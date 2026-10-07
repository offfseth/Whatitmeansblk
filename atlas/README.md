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
- Native accessible year scrubber, validated year form, five demo snapshot jumps, and optional playback.
- Eight data-driven locations. Visibility changes with the year; buttons and the footer location selector open a minimal stub panel. Changing to a year where the selected marker is absent clears selection.
- Responsive desktop/phone layout, keyboard-accessible controls, loading/error states, WebGL failure messaging, and reduced idle GPU work.
- A memorial layer of imagery drifting slowly behind the map, tinted and blurred so it stays behind the subject.
- Optional feature-detected WebMCP year action. This does not add a dependency and is ignored in unsupported browsers.

## Design

**Palette — "Ember & Alluvium".** Warm charcoal-brown ink (`--ink-900` `#100c09`) and warm cream paper (`--paper` `#f3e7d2`), one ember accent (`#e2642a`) with brass (`#e0a052`) under it, and a single cool note (teal, around `#2f6b6c`) reserved for water so that rivers, lakes and coasts are the only cool colour anywhere on the page. Corners are square, rules are hairlines, and metadata is set in letterspaced small caps. Depth comes from relief and from value, never from a decorative gradient.

**Type.** Display and figures are **Bodoni Moda**, a Didone in the register of nineteenth-century American broadsides and newspaper mastheads; interface text and small caps are **Archivo**. Both are SIL Open Font License variable fonts, vendored into `public/fonts/` by `npm run prepare:fonts`, so the running site never calls a font CDN.

**Land colour** is hand-authored cartography, not a land-cover dataset. Elevation, slope, latitude and longitude drive a deliberately narrow warm range — sand, red rock, dry and wet grass, hardwood and conifer, tundra, marsh, exposed rock and snow — pulled 30% toward neutral and then warmed, so regional character is carried mostly by value and relief rather than by hue. Two scales of noise keep the continental moisture gradient from banding into a straight seam down the hundredth meridian.

**Water** is treated as a real surface, not blank space. River valleys and lake beds are carved into the elevation grid *before* relief is derived, so the normal map shows genuine incision rather than painted-on lines; a roughness/metalness map makes water hold a sheen where the land stays matte. The sea sheet is coloured by distance from shore (deep basin, shelf, shallows), carries a faint graticule, and shows Canada, Mexico and the Caribbean as quiet dark silhouettes so the Gulf of Mexico, the Great Lakes and both coasts have their true shape. Its alpha is solid over the subject and over enclosed seas and thins across the open ocean, which is what lets the memorial layer through at the left and right of the frame.

**The coast.** The land sits only just proud of the water, and the shoreline carries a shelf that steps outward and down from the coast, through a foreshore and the waterline, to a shelf break below the sea. The shelf samples the terrain texture at the shoreline itself, so every coast keeps its own colour as it goes under. A tall plate reads as a cut-out pasted onto a sea however its edge is shaded, so the height difference itself is kept small and relief carries the dimension instead. Islands and lakes narrower than a full shelf get a proportionally narrower one, because otherwise the slope folds back through itself. The shelf is built from the dissolved outline of the landmass (`outline` in `map.json`), so state borders inland are untouched.

**Memorial layer.** `src/data/memorial.js` lists the plates; `public/memorial/` holds them. The strip is duplicated once and driven by a single CSS transform animation, so the blurred plates rasterise once and are then composited — no JavaScript runs per frame, and no WebGL frame is requested. It pauses when the tab is hidden and holds still under `prefers-reduced-motion`.

> **The shipped plates are placeholders and depict nothing.** They are generated paper, emulsion, grain and scratches (`npm run prepare:memorial`). A memorial must not invent its own evidence, so no synthesised photograph of a real person, place or event is used. Replace them with licensed, sourced archival images and fill in `credit` for each; credits render into the footer's "Map notes & credits" panel, and the panel says out loud while only placeholders are loaded.

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
      memorial.js               Background plate list and swap instructions
      contracts.js              Documented future event/repository contract
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
    memorial/                   Placeholder plates for the background layer
  scripts/
    prepare-map.mjs              Reproducible asset download and preparation
    prepare-fonts.mjs            One-time typeface vendoring
    prepare-memorial.mjs         Deterministic placeholder plate generation
  tests/
    timeline.test.js            Date boundaries, visibility, state and asset checks
```

Generated/ignored folders: node_modules/, dist/, .cache/. Root README links here. The complete working implementation and assets are in this directory; there are no omitted code snippets or external CDN dependencies at runtime.

## Why this stack

**Vite + JavaScript ES modules + Three.js.** Vite provides a simple development/build workflow. Three.js handles the small 3D scene and proven OrbitControls without a continuously tiled basemap or a larger geospatial rendering stack. Native HTML controls avoid a UI framework and remain keyboard operable. Only Three.js ships as an application dependency; d3-geo, topojson-client and sharp are build-time asset-preparation dependencies.

## Performance techniques

1. **Render on demand:** one coalesced requestAnimationFrame per change. No setAnimationLoop, auto-rotation, damping loop, animated water, or idle animation.
2. **The memorial layer never touches WebGL:** it is one CSS transform animation on a duplicated strip. Blur, mask and tint are applied to the static plates, so they rasterise once and are then composited; the map still renders zero frames while idle.
3. **Bounded pixel ratio:** at most 1.5×, limiting fill rate on high-DPI phones; low-power WebGL preference (a browser hint, not a guarantee).
4. **Merged geometry:** one top-surface mesh, one raised base, one border batch, and shared marker geometry. No per-state draw calls.
5. **Baked relief:** three 1600 × 1001 land textures and one 1400 × 876 sea texture replace a dense terrain mesh, live elevation fetches, and per-frame terrain computation. The sea reuses one texture for colour and alpha.
6. **No shadows or post-processing:** ambient/directional illumination and a single sea plane.
7. **Reuse on scrubbing:** update vertex colors/emphasis and marker visibility; do not rebuild geometry, reload textures, or fetch event content per frame.
8. **Work stops offscreen:** pending map frames, playback and the memorial drift are all stopped when the document is hidden.
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

## Replace the memorial imagery

See the instructions at the top of `src/data/memorial.js`. In short: drop licensed files into `public/memorial/`, list them with a `credit` for each, and keep the list to roughly six to twelve plates. The visual treatment — blur, tint, opacity and the drift speed — lives in `src/style.css` under `.memorial-plate` and `--memorial-cycle`; it is deliberately gentle enough that a real photograph still reads.

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
