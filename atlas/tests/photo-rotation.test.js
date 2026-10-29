import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoRotation, PHOTO_DWELL_MS } from '../src/ui/photoRotation.js';
import { getMilestoneStory } from '../src/data/milestoneStories.js';
import { placePageMarkup } from '../src/ui/placePage.js';

function fixture(options = {}) {
  let callback, state;
  const rotation = createPhotoRotation(3, next => { state = next; }, {
    ...options,
    setTimer(fn, delay) { assert.equal(delay, PHOTO_DWELL_MS); callback = fn; return 1; },
    clearTimer() { callback = null; },
  });
  return { rotation, get state() { return state; }, get running() { return !!callback; }, tick() { assert.ok(callback); callback(); } };
}

test('photos advance every eight seconds and wrap, while manual navigation pauses', () => {
  const f = fixture();
  assert.equal(PHOTO_DWELL_MS, 8000);
  f.tick(); assert.equal(f.state.index, 1);
  f.tick(); assert.equal(f.state.index, 2);
  f.tick(); assert.equal(f.state.index, 0);
  f.rotation.move(-1);
  assert.deepEqual(f.state, { index: 2, paused: true });
  assert.equal(f.running, false);
  f.rotation.toggle(); f.tick(); assert.equal(f.state.index, 0);
  f.rotation.dispose();
});

test('hidden pages suspend rotation and disposal prevents future scheduling', () => {
  const f = fixture();
  f.rotation.setHidden(true); assert.equal(f.running, false);
  f.rotation.setHidden(false); assert.equal(f.running, true);
  f.rotation.dispose(); assert.equal(f.running, false);
  f.rotation.toggle(); f.rotation.setHidden(false);
  assert.equal(f.running, false);
});

test('reduced motion can start paused and explicit playback resumes', () => {
  const f = fixture({ paused: true });
  assert.equal(f.running, false);
  f.rotation.toggle(); assert.equal(f.running, true);
  f.rotation.setPaused(true); assert.equal(f.running, false);
  f.rotation.dispose();
});

for (const [id, year] of [['march-washington', 1963], ['selma-marches', 1965]]) {
test(`${id} reader provides three synchronized frames with item-specific credits`, () => {
  const story = getMilestoneStory(id, { year });
  const html = placePageMarkup(story, year);
  assert.equal(story.images.length, 3);
  assert.equal((html.match(/data-photo-hero/g) ?? []).length, 3);
  assert.equal((html.match(/data-photo-caption/g) ?? []).length, 3);
  assert.equal((html.match(/data-photo-slide/g) ?? []).length, 3);
  assert.equal((html.match(/data-photo-action="toggle"/g) ?? []).length, 2);
  for (const plate of story.images) {
    assert.ok(html.includes(plate.source));
    assert.ok(html.includes(plate.rightsSource.replaceAll('&', '&amp;')));
  }
});
}
