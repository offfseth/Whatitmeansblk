# Black Atlas

A local, single-page foundation for an interactive atlas of African American history: a 3D United States map, a 1619–present timeline, and selectable placeholder locations.

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
- All 50 states and D.C.; Alaska and Hawaiʻi are explicitly labeled insets in the Albers USA composite projection.
- Land that descends into the water on a shelf rather than ending in a cut-out wall, modern state outlines, and colour/normal/surface textures baked from real elevation samples.
- A drawer on the left edge that slides out on hover, pins open on click, and closes on Escape.
- Native accessible year scrubber, validated year form, six period jumps, and optional playback.
- Eight data-driven locations. Visibility changes with the year; buttons and the footer location selector open a minimal stub panel. Changing to a year where the selected marker is absent clears selection.
- Responsive desktop/phone layout, keyboard-accessible controls, loading/error states, WebGL failure messaging, and reduced idle GPU work.
- A period slideshow hanging above the map: archival photographs that cross-fade, filtered to the period the scrubber is in, with a card in front of them naming the period and what it meant.
- Optional feature-detected WebMCP year action. This does not add a dependency and is ignored in unsupported browsers.

## Design

**Palette — "Ember & Alluvium".** Warm charcoal-brown ink (`--ink-900` `#100c09`) and warm cream paper (`--paper` `#f3e7d2`), one ember accent (`#e2642a`) with brass (`#e0a052`) under it, and a single cool note (teal, around `#2f6b6c`) reserved for water so that rivers, lakes and coasts are the only cool colour anywhere on the page. Corners are square, rules are hairlines, and metadata is set in letterspaced small caps. Depth comes from relief and from value, never from a decorative gradient.

**Type.** Display and figures are **Bodoni Moda**, a Didone in the register of nineteenth-century American broadsides and newspaper mastheads; interface text and small caps are **Archivo**. Both are SIL Open Font License variable fonts, vendored into `public/fonts/` by `npm run prepare:fonts`, so the running site never calls a font CDN.

**Land colour** is hand-authored cartography, not a land-cover dataset. Elevation, slope, latitude and longitude drive a deliberately narrow warm range — sand, red rock, dry and wet grass, hardwood and conifer, tundra, marsh, exposed rock and snow — pulled 30% toward neutral and then warmed, so regional character is carried mostly by value and relief rather than by hue. Two scales of noise keep the continental moisture gradient from banding into a straight seam down the hundredth meridian.

**Water** is treated as a real surface, not blank space. River valleys and lake beds are carved into the elevation grid *before* relief is derived, so the normal map shows genuine incision rather than painted-on lines; a roughness/metalness map makes water hold a sheen where the land stays matte. The sea sheet is coloured by distance from shore (deep basin, shelf, shallows), carries a faint graticule, and shows Canada, Mexico and the Caribbean as quiet dark silhouettes so the Gulf of Mexico, the Great Lakes and both coasts have their true shape. Its alpha is solid over the subject and over enclosed seas and thins across the open ocean, which is what lets the sea read as water rather than as a flat plate.

**The coast.** The land sits only just proud of the water, and the shoreline carries a shelf that steps outward and down from the coast, through a foreshore and the waterline, to a shelf break below the sea. The shelf samples the terrain texture at the shoreline itself, so every coast keeps its own colour as it goes under. A tall plate reads as a cut-out pasted onto a sea however its edge is shaded, so the height difference itself is kept small and relief carries the dimension instead. Islands and lakes narrower than a full shelf get a proportionally narrower one, because otherwise the slope folds back through itself. The shelf is built from the dissolved outline of the landmass (`outline` in `map.json`), so state borders inland are untouched.

**The period band.** A slideshow of archival photographs hangs across the top of the scene, above the continent. `src/data/archive.js` lists the plates and joins each one to a period by `eraYear`; `src/ui/archiveStage.js` cross-fades them. Crossing a period boundary on the scrubber swaps the whole set, so the imagery always belongs to the years on screen.

It has to paint **in front of** the canvas, not behind it: the scene draws an opaque sea, so a layer behind the map is simply not there. It is inert to the pointer, so orbiting and zooming still work through it, and it is masked out before the coastline so the map is never read through a photograph. Only `opacity` and `transform` move — the blurred plates rasterise once and are then composited, no JavaScript runs per frame, and no WebGL frame is requested. It pauses when the tab is hidden; under `prefers-reduced-motion` it holds the first plate of the period and never advances on its own, though it still changes when the reader changes the year, because that motion is theirs.

**Framing.** Band height is what decides how much of a photograph survives: a wide letterbox shows a slice, not a picture. The band runs at 46% of the scene, which on a typical desktop is still about 6:1, so a 16:9 frame keeps roughly a quarter of its height — enough to read, but only if the right quarter is kept. So each plate declares `focus` — the point in the file the crop must keep, as `[x%, y%]` — which becomes its `object-position`, because the middle of a photograph is rarely the subject in it. A tall portrait should be cut to roughly 16:9 around its subject before it goes in `public/archive/`; the cover-crop cannot recover what the aspect ratio throws away.

**Following the camera.** A backdrop nailed to the screen while the scene orbits underneath it reads as a sticker on the glass, so the band moves with the camera. `MapScene` reports `cameraState()` — yaw, tilt and dolly, each normalised against the control limits rather than raw, so callers never need to know the limits — once per rendered frame, from inside the existing coalescing frame.

`viewTransform` turns that reading into the band's pose. The main move is horizontal: the band is a plane standing in the scene, under the perspective declared on `.archive`, so orbiting swings it on its vertical axis with `rotateY`, as the map itself swings. Under that it pans against the yaw, lifts and fades as the camera tilts towards straight-down (where the land fills the frame and the band has nowhere to be), and rolls half a degree. Each part is a fraction of the camera's own movement, which is what distance looks like.

> **The swing direction is easy to get backwards, and was.** Whichever side the camera stands on is the near side of the world, so that is the edge that must come forward — and CSS `rotateY` brings the *left* edge forward for positive angles. Checking this by eye is unreliable; it is pinned by a test, and was caught by reading the camera's actual position (`window.__atlas.eye()` in dev) against which edge of the band projected taller.

**The overscan is calculated, not guessed.** `.archive-stage` reaches past the band so no camera angle shows an edge, and the amount it needs is solved from the band's real size by `overscanFor` whenever it changes. The cost of the swing is not a fixed fraction of the band: under perspective the receding edge pulls inward by an amount that grows with the band's *width*, and the roll costs half that width times its sine, neither of which a percentage of the band's *height* tracks. The fixed constant this replaced was fine on a laptop and left a 24px gap at 4K. A test re-projects all four corners independently, across seven band sizes and every extreme of the controls, and asserts the band stays covered.

`rotateY` and the roll ride on the stage; the Ken Burns drift rides on the plate — two elements, so the two transforms never fight and neither leaves the compositor.

**The period card.** In front of the band, in the left rail under the headline, `.era-card` names the period, its span, and two sentences on what it meant — from `period`, `span` and `meaning` in `src/data/eras.js` — plus a caption for the plate currently showing. On a short window the rail sheds the standing invitation, then the plate caption, then clamps the summary; every summary is written so its **first sentence stands alone**, because that is what survives the tightest clamp.

**What is loaded.** The Civil Rights Movement period (1954–1967) runs six real photographs in chronological order — Little Rock 1957, the March on Washington 1963, King in 1964, the Civil Rights Act signing, Selma 1965. Five are public domain on a stated basis recorded in each plate's `basis` field: works of the U.S. Army, the U.S. Information Agency and the White House Press Office are works of the federal government, and the two Library of Congress items carry the Library's own "no known restrictions on publication". The sixth, the supplied March on Washington plate, has **uncleared rights** and is marked as such. Every other period still runs generated stand-ins from `public/memorial/` (`npm run prepare:memorial`) that depict paper, emulsion, grain and scratches and nothing else.

> **Nothing here is quietly presented as a record.** A memorial must not invent its own evidence, so no synthesised photograph of a real person, place or event is used. `rights: "cleared"` requires a one-line `basis` saying *why* it is free and a `source` URL that can be rechecked — both enforced by `npm test`. The footer's "Map notes & credits" panel names every real photograph and says out loud which plates are stand-ins and which have uncleared rights, and in the period card the warning leads the credit line so it is never the part that gets clipped.

**Historical limits:** These are modern boundaries and synthetic colored-region/marker visibility examples. They are not historical borders, a verified chronology, or a free/slave-state classification. The fixed demo snapshot years only demonstrate the mechanism. The timeline begins in 1619 as requested; this should not imply that African presence across the Americas began in 1619.

**Terrain limits:** The map is an actual orbitable 3D scene with raised land. Mountain relief is rendered from an elevation-derived normal map plus baked shaded relief and ambient occlusion, rather than dense displaced mountain geometry. This deliberately trades close-up geometric accuracy for performance; it is not a survey or navigation product. Land outside the United States appears only as a flat, unlit silhouette on the sea sheet, to give the surrounding water its correct shape; it carries no terrain and is not part of the atlas. The land palette is illustrative, as described under **Design**.

## Controls

| Action           | Mouse / keyboard                                  | Touch                     |
| ---------------- | ------------------------------------------------- | ------------------------- |
| Orbit / tilt     | Left-drag                                         | One-finger drag           |
| Pan              | Right-drag                                        | Two-finger drag           |
| Zoom             | Wheel or + / −                                    | Pinch or + / −            |
| Select           | Click location or footer selector                 | Tap location or selector  |
| Year             | Drag slider; focus and use arrow keys; enter year | Drag slider or enter year |
| Reset / overhead | Map toolbar                                       | Map toolbar               |
| Open the drawer  | Hover the left edge, or click the handle          | Tap the handle            |
| Close selection  | Close button or Escape                            | Close button              |

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
    main.js                     UI binding, selection panel, orchestration
    style.css                   Responsive visual design
    state/
      timeline.js               Year/selection store and visibility logic
    data/
      eras.js                   Swappable illustrative map-state adapter
      locations.js              Location IDs, coordinates and date intervals
      archive.js                Period photographs, rights metadata, era join
      contracts.js              Documented future event/repository contract
    ui/
      archiveStage.js           Cross-fading period slideshow, camera lean
    map/
      MapScene.js                Three.js geometry, controls, picking and lifecycle
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

1. **Render on demand:** one coalesced requestAnimationFrame per change. No setAnimationLoop, auto-rotation, damping loop, animated water, or idle animation.
2. **The period band never touches WebGL:** cross-fades are CSS opacity transitions and the drift is one CSS transform animation. Blur, mask and tint are applied to the static plates, so they rasterise once and are then composited; a timer fires once per plate, not per frame, and the map still renders zero frames while idle. Only the plates of the current period stay in the DOM; the previous period's are dropped once they have finished fading out.
3. **Bounded pixel ratio:** at most 1.5×, limiting fill rate on high-DPI phones; low-power WebGL preference (a browser hint, not a guarantee).
4. **Merged geometry:** one top-surface mesh, one raised base, one border batch, and shared marker geometry. No per-state draw calls.
5. **Baked relief:** three 1600 × 1001 land textures and one 1400 × 876 sea texture replace a dense terrain mesh, live elevation fetches, and per-frame terrain computation. The sea reuses one texture for colour and alpha.
6. **No shadows or post-processing:** ambient/directional illumination and a single sea plane.
7. **Reuse on scrubbing:** update vertex colors/emphasis and marker visibility; do not rebuild geometry, reload textures, or fetch event content per frame.
8. **Work stops offscreen:** pending map frames, playback and the slideshow are all stopped when the document is hidden.
9. **Cleanup:** dispose GPU resources, texture resources, controls, observer and listeners on scene teardown.

Development-only diagnostics are readable on the map canvas: data-frames, data-draw-calls, data-triangles and data-pixel-ratio. These attributes are excluded from production builds. A stationary visible map should not increase data-frames. Measurements here do not substitute for testing actual mid-range phones; no device-wide frame-rate or battery guarantee is claimed.

## Replace the illustrative time layer

Change src/data/eras.js first. getMapState(year, regionIds) returns the active region IDs, presentation color, and intensity. The renderer consumes this output and knows nothing about historical interpretation.

For verified changing borders, introduce a repository that returns dated geometry snapshots with stable IDs. Add a MapScene geometry-replacement method, cache only a small number of adjacent snapshots, dispose replaced geometries, and swap on snapshot boundaries rather than every slider tick. Modern Census polygons should not be repurposed as colonial boundaries.

Edit src/data/locations.js to change location names, coordinates, or visibility intervals. If coordinates or location IDs change, regenerate the projected marker data:

```powershell
npm run prepare:map
```

This rebuilds the packaged assets with six concurrent downloads and caches sources in .cache/. The regular install/run workflow does **not** require this step. The elevation and Natural Earth endpoints are public and keyless. Changing the projection requires rebuilding boundaries and marker positions together.

Two further one-time generators exist. Neither runs during install or build:

```powershell
npm run prepare:fonts      # re-vendor the OFL typefaces (needs network)
npm run prepare:memorial   # regenerate the placeholder plates (offline, deterministic)
```

## Add period photographs

See the instructions at the top of `src/data/archive.js`. In short: drop the file into `public/archive/`, add an entry with `eraYear` set to the `year` of a period in `src/data/eras.js`, and fill in `caption`, `credit`, `source` and `rights` honestly. `rights: "cleared"` is a claim that someone actually checked the licence; anything else keeps the warning visible in the footer. A cleared plate also needs a one-line `basis` saying why it is free; `npm test` fails without it. Keep roughly four to eight plates per period, ordered by year — the set for one period is cycled, so more plates means a longer loop and more memory held at once.

Good public-domain sources for the empty periods: the Library of Congress Prints & Photographs catalogue, the National Archives catalogue, Smithsonian Open Access and the NYPL public-domain collections. Works of the U.S. federal government (FSA/OWI, WPA, NARA) are generally public domain; mid-century press photographs usually are not.

Dwell, fade and the camera-lean limits live in `src/ui/archiveStage.js` (`DWELL_MS`, `FADE_MS`, `PAN_X`, `PAN_Y`, `LEAN_DEG`, `FADE_FLOOR`); the band's height, mask, overscan, blur, tint and drift live in `src/style.css` under `.archive`, `.archive-stage`, `.archive-plate` and `.archive-veil`. Raising a pan limit without raising the overscan to match will show an edge. The treatment is deliberately gentle enough that a real photograph still reads, and dark enough that the map still wins.

## Change a period or its summary

`src/data/eras.js` holds both the readable history (`period`, `span`, `meaning`) and the illustrative map layer (`label`, `states`, `color`), and the file says which is which. Period boundaries are editorial, not natural; they exist so the map, the slideshow and the card change together. Changing a boundary year moves which photographs appear when, since `archive.js` joins on it. `npm test` checks that spans stay ordered and meet end to end, and that every plate still joins a real period.

## Add the event content layer next

1. Define sourced, reviewed event records using src/data/contracts.js: stable locationId, start/end years, context, outcome, licensed images and citations.
2. Implement a HistoryRepository adapter. Start with local JSON; retain the same interface if a backend is introduced later.
3. Subscribe to the existing timeline store, cancel stale content requests with AbortController, and cache results by year or historical interval.
4. Render the selected event into the existing panel. Lazy-load images only on selection, give them explicit dimensions and meaningful alternative text, and sanitize any rich text.
5. Work with historical reviewers to establish geography/date uncertainty, the 1619 framing, and primary-source citation rules before presenting any layer as factual.

## Open data and credits

- Modern boundaries: U.S. Census Bureau 2017 cartographic boundaries redistributed by **U.S. Atlas 3.0.1**, ISC license: https://github.com/topojson/us-atlas . Full license is shipped in public/data/us-atlas-LICENSE.txt.
- Elevation: Mapzen/Terrarium terrain tiles served through the public AWS elevation-tiles-prod dataset. Upstream attribution and source licenses: https://github.com/tilezen/joerd/blob/master/docs/attribution.md .
- United States 3DEP, global GMTED2010 and SRTM: courtesy of the U.S. Geological Survey. Global ETOPO1: U.S. National Oceanic and Atmospheric Administration. ArcticDEM and other contributing source attribution is preserved in full in public/data/terrain-attribution.md.
- Rivers, lakes and the coastlines of neighbouring land: **Natural Earth** 10m and 50m vectors, public domain: https://www.naturalearthdata.com/ .
- Typefaces: **Bodoni Moda** and **Archivo**, both under the SIL Open Font License 1.1. The full licenses ship in public/fonts/.
- This project downsampled elevation, incised rivers and lakes into the height grid, baked an illustrative colour palette, normals, ambient occlusion and shaded relief, and exaggerated relief shading. These modifications are not endorsed by the source agencies, and the land colouring is not a land-cover classification.
- Background plates are generated by this project and depict nothing. They are not archival material.
- Three.js is MIT licensed. Dependency licenses remain in their respective packages.

The reference image was used for visual direction; no watermarked artwork was copied into this project.
