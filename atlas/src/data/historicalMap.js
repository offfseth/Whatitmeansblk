// Year-only UI: jurisdiction geometry and affiliations are sampled on December 31.
export const mapCategories = {
  state: { label: 'U.S. states', color: '#d6af70' },
  union: { label: 'Union', color: '#538fb2' },
  confederacy: { label: 'Confederacy', color: '#c16a4b' },
  border: { label: 'Border states · Union', color: '#d9b753' },
  territory: { label: 'U.S. territories / district', color: '#899785' },
  other: { label: 'Other / disputed claims', color: '#b9a7c4' },
};
const confederate = new Set(['Alabama','Arkansas','Florida','Georgia','Louisiana','Mississippi','North Carolina','South Carolina','Tennessee','Texas','Virginia']);
const border = new Set(['Delaware','Kentucky','Maryland','Missouri','West Virginia']);
export const isCivilWarSnapshot = year => year >= 1861 && year <= 1864;
export function categoryFor(feature, year) {
  if (isCivilWarSnapshot(year)) {
    if (feature.type === 'District of Columbia') return 'union';
    if (feature.type === 'State') return confederate.has(feature.name) ? 'confederacy' : border.has(feature.name) ? 'border' : 'union';
  }
  return feature.type === 'State' ? 'state'
    : ['Territory','Unorganized Territory','District of Columbia'].includes(feature.type) ? 'territory' : 'other';
}
export function boundaryFeatures(data, year) {
  const date = year * 10000 + 1231;
  return data.features.filter(feature => feature.from <= date && date <= feature.to);
}
export function historicalSnapshot(history, modern, year) {
  const date = year * 10000 + 1231;
  const available = date >= history.from;
  const contemporary = date > history.to;
  const features = !available ? [] : contemporary
    ? modern.states.features.map(f => ({ id: f.id, name: f.properties.name, type: f.properties.name === 'District of Columbia' ? 'District of Columbia' : 'State', geometry: f.geometry }))
    : boundaryFeatures(history, year);
  const entries = features.map(feature => ({ ...feature, category: categoryFor(feature, year) }));
  return {
    entries, available, contemporary, year,
    // Cache by actual configuration, not each slider tick.
    key: entries.map(f => f.id + ':' + f.category).join('|'),
  };
}
export function boundaryDescription(year) {
  if (year < 1783) return {
    title: 'Before the boundary record', date: '1619–1782 · geographic context',
    note: 'Historical jurisdiction boundaries are not yet available for this period. The terrain is a modern geographic reference.',
  };
  if (year > 2000) return {
    title: 'The contemporary map', date: year + ' · modern Census reference',
    note: 'Modern state boundaries are used after the historical dataset ends in 2000.',
  };
  return {
    title: isCivilWarSnapshot(year) ? 'A nation divided' : year === 1865 ? 'The war ends' : 'A changing republic',
    date: 'Boundaries · December 31, ' + year,
    note: isCivilWarSnapshot(year)
      ? 'State affiliations, not military front lines. Border states remained in the Union; slavery also existed there. Kentucky and Missouri had rival Confederate governments.'
      : year === 1865 ? 'The Confederacy has collapsed by this year-end snapshot. State boundaries continue to change after the war.'
      : 'States, territories, and claims recorded by the Newberry Library. Uncolored land lies outside this layer’s recorded jurisdictions.',
  };
}
