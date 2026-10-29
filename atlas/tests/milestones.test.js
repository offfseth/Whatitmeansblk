import test from 'node:test';
import assert from 'node:assert/strict';
import { milestones } from '../src/data/milestones.js';
import { sources } from '../src/data/sources.js';
import { eras } from '../src/data/eras.js';
import { mapPlaces as locations } from '../src/data/mapPlaces.js';
import { archive, isPublishablePlate, platesForYear } from '../src/data/archive.js';
import { validateContent } from '../src/data/contentValidation.js';
import { filterMilestones, filtersFromSearch, searchFromFilters } from '../src/state/milestoneFilters.js';

const content = { milestones, sources, eras, locations, archive };
test('the collection has complete citations and original text throughout all seven chapters', () => {
  assert.deepEqual(validateContent(content), []);
  assert.ok(milestones.length >= 50);
  for (const era of eras) assert.ok(filterMilestones(milestones, { era: era.year }).length > 0);
});

test('publication checks reject broken references, missing rights evidence, and unsupported quotations', () => {
  const cases = [
    { sourceIds: ['missing'] }, { sourceIds: ['__proto__'] }, { sourceIds: [] },
    { textRights: 'copied-from-article' }, { quotations: [{ text: 'Unreviewed quote' }] },
    { images: [{ src: '/unknown.jpg' }] }, { endYear: 1600 }, { placeIds: ['unknown-city'] },
  ];
  for (const bad of cases) {
    assert.ok(validateContent({ ...content, milestones: [{ ...milestones[0], ...bad }] }).length > 0, JSON.stringify(bad));
  }
  assert.ok(validateContent({ ...content, milestones: [milestones[0], milestones[0]] }).some(error => error.includes('duplicate')));
  assert.ok(validateContent({ ...content, archive: [{ ...archive.at(-3), basis: '' }] }).some(error => error.includes('reuse basis')));
});

test('period filtering includes overlapping movements but excludes adjacent single-year events', () => {
  const reconstruction = filterMilestones(milestones, { era: '1866' }).map(event => event.id);
  assert.ok(reconstruction.includes('great-migration'), 'movement begins in 1910 and overlaps this chapter');
  assert.ok(!reconstruction.includes('thirteenth-amendment'));
  const civilRights = filterMilestones(milestones, { era: '1954' }).map(event => event.id);
  assert.ok(civilRights.includes('great-migration'));
  assert.ok(civilRights.includes('thurgood-marshall'));
  assert.ok(!civilRights.includes('fair-housing-act'));
});

test('milestone images require event-specific registration and a documented rights review', () => {
  const event = milestones.find(item => item.id === 'march-washington');
  const plate = archive.find(item => item.src === event.images[0]);
  for (const bad of [{ rights: 'unverified' }, { rightsSource: '' }, { rightsReviewedAt: '' }, { milestoneIds: [] }]) {
    const changedArchive = archive.map(item => item === plate ? { ...item, ...bad } : item);
    assert.ok(validateContent({ ...content, archive: changedArchive }).some(error => error.includes('march-washington: milestone media')));
  }
});

test('search handles apostrophes, multiple terms, source institutions, themes, and place connections', () => {
  assert.equal(filterMilestones(milestones, { query: "Freedom's Journal" })[0].id, 'freedoms-journal');
  assert.equal(filterMilestones(milestones, { query: 'tubman maryland' })[0].id, 'tubman-escape');
  assert.ok(filterMilestones(milestones, { query: 'NASA', topic: 'Sports & science' }).some(event => event.id === 'mae-jemison'));
  assert.ok(filterMilestones(milestones, { place: 'montgomery', era: '1954' }).every(event => event.placeIds.includes('montgomery')));
  assert.equal(filterMilestones(milestones, { query: '<script>alert(1)</script>' }).length, 0);
  assert.equal(filterMilestones(milestones, { event: 'does-not-exist' }).length, 0);
});

test('all milestone links resolve and shareable filters round-trip', () => {
  for (const event of milestones) assert.deepEqual(filterMilestones(milestones, { event: event.id }), [event]);
  const filters = { query: 'law & citizenship', era: '1954', topic: 'Law & citizenship', place: '', event: '', order: 'newest' };
  assert.deepEqual(filtersFromSearch(searchFromFilters(filters)), filters);
  const newest = filterMilestones(milestones, { order: 'newest' });
  assert.equal(newest[0].year, 2022);
  assert.equal(newest.at(-1).year, 1619);
});

test('unknown rights fail closed and every displayed archive plate has reuse evidence', () => {
  const real = archive.find(plate => !plate.placeholder);
  assert.equal(isPublishablePlate({ ...real, rights: 'unverified' }), false);
  assert.equal(isPublishablePlate({ ...real, basis: '' }), false);
  assert.equal(isPublishablePlate({ ...real, source: 'Supplied for this prototype' }), false);
  for (const era of eras) assert.ok(platesForYear(era.year).every(isPublishablePlate));
  assert.ok(!archive.some(plate => plate.src === '/archive/1963-march-on-washington.webp'));
});
