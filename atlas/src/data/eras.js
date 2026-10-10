/** Editorial chapters organize the archive. Jurisdiction geometry and affiliations
 * are resolved separately in historicalMap.js; colors here style chapter text only. */
export const eras = [
  {
    "year": 1619,
    "period": "Captivity and Colonial America",
    "span": "1619–1775",
    "meaning": "Some twenty captive Africans were landed at Point Comfort, Virginia in August 1619. Over the following century colonial assemblies turned bondage into inherited law — and the people held under it built families, congregations and routes out.",
    "title": "The beginning of a timeline",
    "color": "#d9733a"
  },
  {
    "year": 1776,
    "period": "Revolution and the Early Republic",
    "span": "1776–1860",
    "meaning": "A nation declaring all men equal held four million people in slavery. Northern states emancipated by degrees while cotton drove bondage south and west; free Black churches, newspapers and the Underground Railroad grew in the gap between the promise and the fact.",
    "title": "An expanding story",
    "color": "#e0a052"
  },
  {
    "year": 1861,
    "period": "Civil War and Emancipation",
    "span": "1861–1865",
    "meaning": "The Civil War put slavery and the future of the Union at the center of a national struggle. Enslaved people sought freedom behind Union lines, Black troops joined the fight, and wartime emancipation culminated in the Thirteenth Amendment in 1865.",
    "title": "A nation divided",
    "color": "#b7744f"
  },
  {
    "year": 1866,
    "period": "Reconstruction and Its Aftermath",
    "span": "1866–1915",
    "meaning": "Freedom came with the Thirteenth Amendment, and with it Black schools, churches, landholding and some two thousand Black officeholders. Within a generation Redemption governments answered with Black Codes, convict leasing, disenfranchisement and lynching.",
    "title": "A changing nation",
    "color": "#c0532f"
  },
  {
    "year": 1916,
    "period": "The Great Migration",
    "span": "1916–1953",
    "meaning": "Six million people left the South for Northern and Western cities across two great waves. They remade Harlem, Chicago's South Side and Detroit — and found redlining, restrictive covenants and segregated workplaces waiting for them.",
    "title": "New connections",
    "color": "#4f9780"
  },
  {
    "year": 1954,
    "period": "The Civil Rights Movement",
    "span": "1954–1967",
    "meaning": "Brown v. Board, Montgomery, Birmingham, the March on Washington, Selma. Organised, largely Southern and overwhelmingly local, the movement forced the Civil Rights Act of 1964 and the Voting Rights Act of 1965 into law.",
    "title": "Across the country",
    "color": "#dfb45e"
  },
  {
    "year": 1968,
    "period": "After the Movement",
    "span": "1968–present",
    "meaning": "King was killed in Memphis in April 1968 and the Fair Housing Act passed days later. What followed is contested ground: political office and a growing Black middle class alongside deindustrialisation, mass incarceration, and a Voting Rights Act cut back in 2013.",
    "title": "Contested ground",
    "color": "#c98a4b"
  }
];
export const MIN_YEAR = 1619;
export const MAX_YEAR = new Date().getFullYear();
export function getEra(year) {
  return eras.findLast(era => year >= era.year) ?? eras[0];
}
