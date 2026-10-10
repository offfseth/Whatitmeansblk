import { getPlaceStory, nearestStoryYear } from "../data/placeStories.js";
import { MIN_YEAR, MAX_YEAR } from "../data/eras.js";

export function placeRoute(id, year) {
  return '#/place/' + encodeURIComponent(id) + '?year=' + year;
}
export function parsePlaceRoute(hash) {
  const match = /^#\/place\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!match) return null;
  let id;
  try { id = decodeURIComponent(match[1]); } catch { return null; }
  const story = getPlaceStory(id);
  if (!story) return null;
  const raw = new URLSearchParams(match[2] ?? '').get('year');
  const parsed = raw && /^\d{4}$/.test(raw) ? Number(raw) : 1963;
  const year = nearestStoryYear(id, Math.min(MAX_YEAR, Math.max(MIN_YEAR, parsed)));
  return { id, year };
}
