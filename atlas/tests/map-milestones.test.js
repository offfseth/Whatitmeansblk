import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { geoAlbersUsa } from 'd3-geo';
import { mapPlaces } from '../src/data/mapPlaces.js';
import { mapPlacePoints } from '../src/data/mapPlacePoints.js';
import { milestones } from '../src/data/milestones.js';
import { sources } from '../src/data/sources.js';
import { validateGeography } from '../src/data/geographyValidation.js';
import { mapCoverage, mapWindow, readMapSearch, adjacentCoverageYear } from '../src/state/mapCoverage.js';

const data = { milestones, sources, mapPlaces, points: mapPlacePoints };
const ids = (year, scope) => mapCoverage(year, scope).places.map(place => place.id);
test('every milestone has a geographic classification, evidenced connections, and a displayable place', () => {
  assert.deepEqual(validateGeography(data), []);
  assert.equal(mapPlaces.length, 25);
  assert.equal(milestones.filter(event => event.placeIds.length).length, 35);
  assert.equal(milestones.filter(event => !event.placeIds.length).length, 18);
  for (const event of milestones) {
    const coverage = mapCoverage(event.year);
    assert.ok(coverage.events.includes(event));
    assert.ok(coverage.broad.includes(event) || coverage.places.some(place => place.entries.some(entry => entry.event.id === event.id)));
  }
});

test('period is the default and exact-year coverage obeys inclusive event bounds', () => {
  assert.deepEqual(readMapSearch(''), { scope: 'period', place: '' });
  assert.equal(readMapSearch('?scope=invalid').scope, 'period');
  assert.deepEqual(mapWindow(1963), { from: 1954, to: 1967, label: '1954–1967' });
  assert.ok(ids(1963).includes('greensboro'));
  assert.ok(!ids(1963, 'year').includes('greensboro'));
  assert.ok(ids(1960, 'year').includes('greensboro'));
  for (const year of [1955, 1956]) {
    const city = mapCoverage(year, 'year').places.find(place => place.id === 'montgomery');
    assert.ok(city.entries.some(entry => entry.event.id === 'montgomery-boycott'));
  }
  assert.ok(!ids(1957, 'year').includes('montgomery'));
});

test('local movement phases do not create western migration pins too early', () => {
  const migrationAt = year => mapCoverage(year, 'year').places.filter(place => place.entries.some(entry => entry.event.id === 'great-migration')).map(place => place.id);
  assert.ok(migrationAt(1910).includes('chicago'));
  assert.ok(!migrationAt(1939).includes('los-angeles'));
  assert.ok(migrationAt(1940).includes('los-angeles'));
  assert.ok(migrationAt(1970).includes('oakland'));
  assert.deepEqual(migrationAt(1971), []);
});

test('multi-place events are counted once and broad events are never forced into a city', () => {
  const rides = mapCoverage(1961, 'year');
  assert.equal(rides.events.filter(event => event.id === 'freedom-rides').length, 1);
  for (const city of ['washington', 'birmingham', 'montgomery', 'jackson']) {
    assert.ok(rides.places.find(place => place.id === city).entries.some(entry => entry.event.id === 'freedom-rides'));
  }
  const emancipation = mapCoverage(1863, 'year');
  assert.ok(emancipation.broad.some(event => event.id === 'emancipation-proclamation'));
  assert.ok(emancipation.places.every(place => !place.entries.some(entry => entry.event.id === 'emancipation-proclamation')));
});

test('new milestone-only places work alongside legacy city stories and empty years', () => {
  const launch = mapCoverage(1992, 'year').places.find(place => place.id === 'kennedy-space-center');
  assert.equal(launch.entries[0].event.id, 'mae-jemison');
  assert.equal(launch.stories.length, 0);
  assert.ok(mapCoverage(1863, 'year').places.some(place => place.stories.length));
  const empty = mapCoverage(2026, 'year');
  assert.equal(empty.places.length + empty.events.length, 0);
  assert.equal(adjacentCoverageYear(2026, -1), 2022);
  assert.equal(adjacentCoverageYear(2026, 1), null);
  assert.equal(adjacentCoverageYear(1619, -1), null);
});

test('geography validation rejects unsupported links, invalid ranges, and missing projection data', () => {
  const event = milestones[0], link = event.geography.connections[0];
  for (const change of [{ placeId: 'unknown' }, { sourceIds: [] }, { sourceIds: ['__proto__'] }, { from: 1618 }, { to: 1620 }, { from: 1620, to: 1619 }]) {
    const bad = { ...event, geography: { ...event.geography, connections: [{ ...link, ...change }] } };
    assert.ok(validateGeography({ ...data, milestones: [bad] }).length > 0);
  }
  assert.ok(validateGeography({ ...data, points: {} }).some(error => error.includes('projected point')));
  assert.ok(validateGeography({ ...data, milestones: [{ ...event, geography: undefined }] }).length > 0);
});

test('all generated marker points match the terrain projection and stay inside its extent', async () => {
  const project = geoAlbersUsa().scale(1300).translate([487.5, 305]);
  const oldMap = JSON.parse(await readFile(new URL('../public/data/map.json', import.meta.url)));
  for (const place of mapPlaces) {
    const point = mapPlacePoints[place.id], expected = project(place.coordinates);
    assert.ok(Math.abs(point[0] - expected[0]) < .001 && Math.abs(point[1] - expected[1]) < .001);
    assert.ok(point[0] >= 0 && point[0] <= 975 && point[1] >= 0 && point[1] <= 610);
    const legacy = oldMap.locations.find(entry => entry.id === place.id);
    if (legacy) assert.ok(Math.hypot(point[0] - legacy.point[0], point[1] - legacy.point[1]) < .01);
  }
});
