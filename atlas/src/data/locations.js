import { placePeriods } from "./placePeriods.js";

/** Stable geographic identity; published stories determine temporal visibility. */
export const locations = [
  {
    id: "point-comfort",
    name: "Point Comfort",
    region: "Virginia",
    coordinates: [-76.308, 37.003],
  },
  {
    id: "charleston",
    name: "Charleston",
    region: "South Carolina",
    coordinates: [-79.931, 32.777],
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    region: "Pennsylvania",
    coordinates: [-75.165, 39.953],
  },
  {
    id: "new-orleans",
    name: "New Orleans",
    region: "Louisiana",
    coordinates: [-90.072, 29.951],
  },
  {
    id: "washington",
    name: "Washington, D.C.",
    region: "District of Columbia",
    coordinates: [-77.037, 38.907],
  },
  {
    id: "chicago",
    name: "Chicago",
    region: "Illinois",
    coordinates: [-87.63, 41.878],
  },
  {
    id: "montgomery",
    name: "Montgomery",
    region: "Alabama",
    coordinates: [-86.3, 32.367],
  },
  {
    id: "los-angeles",
    name: "Los Angeles",
    region: "California",
    coordinates: [-118.244, 34.052],
  },
].map(location => ({ ...location, periods: placePeriods[location.id] }));
