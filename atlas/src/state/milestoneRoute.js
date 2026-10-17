import { milestones } from '../data/milestones.js';
import { mapCoverage, mapWindow, overlaps } from './mapCoverage.js';
import { MIN_YEAR, MAX_YEAR } from '../data/eras.js';

const byId = new Map(milestones.map(event => [event.id, event]));

// A reader URL must resolve to an evidenced place and a window containing it.
export function resolveMilestone(id, { placeId, year, scope = 'period' } = {}) {
  const event = byId.get(id);
  if (!event) return null;
  const connection = event.geography.connections.find(item => item.placeId === placeId)
    ?? event.geography.connections[0];
  scope = scope === 'year' ? 'year' : 'period';
  const from = connection?.from ?? event.year;
  const to = connection?.to ?? event.endYear;
  year = /^\d{4}$/.test(String(year)) ? Math.max(MIN_YEAR, Math.min(MAX_YEAR, Number(year))) : from;
  if (!overlaps(from, to, mapWindow(year, scope))) year = Math.max(from, Math.min(to, year));
  return { id, placeId: connection?.placeId ?? null, year, scope };
}

export function milestoneRoute(id, options = {}) {
  const route = resolveMilestone(id, options);
  if (!route) return null;
  const params = new URLSearchParams({ year: route.year, scope: route.scope });
  if (route.placeId) params.set('place', route.placeId);
  return '#/milestone/' + encodeURIComponent(id) + '?' + params;
}

export function parseMilestoneRoute(hash) {
  const match = /^#\/milestone\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!match) return null;
  let id;
  try { id = decodeURIComponent(match[1]); } catch { return null; }
  const params = new URLSearchParams(match[2] ?? '');
  return resolveMilestone(id, { placeId: params.get('place'), year: params.get('year'), scope: params.get('scope') });
}

export function milestoneForPlace(placeId, year, scope = 'period') {
  const coverage = mapCoverage(year, scope);
  const entries = placeId === '@broad'
    ? coverage.broad.map(event => ({ event, connection: { from: event.year, to: event.endYear } }))
    : coverage.places.find(place => place.id === placeId)?.entries ?? [];
  const distance = ({ connection: { from, to } }) => Math.max(from - year, year - to, 0);
  const first = [...entries].sort((a, b) => distance(a) - distance(b)
    || (a.connection.to - a.connection.from) - (b.connection.to - b.connection.from)
    || a.event.year - b.event.year)[0];
  return first ? resolveMilestone(first.event.id, { placeId, year, scope }) : null;
}
