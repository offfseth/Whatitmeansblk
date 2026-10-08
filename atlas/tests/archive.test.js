import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { eras, getEra, MIN_YEAR, MAX_YEAR } from "../src/data/eras.js";
import {
  archive,
  platesForYear,
  archiveCredits,
  unclearedPlates,
} from "../src/data/archive.js";

test("every period carries readable summary copy", () => {
  for (const era of eras) {
    assert.ok(era.period?.length > 3, era.year + " needs a period name");
    assert.match(era.span, /^\d{4}–(\d{4}|present)$/);
    assert.ok(
      era.meaning.length > 120 && era.meaning.length < 340,
      era.year + " summary is " + era.meaning.length + " chars",
    );
  }
});
test("period spans are ordered and meet end to end", () => {
  for (let i = 0; i < eras.length; i++) {
    const [from, to] = eras[i].span.split("–");
    assert.equal(Number(from), eras[i].year);
    const next = eras[i + 1];
    if (next) {
      assert.ok(next.year > eras[i].year);
      assert.equal(Number(to), next.year - 1);
    } else assert.equal(to, "present");
  }
});
test("the 1963 March on Washington lands in the civil rights period", () => {
  const plate = archive.find((p) => p.year === 1963);
  assert.equal(getEra(plate.year).year, plate.eraYear);
  assert.ok(platesForYear(1963).includes(plate));
  assert.ok(!platesForYear(1940).includes(plate));
});
test("every plate joins a real period and every year has plates to show", () => {
  const years = new Set(eras.map((e) => e.year));
  for (const plate of archive) {
    assert.ok(years.has(plate.eraYear), plate.src + " has no period");
    assert.match(plate.src, /^\/[\w./-]+\.(webp|jpg|jpeg|png)$/);
    assert.ok(plate.caption && plate.credit && plate.source);
    assert.ok(["cleared", "unverified"].includes(plate.rights));
  }
  for (const year of [MIN_YEAR, 1700, 1865, 1916, 1954, 1968, MAX_YEAR])
    assert.ok(platesForYear(year).length > 0, "no plates for " + year);
});
test("plate files exist on disk", async () => {
  for (const plate of archive) {
    const file = new URL("../public" + plate.src, import.meta.url);
    assert.ok((await stat(file)).size > 0, plate.src + " is missing");
  }
});
test("uncleared rights are surfaced rather than swallowed", () => {
  for (const plate of unclearedPlates) assert.ok(!plate.placeholder);
  const credits = archiveCredits().join(" ");
  for (const plate of unclearedPlates)
    assert.match(credits, /rights not cleared/);
  assert.ok(!credits.includes("Placeholder plate"));
});
test("a cleared plate says why it is free and where it came from", () => {
  for (const plate of archive.filter((p) => p.rights === "cleared")) {
    assert.ok(
      plate.basis && plate.basis.length > 20,
      plate.src + " claims cleared rights with no stated basis",
    );
    if (plate.placeholder) continue;
    assert.match(
      plate.source,
      /^https:\/\//,
      plate.src + " needs a source URL that can be rechecked",
    );
  }
});
test("the civil rights period runs a real, chronological sequence", () => {
  const plates = platesForYear(1963);
  assert.ok(plates.length >= 5, "expected a full period, got " + plates.length);
  assert.equal(plates.filter((p) => p.placeholder).length, 0);
  const years = plates.map((p) => p.year);
  assert.deepEqual(years, [...years].sort((a, b) => a - b), "out of order");
  assert.ok(years.every((y) => y >= 1954 && y <= 1967), "outside the period");
});
test("every real plate says where its subject is, inside the frame", () => {
  for (const plate of archive) {
    if (plate.placeholder) continue;
    assert.ok(plate.focus, plate.src + " has no focus point");
    const [x, y] = plate.focus;
    for (const v of [x, y]) {
      assert.ok(Number.isFinite(v), plate.src + " focus is not numeric");
      // Anything outside this cannot be centred by object-position, so the
      // subject would sit against an edge however the band is sized.
      assert.ok(v >= 10 && v <= 90, plate.src + " focus " + v + "% is at an edge");
    }
  }
});

// --- the band's overscan -----------------------------------------------
// The swing, roll and pans all eat into the margin between the stage and the
// band. If the solver ever returns too little, a camera angle shows the page
// through a corner. This reproduces the projection independently.
import { overscanFor, viewTransform } from "../src/ui/archiveStage.js";

const PERSPECTIVE = 1500;
/** Worst-case inward intrusion of the stage's edges, by direct projection. */
function clearance(bandW, bandH, turnDeg, leanDeg, panXpc, panYpc) {
  const { x: ox, y: oy } = overscanFor(bandW, bandH, PERSPECTIVE);
  const W = bandW + 2 * ox,
    H = bandH + 2 * oy;
  const t = (turnDeg * Math.PI) / 180,
    l = (leanDeg * Math.PI) / 180;
  const dx = (panXpc / 100) * W,
    dy = (panYpc / 100) * H;
  // Corners in stage space, rotateY then roll, then perspective divide.
  const pts = [
    [-W / 2, -H / 2],
    [W / 2, -H / 2],
    [W / 2, H / 2],
    [-W / 2, H / 2],
  ].map(([x, y]) => {
    const x1 = x * Math.cos(t),
      z1 = -x * Math.sin(t);
    const s = PERSPECTIVE / (PERSPECTIVE - z1);
    const x2 = x1 * Math.cos(l) - y * Math.sin(l);
    const y2 = x1 * Math.sin(l) + y * Math.cos(l);
    return [x2 * s + dx, y2 * s + dy];
  });
  const band = [
    [-bandW / 2, -bandH / 2],
    [bandW / 2, -bandH / 2],
    [bandW / 2, bandH / 2],
    [-bandW / 2, bandH / 2],
  ];
  let worst = Infinity;
  for (let i = 0; i < 4; i++) {
    const a = pts[i],
      b = pts[(i + 1) % 4];
    const ex = b[0] - a[0],
      ey = b[1] - a[1],
      len = Math.hypot(ex, ey);
    for (const c of band)
      worst = Math.min(
        worst,
        (ex * (c[1] - a[1]) - ey * (c[0] - a[0])) / len,
      );
  }
  return worst;
}

test("the band stays covered at every camera angle, at every size", () => {
  // Laptop, desktop, ultrawide, 4K, portrait phone, and a short wide strip.
  const sizes = [
    [1584, 254], [1280, 300], [2560, 419], [3840, 540],
    [390, 220], [1920, 180], [900, 500],
  ];
  for (const [w, h] of sizes)
    for (const turn of [-3, 0, 3])
      for (const lean of [-0.6, 0, 0.6])
        for (const px of [-2.6, 0, 2.6])
          for (const py of [-2.2, 0]) {
            const c = clearance(w, h, turn, lean, px, py);
            assert.ok(
              c >= 0,
              `${w}x${h} turn ${turn} lean ${lean} pan ${px}/${py}: band uncovered by ${(-c).toFixed(1)}px`,
            );
          }
});
test("overscan grows with the band, rather than staying a fixed guess", () => {
  const small = overscanFor(1280, 300, PERSPECTIVE);
  const wide = overscanFor(3840, 540, PERSPECTIVE);
  assert.ok(wide.y > small.y * 1.5, "wide screens need much more vertical room");
  assert.ok(wide.x > small.x);
});

test("the band swings the way the camera actually moved", () => {
  // yaw is +1 when the camera has orbited to screen-right. Whichever side the
  // camera stands on is the near side of the world, and CSS rotateY brings
  // the LEFT edge forward for positive angles - so camera-right must give a
  // negative turn. Getting this backwards looks almost right, which is why it
  // is pinned here rather than left to the eye.
  assert.ok(viewTransform({ yaw: 1 }).turn < 0, "camera right: right edge near");
  assert.ok(viewTransform({ yaw: -1 }).turn > 0, "camera left: left edge near");
  assert.ok(viewTransform({ yaw: 0 }).turn === 0);
  // The pan opposes the yaw: distant scenery slides against the near field.
  assert.ok(viewTransform({ yaw: 1 }).x < 0);
  assert.ok(viewTransform({ yaw: -1 }).x > 0);
  // Turn and pan are mirror-symmetric, so no angle is favoured.
  for (const k of ["x", "turn", "lean"])
    assert.ok(
      Math.abs(viewTransform({ yaw: 1 })[k] + viewTransform({ yaw: -1 })[k]) < 1e-9,
      k + " is lopsided",
    );
});
test("the band steps back when the camera looks straight down", () => {
  const overhead = viewTransform({ yaw: 0, tilt: 0 });
  const oblique = viewTransform({ yaw: 0, tilt: 1 });
  assert.ok(overhead.fade < oblique.fade, "overhead must recede");
  assert.ok(overhead.fade > 0, "but never vanish entirely");
  assert.equal(oblique.fade, 1);
  assert.ok(overhead.y < oblique.y, "and lift out of the way");
  assert.ok(oblique.y === 0);
});
test("yaw and tilt outside their range cannot push the band past its limits", () => {
  for (const wild of [-9, 9, NaN, Infinity, -Infinity]) {
    const v = viewTransform({ yaw: wild, tilt: wild });
    for (const [k, n] of Object.entries(v))
      assert.ok(Number.isFinite(n), `${k} became ${n} at yaw ${wild}`);
    assert.ok(Math.abs(v.turn) <= 3 + 1e-9, "turn exceeded its limit");
    assert.ok(Math.abs(v.x) <= 2.6 + 1e-9, "pan exceeded its limit");
  }
});
