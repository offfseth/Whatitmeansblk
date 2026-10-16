import { locations } from './locations.js';

// Geographic display points, not precise event addresses. History is joined
// separately in milestoneGeography.js. Natural Earth city points are public domain.
const cityRows = [
  ['boston', 'Boston', 'Massachusetts', -71.071960, 42.331906, 1159151239],
  ['new-york', 'New York City', 'New York', -73.995718, 40.721562, 1159151575],
  ['st-louis', 'St. Louis', 'Missouri', -90.241926, 38.636964, 1159151231],
  ['galveston', 'Galveston', 'Texas', -94.797480, 29.301143, 1159146235],
  ['memphis', 'Memphis', 'Tennessee', -90.028777, 35.144701, 1159150521],
  ['tulsa', 'Tulsa', 'Oklahoma', -95.930021, 36.120003, 1159149247],
  ['little-rock', 'Little Rock', 'Arkansas', -92.331093, 34.736083, 1159146223],
  ['greensboro', 'Greensboro', 'North Carolina', -79.800023, 36.070006, 1159146275],
  ['raleigh', 'Raleigh', 'North Carolina', -78.647035, 35.772696, 1159150513],
  ['birmingham', 'Birmingham', 'Alabama', -86.824995, 33.530006, 1159146259],
  ['jackson', 'Jackson', 'Mississippi', -90.184997, 32.298815, 1159150511],
  ['selma', 'Selma', 'Alabama', -87.021159, 32.407568, 1159133239],
  ['oakland', 'Oakland', 'California', -122.278038, 37.804725, 1159147363],
  ['topeka', 'Topeka', 'Kansas', -95.669985, 39.050005, 1159149243],
];

export const mapPlaces = [
  ...locations.map(place => ({ ...place, coordinateSourceIds: [], coordinateNote: 'Existing atlas geographic reference point; see the map method.' })),
  ...cityRows.map(([id, name, region, lon, lat, naturalEarthId]) => ({
    id, name, region, coordinates: [lon, lat], periods: [], naturalEarthId,
    coordinateSourceIds: ['natural-earth-places'], coordinateNote: 'Approximate city reference point from Natural Earth; not an event address.',
  })),
  { id: 'harpers-ferry', name: 'Harpers Ferry', region: 'West Virginia (Virginia in 1859)', coordinates: [-77.743284, 39.321696], periods: [],
    coordinateSourceIds: ['harpers-geography'], coordinateNote: 'Lower Town area reference using the National Park Service river-access point; not an exact raid location.' },
  { id: 'eastern-shore', name: 'Maryland Eastern Shore', region: 'Maryland', coordinates: [-76.142698, 38.444593], periods: [],
    coordinateSourceIds: ['tubman-geography'], coordinateNote: 'Regional marker anchored near the modern Tubman visitor center; not the exact starting point of her escape.' },
  { id: 'kennedy-space-center', name: 'Kennedy Space Center', region: 'Florida', coordinates: [-80.620858, 28.623889], periods: [],
    coordinateSourceIds: ['kennedy-geography'], coordinateNote: 'Launch Complex 39B reference point, rounded from NASA coordinates. The spaceflight itself continued in orbit.' },
];

export const mapPlaceById = new Map(mapPlaces.map(place => [place.id, place]));
