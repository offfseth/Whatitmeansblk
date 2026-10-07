/** Offline asset preparation. The running website never requests map tiles.
 *
 * Builds, from open data, four textures plus the boundary/marker JSON:
 *   terrain.webp  land colour: biome palette x shaded relief x ambient occlusion
 *   normals.webp  multi-scale surface normals, with river valleys incised
 *   surface.webp  G = roughness, B = metalness, so water catches light as water
 *   sea.webp      sea colour by distance from shore, neighbouring land, graticule,
 *                 and an alpha field that lets the memorial layer show through
 *
 * The biome palette is hand-authored cartography driven by longitude, latitude,
 * elevation and slope. It is an illustrative portrait of the American landscape,
 * not a land-cover dataset. Relief is shaded, not surveyed. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { feature, merge, mesh } from "topojson-client";
import {
  geoAlbersUsa,
  geoConicEqualArea,
  geoPath,
  geoGraticule,
} from "d3-geo";
import sharp from "sharp";
import { locations } from "../src/data/locations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, ".cache");
const output = path.join(root, "public/data");
await fs.mkdir(cache, { recursive: true });
await fs.mkdir(output, { recursive: true });

const PROJ_W = 975,
  PROJ_H = 610;
const W = 1600,
  H = 1001; // land textures
const SEA_SPAN = 2.4, // sea canvas covers this multiple of the projection box
  SEA_W = 1400,
  SEA_H = 876;
const ZOOM = 6; // elevation tile zoom: ~2.4 km per sample, close to one per texel

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const mixRgb = (a, b, t) => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];

async function download(url, name) {
  const p = path.join(cache, name);
  try {
    return await fs.readFile(p);
  } catch {}
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ": " + r.status);
  const bytes = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(p, bytes);
  return bytes;
}
const NE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/";
const naturalEarth = async (name) =>
  JSON.parse(await download(NE + name + ".geojson", name + ".geojson"));

/** Renders an SVG fragment in projection coordinates and returns its coverage. */
async function rasterize(inner, w, h, viewBox = "0 0 " + PROJ_W + " " + PROJ_H) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    w +
    '" height="' +
    h +
    '" viewBox="' +
    viewBox +
    '">' +
    inner +
    "</svg>";
  const raw = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = raw[i * 4 + 3];
  return out;
}

function boxBlur(src, w, h, radius, passes = 3) {
  let a = Float32Array.from(src),
    b = new Float32Array(src.length);
  const run = (from, to, stride, count, length) => {
    for (let line = 0; line < count; line++) {
      const base = line * (stride === 1 ? length : 1);
      let sum = 0;
      const at = (i) => from[base + i * stride];
      for (let i = -radius; i <= radius; i++)
        sum += at(Math.max(0, Math.min(length - 1, i)));
      const norm = 1 / (radius * 2 + 1);
      for (let i = 0; i < length; i++) {
        to[base + i * stride] = sum * norm;
        sum -= at(Math.max(0, i - radius));
        sum += at(Math.min(length - 1, i + radius + 1));
      }
    }
  };
  for (let p = 0; p < passes; p++) {
    run(a, b, 1, h, w);
    run(b, a, w, w, h);
  }
  return a;
}

/** Chamfer distance, in pixels, from every cell to the nearest set cell. */
function distanceField(isSource, w, h) {
  const INF = 1e9,
    d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = isSource[i] ? 0 : INF;
  const D = 1,
    Q = Math.SQRT2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + D);
      if (y > 0) {
        v = Math.min(v, d[i - w] + D);
        if (x > 0) v = Math.min(v, d[i - w - 1] + Q);
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + Q);
      }
      d[i] = v;
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (x < w - 1) v = Math.min(v, d[i + 1] + D);
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + D);
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + Q);
        if (x > 0) v = Math.min(v, d[i + w - 1] + Q);
      }
      d[i] = v;
    }
  return d;
}

function hash2(x, y, s) {
  let h =
    Math.imul(x | 0, 0x27d4eb2d) ^
    Math.imul(y | 0, 0x165667b1) ^
    Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const fade = (t) => t * t * (3 - 2 * t);
function noise2(x, y, seed) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = fade(x - ix),
    fy = fade(y - iy);
  const a = hash2(ix, iy, seed),
    b = hash2(ix + 1, iy, seed),
    c = hash2(ix, iy + 1, seed),
    d = hash2(ix + 1, iy + 1, seed);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}
function fbm(x, y, seed, octaves = 3) {
  let sum = 0,
    amp = 0.5,
    total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise2(x, y, seed + o * 57) * amp;
    total += amp;
    x *= 2.07;
    y *= 2.07;
    amp *= 0.5;
  }
  return sum / total;
}

// ---------------------------------------------------------------- boundaries
const topology = JSON.parse(
  await download(
    "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-albers-10m.json",
    "states.json",
  ),
);
const states = feature(topology, topology.objects.states);
// Puerto Rico is outside the Albers-USA composite projection; all 50 states + DC remain.
const borders = mesh(topology, topology.objects.states);
// The dissolved outline of the whole landmass, outer rings first and lake holes
// after, which is what the renderer extrudes the continental slope from. State
// boundaries are deliberately absent: only the water's edge gets a slope.
const outline = merge(topology, topology.objects.states.geometries);
const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const projectedPath = geoPath(projection);
const statesPath = geoPath(null)(states); // us-atlas ships pre-projected
// The composite projection clips to a rectangle around the United States, which
// would slice Canada and Mexico off in a straight line. Neighbouring land is
// therefore drawn with the bare lower-48 cone, which matches the composite
// exactly over the conterminous states and simply keeps going past the border.
const conicPath = geoPath(
  geoConicEqualArea()
    .parallels([29.5, 45.5])
    .rotate([96, 0])
    .center([-0.6, 38.7])
    .scale(1300)
    .translate([487.5, 305]),
);

// ------------------------------------------------------------------ land mask
const landMask = await rasterize(
  '<path fill="white" d="' + statesPath + '"/>',
  W,
  H,
);

// --------------------------------------------------------------- hydrography
const inNorthAmerica = (f) => {
  let lo = 1e9,
    hi = -1e9,
    la = 1e9,
    lb = -1e9;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      lo = Math.min(lo, c[0]);
      hi = Math.max(hi, c[0]);
      la = Math.min(la, c[1]);
      lb = Math.max(lb, c[1]);
    } else c.forEach(walk);
  };
  walk(f.geometry.coordinates);
  return hi > -172 && lo < -58 && lb > 16 && la < 73;
};
const rivers = (await naturalEarth("ne_10m_rivers_lake_centerlines")).features
  .filter(inNorthAmerica)
  .map((f) => ({
    d: projectedPath(f),
    // Natural Earth scalerank runs 0 (greatest) to 10; widen the trunk rivers.
    width: Math.max(0.34, 1.7 - (f.properties.scalerank ?? 8) * 0.16),
  }))
  .filter((r) => r.d);
const lakeFeatures = (await naturalEarth("ne_10m_lakes")).features.filter(
  inNorthAmerica,
);
const lakes = lakeFeatures.map((f) => projectedPath(f)).filter(Boolean);
const lakesConic = lakeFeatures.map((f) => conicPath(f)).filter(Boolean);
const worldLand = (await naturalEarth("ne_50m_land")).features
  .filter(inNorthAmerica)
  .map((f) => conicPath(f))
  .filter(Boolean);

const riverSvg = rivers
  .map(
    (r) =>
      '<path fill="none" stroke="white" stroke-width="' +
      r.width +
      '" stroke-linecap="round" stroke-linejoin="round" d="' +
      r.d +
      '"/>',
  )
  .join("");
const lakeSvg = lakes.map((d) => '<path fill="white" d="' + d + '"/>').join("");
const riverMask = await rasterize(riverSvg, W, H);
const lakeMask = await rasterize(lakeSvg, W, H);

// ------------------------------------------------------------------ elevation
const size = 2 ** ZOOM;
const tileKeys = new Map();
const tileOf = new Int32Array(W * H).fill(-1);
const tilePx = new Uint8Array(W * H),
  tilePy = new Uint8Array(W * H);
const lonOf = new Float32Array(W * H),
  latOf = new Float32Array(W * H);
const sx = W / PROJ_W,
  sy = H / PROJ_H;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (landMask[i] < 90) continue;
    const ll = projection.invert([x / sx, y / sy]);
    if (!ll) continue;
    const [lon, lat] = ll;
    lonOf[i] = lon;
    latOf[i] = lat;
    const mx = ((lon + 180) / 360) * size * 256;
    const my =
      ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) *
      size *
      256;
    const key = Math.floor(mx / 256) + "-" + Math.floor(my / 256);
    let index = tileKeys.get(key);
    if (index === undefined) tileKeys.set(key, (index = tileKeys.size));
    tileOf[i] = index;
    tilePx[i] = Math.floor(mx) % 256;
    tilePy[i] = Math.floor(my) % 256;
  }
const tiles = new Array(tileKeys.size);
const queue = [...tileKeys.entries()];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [key, index] = queue.pop();
      const [tx, ty] = key.split("-");
      const png = await download(
        "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/" +
          ZOOM +
          "/" +
          tx +
          "/" +
          ty +
          ".png",
        "z" + ZOOM + "-" + key + ".png",
      );
      tiles[index] = await sharp(png).removeAlpha().raw().toBuffer();
    }
  }),
);
const heights = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) {
  const t = tileOf[i];
  if (t < 0) continue;
  const tile = tiles[t],
    p = (tilePy[i] * 256 + tilePx[i]) * 3;
  heights[i] = Math.max(
    0,
    tile[p] * 256 + tile[p + 1] + tile[p + 2] / 256 - 32768,
  );
}

// Carve river valleys and flatten lake surfaces before any relief is derived,
// so the normal map shows real incision rather than a painted-on line.
const riverSoft = boxBlur(riverMask, W, H, 2);
const riverWide = boxBlur(riverMask, W, H, 14);
const lakeSoft = boxBlur(lakeMask, W, H, 2);
for (let i = 0; i < W * H; i++) {
  if (tileOf[i] < 0) continue;
  heights[i] -= (riverSoft[i] / 255) * 150;
  const lake = clamp(lakeSoft[i] / 255);
  if (lake > 0) heights[i] -= lake * 40;
}

// --------------------------------------------------------------- relief maths
const PIXEL_METRES = 2850; // ground distance covered by one texel, roughly
const broad = boxBlur(heights, W, H, 9);
const ambient = boxBlur(heights, W, H, 34);
const at = (field, x, y) =>
  field[
    Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))
  ];
/** Sea cells hold zero, so reading them directly would emboss a hard rim along
 * every coast. Fall back to the centre height instead. */
const landHeight = (x, y, fallback) => {
  const k =
    Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x));
  return tileOf[k] >= 0 ? heights[k] : fallback;
};
// Scene sunlight sits to the north-west and 51 degrees up; the baked shading
// uses the same direction so it reinforces the live light instead of fighting it.
const LIGHT = (() => {
  const v = [-25, 20, 40], // east, north, up
    len = Math.hypot(...v);
  return v.map((c) => c / len);
})();

const colors = Buffer.alloc(W * H * 3),
  normals = Buffer.alloc(W * H * 3),
  surface = Buffer.alloc(W * H * 3);

/** A deliberately narrow, warm range. Regional character is carried mostly by
 * value and relief rather than by hue, so the sheet reads as one piece of
 * paper instead of a rainbow physical atlas. */
const C_SAND = [172, 133, 88],
  C_REDROCK = [151, 85, 53],
  C_GRASS_DRY = [158, 132, 86],
  C_GRASS_WET = [130, 125, 79],
  C_FOREST = [94, 98, 63],
  C_CONIFER = [68, 78, 59],
  C_TUNDRA = [118, 112, 89],
  C_WETLAND = [88, 94, 65],
  C_ROCK = [137, 117, 94],
  C_SNOW = [225, 215, 195],
  C_RIVER = [52, 86, 86],
  C_LAKE = [37, 70, 75];

const bell = (v, c, r) => Math.exp(-(((v - c) / r) ** 2));
const region = (lon, lat, lon0, lat0, rx, ry) =>
  bell(lon, lon0, rx) * bell(lat, lat0, ry);

for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x,
      p = i * 3;
    const land = clamp(landMask[i] / 255);
    const h = heights[i],
      lon = lonOf[i],
      lat = latOf[i];

    // --- surface normal, fine detail over broad landform ---
    const gxFine = landHeight(x - 1, y, h) - landHeight(x + 1, y, h),
      gyFine = landHeight(x, y + 1, h) - landHeight(x, y - 1, h);
    const gxBroad = at(broad, x - 3, y) - at(broad, x + 3, y),
      gyBroad = at(broad, x, y + 3) - at(broad, x, y - 3);
    const nx = (gxFine * 0.0042 + gxBroad * 0.0026) * land,
      ny = (gyFine * 0.0042 + gyBroad * 0.0026) * land,
      nz = 1,
      nlen = Math.hypot(nx, ny, nz);
    const unx = nx / nlen,
      uny = ny / nlen,
      unz = nz / nlen;
    normals[p] = Math.round((unx * 0.5 + 0.5) * 255);
    normals[p + 1] = Math.round((uny * 0.5 + 0.5) * 255);
    normals[p + 2] = Math.round((unz * 0.5 + 0.5) * 255);

    if (land < 0.02) {
      surface[p] = 255;
      surface[p + 1] = 232;
      continue;
    }

    const slope =
      Math.hypot(gxFine, gyFine) / (2 * PIXEL_METRES) +
      Math.hypot(gxBroad, gyBroad) / (6 * PIXEL_METRES);

    // --- moisture: the hand-drawn part of the palette ---
    // Two scales of noise keep the continental gradient from banding into a
    // straight north-south seam down the hundredth meridian.
    const grain =
      (fbm(x / 130, y / 130, 11) - 0.5) * 1.35 + (fbm(x / 34, y / 34, 23) - 0.5);
    let moisture = 0.1 + smoothstep(-104, -92, lon) * 0.82;
    const wet = Math.max(
      region(lon, lat, -123.2, 46.5, 3.4, 3.4), // Pacific Northwest
      region(lon, lat, -84, 32.5, 7.5, 4.6) * 0.95, // Southeast
      region(lon, lat, -71.5, 44.5, 5.2, 3.6) * 0.9, // New England
      region(lon, lat, -90, 46.8, 5.4, 2.8) * 0.85, // North Woods
      region(lon, lat, -82, 37.5, 4.2, 3.6) * 0.9, // Appalachians
    );
    const dry = Math.max(
      region(lon, lat, -114.5, 34.5, 5.2, 3.4), // Mojave and Sonoran
      region(lon, lat, -105.5, 31.5, 4.0, 2.8) * 0.95, // Chihuahuan
      region(lon, lat, -117.5, 39.8, 4.6, 3.6) * 0.95, // Great Basin
      region(lon, lat, -110, 38.5, 3.8, 3.0) * 0.9, // Colorado Plateau
      region(lon, lat, -119.8, 36.2, 2.2, 2.4) * 0.7, // southern Central Valley
    );
    moisture = clamp(
      moisture +
        wet * 0.85 -
        dry * 1.2 +
        grain * 0.26 +
        smoothstep(1500, 2700, h) * (lon < -103 ? 0.34 : 0.14),
    );

    // Wide, overlapping bands: neighbouring biomes should dissolve into one
    // another rather than meet at a contour line.
    const desert = 1 - smoothstep(0.1, 0.5, moisture),
      forest = smoothstep(0.4, 0.86, moisture),
      grass = clamp(1 - desert - forest);

    const redRock =
      Math.max(
        region(lon, lat, -110.3, 38.2, 4.2, 3.2),
        region(lon, lat, -111.5, 35.8, 3.0, 2.2) * 0.9,
      ) * smoothstep(900, 1800, h);
    const cold = clamp(
      smoothstep(39, 49, lat) * 0.8 + smoothstep(1300, 2600, h) * 0.7,
    );
    let col = mixRgb(
      mixRgb(
        mixRgb(C_SAND, C_REDROCK, clamp(redRock * 1.15)),
        mixRgb(C_GRASS_DRY, C_GRASS_WET, smoothstep(0.24, 0.6, moisture)),
        grass,
      ),
      mixRgb(C_FOREST, C_CONIFER, cold),
      forest,
    );

    // Exposed rock on steep ground, tundra in the far north, snow up high.
    col = mixRgb(
      col,
      mixRgb(C_ROCK, C_REDROCK, clamp(redRock * 0.8)),
      smoothstep(0.035, 0.15, slope) * 0.72,
    );
    col = mixRgb(col, C_TUNDRA, smoothstep(57, 64, lat));
    // Snow stays on the high peaks. The floor keeps Alaska from going white.
    const snowLine = Math.max(1600, 3300 - (lat - 33) * 62);
    col = mixRgb(col, C_SNOW, smoothstep(snowLine, snowLine + 650, h) * 0.88);
    // Coastal and deltaic lowland reads as marsh rather than dry ground.
    col = mixRgb(
      col,
      C_WETLAND,
      smoothstep(140, 10, h) * smoothstep(0.5, 0.8, moisture) * 0.55,
    );
    // Floodplains: a green ribbon follows the trunk rivers across dry country.
    col = mixRgb(
      col,
      C_WETLAND,
      clamp((riverWide[i] / 255) * 2.6) * 0.42 * (1 - forest * 0.5),
    );

    // --- shaded relief and ambient occlusion ---
    const shade = clamp(
      unx * LIGHT[0] + uny * LIGHT[1] + unz * LIGHT[2],
      0.06,
      1,
    );
    const relief = mix(0.6, 1.26, Math.pow(shade, 0.8));
    const openness = smoothstep(-220, 260, h - ambient[i]);
    const occlusion = mix(0.76, 1.13, openness);
    for (let c = 0; c < 3; c++) col[c] *= relief * occlusion;

    // --- grade the land: pull the hues together, then warm the whole sheet ---
    const tonal = 1 + (fbm(x / 210, y / 210, 71) - 0.5) * 0.16;
    const lum = 0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2];
    const grade = [1.07, 0.985, 0.845];
    for (let c = 0; c < 3; c++) {
      const v = (mix(col[c], lum, 0.3) * tonal * grade[c]) / 255;
      col[c] = clamp(0.46 + (v - 0.46) * 1.12) * 255;
    }

    // --- water last, so the grade never muddies it: it stays the one cool
    //     note on a warm sheet, but takes the same light as the land ---
    const river = clamp((riverSoft[i] / 255) * 1.9);
    const lake = clamp((lakeSoft[i] / 255) * 1.35);
    const wetness = clamp(Math.max(river * 0.85, lake));
    const water = mixRgb(C_RIVER, C_LAKE, lake);
    for (let c = 0; c < 3; c++) water[c] *= mix(0.86, 1.1, shade);
    col = mixRgb(col, water, wetness);
    for (let c = 0; c < 3; c++)
      colors[p + c] = Math.round(clamp(col[c], 0, 255));
    // Roughness drops over water so the sun leaves a real highlight on it.
    surface[p] = 255;
    surface[p + 1] = Math.round(mix(232, 48, wetness));
    surface[p + 2] = Math.round(wetness * 46);
  }

// Bleed land colour a few texels past the coastline: the land mesh stops at the
// shore, and without this its mipmapped edge fringes dark into the sea.
{
  let filled = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) filled[i] = landMask[i] >= 6 ? 1 : 0;
  for (let pass = 0; pass < 6; pass++) {
    const next = Uint8Array.from(filled);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (filled[i]) continue;
        let r = 0,
          g = 0,
          b = 0,
          n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx,
              yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            const k = (yy * W + xx) * 3;
            if (!filled[yy * W + xx]) continue;
            r += colors[k];
            g += colors[k + 1];
            b += colors[k + 2];
            n++;
          }
        if (!n) continue;
        colors[i * 3] = Math.round(r / n);
        colors[i * 3 + 1] = Math.round(g / n);
        colors[i * 3 + 2] = Math.round(b / n);
        next[i] = 1;
      }
    filled = next;
  }
}

await sharp(colors, { raw: { width: W, height: H, channels: 3 } })
  .webp({ quality: 84 })
  .toFile(path.join(output, "terrain.webp"));
await sharp(normals, { raw: { width: W, height: H, channels: 3 } })
  .webp({ quality: 92 })
  .toFile(path.join(output, "normals.webp"));
await sharp(surface, { raw: { width: W, height: H, channels: 3 } })
  .webp({ quality: 80 })
  .toFile(path.join(output, "surface.webp"));

// ----------------------------------------------------------------------- sea
const seaProjW = PROJ_W * SEA_SPAN,
  seaProjH = PROJ_H * SEA_SPAN;
const seaBox = [
  487.5 - seaProjW / 2,
  305 - seaProjH / 2,
  seaProjW,
  seaProjH,
].join(" ");
const seaUsMask = await rasterize(
  '<path fill="white" d="' + statesPath + '"/>',
  SEA_W,
  SEA_H,
  seaBox,
);
const seaWorldMask = await rasterize(
  worldLand.map((d) => '<path fill="white" d="' + d + '"/>').join(""),
  SEA_W,
  SEA_H,
  seaBox,
);
// Natural Earth's land layer fills inland water, so the Great Lakes arrive as
// land and have to be cut back out before anything is measured from the shore.
const seaLakeMask = await rasterize(
  lakesConic.map((d) => '<path fill="white" d="' + d + '"/>').join(""),
  SEA_W,
  SEA_H,
  seaBox,
);
const graticuleMask = await rasterize(
  '<path fill="none" stroke="white" stroke-width="0.9" d="' +
    projectedPath(
      geoGraticule()
        .extent([
          [-128, 23],
          [-64, 51],
        ])
        .step([5, 5])(),
    ) +
    '"/>',
  SEA_W,
  SEA_H,
  seaBox,
);
const solidLand = new Float32Array(SEA_W * SEA_H);
const anyLand = new Uint8Array(SEA_W * SEA_H),
  usLand = new Uint8Array(SEA_W * SEA_H);
for (let i = 0; i < anyLand.length; i++) {
  solidLand[i] =
    clamp(Math.max(seaWorldMask[i], seaUsMask[i]) / 255) *
    (1 - clamp(seaLakeMask[i] / 255));
  anyLand[i] = solidLand[i] > 0.45 ? 1 : 0;
  usLand[i] = seaUsMask[i] > 110 ? 1 : 0;
}
const toShore = distanceField(anyLand, SEA_W, SEA_H);
const toUs = distanceField(usLand, SEA_W, SEA_H);

const C_DEEP = [11, 22, 27],
  C_MID = [18, 44, 50],
  C_SHELF = [38, 80, 79],
  C_NEIGHBOUR = [27, 21, 17];
const sea = Buffer.alloc(SEA_W * SEA_H * 4);
for (let y = 0; y < SEA_H; y++)
  for (let x = 0; x < SEA_W; x++) {
    const i = y * SEA_W + x,
      p = i * 4;
    const d = toShore[i];
    const basin = Math.exp(-d / 150),
      shelf = Math.exp(-d / 34);
    let col = mixRgb(mixRgb(C_DEEP, C_MID, basin), C_SHELF, shelf * 0.85);
    // Slow mottling keeps the open water from reading as flat fill.
    const swell = fbm(x / 110, y / 110, 3) - 0.5;
    const ripple = fbm(x / 26, y / 26, 29) - 0.5;
    for (let c = 0; c < 3; c++)
      col[c] *= 1 + swell * 0.3 + ripple * 0.1 * (1 - shelf);
    const grat = (graticuleMask[i] / 255) * (1 - shelf * 0.6);
    col = mixRgb(col, [col[0] + 26, col[1] + 26, col[2] + 20], grat * 0.5);

    // Land beyond the United States stays a quiet silhouette: it gives the
    // Gulf, the Great Lakes and both coasts their shape without competing.
    // Suppress the silhouette right along the United States coast, where the
    // 50m world outline and the 10m Census outline disagree by a few kilometres.
    const neighbour = solidLand[i] * smoothstep(2, 7, toUs[i]);
    if (neighbour > 0) {
      const rim = Math.exp(-d / 6) * 0.5;
      col = mixRgb(
        col,
        [
          C_NEIGHBOUR[0] + rim * 34,
          C_NEIGHBOUR[1] + rim * 28,
          C_NEIGHBOUR[2] + rim * 22,
        ],
        neighbour,
      );
    }
    for (let c = 0; c < 3; c++) sea[p + c] = Math.round(clamp(col[c], 0, 255));

    // Alpha. The sheet is solid over the subject and over any enclosed sea --
    // the Gulf, the Great Lakes, the Caribbean -- and thins out across the open
    // ocean, so the memorial drifts through the empty water at the left and
    // right of the frame rather than behind the map itself.
    const nearUs = smoothstep(200, 30, toUs[i]);
    const nearAnyLand = smoothstep(170, 20, d);
    // Dissolve before the texture border: a straight edge would read as a seam.
    const border = Math.min(x, SEA_W - 1 - x, y, SEA_H - 1 - y);
    sea[p + 3] = Math.round(
      clamp(Math.max(nearUs, nearAnyLand)) *
        0.88 *
        smoothstep(0, 70, border) *
        255,
    );
  }
await sharp(sea, { raw: { width: SEA_W, height: SEA_H, channels: 4 } })
  .webp({ quality: 86, alphaQuality: 92 })
  .toFile(path.join(output, "sea.webp"));

// ---------------------------------------------------------------- map + notes
const round = (_k, v) =>
  typeof v === "number" ? Math.round(v * 100) / 100 : v;
await fs.writeFile(
  path.join(output, "map.json"),
  JSON.stringify(
    {
      width: PROJ_W,
      height: PROJ_H,
      states,
      borders,
      outline,
      locations: locations.map((l) => ({
        id: l.id,
        point: projection(l.coordinates),
      })),
    },
    round,
  ),
);
await fs.writeFile(
  path.join(output, "us-atlas-LICENSE.txt"),
  await download(
    "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/LICENSE",
    "us-atlas-LICENSE",
  ),
);
await fs.writeFile(
  path.join(output, "terrain-attribution.md"),
  await download(
    "https://raw.githubusercontent.com/tilezen/joerd/master/docs/attribution.md",
    "terrain-attribution.md",
  ),
);
console.log(
  "Prepared " +
    states.features.length +
    " regions, " +
    tileKeys.size +
    " elevation tiles, " +
    rivers.length +
    " rivers and " +
    lakes.length +
    " lakes; assets are ready.",
);
