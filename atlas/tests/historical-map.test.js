import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { geoAlbersUsa } from 'd3-geo';
import { historicalSnapshot, boundaryDescription } from '../src/data/historicalMap.js';

const history = JSON.parse(await readFile(new URL('../public/data/historical-boundaries.json', import.meta.url)));
const modern = JSON.parse(await readFile(new URL('../public/data/map.json', import.meta.url)));
const snapshot = year => historicalSnapshot(history, modern, year);
const named = (year, name) => snapshot(year).entries.find(f => f.name === name);
const pointInRing = ([x,y], ring) => {
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
};
const projection = geoAlbersUsa().scale(1300).translate([487.5,305]);
const contains = (feature, lonlat) => {
  const p=projection(lonlat);
  return feature.geometry.coordinates.some(poly => pointInRing(p,poly[0]) && !poly.slice(1).some(hole=>pointInRing(p,hole)));
};
test('1786 has thirteen states, with Kentucky in Virginia and Maine in Massachusetts', () => {
  assert.equal(snapshot(1786).entries.filter(f=>f.type==='State').length,13);
  for (const name of ['Kentucky','Maine','West Virginia','California','Alaska','Hawaii']) assert.equal(named(1786,name),undefined);
  assert.ok(contains(named(1786,'Virginia'),[-84.87,38.2]));
  assert.ok(contains(named(1786,'Massachusetts'),[-69.45,45.25]));
  assert.equal(named(1786,'Vermont Republic').category,'other');
  assert.ok(named(1792,'Kentucky'));
});
test('state creation changes geometry, not just modern-state visibility', () => {
  const point=[-80.45,38.60];
  assert.equal(named(1862,'West Virginia'),undefined);
  assert.ok(contains(named(1862,'Virginia'),point));
  assert.ok(contains(named(1863,'West Virginia'),point));
  assert.equal(contains(named(1863,'Virginia'),point),false);
  assert.equal(named(1863,'Nevada'),undefined);
  assert.equal(named(1864,'Nevada').category,'union');
});
test('Civil War affiliations distinguish the eleven Confederate states and loyal border states', () => {
  assert.equal(snapshot(1861).entries.filter(f=>f.category==='confederacy').length,11);
  assert.equal(snapshot(1861).entries.filter(f=>f.category==='border').length,4);
  assert.equal(snapshot(1863).entries.filter(f=>f.category==='border').length,5);
  assert.equal(named(1863,'West Virginia').category,'border');
  assert.equal(named(1863,'District of Columbia').category,'union');
  assert.equal(named(1863,'Missouri').category,'border');
  assert.equal(named(1863,'Kentucky').category,'border');
  assert.equal(named(1863,'California').category,'union');
  assert.equal(snapshot(1865).entries.some(f=>f.category==='confederacy'),false);
  assert.match(boundaryDescription(1865).note,/collapsed/);
});
test('territories become states and dataset limits are explicit', () => {
  assert.equal(named(1958,'Alaska Territory').category,'territory');
  assert.equal(named(1958,'Hawaii Territory').category,'territory');
  assert.equal(named(1959,'Alaska').category,'state');
  assert.equal(named(1959,'Hawaii').category,'state');
  assert.equal(snapshot(1782).entries.length,0);
  assert.equal(snapshot(2026).entries.filter(f=>f.type==='State').length,50);
  assert.equal(snapshot(2026).contemporary,true);
  assert.match(boundaryDescription(1700).note,/not yet available/);
});
test('every recorded configuration has finite, closed projected polygons and source provenance', () => {
  const ids=new Set();
  for (const feature of history.features) {
    assert.ok(!ids.has(feature.id)); ids.add(feature.id);
    assert.ok(feature.from<=feature.to && feature.change && feature.citation);
    assert.ok(feature.geometry.coordinates.length);
    for (const polygon of feature.geometry.coordinates) for (const ring of polygon) {
      assert.ok(ring.length>=4);
      assert.deepEqual(ring[0],ring.at(-1));
      for (const point of ring) assert.ok(point.every(Number.isFinite));
    }
  }
});
test('snapshot cache reuses unchanged boundaries and changes when a jurisdiction changes', () => {
  assert.equal(snapshot(1963).key,snapshot(1964).key);
  assert.notEqual(snapshot(1862).key,snapshot(1863).key);
  assert.notEqual(snapshot(1864).key,snapshot(1865).key);
});
