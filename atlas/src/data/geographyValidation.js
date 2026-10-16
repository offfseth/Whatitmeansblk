export function validateGeography({ milestones, sources, mapPlaces, points }) {
  const errors = [], placeIds = new Set();
  const check = (value, message) => { if (!value) errors.push(message); };
  for (const place of mapPlaces) {
    check(!placeIds.has(place.id), `${place.id}: duplicate map place`); placeIds.add(place.id);
    check(place.coordinates?.length === 2 && place.coordinates.every(Number.isFinite), `${place.id}: missing coordinates`);
    check(place.coordinateNote && place.coordinateSourceIds?.every(id => Object.hasOwn(sources, id)), `${place.id}: missing coordinate provenance`);
    check(points[place.id]?.length === 2 && points[place.id].every(Number.isFinite), `${place.id}: missing projected point; run prepare:markers`);
  }
  for (const event of milestones) {
    const geo = event.geography;
    check(geo && ['place', 'multiple', 'regional', 'national'].includes(geo.scope) && geo.note && geo.reviewedAt, `${event.id}: missing geographic classification`);
    if (!geo || !Array.isArray(geo.connections)) { errors.push(`${event.id}: missing place connections`); continue; }
    const seen = new Set();
    for (const link of geo.connections) {
      check(placeIds.has(link.placeId) && !seen.has(link.placeId), `${event.id}: unknown or duplicate place connection`);
      seen.add(link.placeId);
      check(link.role && link.sourceIds?.length && link.sourceIds.every(id => Object.hasOwn(sources, id)), `${event.id}: missing evidence for place connection`);
      check(Number.isInteger(link.from) && Number.isInteger(link.to) && link.from <= link.to && link.from >= event.year && link.to <= event.endYear, `${event.id}: connection dates outside event bounds`);
    }
    check(event.placeIds.length === seen.size && event.placeIds.every(id => seen.has(id)), `${event.id}: inconsistent place filter IDs`);
    check(geo.connections.length > 0 || ['national', 'regional'].includes(geo.scope), `${event.id}: local event has no place connection`);
  }
  return errors;
}
