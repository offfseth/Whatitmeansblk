import { readFile, mkdir, writeFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(new URL('../public/data/map.json', import.meta.url), 'utf8'));
const output = new URL('../public/places/', import.meta.url);
await mkdir(output, { recursive: true });
const paths = data.states.features.map((state) => {
  const polygons = state.geometry.type === 'Polygon' ? [state.geometry.coordinates] : state.geometry.coordinates;
  const d = polygons.map((polygon) => polygon.map((ring) => ring
    .filter((_, i) => i % 3 === 0 || i === ring.length - 1)
    .map((point, i) => (i ? 'L' : 'M') + point.map(v => v.toFixed(1)).join(','))
    .join(' ') + 'Z').join(' ')).join(' ');
  return '<path d="' + d + '"/>';
}).join('');
for (const place of data.locations) {
  const [x, y] = place.point;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [x - 230, y - 260, 460, 520].join(' ') + '">' +
    '<rect x="-1000" y="-1000" width="4000" height="4000" fill="#343d3b"/>' +
    '<g fill="#d0c0a0" stroke="#786e5c" stroke-width=".65" stroke-linejoin="round">' + paths + '</g>' +
    '<g stroke="#f2e9d9" opacity=".3" stroke-width=".5"><path d="M' + (x - 230) + ',' + y + 'h460M' + x + ',' + (y - 260) + 'v520"/></g>' +
    '<circle cx="' + x + '" cy="' + y + '" r="24" fill="none" stroke="#f2e9d9" stroke-width=".8"/>' +
    '<circle cx="' + x + '" cy="' + y + '" r="9" fill="#b24e28" stroke="#f2e9d9" stroke-width="2"/></svg>';
  await writeFile(new URL(place.id + '.svg', output), svg);
}
console.log('Prepared ' + data.locations.length + ' geographic place plates.');
