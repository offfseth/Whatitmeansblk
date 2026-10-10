# Black Atlas

An editorial atlas of African American history: chapter-based archival photographs, a 3D United States map, a 1619–present timeline, and city pages for reading sourced history.

## Run locally

Install Node.js **22.12+** (or Node 24 LTS), then open a terminal in this repository:

```powershell
cd atlas
npm ci
npm run dev
```

If using the source ZIP, open the extracted folder containing package.json and omit the `cd atlas` step.

Open **http://127.0.0.1:5173/**. If that port is occupied, Vite prints its actual URL.

Production build and local production preview:

```powershell
npm run build
npm run preview
```

Open the URL printed by the preview command (normally http://127.0.0.1:4173/). Stop either server with Ctrl+C. Do not open index.html directly with file://.

```powershell
npm test
```

No API keys, accounts, backend, or live map-tile service are needed. The map assets are included. After dependencies are installed, normal build/runtime operations do not require internet access. Asset regeneration is optional and does require network access.

## What is implemented

- Orbit, tilt, pan, zoom, reset, and overhead view. Every limit is set so the sea sheet still fills the frame at the extremes, so there is no angle or zoom from which the empty space past it comes into view. The pull-back limit tracks the window's aspect ratio.
- Dated states and territories from 1783–2000, with a modern reference for later years; Alaska and Hawaiʻi are explicitly labeled insets in the Albers USA composite projection.
- Land that descends into the water on a shelf rather than ending in a cut-out wall, historically dated jurisdiction outlines, and colour/normal/surface textures baked from real elevation samples.
- A paper-colored about drawer that previews on hover and pins on click. The rest of the page dims and becomes inert while it is open. Escape, the close button, and the backdrop dismiss it; keyboard focus stays inside and returns on close.
- Native accessible year scrubber, validated year form, seven period jumps, and optional playback.
- Eight places with 13 dated story chapters that appear, disappear, and change content with the selected year. Selecting a map marker, label, or map location selector flies the camera toward that place, then opens a full editorial page with historical context, key dates, archival imagery, and sources.
- Shareable city URLs (`#/place/washington?year=1963`), browser Back/Forward, related places, and return to the original map year, camera, scroll position, and keyboard focus. Escape or the cancel control interrupts a descent. Reduced motion opens the story immediately, and city pages remain available without WebGL.
- Responsive desktop/phone layout, keyboard-accessible controls, loading/error states, WebGL failure messaging, and reduced idle GPU work.
- A readable archival slideshow with caption, credit, source, image count, and previous/next/pause controls. Named chapter filters sit between the editorial introduction and the map, sharing the same state as the year scrubber.
- Optional feature-detected WebMCP year action. This does not add a dependency and is ignored in unsupported browsers.

## Design

**Palette — "Ember & Alluvium".** Warm charcoal-brown ink (`--ink-900` `#14120f`) and warm cream paper (`--paper` `#f2e9d9`), one ember accent (`#dc784b`) with brass (`#d8b37b`) under it, and teal water. Historical jurisdictions add a labeled palette: Union blue, Confederate rust, border-state gold, and neutral territories. Corners are square, rules are hairlines, and metadata is set in letterspaced small caps. Depth comes from relief and from value, never from a decorative gradient.

**Type.** Display and figures are **Bodoni Moda**, a Didone in the register of nineteenth-century American broadsides and newspaper mastheads; interface text and small caps are **Archivo**. Both are SIL Open Font License variable fonts, vendored into `public/fonts/` by `npm run prepare:fonts`, so the running site never calls a font CDN.

**Land colour** is hand-authored cartography, not a land-cover dataset. Elevation, slope, latitude and longitude drive a deliberately narrow warm range — sand, red rock, dry and wet grass, hardwood and conifer, tundra, marsh, exposed rock and snow — pulled 30% toward neutral and then warmed, so regional character is carried mostly by value and relief rather than by hue. Two scales of noise keep the continental moisture gradient from banding into a straight seam down the hundredth meridian.

**Water** is treated as a real surface, not blank space. River valleys and lake beds are carved into the elevation grid *before* relief is derived, so the normal map shows genuine incision rather than painted-on lines; a roughness/metalness map makes water hold a sheen where the land stays matte. The sea sheet is coloured by distance from shore (deep basin, shelf, shallows), carries a faint graticule, and shows Canada, Mexico and the Caribbean as quiet dark silhouettes so the Gulf of Mexico, the Great Lakes and both coasts have their true shape. Its alpha is solid over the subject and over enclosed seas and thins across the open ocean, which is what lets the sea read as water rather than as a flat plate.

**The coast.** The land sits only just proud of the water, and the shoreline carries a shelf that steps outward and down from the coast, through a foreshore and the waterline, to a shelf break below the sea. The shelf samples the terrain texture at the shoreline itself, so every coast keeps its own colour as it goes under. A tall plate reads as a cut-out pasted onto a sea however its edge is shaded, so the height difference itself is kept small and relief carries the dimension instead. Islands and lakes narrower than a full shelf get a proportionally narrower one, because otherwise the slope folds back through itself. The shelf is built from the dissolved outline of the landmass (`outline` in `map.json`), so state borders inland are untouched.

**The room.** The page is one viewport-filling stage rather than a stack of bands, because the map is the subject and a stack of bands turns it into an illustration inside an article about itself. The land fills the window; the chapter photograph is the air above it; the masthead, the seven chapter names, the record, the chapter text and the years are held against the four margins as text on a scrim, with no panels, borders or section headings between them. The map toolbar stays compact; selecting a place now leaves the map stage for its full reading page.

The camera frames the land a little further out than the distance that merely fits it, so the margins have air to sit in rather than overlapping the subject.

**Arrival, then exploration.** The page opens as a title over a photograph with the land sitting back behind it — the one moment the atlas can be a single image. The overture is pointer-transparent, so the first drag both dissolves it and turns the land underneath: there is nothing to dismiss. Any sign of intent does it — a drag, a chapter, a year, a key, a scroll — after which the margins come up to full and the land comes forward. Reduced motion skips the opening state entirely, in CSS, because without the dissolve there would be no way out of it.

Below 960px the room unfolds into a column: the photograph and title become a poster you land on, the land gets a full-width band of its own beneath it, and the margins stack underneath. The arrival state goes away with it — on a touch screen there is no hover, and a poster that must be dismissed before the map works is a door, not an opening.

**The opening chapter.** The page opens in 1963, with Washington’s March on Washington story and the Civil Rights Movement archive. Every period from 1619 onward remains available through the filters and timeline. Change the initial value passed to createTimeline in src/main.js to select a different opening.

**The photograph twice.** The same image does two jobs at once. Behind the land it is *atmosphere*: full-bleed, pulled towards the ink palette, slightly blurred, bleeding off the top of the window so it has no top edge to read as a banner and dissolving before the horizon so the land rises out of it. It costs no layout space at all, and it drifts with the camera at half the parallax of the land, because scenery at a distance answers the camera less than the thing in front of it. In the margin it is *the record*: small, sharp, captioned, credited, with its own controls.

Mood is not evidence, so the two are never separated. `src/ui/sky.js` is fed from the same `onPlate` callback as the slideshow, and a chapter whose archive is still empty shows no sky — rather than an unattributed photograph standing in for a period it does not belong to. The blur is not decoration either: at full detail a photograph behind the map competes with it, because protest placards and map labels read as the same kind of mark.

**Plates.** Each plate retains its declared focus point and cross-fades without blur, tint, or constant drifting. Captions identify the individual photograph; the filter selects the broader period, not an exact photo year. Manual previous/next pauses automatic advancement so readers can examine an image. Pause persists across chapter changes and drawer opening. Reduced motion starts paused, while explicit playback remains available. The timer also stops while the tab is hidden or the about drawer is open.

**Missing images.** Placeholder records remain in the data adapter, but their generated textures are hidden. A plain paper panel explains that archival material for the chapter is still being gathered. No invented historical image is presented as evidence.

**The drawer.** src/ui/drawer.js coordinates hover preview, click/keyboard pinning, the page scrim, inert content, focus containment, and dismissal. Native disclosure sections contain the project introduction, map instructions, author, sources, and feedback. The author biography and feedback destination still require the creator’s supplied details; the UI does not pretend to send feedback.

**What is loaded.** The Civil Rights Movement period (1954–1967) runs six real photographs in chronological order — Little Rock 1957, the March on Washington 1963, King in 1964, the Civil Rights Act signing, Selma 1965. Five are public domain on a stated basis recorded in each plate's `basis` field: works of the U.S. Army, the U.S. Information Agency and the White House Press Office are works of the federal government, and the two Library of Congress items carry the Library's own "no known restrictions on publication". The sixth, the supplied March on Washington plate, has **uncleared rights** and is marked as such. Every other period currently shows the explicit empty archive panel; the old generated stand-ins remain in the data files but are not shown.

> **Nothing here is quietly presented as a record.** A memorial must not invent its own evidence, so no synthesised photograph of a real person, place or event is used. `rights: "cleared"` requires a one-line `basis` saying *why* it is free and a `source` URL that can be rechecked — both enforced by `npm test`. The footer's "Map notes & credits" panel names every real photograph and says out loud which plates are stand-ins and which have uncleared rights, and in the period card the warning leads the credit line so it is never the part that gets clipped.

**Historical limits:** The Newberry boundary layer covers 1783–2000, sampled on December 31. Earlier years omit jurisdiction lines and fills; later years use the modern Census reference. Civil War affiliations describe states, not military occupation or a free/slave classification. Indigenous sovereignty and historical coastlines are not represented by this jurisdiction layer. City coverage means published story coverage, not the lifetime of a city. See [historical map method](public/data/history-attribution.md).

**Terrain limits:** The map is an actual orbitable 3D scene with raised land. Mountain relief is rendered from an elevation-derived normal map plus baked shaded relief and ambient occlusion, rather than dense displaced mountain geometry. This deliberately trades close-up geometric accuracy for performance; it is not a survey or navigation product. Land outside the United States appears only as a flat, unlit silhouette on the sea sheet, to give the surrounding water its correct shape; it carries no terrain and is not part of the atlas. The land palette is illustrative, as described under **Design**.

## Controls

| Action           | Mouse / keyboard                                  | Touch                     |
| ---------------- | ------------------------------------------------- | ------------------------- |
| Orbit / tilt     | Left-drag                                         | One-finger drag           |
| Pan              | Right-drag                                        | Two-finger drag           |
| Zoom             | Wheel or + / −                                    | Pinch or + / −            |
| Select           | Click location or map selector                 | Tap location or selector  |
| Year             | Drag slider; focus and use arrow keys; enter year | Drag slider or enter year |
| Reset / overhead | Map toolbar                                       | Map toolbar               |
| Open the drawer  | Hover the left edge, or click the handle          | Tap the handle            |
| Leave the opening| Drag, scroll, or use any control                  | Drag, or use any control  |
| Return to atlas  | Back to atlas or Escape                           | Back to atlas             |

No animation starts automatically. Playback advances at 10 years per second, stops at the present year, pauses on manual scrubbing, and stops when the tab is hidden.

## Folder structure

```text
atlas/
  index.html                    Semantic page structure
  package.json                  Exact direct dependency versions and commands
  package-lock.json             Reproducible installation
  .gitignore
  README.md
  VALIDATION.md
  src/
    main.js                     UI binding and orchestration
    style.css                   Responsive visual design
    state/
      timeline.js               Year/selection store and visibility logic
    data/
      eras.js                   Editorial archive chapters
      historicalMap.js          Dated boundary selection and political affiliations
      placePeriods.js           Inclusive city-story coverage and chapter overrides
      locations.js              Stable place IDs, coordinates, and chapter joins
      archive.js                Period photographs, rights metadata, era join
      placeStories.js           Eight sourced essays, dates, and image joins
      contracts.js              Documented future event/repository contract
    ui/
      archiveStage.js           Cross-fading slideshow and playback controls
      sky.js                    The same photograph as full-bleed atmosphere
      drawer.js                 Hover preview, modal focus, and dismissal
      placePage.js / .css        Editorial city page and responsive styling
      placeExplorer.js          Arrival, return, focus, and browser navigation
    map/
      MapScene.js                Three.js geometry, controls, picking and lifecycle
      cameraFlight.js            Finite, cancellable camera animation
  public/
    favicon.svg
    data/
      map.json                  Boundaries, dissolved outline, projected locations
      terrain.webp              Biome palette over shaded relief
      normals.webp               Multi-scale normals, river valleys incised
      surface.webp               Roughness and metalness: water reads as water
      sea.webp                   Sea colour, neighbouring land, alpha field
      us-atlas-LICENSE.txt
      terrain-attribution.md
    fonts/                      Vendored OFL variable fonts, licenses, @font-face
    archive/                    Sourced period photographs
    places/                     Modern geographic plates for places without photos
    memorial/                   Generated stand-in plates for periods with none
  scripts/
    prepare-map.mjs              Reproducible asset download and preparation
    prepare-fonts.mjs            One-time typeface vendoring
    prepare-memorial.mjs         Deterministic placeholder plate generation
  tests/
    timeline.test.js            Date boundaries, visibility, state and asset checks
    archive.test.js             Period copy, plate/era joins, rights disclosure
```

Generated/ignored folders: node_modules/, dist/, .cache/. Root README links here. The complete working implementation and assets are in this directory; there are no omitted code snippets or external CDN dependencies at runtime.

## Why this stack

**Vite + JavaScript ES modules + Three.js.** Vite provides a simple development/build workflow. Three.js handles the small 3D scene and proven OrbitControls without a continuously tiled basemap or a larger geospatial rendering stack. Native HTML controls avoid a UI framework and remain keyboard operable. Only Three.js ships as an application dependency; d3-geo, topojson-client and sharp are build-time asset-preparation dependencies.

## Performance techniques

City selection briefly schedules animation frames for the camera flight. That finite animation stops on arrival, cancellation, tab hiding, or disposal. The map stays suspended for the entire time a city page is open.

1. **Render on demand:** one coalesced requestAnimationFrame per change. No setAnimationLoop, auto-rotation, damping loop, animated water, or idle animation.
2. **The slideshow never touches WebGL:** photographs cross-fade with CSS opacity. A timer fires once per image, not per frame. The map still renders zero frames while idle. Old chapter images retire after their fade.
   The sky follows the camera, but only ever by writing a `translate`/`rotate` on one already-composited layer, coalesced to one rAF per change; its filter and mask are baked into that layer once and are not recomputed while the camera moves. Nothing follows the camera while it is still.
   **Transparency has a budget.** `backdrop-filter` over a live WebGL canvas re-blurs whenever the canvas changes, which is every frame of an orbit, so it is spent only on small surfaces — the map toolbar, the map labels, the phone timeline. Every full-bleed layer is tint and gradient, which cost nothing extra while the camera moves.
3. **Bounded pixel ratio:** at most 1.5×, limiting fill rate on high-DPI phones; low-power WebGL preference (a browser hint, not a guarantee).
4. **Merged geometry:** one top-surface mesh, one raised base, one border batch, and shared marker geometry. No per-state draw calls.
5. **Baked relief:** three 1600 × 1001 land textures and one 1400 × 876 sea texture replace a dense terrain mesh, live elevation fetches, and per-frame terrain computation. The sea reuses one texture for colour and alpha.
6. **No shadows or post-processing:** ambient/directional illumination and a single sea plane.
7. **Reuse on scrubbing:** update vertex colors/emphasis and marker visibility; do not rebuild geometry, reload textures, or fetch event content per frame.
8. **Work stops offscreen:** pending map frames, playback and the slideshow are all stopped when the document is hidden.
9. **Cleanup:** dispose GPU resources, texture resources, controls, observer and listeners on scene teardown.

Development-only diagnostics are readable on the map canvas: data-frames, data-draw-calls, data-triangles and data-pixel-ratio. These attributes are excluded from production builds. A stationary visible map should not increase data-frames. Measurements here do not substitute for testing actual mid-range phones; no device-wide frame-rate or battery guarantee is claimed.

## Extend the historical time layer

City identity lives in src/data/locations.js. Add dated chapters to src/data/placePeriods.js with a stable chapter ID, inclusive from/to years, label, and sourced story content. Chapters inherit their place’s base essay from src/data/placeStories.js unless overridden. Use explicit sections, dates, sources, and images when the period calls for a different story. Set images: [] when no image belongs to that period. Ranges express editorial coverage; do not use 9999 to keep every city permanently visible.

Washington currently has four chapters: Capitol construction (1793–1800), D.C. emancipation (1862–1863), Marian Anderson’s concert (1939), and the March on Washington / Civil Rights Act (1963–1964). Point Comfort and Montgomery also reappear for separate chapters. A city can remain visible across many years, as Chicago does during the Great Migration (1916–1970).

The map, selector, page, and URL share that coverage. Uncovered years show an empty state with a nearby covered year. Old city URLs normalize to the nearest published year, and the page labels the actual coverage. City pages offer “This place through time” navigation.

Historical geometry lives in public/data/historical-boundaries.json. The renderer switches configurations only when their dated geometry or political classification changes, disposes replaced geometry, and batches fills by legend category. It does not repurpose modern states as early boundaries.

To regenerate from the official Newberry ZIP:

    npm run prepare:history -- "path/to/US_AtlasHCB_StateTerr_Gen01.zip"

See [attribution and source download](public/data/history-attribution.md). The prepared file is included; normal development and builds remain offline.

If city IDs or coordinates change, regenerate map markers with npm run prepare:map and geographic page illustrations with npm run prepare:places. Changing the map projection requires rebuilding both modern and historical geometry and marker positions together. The optional prepare:fonts and prepare:memorial commands remain available.

## Add period photographs

See the instructions at the top of `src/data/archive.js`. In short: drop the file into `public/archive/`, add an entry with `eraYear` set to the `year` of a period in `src/data/eras.js`, and fill in `caption`, `credit`, `source` and `rights` honestly. `rights: "cleared"` is a claim that someone actually checked the licence; anything else keeps the warning visible in the footer. A cleared plate also needs a one-line `basis` saying why it is free; `npm test` fails without it. Keep roughly four to eight plates per period, ordered by year — the set for one period is cycled, so more plates means a longer loop and more memory held at once.

Good public-domain sources for the empty periods: the Library of Congress Prints & Photographs catalogue, the National Archives catalogue, Smithsonian Open Access and the NYPL public-domain collections. Works of the U.S. federal government (FSA/OWI, WPA, NARA) are generally public domain; mid-century press photographs usually are not.

Dwell and fade timing live in src/ui/archiveStage.js (DWELL_MS and FADE_MS). Framing and transitions live in src/style.css under .archive-frame, .archive-stage, and .archive-plate; the atmosphere layer is .sky and .sky-layer. The margin gallery uses followCamera: false and does not move; the sky uses the same tested viewTransform helper at half strength to follow the camera.

## Change a period or its summary

src/data/eras.js holds readable chapter history (period, span, meaning) and a text accent color. Historical boundaries and affiliations are independent, in src/data/historicalMap.js. Period boundaries are editorial, not natural; they exist so the map, the slideshow and the card change together. Changing a boundary year moves which photographs appear when, since `archive.js` joins on it. `npm test` checks that spans stay ordered and meet end to end, and that every plate still joins a real period.

## City stories and the reading experience

`src/data/placeStories.js` is the main content entry point. Each stable location ID has a title, introduction, article sections, key dates, sources, and an `images` list joining to `archive.js`. Each section’s `source` is an index into that place’s source list. Keep source links and photo credits alongside the content as the archive grows.

The split hero follows the supplied editorial reference; the reading body uses warm paper, a narrow text measure, and a separate visual archive. These are starter essays spanning a place’s history, not events filtered to the atlas year. The entry year is labeled on the page. Washington and Montgomery use existing cleared archival photographs. The other six places use explicitly labeled modern geographic plates while their photographic collections are gathered. No generated historical photographs are used. Rebuild the geographic plates after changing map coordinates with `npm run prepare:places` (offline).

The camera approaches a city for 1.5 seconds before the page is revealed. Normal map pan/zoom limits are restored after the flight. A page suspends the map and chapter slideshow; returning resumes their previous state. `placeRoute.js` validates shareable hash routes so a static host needs no route rewriting. The controller preserves the original atlas year even when the reader visits related places.

## Expand the event content layer

1. Define sourced, reviewed event records using src/data/contracts.js: stable locationId, start/end years, context, outcome, licensed images and citations.
2. Implement a HistoryRepository adapter. Start with local JSON; retain the same interface if a backend is introduced later.
3. Subscribe to the existing timeline store, cancel stale content requests with AbortController, and cache results by year or historical interval.
4. Add event sections to the city page. Lazy-load images only on selection, give them explicit dimensions and meaningful alternative text, and sanitize any rich text.
5. Work with historical reviewers to establish geography/date uncertainty, the 1619 framing, and primary-source citation rules before presenting any layer as factual.

## Open data and credits

- Modern boundaries: U.S. Census Bureau 2017 cartographic boundaries redistributed by **U.S. Atlas 3.0.1**, ISC license: https://github.com/topojson/us-atlas . Full license is shipped in public/data/us-atlas-LICENSE.txt.
- Elevation: Mapzen/Terrarium terrain tiles served through the public AWS elevation-tiles-prod dataset. Upstream attribution and source licenses: https://github.com/tilezen/joerd/blob/master/docs/attribution.md .
- United States 3DEP, global GMTED2010 and SRTM: courtesy of the U.S. Geological Survey. Global ETOPO1: U.S. National Oceanic and Atmospheric Administration. ArcticDEM and other contributing source attribution is preserved in full in public/data/terrain-attribution.md.
- Rivers, lakes and the coastlines of neighbouring land: **Natural Earth** 10m and 50m vectors, public domain: https://www.naturalearthdata.com/ .
- Typefaces: **Bodoni Moda** and **Archivo**, both under the SIL Open Font License 1.1. The full licenses ship in public/fonts/.
- This project downsampled elevation, incised rivers and lakes into the height grid, baked an illustrative colour palette, normals, ambient occlusion and shaded relief, and exaggerated relief shading. These modifications are not endorsed by the source agencies, and the land colouring is not a land-cover classification.
- Archival image credits and rights status are listed per photograph in src/data/archive.js and in the on-page credits. Generated placeholder plates are not displayed.
- Three.js is MIT licensed. Dependency licenses remain in their respective packages.

The reference image was used for visual direction; no watermarked artwork was copied into this project.
