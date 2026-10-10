import { readFile, writeFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { geoAlbersUsa, geoStream } from 'd3-geo';

// Newberry US_AtlasHCB_StateTerr_Gen01.zip, downloaded from the source in attribution.
// Only the polygon SHP and DBF are read. No downloaded code is executed.
const zip = await readFile(process.argv[2]);
const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (end < 0) throw new Error('Expected a ZIP archive');
const files = new Map();
let cursor = zip.readUInt32LE(end + 16);
for (let k = 0; k < zip.readUInt16LE(end + 10); k++) {
  const method = zip.readUInt16LE(cursor + 10), size = zip.readUInt32LE(cursor + 20);
  const n = zip.readUInt16LE(cursor + 28), extra = zip.readUInt16LE(cursor + 30), comment = zip.readUInt16LE(cursor + 32), off = zip.readUInt32LE(cursor + 42);
  const name = zip.toString('utf8', cursor + 46, cursor + 46 + n);
  const start = off + 30 + zip.readUInt16LE(off + 26) + zip.readUInt16LE(off + 28);
  if (/\.(shp|dbf)$/.test(name)) {
    if (![0, 8].includes(method)) throw new Error('Unsupported ZIP compression');
    const bytes = zip.subarray(start, start + size);
    files.set(name.split('.').at(-1), method === 8 ? inflateRawSync(bytes) : bytes);
  }
  cursor += 46 + n + extra + comment;
}
const dbf = files.get('dbf'), shp = files.get('shp'), fields = [], records = [];
for (let o = 32; dbf[o] !== 13; o += 32)
  fields.push({ name: dbf.toString('ascii', o, o + 11).replace(/\0.*/, ''), length: dbf[o + 16] });
for (let i = 0; i < dbf.readUInt32LE(4); i++) {
  let off = dbf.readUInt16LE(8) + i * dbf.readUInt16LE(10) + 1;
  const row = {};
  for (const f of fields) { row[f.name] = dbf.toString('latin1', off, off + f.length).trim(); off += f.length; }
  records.push(row);
}
const area = ring => ring.reduce((sum, p, i) => { const q = ring[(i + 1) % ring.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0);
const inside = ([x, y], ring) => {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
};
// Assign holes to the smallest containing exterior, including clipped inset rings.
function group(rings) {
  const sorted = rings.filter(r => r.length >= 4 && Math.abs(area(r)) > 0.000001).sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));
  const nodes = [];
  for (const ring of sorted) {
    const parent = nodes.filter(n => inside(ring[0], n.ring)).at(-1);
    nodes.push({ ring, parent, depth: parent ? parent.depth + 1 : 0 });
  }
  return nodes.filter(n => n.depth % 2 === 0).map(n => [n.ring, ...nodes.filter(h => h.parent === n && h.depth % 2 === 1).map(h => h.ring)]);
}
const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const features = [];
let recordIndex = 0;
for (let offset = 100; offset < shp.length;) {
  const size = shp.readUInt32BE(offset + 4) * 2, base = offset + 8, row = records[recordIndex++];
  if (shp.readInt32LE(base) !== 5) throw new Error('Expected polygon shapefile');
  const parts = shp.readInt32LE(base + 36), points = shp.readInt32LE(base + 40), rings = [];
  const pointBase = base + 44 + parts * 4;
  for (let j = 0; j < parts; j++) {
    const first = shp.readInt32LE(base + 44 + j * 4);
    const last = j + 1 < parts ? shp.readInt32LE(base + 44 + (j + 1) * 4) : points;
    const ring = [];
    for (let p = first; p < last; p++) ring.push([shp.readDoubleLE(pointBase + p * 16), shp.readDoubleLE(pointBase + p * 16 + 8)]);
    rings.push(ring);
  }
  const projected = [];
  let line;
  geoStream({ type: 'MultiPolygon', coordinates: group(rings) }, projection.stream({
    polygonStart() {}, polygonEnd() {}, lineStart() { line = []; },
    point(x, y) { line.push([+x.toFixed(2), +y.toFixed(2)]); },
    lineEnd() { if (line.length) { line.push(line[0]); projected.push(line); } },
  }));
  features.push({
    id: row.ID + '-' + row.VERSION, name: row.NAME, type: row.TERR_TYPE,
    from: Number(row.START_DATE), to: Number(row.END_DATE),
    change: row.CHANGE, citation: row.CITATION,
    geometry: { type: 'MultiPolygon', coordinates: group(projected) },
  });
  offset = base + size;
}
if (features.length !== records.length) throw new Error('SHP / DBF record mismatch');
const data = {
  source: 'Peter Siczewicz; Emily Kelley, digital compiler; John H. Long, editor. Newberry Library, U.S. Historical States and Territories (Generalized .01 deg), 2011',
  url: 'https://publications.newberry.org/ahcb/pages/United_States.html',
  projection: 'Albers USA, scale 1300, translate [487.5,305]',
  from: 17830903, to: 20001231, features,
};
await writeFile(new URL('../public/data/historical-boundaries.json', import.meta.url), JSON.stringify(data));
console.log(features.length + ' dated boundary configurations prepared.');
