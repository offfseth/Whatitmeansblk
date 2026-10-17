import { milestones } from './milestones.js';
import { sources } from './sources.js';
import { mapPlaceById } from './mapPlaces.js';
import { mapCoverage } from '../state/mapCoverage.js';
import { resolveMilestone } from '../state/milestoneRoute.js';

const range = (from, to) => from === to ? String(from) : `${from}–${to}`;

// The library and full reader use the same original prose and evidence records.
export function getMilestoneStory(id, options = {}) {
  const route = resolveMilestone(id, options);
  if (!route) return null;
  const event = milestones.find(item => item.id === id);
  const place = mapPlaceById.get(route.placeId);
  const connection = event.geography.connections.find(item => item.placeId === route.placeId);
  const coverage = mapCoverage(route.year, route.scope);
  const local = coverage.places.find(item => item.id === route.placeId);
  const sourceIds = [...new Set([
    ...event.sourceIds, ...event.geography.connections.flatMap(item => item.sourceIds),
    ...(place?.coordinateSourceIds ?? []),
  ])];
  const citations = ids => [...new Set(ids)].map(sourceId => sourceIds.indexOf(sourceId));
  const entries = (place ? local.entries.map(item => item.event) : coverage.broad);
  return {
    ...route, kind: 'milestone', title: event.title,
    name: place?.name ?? event.location, region: place?.region ?? 'Across regions & the nation',
    theme: event.topics.join(' · '), period: event.date, dek: event.location + ' · ' + event.date,
    coordinates: place?.coordinates, images: [],
    windowLabel: coverage.window.label, geographyNote: event.geography.note,
    coordinateNote: place?.coordinateNote, reviewedAt: event.reviewedAt,
    sections: [
      { title: 'What happened', paragraphs: [event.summary], sourceIndices: citations(event.sourceIds) },
      { title: 'Why it matters', paragraphs: [event.context], sourceIndices: citations(event.sourceIds) },
      { title: place ? 'Why this place' : 'Geographic reach',
        paragraphs: [...(connection ? [connection.role] : []), event.geography.note],
        sourceIndices: citations(connection?.sourceIds ?? event.sourceIds) },
    ],
    dates: [[event.date, event.title], ...(connection && (connection.from !== event.year || connection.to !== event.endYear)
      ? [[range(connection.from, connection.to), `Mapped connection: ${connection.role}`]] : [])],
    dateSources: [citations(event.sourceIds), citations(connection?.sourceIds ?? [])],
    sources: sourceIds.map(sourceId => { const source = sources[sourceId]; return [source.publisher, source.title, source.url]; }),
    sourceDetails: sourceIds.map(sourceId => sources[sourceId]),
    chapters: entries.map(item => ({ ...resolveMilestone(item.id, route), label: item.title, period: item.date })),
    cityStories: (local?.stories ?? []).map(story => ({ id: place.id, label: story.label,
      year: Math.max(story.from, coverage.window.from), period: range(story.from, story.to) })),
    connections: event.geography.connections.map(item => ({
      ...resolveMilestone(id, { ...route, placeId: item.placeId }),
      name: mapPlaceById.get(item.placeId).name, role: item.role,
    })),
    related: entries.filter(item => item.id !== id).slice(0, 3)
      .map(item => ({ ...resolveMilestone(item.id, route), title: item.title, period: item.date })),
  };
}
