import { readdir, readFile, stat } from 'node:fs/promises';
import { milestones } from '../src/data/milestones.js';
import { sources } from '../src/data/sources.js';
import { eras } from '../src/data/eras.js';
import { mapPlaces } from '../src/data/mapPlaces.js';
import { mapPlacePoints } from '../src/data/mapPlacePoints.js';
import { validateGeography } from '../src/data/geographyValidation.js';
import { archive } from '../src/data/archive.js';
import { placeStories, getPlaceStory } from '../src/data/placeStories.js';
import { validateContent } from '../src/data/contentValidation.js';

const errors = [
  ...validateContent({ milestones, sources, eras, locations: mapPlaces, archive }),
  ...validateGeography({ milestones, sources, mapPlaces, points: mapPlacePoints }),
];
const published = new Set(archive.filter(plate => !plate.placeholder).map(plate => plate.src));
// Vite copies public/ verbatim. Hiding an image in the UI alone is insufficient.
for (const name of await readdir(new URL('../public/archive/', import.meta.url))) {
  if (!published.has('/archive/' + name)) errors.push(`Unregistered public/archive asset: ${name}`);
}
for (const plate of archive) {
  try { if (!(await stat(new URL('../public' + plate.src, import.meta.url))).size) errors.push(`Empty image: ${plate.src}`); }
  catch { errors.push(`Missing image: ${plate.src}`); }
}
for (const place of placeStories) for (const chapter of place.chapters) {
  const story = getPlaceStory(place.id, chapter.from);
  for (const section of story.sections) {
    const citation = story.sources[section.source];
    if (!citation?.[0] || !citation[1] || !/^https:\/\//.test(citation[2])) errors.push(`${place.id}/${chapter.id}: missing section source`);
  }
}
const policy = await readFile(new URL('../public/data/content-policy.md', import.meta.url), 'utf8');
if (!policy.includes('citation is not permission')) errors.push('Missing published content policy');
if (errors.length) {
  console.error('Content checks failed:\n' + errors.map(error => '- ' + error).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Content checks passed: ${milestones.length} milestones, ${Object.keys(sources).length} references, ${mapPlaces.length} mapped places, ${eras.length} sourced chapters, ${published.size} registered photographs.`);
}
