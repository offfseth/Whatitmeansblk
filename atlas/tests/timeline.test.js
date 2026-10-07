import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createTimeline, visibleLocations } from "../src/state/timeline.js";
import { getEra, getMapState, MIN_YEAR, MAX_YEAR } from "../src/data/eras.js";
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
test("snapshot boundaries and intermediate years produce distinct map state", () => {
  assert.equal(getEra(1775).year, 1619);
  assert.equal(getEra(1776).year, 1776);
  assert.notEqual(
    getMapState(1620, []).emphasis,
    getMapState(1700, []).emphasis,
  );
  assert.deepEqual(
    [...getMapState(MAX_YEAR, ["02", "15", "51"]).active],
    ["02", "15", "51"],
  );
});
test("location visibility respects both endpoints", () => {
  assert.deepEqual(
    visibleLocations(locations, 1619).map((l) => l.id),
    ["point-comfort"],
  );
  assert.equal(visibleLocations(locations, MAX_YEAR).length, 8);
  assert.equal(visibleLocations([{ from: 1700, to: 1800 }], 1800).length, 1);
  assert.equal(visibleLocations([{ from: 1700, to: 1800 }], 1801).length, 0);
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
