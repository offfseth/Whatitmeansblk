import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { Vector3, PerspectiveCamera } from 'three';
import { animateFlight } from '../src/map/cameraFlight.js';
import { MapScene } from '../src/map/MapScene.js';
import { placeStories, getPlaceStory, nearestStoryYear } from '../src/data/placeStories.js';
import { locations } from '../src/data/locations.js';
import { parsePlaceRoute, placeRoute } from '../src/state/placeRoute.js';

test('every selectable place has a sourced story and locally available imagery', async () => {
  assert.deepEqual(placeStories.map(p => p.id), locations.map(p => p.id));
  for (const location of placeStories) for (const chapter of location.chapters) {
    const place = getPlaceStory(location.id, chapter.from);
    assert.ok(place.title && place.dek && place.dates.length && place.sections.length);
    for (const section of place.sections) {
      assert.ok(section.paragraphs.length);
      assert.ok(place.sources[section.source], place.id + ': missing section citation');
    }
    for (const [, , url] of place.sources) assert.equal(new URL(url).protocol, 'https:');
    for (const image of place.images) {
      assert.equal(image.rights, 'cleared');
      assert.ok(!image.placeholder && image.basis && image.caption && image.credit);
      assert.ok((await stat(new URL('../public' + image.src, import.meta.url))).size > 0);
    }
    if (!place.images.length) assert.ok((await stat(new URL('../public/places/' + place.id + '.svg', import.meta.url))).size > 0);
  }
});
test('place links round-trip and preserve the selected year', () => {
  for (const place of placeStories) {
    for (const chapter of place.chapters) for (const year of [chapter.from, chapter.to])
      assert.deepEqual(parsePlaceRoute(placeRoute(place.id, year)), { id: place.id, year });
  }
});
test('routes reject unknown or malformed IDs and keep years in the visible interval', () => {
  for (const hash of ['', '#notes', '#/place/missing', '#/place/%ZZ', '#/place/__proto__']) assert.equal(parsePlaceRoute(hash), null);
  assert.deepEqual(parsePlaceRoute('#/place/montgomery?year=1619'), { id: 'montgomery', year: 1955 });
  assert.equal(parsePlaceRoute('#/place/chicago?year=9999').year, 1970);
  assert.equal(parsePlaceRoute('#/place/chicago?year=NaN').year, 1963);
  assert.equal(parsePlaceRoute('#/place/chicago').year, 1963);
});
function clock() {
  let next = 0;
  const pending = new Map();
  const visibility = new EventTarget();
  visibility.hidden = false;
  return {
    visibility, pending,
    request: (fn) => { pending.set(++next, fn); return next; },
    cancel: (id) => pending.delete(id), now: () => 0,
    tick(time) { const jobs = [...pending.values()]; pending.clear(); jobs.forEach(fn => fn(time)); },
  };
}
test('camera flight advances smoothly, lands exactly, and stops scheduling frames', async () => {
  const fixture = clock(), values = [];
  const result = animateFlight({ ...fixture, duration: 1500, update: t => values.push(t) });
  fixture.tick(0); fixture.tick(750); fixture.tick(1500);
  assert.equal(await result, true);
  assert.equal(values[0], 0);
  assert.equal(values[1], 0.5);
  assert.equal(values.at(-1), 1);
  assert.equal(fixture.pending.size, 0);
});
test('cancelling a flight resolves without revealing a stale destination', async () => {
  const fixture = clock(), values = [], abort = new AbortController();
  const result = animateFlight({ ...fixture, signal: abort.signal, update: t => values.push(t) });
  fixture.tick(400); abort.abort();
  assert.equal(await result, false);
  assert.equal(fixture.pending.size, 0);
  assert.ok(values.at(-1) < 1);
});
test('reduced motion and hidden tabs finish immediately with no idle frames', async () => {
  for (const hidden of [false, true]) {
    const fixture = clock(), values = [];
    fixture.visibility.hidden = hidden;
    assert.equal(await animateFlight({ ...fixture, duration: hidden ? 1500 : 0, update: t => values.push(t) }), true);
    assert.deepEqual(values, [1]);
    assert.equal(fixture.pending.size, 0);
  }
});
test('backgrounding mid-flight completes the pending navigation', async () => {
  const fixture = clock(), values = [];
  const result = animateFlight({ ...fixture, update: t => values.push(t) });
  fixture.tick(500);
  fixture.visibility.hidden = true;
  fixture.visibility.dispatchEvent(new Event('visibilitychange'));
  assert.equal(await result, true);
  assert.equal(values.at(-1), 1);
  assert.equal(fixture.pending.size, 0);
});
test('a pre-cancelled flight cannot move the camera', async () => {
  const abort = new AbortController(); abort.abort();
  assert.equal(await animateFlight({ ...clock(), signal: abort.signal, update: () => assert.fail('moved') }), false);
});
test('city flight reaches an eastern marker beyond normal pan limits and restores the original view', async (t) => {
  const fixture = clock();
  const saved = new Map();
  for (const [name, value] of Object.entries({ document: fixture.visibility, requestAnimationFrame: fixture.request, cancelAnimationFrame: fixture.cancel })) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  t.after(() => { for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } });
  const scene = Object.create(MapScene.prototype);
  scene.camera = new PerspectiveCamera(); scene.camera.position.set(0, 48, 32);
  scene.controls = { target: new Vector3(), enabled: true, minDistance: 22, maxTargetRadius: 6.5, update() {} };
  scene.markers = [{ id: 'washington', group: { position: new Vector3(20, .48, -1) } }];
  scene.invalidate = () => {};
  const initial = scene.captureView();
  assert.equal(await scene.flyToLocation('washington', { duration: 0 }), true);
  assert.deepEqual(scene.controls.target.toArray(), [20, .15, -1]);
  assert.ok(scene.camera.position.distanceTo(scene.controls.target) < 10);
  assert.equal(scene.controls.minDistance, 22);
  assert.equal(scene.controls.maxTargetRadius, 6.5);
  assert.equal(scene.controls.enabled, true);
  scene.restoreView(initial);
  assert.deepEqual(scene.camera.position.toArray(), [0, 48, 32]);
  assert.deepEqual(scene.controls.target.toArray(), [0, 0, 0]);
  const abort = new AbortController();
  const pending = scene.flyToLocation('washington', { signal: abort.signal });
  scene.cancelFlight();
  assert.equal(scene.controls.enabled, true, 'Escape must immediately restore interaction');
  assert.equal(await pending, false);
});

test('the same city resolves to different sourced stories and period-appropriate images', () => {
  const early = getPlaceStory('washington', 1793), war = getPlaceStory('washington', 1862), march = getPlaceStory('washington', 1963);
  assert.equal(new Set([early.title, war.title, march.title]).size, 3);
  assert.equal(war.images.length, 0);
  assert.equal(march.images[0].year, 1963);
  assert.equal(getPlaceStory('washington', 1900), undefined);
  assert.equal(getPlaceStory('montgomery', 1956).images.length, 0);
  assert.equal(getPlaceStory('montgomery', 1965).images[0].year, 1965);
});
test('stale links land on actual covered years, including gaps between chapters', () => {
  assert.equal(nearestStoryYear('washington', 1864), 1863);
  assert.equal(nearestStoryYear('washington', 1954), 1963);
  assert.equal(nearestStoryYear('montgomery', 1960), 1956);
  assert.equal(nearestStoryYear('missing', 1963), null);
  assert.deepEqual(parsePlaceRoute('#/place/washington?year=1954'), { id:'washington', year:1963 });
});
test('city chapters have ordered, non-overlapping inclusive coverage and no mismatched photos', () => {
  for (const place of placeStories) {
    const ids = new Set();
    let end = -Infinity;
    for (const chapter of place.chapters) {
      assert.ok(Number.isInteger(chapter.from) && chapter.from <= chapter.to);
      assert.ok(chapter.from > end, place.id + ': ambiguous overlapping coverage');
      assert.ok(!ids.has(chapter.id));
      ids.add(chapter.id); end = chapter.to;
      for (const image of chapter.images) assert.ok(image.year >= chapter.from && image.year <= chapter.to);
    }
  }
});
