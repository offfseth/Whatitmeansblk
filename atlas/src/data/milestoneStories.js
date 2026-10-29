import { milestones } from './milestones.js';
import { sources } from './sources.js';
import { mapPlaceById } from './mapPlaces.js';
import { mapCoverage } from '../state/mapCoverage.js';
import { resolveMilestone } from '../state/milestoneRoute.js';
import { milestoneEssays, essaySourceIds } from './milestoneEssays.js';
import { archive, isPublishablePlate } from './archive.js';

const range = (from, to) => from === to ? String(from) : `${from}–${to}`;

// The library supplies a concise introduction; the reader adds researched essays.
export function getMilestoneStory(id, options = {}) {
  const route = resolveMilestone(id, options);
  if (!route) return null;
  const event = milestones.find(item => item.id === id);
  // Keep the local reader usable while an editor is drafting a new essay.
  // The publication gate still requires a complete essay for every milestone.
  const expanded = Object.hasOwn(milestoneEssays, id);
  const essay = milestoneEssays[id] ?? {
    reviewedAt: event.reviewedAt,
    sections: [{ id: 'significance', title: 'Why it matters', paragraphs: [{ text: event.context, sourceIds: event.sourceIds }] }],
    timeline: [{ date: event.date, text: event.title, sourceIds: event.sourceIds }],
    sourceNote: null,
  };
  const place = mapPlaceById.get(route.placeId);
  const connection = event.geography.connections.find(item => item.placeId === route.placeId);
  const coverage = mapCoverage(route.year, route.scope);
  const local = coverage.places.find(item => item.id === route.placeId);
  const sourceIds = [...new Set([
    ...event.sourceIds, ...(expanded ? essaySourceIds(essay) : []), ...event.geography.connections.flatMap(item => item.sourceIds),
    ...(place?.coordinateSourceIds ?? []),
  ])];
  const citations = ids => [...new Set(ids)].map(sourceId => sourceIds.indexOf(sourceId));
  const sections = essay.sections.map(section => ({
    id: 'story-' + section.id, title: section.title,
    paragraphs: section.paragraphs.map(paragraph => paragraph.text),
    paragraphSourceIndices: section.paragraphs.map(paragraph => citations(paragraph.sourceIds)),
    sourceIndices: citations(section.paragraphs.flatMap(paragraph => paragraph.sourceIds)),
  }));
  const wordCount = [event.summary, ...sections.flatMap(section => section.paragraphs)]
    .join(' ').trim().split(/\s+/).length;
  const entries = (place ? local.entries.map(item => item.event) : coverage.broad);
  return {
    ...route, kind: 'milestone', title: event.title,
    name: place?.name ?? event.location, region: place?.region ?? 'Across regions & the nation',
    theme: event.topics.join(' · '), period: event.date, dek: event.location + ' · ' + event.date,
    coordinates: place?.coordinates,
    images: event.images.map(src => archive.find(plate => plate.src === src))
      .filter(plate => plate && !plate.placeholder && isPublishablePlate(plate) && plate.milestoneIds?.includes(id)),
    windowLabel: coverage.window.label, geographyNote: event.geography.note,
    coordinateNote: place?.coordinateNote, reviewedAt: essay.reviewedAt,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 200)),
    sourceNote: essay.sourceNote ? { text: essay.sourceNote.text, sourceIndices: citations(essay.sourceNote.sourceIds) } : null,
    sections: [
      { id: 'story-overview', title: 'At a glance', paragraphs: [event.summary],
        paragraphSourceIndices: [citations(event.sourceIds)], sourceIndices: citations(event.sourceIds) },
      ...sections,
      { id: 'story-geography', title: place ? 'Why this place' : 'Geographic reach',
        paragraphs: [connection ? connection.role : event.geography.note],
        paragraphSourceIndices: [citations(connection?.sourceIds ?? event.sourceIds)],
        sourceIndices: citations(connection?.sourceIds ?? event.sourceIds) },
    ],
    dates: [...essay.timeline.map(moment => [moment.date, moment.text]), ...(connection && (connection.from !== event.year || connection.to !== event.endYear)
      ? [[range(connection.from, connection.to), `Mapped connection: ${connection.role}`]] : [])],
    dateSources: [...essay.timeline.map(moment => citations(moment.sourceIds)),
      ...(connection && (connection.from !== event.year || connection.to !== event.endYear) ? [citations(connection.sourceIds)] : [])],
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
