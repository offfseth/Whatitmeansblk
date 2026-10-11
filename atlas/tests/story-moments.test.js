import test from 'node:test';
import assert from 'node:assert/strict';
import { storyMoments, adjacentStoryYear } from '../src/state/storyMoments.js';
import { locations } from '../src/data/locations.js';
import { visibleLocations } from '../src/state/timeline.js';

const moments = storyMoments(locations);
test('every story jump lands on a year where its city is visible', () => {
  assert.equal(moments.length, locations.reduce((sum, place) => sum + place.periods.length, 0));
  for (const moment of moments) {
    assert.ok(visibleLocations(locations, moment.from).some(place => place.id === moment.placeId));
  }
});
test('navigation finds short stories and reappearances without getting stuck on shared years', () => {
  assert.equal(adjacentStoryYear(moments, 1927, 1), 1928);
  assert.equal(adjacentStoryYear(moments, 1928, 1), 1939);
  assert.equal(adjacentStoryYear(moments, 1860, 1), 1861);
  assert.equal(adjacentStoryYear(moments, 1862, -1), 1861);
  assert.equal(adjacentStoryYear(moments, 1862, 1), 1916);
});
test('navigation ends explicitly and handles empty coverage', () => {
  assert.equal(adjacentStoryYear(moments, 1619, -1), null);
  assert.equal(adjacentStoryYear(moments, 2026, 1), null);
  assert.equal(adjacentStoryYear([], 1900, 1), null);
});
