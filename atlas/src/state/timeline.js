import { MIN_YEAR, MAX_YEAR } from "../data/eras.js";
/** One source of truth shared by the scrubber, year form, renderer and panel. */
export function createTimeline(initial = MIN_YEAR) {
  let year = normalize(initial),
    selectedId = null;
  const listeners = new Set();
  function normalize(value) {
    const n = Number(value);
    return Number.isFinite(n)
      ? Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.round(n)))
      : MIN_YEAR;
  }
  const snapshot = () => ({ year, selectedId });
  const emit = () => listeners.forEach((fn) => fn(snapshot()));
  return {
    get: snapshot,
    setYear(value) {
      const next = normalize(value);
      if (next !== year) {
        year = next;
        emit();
      }
    },
    select(id) {
      if (id !== selectedId) {
        selectedId = id;
        emit();
      }
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(snapshot());
      return () => listeners.delete(fn);
    },
  };
}
export function visibleLocations(locations, year) {
  return locations.filter((location) => location.periods.some(period => year >= period.from && year <= period.to));
}
