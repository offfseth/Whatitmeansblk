/** Editorial chapters organize the archive. Jurisdiction geometry and affiliations
 * are resolved separately in historicalMap.js; colors here style chapter text only. */
export const eras = [
  {
    "year": 1619,
    "period": "Captivity and Colonial America",
    "span": "1619–1775",
    "meaning": "Captive Africans arrived at Point Comfort in 1619. Virginia later made slavery hereditary through the mother. Resistance took many forms, including the Stono Rebellion; Phillis Wheatley’s published poetry also belongs to this colonial history.",
    "sourceIds": ["arrival", "virginia-law", "stono", "wheatley"],
    "title": "The beginning of a timeline",
    "color": "#d9733a"
  },
  {
    "year": 1776,
    "period": "Revolution and the Early Republic",
    "span": "1776–1860",
    "meaning": "Black communities built mutual aid organizations and newspapers while slavery persisted. Harriet Tubman guided people to freedom. The Dred Scott ruling and the raid at Harpers Ferry reveal sharply opposed efforts to defend slavery and destroy it.",
    "sourceIds": ["free-african-society", "freedoms-journal", "tubman", "dred-scott", "harpers-ferry"],
    "title": "An expanding story",
    "color": "#e0a052"
  },
  {
    "year": 1861,
    "period": "Civil War and Emancipation",
    "span": "1861–1865",
    "meaning": "Freedom seekers such as Robert Smalls acted against slavery during the Civil War. The Emancipation Proclamation changed the Union’s war aims, but excluded some enslaved people. The Thirteenth Amendment established constitutional abolition in 1865.",
    "sourceIds": ["smalls", "emancipation", "amendment-13"],
    "title": "A nation divided",
    "color": "#b7744f"
  },
  {
    "year": 1866,
    "period": "Reconstruction and Its Aftermath",
    "span": "1866–1915",
    "meaning": "Constitutional amendments promised citizenship and voting protections, and Black representatives entered Congress. Segregation and voter suppression challenged those gains. Ida B. Wells investigated lynching, and the NAACP organized to defend civil rights.",
    "sourceIds": ["amendment-14", "amendment-15", "revels", "wells", "naacp"],
    "title": "A changing nation",
    "color": "#c0532f"
  },
  {
    "year": 1916,
    "period": "The Great Migration",
    "span": "1916–1953",
    "meaning": "The Great Migration carried millions of Black people from the South to other regions, seeking safety and opportunity. New communities and cultural movements grew even as housing discrimination persisted. Federal action on defense jobs and military segregation followed.",
    "sourceIds": ["migration", "harlem", "order-8802", "order-9981"],
    "title": "New connections",
    "color": "#4f9780"
  },
  {
    "year": 1954,
    "period": "The Civil Rights Movement",
    "span": "1954–1967",
    "meaning": "Court challenges, boycotts, sit-ins, and voting campaigns confronted segregation. Brown v. Board rejected segregated public schools; sustained organizing helped secure the Civil Rights Act of 1964 and the Voting Rights Act of 1965.",
    "sourceIds": ["brown", "boycott", "greensboro", "civil-rights-act", "voting-rights-act"],
    "title": "Across the country",
    "color": "#dfb45e"
  },
  {
    "year": 1968,
    "period": "After the Movement",
    "span": "1968–present",
    "meaning": "King’s assassination and the Fair Housing Act marked April 1968. Later milestones include Black History Month, breakthroughs in elected office and spaceflight, and renewed organizing. The 2013 Shelby County ruling changed federal voting oversight.",
    "sourceIds": ["king", "fair-housing", "woodson", "obama", "jemison", "blm", "shelby"],
    "title": "Contested ground",
    "color": "#c98a4b"
  }
];
export const MIN_YEAR = 1619;
export const MAX_YEAR = new Date().getFullYear();
export function getEra(year) {
  return eras.findLast(era => year >= era.year) ?? eras[0];
}
