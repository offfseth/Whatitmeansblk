/** Deliberately synthetic coverage highlights, NOT historical jurisdictions.
 * Replace this adapter with sourced, versioned historical snapshots later. */
export const eras = [
  {
    year: 1619,
    title: "The beginning of a timeline",
    label: "Coastal focus",
    states: ["51"],
    color: "#d9733a",
  },
  {
    year: 1776,
    title: "An expanding story",
    label: "Eastern focus",
    states: [
      "51",
      "37",
      "45",
      "13",
      "24",
      "10",
      "42",
      "34",
      "36",
      "09",
      "44",
      "25",
      "33",
    ],
    color: "#e0a052",
  },
  {
    year: 1865,
    title: "A changing nation",
    label: "Southern focus",
    states: [
      "51",
      "37",
      "45",
      "13",
      "12",
      "01",
      "28",
      "22",
      "48",
      "05",
      "47",
      "21",
      "29",
    ],
    color: "#c0532f",
  },
  {
    year: 1916,
    title: "New connections",
    label: "Northern focus",
    states: ["17", "26", "39", "42", "36", "34", "25", "18", "55", "27"],
    color: "#4f9780",
  },
  {
    year: 1965,
    title: "Across the country",
    label: "National focus",
    states: "all",
    color: "#dfb45e",
  },
];
export const MIN_YEAR = 1619;
export const MAX_YEAR = new Date().getFullYear();
export function getEra(year) {
  return eras.findLast((era) => year >= era.year) ?? eras[0];
}
// Continuous intensity gives immediate feedback even between demo snapshots.
export function getMapState(year, ids) {
  const era = getEra(year),
    index = eras.indexOf(era),
    end = eras[index + 1]?.year ?? MAX_YEAR;
  const progress = Math.max(
    0,
    Math.min(1, (year - era.year) / Math.max(1, end - era.year)),
  );
  return {
    era,
    emphasis: 0.3 + progress * 0.35,
    active: new Set(era.states === "all" ? ids : era.states),
  };
}
