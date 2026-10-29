import { eras } from '../data/eras.js';
import { sources } from '../data/sources.js';
import { mapPlaceById } from '../data/mapPlaces.js';
import { milestoneEssays, essaySourceIds } from '../data/milestoneEssays.js';

const normalize = text => String(text).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').toLowerCase();

export function filterMilestones(records, { query = '', era = '', topic = '', place = '', event = '', order = 'oldest' } = {}) {
  const chapter = eras.find(item => String(item.year) === String(era));
  const next = chapter && eras[eras.indexOf(chapter) + 1];
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return records.filter(item => {
    if (event && item.id !== event) return false;
    if (chapter && (item.endYear < chapter.year || item.year >= (next?.year ?? Infinity))) return false;
    if (topic && !item.topics.includes(topic)) return false;
    if (place && !item.placeIds.includes(place)) return false;
    const essay = milestoneEssays[item.id];
    const text = normalize([item.title, item.date, item.location, item.summary, item.context, ...item.topics,
      ...(essay?.sections.flatMap(section => [section.title, ...section.paragraphs.map(paragraph => paragraph.text)]) ?? []),
      ...item.placeIds.map(id => mapPlaceById.get(id)?.name ?? ''),
      ...[...item.sourceIds, ...essaySourceIds(essay)].map(id => sources[id]?.publisher ?? '')].join(' '));
    return words.every(word => text.includes(word));
  }).sort((a, b) => order === 'newest' ? b.year - a.year : a.year - b.year);
}

export function filtersFromSearch(search) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(['query', 'era', 'topic', 'place', 'event', 'order'].map(key =>
    [key, params.get(key === 'query' ? 'q' : key) ?? (key === 'order' ? 'oldest' : '')]));
}

export function searchFromFilters(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && !(key === 'order' && value === 'oldest')) params.set(key === 'query' ? 'q' : key, value);
  }
  return params.size ? '?' + params.toString() : '';
}
