import { eras, getEra } from "./eras.js";

/** The slideshow that runs behind and above the map, filtered by period.
 *
 * HOW TO ADD A PICTURE
 *   1. Verify the specific item's reuse evidence, then put the file in
 *      public/archive/ (WebP or JPEG; ~1200px wide is plenty,
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
 *   4. `rights` must be "cleared" only after checking the item-specific reuse
 *      evidence, recorded in `basis` and `source`. Unverified assets belong
 *      outside public/ and must not be added to this published manifest.
 *      See CONTENT_POLICY.md; credit is not permission.
 *
 * COLLECTIONS TO RESEARCH for the empty periods: the Library of
 * Congress Prints & Photographs catalogue (loc.gov/pictures), the National
 * Archives catalogue (catalog.archives.gov), the Smithsonian Open Access
 * collection, and the NYPL Digital Collections public-domain set. Works of the
 * U.S. federal employees made within official duties are generally public
 * domain in the United States. Each collection can also contain protected
 * third-party work; the institution's name alone is not a reuse basis.
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
  // Federal works and item-specific Library of Congress rights advisories.
  // "No known restrictions" is an institutional advisory, not a blanket
  // public-domain declaration. Preserve that distinction in the credits.
  {
    src: '/archive/1956-montgomery-bus-diagram.webp',
    milestoneIds: ['montgomery-boycott'],
    width: 516, height: 600, focus: [50, 45], eraYear: 1954, year: 1956,
    caption: 'Diagram of the Montgomery bus marking where Rosa Parks was seated, filed as an exhibit in the federal bus-segregation case Browder v. Gayle, 1956',
    credit: 'Records of District Courts of the United States (RG 21) — U.S. National Archives (NAID 596069)',
    source: 'https://catalog.archives.gov/id/596069',
    rightsSource: 'https://docsteach.org/documents/document/diagram-of-the-bus-showing-where-rosa-parks-was-seated',
    rights: 'cleared',
    basis: 'The National Archives Foundation DocsTeach item record identifies this document as public domain, free of known copyright restrictions.',
    rightsReviewedAt: '2026-10-28',
    rightsReviewedBy: 'Black Atlas editorial workflow (AI-assisted)',
    modifications: 'Archival JPEG converted to WebP at its original 516-pixel width. No retouching. The header crops for layout; the archive shows the full stored image.',
  },
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
    milestoneIds: ['march-washington'],
    width: 1400,
    height: 1116,
    rightsSource: 'https://commons.wikimedia.org/wiki/File:Civil_Rights_March_on_Washington,_D.C._(Leaders_of_the_march.)_-_NARA_-_542000.tif',
    rightsReviewedAt: '2026-10-28',
    rightsReviewedBy: 'Black Atlas editorial workflow (AI-assisted)',
    modifications: 'Existing resized WebP derivative; reused without further pixel edits. The header crops for layout; the archive shows the full stored image.',
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
    src: '/archive/1963-march-on-washington-mall.webp',
    milestoneIds: ['march-washington'],
    width: 1400, height: 1103, focus: [68, 52], eraYear: 1954, year: 1963,
    caption: 'Crowds beside the Reflecting Pool and Washington Monument during the March on Washington, 28 August 1963',
    credit: 'U.S. Information Agency records — U.S. National Archives (NAID 542045); photographer unidentified',
    source: 'https://catalog.archives.gov/id/542045',
    rightsSource: 'https://docsteach.org/document/civil-rights-march-washington-dc/',
    downloadSource: 'https://commons.wikimedia.org/wiki/File:Civil_Rights_March_on_Washington,_D.C._(A_wide-angle_view_of_marchers_along_the_mall,_showing_the_Reflecting_Pool_and..._-_NARA_-_542045.tif',
    rights: 'cleared',
    basis: 'The National Archives Foundation DocsTeach item record identifies this photograph as public domain, free of known copyright restrictions.',
    rightsReviewedAt: '2026-10-28',
    rightsReviewedBy: 'Black Atlas editorial workflow (AI-assisted)',
    modifications: 'NARA TIFF from Wikimedia Commons resized to 1400 pixels wide and converted to WebP. No retouching. The header crops for layout; the archive shows the full stored image.',
  },
  {
    src: '/archive/1963-march-on-washington-aerial.webp',
    milestoneIds: ['march-washington'],
    width: 1400, height: 1533, focus: [50, 65], eraYear: 1954, year: 1963,
    caption: 'An aerial view of marchers filling the National Mall and adjacent street, 28 August 1963',
    credit: 'U.S. Information Agency records — U.S. National Archives (NAID 541998); photographer unidentified',
    source: 'https://catalog.archives.gov/id/541998',
    rightsSource: 'https://docsteach.org/document/civil-rights-march-on-washington-dc-aerial-view-of-the-crowd-of-marchers-on-the-mall-and-street/',
    downloadSource: 'https://commons.wikimedia.org/wiki/File:Civil_Rights_March_on_Washington,_D.C._(Aerial_view_of_the_crowd_of_marchers_on_the_mall_and_street.)_-_NARA_-_541998.tif',
    rights: 'cleared',
    basis: 'The National Archives Foundation DocsTeach item record identifies this photograph as public domain, free of known copyright restrictions.',
    rightsReviewedAt: '2026-10-28',
    rightsReviewedBy: 'Black Atlas editorial workflow (AI-assisted)',
    modifications: 'NARA TIFF from Wikimedia Commons resized to 1400 pixels wide and converted to WebP. No retouching. The header crops for layout; the archive shows the full stored image.',
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
    milestoneIds: ['selma-marches'],
    width: 1400, height: 948,
    rightsSource: 'https://www.loc.gov/item/2003675346/',
    rightsReviewedAt: '2026-10-28',
    rightsReviewedBy: 'Black Atlas editorial workflow (AI-assisted)',
    modifications: 'Existing resized WebP derivative reused without further pixel edits. The header crops for layout; the archive shows the full stored image. The Library of Congress dates the photograph to 1965 and its print to 1999 or 2000.',
    focus: [46, 40],
    eraYear: 1954,
    year: 1965,
    caption:
      "Participants in the Selma-to-Montgomery march resting on a wall, Alabama, 1965",
    credit: "Peter Pettus — Library of Congress",
    source: "https://www.loc.gov/item/2003675346/",
    rights: "cleared",
    basis:
      "Library of Congress cph.3d02329: no known restrictions on publication.",
  },
  {
    src: '/archive/1965-selma-flags.webp',
    milestoneIds: ['selma-marches'],
    width: 1024, height: 813, focus: [65, 56], eraYear: 1954, year: 1965,
    caption: 'Participants carrying American flags during the Selma-to-Montgomery voting-rights march, Alabama, 1965',
    credit: 'Peter Pettus — Library of Congress, Prints and Photographs Division (LC-DIG-ppmsca-08102)',
    source: 'https://www.loc.gov/item/2003675345/',
    rightsSource: 'https://www.loc.gov/item/2003675345/',
    downloadSource: 'https://tile.loc.gov/storage-services/service/pnp/ppmsca/08100/08102v.jpg',
    rights: 'cleared',
    basis: 'The Library of Congress item record states: No known restrictions on publication. This is an institutional rights advisory, not a public-domain declaration.',
    rightsReviewedAt: '2026-10-28',
    rightsReviewedBy: 'Black Atlas editorial workflow (AI-assisted)',
    modifications: 'Library of Congress JPEG converted to WebP at its original 1024-pixel width, retaining the print border. No retouching. The header crops for layout; the archive shows the full stored image. Photograph taken in 1965; print made in 1999 or 2000.',
  },
  {
    src: '/archive/1965-selma-freedom-train.webp',
    milestoneIds: ['selma-marches'],
    width: 1024, height: 812, focus: [50, 57], eraYear: 1954, year: 1965,
    caption: 'A Freedom Train to Alabama sign solicits contributions for Selma victims at a station, 1965; the Library of Congress does not identify the location',
    credit: 'Peter Pettus — Library of Congress, Prints and Photographs Division (LC-DIG-ppmsca-38829)',
    source: 'https://www.loc.gov/item/2015646323/',
    rightsSource: 'https://www.loc.gov/item/2015646323/',
    downloadSource: 'https://tile.loc.gov/storage-services/service/pnp/ppmsca/38800/38829v.jpg',
    rights: 'cleared',
    basis: 'The Library of Congress item record states: No known restrictions on publication. This is an institutional rights advisory, not a public-domain declaration.',
    rightsReviewedAt: '2026-10-28',
    rightsReviewedBy: 'Black Atlas editorial workflow (AI-assisted)',
    modifications: 'Library of Congress JPEG converted to WebP at its original 1024-pixel width, retaining the print border. No retouching. The header crops for layout; the archive shows the full stored image. Photograph taken in 1965; print made in 1999 or 2000.',
  },
  stand(1968, 4),
  stand(1968, 7),
];

const byEra = new Map(eras.map((era) => [era.year, []]));
export function isPublishablePlate(plate) {
  return plate.rights === 'cleared' && Boolean(plate.basis?.trim()) &&
    (plate.placeholder || /^https:\/\//.test(plate.source));
}
for (const plate of archive.filter(isPublishablePlate)) byEra.get(plate.eraYear)?.push(plate);

/** Plates for the period containing `year`, newest era first if one is empty.
 * Never returns an empty list: a period with no plates falls back to the
 * previous period's, so the stage is never a black rectangle. */
export function platesForYear(year) {
  const era = getEra(year);
  for (let i = eras.indexOf(era); i >= 0; i--) {
    const plates = byEra.get(eras[i].year);
    if (plates?.length) return plates;
  }
  return archive.filter(isPublishablePlate);
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
    .filter((p) => !p.placeholder && isPublishablePlate(p) && !seen.has(p.src) && seen.add(p.src))
    .map(
      (p) =>
        p.caption +
        " — " +
        p.credit +
        (p.rights === "cleared" ? "" : " (rights not cleared)"),
    );
}
