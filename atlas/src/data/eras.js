/** Period definitions for the timeline.
 *
 * TWO KINDS OF CONTENT LIVE HERE, AND THEY ARE NOT EQUALLY SOLID:
 *
 *   `period`, `span` and `meaning` are historical summary. They are short,
 *   conventional accounts of each period and are meant to be read. Keep them
 *   factual, keep them brief, and have them reviewed before publishing.
 *
 *   `label`, `states` and `color` are the ILLUSTRATIVE MAP LAYER — deliberately
 *   synthetic coverage highlights, NOT historical jurisdictions, population
 *   data or any claim about where people were. Replace this adapter with
 *   sourced, versioned historical snapshots later.
 *
 * Period boundaries are editorial, not natural: people's lives ran across them.
 * They exist so the map, the slideshow and the caption can change together.
 *
 * WRITING `meaning`: keep it to two sentences and put the whole of the point
 * in the FIRST one. On a short window the card clamps the paragraph to three
 * lines, so the opening sentence is what some readers will get. */
export const eras = [
  {
    year: 1619,
    period: "Captivity and Colonial America",
    span: "1619–1775",
    meaning:
      "Some twenty captive Africans were landed at Point Comfort, Virginia in August 1619. Over the following century colonial assemblies turned bondage into inherited law — and the people held under it built families, congregations and routes out.",
    title: "The beginning of a timeline",
    label: "Coastal focus",
    states: ["51"],
    color: "#d9733a",
  },
  {
    year: 1776,
    period: "Revolution and the Early Republic",
    span: "1776–1864",
    meaning:
      "A nation declaring all men equal held four million people in slavery. Northern states emancipated by degrees while cotton drove bondage south and west; free Black churches, newspapers and the Underground Railroad grew in the gap between the promise and the fact.",
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
    period: "Emancipation and Reconstruction",
    span: "1865–1915",
    meaning:
      "Freedom came with the Thirteenth Amendment, and with it Black schools, churches, landholding and some two thousand Black officeholders. Within a generation Redemption governments answered with Black Codes, convict leasing, disenfranchisement and lynching.",
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
    period: "The Great Migration",
    span: "1916–1953",
    meaning:
      "Six million people left the South for Northern and Western cities across two great waves. They remade Harlem, Chicago's South Side and Detroit — and found redlining, restrictive covenants and segregated workplaces waiting for them.",
    title: "New connections",
    label: "Northern focus",
    states: ["17", "26", "39", "42", "36", "34", "25", "18", "55", "27"],
    color: "#4f9780",
  },
  {
    year: 1954,
    period: "The Civil Rights Movement",
    span: "1954–1967",
    meaning:
      "Brown v. Board, Montgomery, Birmingham, the March on Washington, Selma. Organised, largely Southern and overwhelmingly local, the movement forced the Civil Rights Act of 1964 and the Voting Rights Act of 1965 into law.",
    title: "Across the country",
    label: "National focus",
    states: "all",
    color: "#dfb45e",
  },
  {
    year: 1968,
    period: "After the Movement",
    span: "1968–present",
    meaning:
      "King was killed in Memphis in April 1968 and the Fair Housing Act passed days later. What followed is contested ground: political office and a growing Black middle class alongside deindustrialisation, mass incarceration, and a Voting Rights Act cut back in 2013.",
    title: "Contested ground",
    label: "Continental focus",
    states: "all",
    color: "#c98a4b",
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
