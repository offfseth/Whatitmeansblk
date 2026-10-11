/** Published coverage starts, not city founding dates. */
export function storyMoments(locations) {
  return locations.flatMap(place => place.periods.map(period => ({
    placeId: place.id, name: place.name, ...period,
  }))).sort((a, b) => a.from - b.from || a.name.localeCompare(b.name));
}

export function adjacentStoryYear(moments, year, direction) {
  const years = [...new Set(moments.map(moment => moment.from))].sort((a, b) => a - b);
  return direction < 0
    ? years.findLast(value => value < year) ?? null
    : years.find(value => value > year) ?? null;
}
