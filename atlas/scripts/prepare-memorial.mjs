/** Generates the placeholder plates that drift behind the map.
 *
 * These are deliberately NON-REPRESENTATIONAL: aged photographic emulsion,
 * paper tone, grain, vignette and scratches, with no people, places or events
 * depicted. Fabricating or synthesising imagery of real historical subjects
 * would be dishonest in a memorial, so the placeholders only supply the
 * texture and tonal rhythm of an archive until licensed, sourced photographs
 * replace them. They stand in for the periods that have no photograph yet;
 * src/data/archive.js says which, and how to swap one out.
 *
 * Output is deterministic: the same seed always rebuilds the same plates. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/memorial");
await fs.mkdir(output, { recursive: true });

const WIDTH = 900,
  HEIGHT = 600,
  COUNT = 8;

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
function valueNoise(x, y, seed) {
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
function fbm(x, y, seed, octaves = 4) {
  let sum = 0,
    amplitude = 0.5,
    total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x, y, seed + o * 101) * amplitude;
    total += amplitude;
    x *= 2.03;
    y *= 2.03;
    amplitude *= 0.5;
  }
  return sum / total;
}
function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Warm archival ramps: silver-gelatin cool through albumen gold. */
const ramps = [
  [
    [26, 20, 17],
    [96, 76, 58],
    [178, 152, 118],
    [232, 216, 190],
  ],
  [
    [22, 18, 18],
    [84, 68, 59],
    [161, 136, 110],
    [223, 207, 183],
  ],
  [
    [28, 21, 15],
    [104, 78, 51],
    [186, 150, 102],
    [238, 220, 183],
  ],
  [
    [20, 19, 20],
    [80, 75, 70],
    [155, 145, 132],
    [219, 211, 197],
  ],
  [
    [30, 22, 16],
    [110, 82, 55],
    [191, 156, 112],
    [240, 224, 192],
  ],
];
function sample(ramp, t) {
  const u = Math.max(0, Math.min(0.9999, t)) * (ramp.length - 1);
  const i = Math.floor(u),
    f = u - i,
    a = ramp[i],
    b = ramp[i + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

const manifest = [];
for (let n = 0; n < COUNT; n++) {
  const random = mulberry32(1619 + n * 7919);
  const ramp = ramps[n % ramps.length];
  const seed = 100 + n * 37;
  const exposure = 0.42 + random() * 0.2;
  const contrast = 0.9 + random() * 0.5;
  // Soft tonal masses stand in for an out-of-focus photographic subject.
  const masses = Array.from({ length: 3 + Math.floor(random() * 3) }, () => ({
    x: random(),
    y: 0.25 + random() * 0.6,
    r: 0.1 + random() * 0.26,
    amp: (random() - 0.35) * 0.5,
  }));
  const scratches = Array.from({ length: Math.floor(random() * 4) }, () => ({
    x: random(),
    lean: (random() - 0.5) * 0.09,
    strength: 0.05 + random() * 0.12,
  }));
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const u = x / WIDTH,
        v = y / HEIGHT;
      let tone = exposure;
      tone += (fbm(u * 2.4, v * 2.4, seed) - 0.5) * 0.4; // uneven development
      tone += (fbm(u * 7, v * 7, seed + 31) - 0.5) * 0.12;
      for (const m of masses) {
        const dx = (u - m.x) / m.r,
          dy = (v - m.y) / (m.r * 0.85);
        tone += m.amp * Math.exp(-(dx * dx + dy * dy) * 1.6);
      }
      for (const s of scratches) {
        const d = Math.abs(u - (s.x + s.lean * (v - 0.5))) * WIDTH;
        if (d < 1.6) tone += s.strength * (1 - d / 1.6);
      }
      tone = 0.5 + (tone - 0.5) * contrast;
      // Vignette and a faint print margin give each plate a physical edge.
      const cx = (u - 0.5) * 2,
        cy = (v - 0.5) * 2;
      tone *= 1 - 0.55 * Math.pow(Math.min(1, Math.hypot(cx, cy * 0.92)), 2.4);
      const edge = Math.min(u, 1 - u, v * 1.5, (1 - v) * 1.5);
      tone *= 0.55 + 0.45 * Math.min(1, edge / 0.045);
      tone += (hash2(x, y, seed + 7) - 0.5) * 0.085; // grain
      const speck = hash2(x, y, seed + 991);
      if (speck > 0.9993) tone += 0.3;
      else if (speck < 0.0004) tone -= 0.3;
      const [r, g, b] = sample(ramp, tone);
      const p = (y * WIDTH + x) * 3;
      pixels[p] = Math.max(0, Math.min(255, r));
      pixels[p + 1] = Math.max(0, Math.min(255, g));
      pixels[p + 2] = Math.max(0, Math.min(255, b));
    }
  }
  const file = "plate-" + String(n + 1).padStart(2, "0") + ".webp";
  await sharp(pixels, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
    .webp({ quality: 74 })
    .toFile(path.join(output, file));
  manifest.push(file);
}
console.log("Wrote " + manifest.length + " placeholder plates to public/memorial/");
