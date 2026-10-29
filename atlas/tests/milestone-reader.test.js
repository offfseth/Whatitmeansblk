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
import { milestoneEssays, essaySourceIds } from '../src/data/milestoneEssays.js';
import { sources } from '../src/data/sources.js';
import { validateEssays } from '../src/data/essayValidation.js';

test('all milestones and evidenced city connections have complete cited reading pages and stable URLs', async () => {
  for (const event of milestones) {
    for (const placeId of event.placeIds.length ? event.placeIds : [null]) {
      const selection = resolveMilestone(event.id, { placeId });
      assert.deepEqual(parseMilestoneRoute(milestoneRoute(event.id, selection)), selection);
      const story = getMilestoneStory(event.id, selection);
      assert.equal(story.placeId, placeId);
      assert.equal(story.sections[0].paragraphs[0], event.summary);
      assert.equal(story.sections[1].paragraphs[0], milestoneEssays[event.id].sections[0].paragraphs[0].text);
      assert.ok(story.sections.length >= 6);
      for (const section of story.sections) {
        assert.ok(section.sourceIndices.length, event.id + ': missing evidence');
        for (const index of section.sourceIndices) assert.equal(new URL(story.sources[index][2]).protocol, 'https:');
        assert.equal(section.paragraphSourceIndices.length, section.paragraphs.length);
        for (const indices of section.paragraphSourceIndices) {
          assert.ok(indices.length);
          for (const index of indices) assert.ok(story.sources[index]);
        }
      }
      assert.equal(story.dates.length, story.dateSources.length);
      assert.ok(story.dates.length >= 3);
      for (const indices of story.dateSources) for (const index of indices) assert.ok(story.sources[index]);
      for (const id of essaySourceIds(milestoneEssays[event.id])) assert.ok(story.sourceDetails.some(source => source.id === id));
      const markup = placePageMarkup(story, selection.year);
      for (const label of ['At a glance', 'In this story', 'Reading the evidence', 'Follow the sources.', 'The visual record.', 'Sourcing &amp; reuse policy']) assert.ok(markup.includes(label), event.id + ': ' + label);
      const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
      assert.equal(new Set(ids).size, ids.length, event.id + ': duplicate DOM target');
      for (const [, target] of markup.matchAll(/data-story-section="([^"]+)"/g)) assert.ok(ids.includes(target), event.id + ': broken section/reference link ' + target);
      assert.equal((markup.match(/<h1 /g) ?? []).length, 1);
      assert.ok(!markup.includes('undefined') && !markup.includes('NaN'));
      assert.deepEqual(story.images.map(plate => plate.src), event.images);
      for (const plate of story.images) {
        assert.ok(markup.includes(plate.src));
        assert.ok(markup.includes(plate.source));
        assert.ok(markup.includes(plate.rightsSource));
        assert.ok(markup.includes(plate.rightsReviewedAt));
      }
      assert.ok(story.chapters.some(chapter => chapter.id === event.id));
      if (placeId) assert.ok((await stat(new URL('../public/places/' + placeId + '.svg', import.meta.url))).size > 0);
      else assert.ok(!markup.includes('/places/') && !markup.includes('place-coordinate-line'));
    }
  }
});

test('publication checks prevent uncited passages, timelines, missing essays and invalid contents targets', () => {
  const base = { essays: milestoneEssays, milestones, sources };
  assert.deepEqual(validateEssays(base), []);
  const id = milestones[0].id;
  const missing = { ...milestoneEssays };
  delete missing[id];
  assert.ok(validateEssays({ ...base, essays: missing }).some(error => error.includes('missing in-depth')));
  for (const mutate of [
    essay => { essay.sections[0].paragraphs[0].sourceIds = []; },
    essay => { essay.sections[0].paragraphs[0].sourceIds = ['__proto__']; },
    essay => { essay.timeline[0].sourceIds = ['missing']; },
    essay => { essay.sections[1].id = essay.sections[0].id; },
    essay => { essay.sections[0].id = 'overview'; },
    essay => { essay.sourceNote.sourceIds = []; },
  ]) {
    const essay = structuredClone(milestoneEssays[id]);
    mutate(essay);
    assert.ok(validateEssays({ ...base, essays: { ...milestoneEssays, [id]: essay } }).length > 0);
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
