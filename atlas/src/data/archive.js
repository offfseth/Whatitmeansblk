import { eras, getEra } from "./eras.js";

/** The slideshow that runs behind and above the map, filtered by period.
 *
 * HOW TO ADD A PICTURE
 *   1. Put the file in public/archive/ (WebP or JPEG; ~1200px wide is plenty,
 *      the layer is blurred and dimmed). Keep roughly 3–6 plates per period:
 *      the set for one period is cycled, so more plates means a longer loop
 *      and more memory held at once.
 *   2. Add an entry below with `eraYear` set to the `year` of an era in
 *      eras.js. That one field is the whole filter.
 *   3. Fill in `caption`, `credit`, `source` and `rights` honestly. Captions
 *      are shown in the period card; credits are rendered into "Map notes &
 *      credits" in the footer.
 *   3b. Set `focus` to where the subject actually is, by eye, as [x%, y%].
 *      Without it the band crops to the middle and beheads anyone standing
 *      off-centre. A wide source survives the crop best: if the photograph is
 *      a tall portrait, cut it to roughly 16:9 around the subject first.
 *   4. `rights` must be "cleared" only once someone has actually checked the
 *      licence, and a cleared plate must say why in `basis`. Anything else
 *      keeps the "rights not cleared" warning visible in the footer, which is
 *      the point: a memorial must not quietly present unverified material as
 *      a record.
 *
 * GOOD PUBLIC-DOMAIN SOURCES to fill the empty periods: the Library of
 * Congress Prints & Photographs catalogue (loc.gov/pictures), the National
 * Archives catalogue (catalog.archives.gov), the Smithsonian Open Access
 * collection, and the NYPL Digital Collections public-domain set. Works of the
 * U.S. federal government — FSA/OWI, WPA, NARA — are generally public domain;
 * mid-century press photographs usually are NOT.
 *
 * Plates marked `placeholder: true` are the generated stand-ins from
 * scripts/prepare-memorial.mjs: aged emulsion, grain and scratches depicting
 * nobody and nothing. They hold the tonal rhythm of an archive until real
 * photographs replace them. Nothing here is ever a synthesised depiction of a
 * real person, place or event.
 *
 * Drift and dwell timing live in src/ui/archiveStage.js and src/style.css. */

/** @typedef {Object} ArchivePlate
 * @property {string} src Served path under public/.
 * @property {number} eraYear Joins to an `era.year` in eras.js.
 * @property {number|null} year Year depicted, if known.
 * @property {string} caption One line, shown in the period card.
 * @property {string} credit Photographer / holding institution.
 * @property {string} source Where the file came from.
 * @property {"cleared"|"unverified"} rights
 * @property {string} [basis] Why it is free, in one line. Required whenever
 *   `rights` is "cleared", so the claim can be audited rather than trusted.
 * @property {[number, number]} [focus] Where the subject is, as percentages of
 *   the file: [x, y]. The band is a wide letterbox, so the cover-crop throws
 *   away most of a tall photograph; this is the point it keeps, and the point
 *   the camera pan is clamped around. Defaults to the middle, slightly high.
 * @property {boolean} [placeholder] True for generated stand-ins.
 */

const stand = (eraYear, plate) => ({
  src: "/memorial/plate-" + String(plate).padStart(2, "0") + ".webp",
  eraYear,
  year: null,
  caption: "No photograph for this period yet",
  credit: "Generated stand-in",
  source: "scripts/prepare-memorial.mjs",
  rights: "cleared",
  basis: "Generated for this project; depicts nothing.",
  placeholder: true,
});

/** Middle, a little high: heads sit above centre in most photographs. */
export const DEFAULT_FOCUS = [50, 42];

/** @type {ArchivePlate[]} */
export const archive = [
  stand(1619, 1),
  stand(1619, 2),
  stand(1776, 3),
  stand(1776, 4),
  stand(1861, 5),
  stand(1866, 6),
  stand(1916, 7),
  stand(1916, 8),

  // ---- The Civil Rights Movement, 1954–1967 ----------------------------
  // Chronological, so the loop walks the period forward. Every plate below
  // except the supplied one is public domain: a work of the U.S. federal
  // government, or an item the Library of Congress states has no known
  // restrictions on publication. `source` is the page the file came from, so
  // the claim can be rechecked rather than taken on trust.
  {
    src: "/archive/1957-little-rock-nine.webp",
    focus: [32, 50],
    eraYear: 1954,
    year: 1957,
    caption:
      "Troops of the 101st Airborne on the street during the integration of Central High School, Little Rock, Arkansas, September 1957",
    credit: "U.S. Army",
    source:
      "https://commons.wikimedia.org/wiki/File:Operation_Arkansas,_Little_Rock_Nine.jpg",
    rights: "cleared",
    basis: "Work of the U.S. Army, so a work of the federal government.",
  },
  {
    src: "/archive/1963-march-on-washington-leaders.webp",
    focus: [48, 42],
    eraYear: 1954,
    year: 1963,
    caption:
      "Leaders of the March on Washington for Jobs and Freedom move off at the head of the procession, 28 August 1963",
    credit:
      "Rowland Scherman for the U.S. Information Agency — U.S. National Archives",
    source: "https://catalog.archives.gov/id/542000",
    rights: "cleared",
    basis:
      "Made by the official photographer of the U.S. Information Agency, so a work of the federal government.",
  },
  {
    src: "/archive/1963-march-on-washington.webp",
    focus: [72, 34],
    eraYear: 1954,
    year: 1963,
    caption:
      "Martin Luther King Jr. addresses the March on Washington for Jobs and Freedom, Lincoln Memorial, 28 August 1963",
    credit: "Photographer unidentified",
    source: "Supplied for this prototype",
    rights: "unverified",
  },
  {
    src: "/archive/1964-king-press-conference.webp",
    focus: [50, 44],
    eraYear: 1954,
    year: 1964,
    caption:
      "Martin Luther King Jr. at a press conference, 26 March 1964",
    credit:
      "Marion S. Trikosko, U.S. News & World Report — Library of Congress",
    source: "https://www.loc.gov/item/2003688129/",
    rights: "cleared",
    basis:
      "Library of Congress, U.S. News & World Report collection: no known restrictions on publication.",
  },
  {
    src: "/archive/1964-civil-rights-act-signing.webp",
    focus: [52, 56],
    eraYear: 1954,
    year: 1964,
    caption:
      "President Johnson signs the Civil Rights Act of 1964, Martin Luther King Jr. standing behind him, 2 July 1964",
    credit:
      "Cecil Stoughton, White House Press Office — LBJ Presidential Library",
    source:
      "https://commons.wikimedia.org/wiki/File:Lyndon_Johnson_signing_Civil_Rights_Act,_July_2,_1964.jpg",
    rights: "cleared",
    basis:
      "Made by the White House Press Office, so a work of the federal government.",
  },
  {
    src: "/archive/1965-selma-to-montgomery.webp",
    focus: [46, 40],
    eraYear: 1954,
    year: 1965,
    caption:
      "Marchers resting on the road from Selma to Montgomery, Alabama, March 1965",
    credit: "Peter Pettus — Library of Congress",
    source: "https://www.loc.gov/item/2003675346/",
    rights: "cleared",
    basis:
      "Library of Congress cph.3d02329: no known restrictions on publication.",
  },
  stand(1968, 4),
  stand(1968, 7),
];

const byEra = new Map(eras.map((era) => [era.year, []]));
for (const plate of archive) byEra.get(plate.eraYear)?.push(plate);

/** Plates for the period containing `year`, newest era first if one is empty.
 * Never returns an empty list: a period with no plates falls back to the
 * previous period's, so the stage is never a black rectangle. */
export function platesForYear(year) {
  const era = getEra(year);
  for (let i = eras.indexOf(era); i >= 0; i--) {
    const plates = byEra.get(eras[i].year);
    if (plates?.length) return plates;
  }
  return archive;
}

/** True while every plate on screen is a generated stand-in — said out loud in
 * the credits so a placeholder is never mistaken for a record. */
export const archiveIsPlaceholder = archive.every((p) => p.placeholder);

/** Plates whose licence nobody has checked yet. */
export const unclearedPlates = archive.filter(
  (p) => !p.placeholder && p.rights !== "cleared",
);

/** One credit line per distinct real photograph, for the footer. */
export function archiveCredits() {
  const seen = new Set();
  return archive
    .filter((p) => !p.placeholder && !seen.has(p.src) && seen.add(p.src))
    .map(
      (p) =>
        p.caption +
        " — " +
        p.credit +
        (p.rights === "cleared" ? "" : " (rights not cleared)"),
    );
}
