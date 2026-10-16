import { eras, getEra, MAX_YEAR } from '../data/eras.js';
import { mapPlaces } from '../data/mapPlaces.js';
import { milestones } from '../data/milestones.js';

export const overlaps = (from, to, window) => from <= window.to && to >= window.from;
export function mapWindow(year, scope = 'period') {
  if (scope === 'year') return { from: year, to: year, label: String(year) };
  const era = getEra(year);
  return { from: era.year, to: (eras[eras.indexOf(era) + 1]?.year ?? MAX_YEAR + 1) - 1, label: era.span };
}

export function mapCoverage(year, scope = 'period') {
  const window = mapWindow(year, scope);
  const events = milestones.filter(event => overlaps(event.year, event.endYear, window));
  const places = mapPlaces.map(place => {
    const entries = events.flatMap(event => event.geography.connections
      .filter(connection => connection.placeId === place.id && overlaps(connection.from, connection.to, window))
      .map(connection => ({ event, connection })));
    const stories = place.periods.filter(period => overlaps(period.from, period.to, window));
    return { ...place, entries, stories };
  }).filter(place => place.entries.length || place.stories.length).sort((a, b) => a.name.localeCompare(b.name));
  return { window, events, places, broad: events.filter(event => !event.geography.connections.length) };
}

export function adjacentCoverageYear(year, direction) {
  const starts = [...new Set([
    ...milestones.map(event => event.year),
    ...milestones.flatMap(event => event.geography.connections.map(connection => connection.from)),
    ...mapPlaces.flatMap(place => place.periods.map(period => period.from)),
  ])].sort((a, b) => a - b);
  return direction < 0 ? starts.findLast(value => value < year) ?? null : starts.find(value => value > year) ?? null;
}

export function readMapSearch(search) {
  const params = new URLSearchParams(search);
  return { scope: params.get('scope') === 'year' ? 'year' : 'period', place: params.get('place') ?? '' };
}
