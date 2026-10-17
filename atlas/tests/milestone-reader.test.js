import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { milestones } from '../src/data/milestones.js';
import { mapPlaces } from '../src/data/mapPlaces.js';
import { getMilestoneStory } from '../src/data/milestoneStories.js';
import { getPlaceStory, placeStories } from '../src/data/placeStories.js';
import { milestoneRoute, parseMilestoneRoute, resolveMilestone, milestoneForPlace } from '../src/state/milestoneRoute.js';
import { mapCoverage } from '../src/state/mapCoverage.js';
import { placePageMarkup } from '../src/ui/placePage.js';

test('all milestones and evidenced city connections have complete cited reading pages and stable URLs', async () => {
  for (const event of milestones) {
    for (const placeId of event.placeIds.length ? event.placeIds : [null]) {
      const selection = resolveMilestone(event.id, { placeId });
      assert.deepEqual(parseMilestoneRoute(milestoneRoute(event.id, selection)), selection);
      const story = getMilestoneStory(event.id, selection);
      assert.equal(story.placeId, placeId);
      assert.equal(story.sections[0].paragraphs[0], event.summary);
      assert.equal(story.sections[1].paragraphs[0], event.context);
      for (const section of story.sections) {
        assert.ok(section.sourceIndices.length, event.id + ': missing evidence');
        for (const index of section.sourceIndices) assert.equal(new URL(story.sources[index][2]).protocol, 'https:');
      }
      const markup = placePageMarkup(story, selection.year);
      for (const label of ['What happened', 'Why it matters', 'Follow the sources.', 'The visual record.', 'Sourcing &amp; reuse policy']) assert.ok(markup.includes(label), event.id + ': ' + label);
      assert.equal((markup.match(/<h1 /g) ?? []).length, 1);
      assert.ok(!markup.includes('undefined') && !markup.includes('NaN'));
      assert.deepEqual(story.images, []);
      assert.ok(story.chapters.some(chapter => chapter.id === event.id));
      if (placeId) assert.ok((await stat(new URL('../public/places/' + placeId + '.svg', import.meta.url))).size > 0);
      else assert.ok(!markup.includes('/places/') && !markup.includes('place-coordinate-line'));
    }
  }
});

test('each visible place resolves to a milestone in the selected window or a published city story', () => {
  for (const event of milestones) for (const scope of ['year', 'period']) {
    const coverage = mapCoverage(event.year, scope);
    for (const place of coverage.places) {
      const route = milestoneForPlace(place.id, event.year, scope);
      if (place.entries.length) {
        assert.ok(route);
        assert.ok(place.entries.some(entry => entry.event.id === route.id));
        assert.equal(route.year, event.year);
        assert.equal(route.scope, scope);
      } else assert.ok(place.stories.length);
    }
  }
  assert.equal(milestoneForPlace('washington', 1963).id, 'march-washington');
  assert.equal(milestoneForPlace('greensboro', 1963).id, 'greensboro-sit-in');
  assert.equal(milestoneForPlace('greensboro', 1963, 'year'), null);
});

test('period switching keeps the entry year and city; exact-year menus exclude other years', () => {
  const period = getMilestoneStory('march-washington', { placeId: 'washington', year: 1963 });
  assert.equal(period.chapters.length, 4);
  for (const chapter of period.chapters) {
    assert.equal(chapter.year, 1963);
    assert.equal(chapter.placeId, 'washington');
  }
  const exact = getMilestoneStory('march-washington', { year: 1963, scope: 'year' });
  assert.deepEqual(exact.chapters.map(entry => entry.id), ['march-washington']);
  assert.equal(resolveMilestone('great-migration', { placeId: 'oakland', year: 1910, scope: 'year' }).year, 1940);
  assert.equal(resolveMilestone('great-migration', { placeId: 'chicago', year: 1970, scope: 'year' }).year, 1970);
});

test('bad URLs cannot invent city connections, sources, or unknown entries', () => {
  for (const hash of ['', '#/milestone/missing', '#/milestone/%ZZ', '#/milestone/__proto__']) assert.equal(parseMilestoneRoute(hash), null);
  assert.deepEqual(parseMilestoneRoute('#/milestone/greensboro-sit-in?year=NaN&place=washington&scope=invalid'), {
    id: 'greensboro-sit-in', placeId: 'greensboro', year: 1960, scope: 'period',
  });
  const broad = parseMilestoneRoute('#/milestone/civil-rights-act?place=washington&year=1963');
  assert.equal(broad.placeId, null);
  assert.equal(broad.year, 1963);
  assert.equal(getMilestoneStory('missing'), null);
});

test('all original city chapters still render through the shared template', () => {
  for (const place of placeStories) for (const chapter of place.chapters) {
    const story = getPlaceStory(place.id, chapter.from);
    const markup = placePageMarkup(story, chapter.from);
    assert.ok(markup.includes('This place through time'));
    assert.ok(markup.includes('Follow the sources.'));
    for (const source of story.sources) assert.ok(markup.includes(source[2].replaceAll('&', '&amp;')));
    assert.ok(!markup.includes('undefined') && !markup.includes('NaN'));
  }
});

test('every map place has an offline geographic illustration', async () => {
  for (const place of mapPlaces) assert.ok((await stat(new URL('../public/places/' + place.id + '.svg', import.meta.url))).size > 0);
});
