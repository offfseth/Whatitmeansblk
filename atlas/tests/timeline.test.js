import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createTimeline, visibleLocations } from "../src/state/timeline.js";
import { getEra, MIN_YEAR, MAX_YEAR } from "../src/data/eras.js";
import { locations } from "../src/data/locations.js";
test("years are finite, rounded and clamped to the supported range", () => {
  const t = createTimeline();
  t.setYear(0);
  assert.equal(t.get().year, MIN_YEAR);
  t.setYear(9999);
  assert.equal(t.get().year, MAX_YEAR);
  t.setYear(1800.6);
  assert.equal(t.get().year, 1801);
  t.setYear("bad");
  assert.equal(t.get().year, MIN_YEAR);
});
test("subscriptions only emit for changed state and can unsubscribe", () => {
  const t = createTimeline();
  let calls = 0;
  const off = t.subscribe(() => calls++);
  t.setYear(MIN_YEAR);
  assert.equal(calls, 1);
  t.select("point-comfort");
  assert.equal(calls, 2);
  off();
  t.setYear(1865);
  assert.equal(calls, 2);
});
test("editorial chapters separate the early republic, war, and aftermath", () => {
  assert.equal(getEra(1860).year, 1776);
  assert.equal(getEra(1861).year, 1861);
  assert.equal(getEra(1865).year, 1861);
  assert.equal(getEra(1866).year, 1866);
});
test("location coverage includes endpoints, excludes gaps, and allows reappearance", () => {
  const visible = year => visibleLocations(locations, year).map(l => l.id);
  assert.deepEqual(visible(1619), ["point-comfort"]);
  assert.equal(visible(1620).includes("point-comfort"), false);
  assert.equal(visible(1861).includes("point-comfort"), true);
  assert.equal(visible(1865).includes("point-comfort"), true);
  assert.equal(visible(1866).includes("point-comfort"), false);
  for (const year of [1793,1800,1862,1863,1939,1963,1964]) assert.ok(visible(year).includes("washington"));
  for (const year of [1792,1801,1861,1864,1938,1940,1962,1965]) assert.ok(!visible(year).includes("washington"));
  assert.deepEqual(visible(2026), []);
});
test("packaged map covers all 50 states and DC, and every marker has a projected point", async () => {
  const map = JSON.parse(
    await readFile(new URL("../public/data/map.json", import.meta.url)),
  );
  assert.equal(map.states.features.length, 51);
  assert.equal(new Set(map.states.features.map((s) => s.id)).size, 51);
  for (const l of locations) {
    const p = map.locations.find((p) => p.id === l.id)?.point;
    assert.ok(p?.every(Number.isFinite));
    assert.ok(p[0] >= 0 && p[0] <= 975 && p[1] >= 0 && p[1] <= 610);
  }
  for (const state of map.states.features)
    assert.ok(["Polygon", "MultiPolygon"].includes(state.geometry.type));
});
