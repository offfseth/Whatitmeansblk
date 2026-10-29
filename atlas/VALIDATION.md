# Validation

## Cited event essays — October 28, 2026

- All 53 milestones now have expanded reading pages, with 146 registered references. Paragraphs, context timelines, and evidence notes retain their own source IDs; publication checks reject missing essays and uncited passages.
- This pass focused on Brown v. Board, Montgomery, and the March on Washington: implementation after Brown, the boycott's transport network, and congressional opposition to the march. New factual additions were checked against the linked National Archives and Stanford King Institute accounts.
- Numbered references, source-return controls, contents navigation, and full-text collection search are implemented. Earlier desktop browser checks confirmed citation focus/return and preservation of the event URL. Phone viewport verification was interrupted by a browser-tool timeout and remains incomplete.
- Final automated suite: all 64 tests passed after the focused content additions. Production build passed using `npm.cmd run build -- --configLoader native`; the existing large-chunk advisory remains. Content publication checks also passed.

## Map surroundings — October 10, 2026

- Replaced the runtime sea.webp backdrop (neighboring-country silhouettes and lit water) with a static 128px alpha texture and an unlit matte material. The radial field fades to zero alpha at its edges and is disposed with the other map textures.
- Removed the three large ocean labels; retained Alaska and Hawaiʻi inset labels, terrain, rivers, lakes, and historical boundaries.
- Inspected the desktop default view in Chrome. All 44 tests pass and the production build passes. Camera-extreme and physical mobile GPU checks were not completed in this pass.

## City typography and palette audit — October 10, 2026

- Replaced the accumulated city-page overrides with one responsive stylesheet. Headings use normal tracking and explicit line heights; dates are block-level; phone metadata flows in a single column. Hero captions occupy normal layout space rather than overlapping the introduction.
- Warm-white reading and source sections, deep teal dates and navigation, mint and terracotta accents. Original photographs remain unchanged.
- Browser DOM geometry audit: all 13 published story chapters at 390, 768, and 1440 pixel viewport widths (39 combinations), with no horizontal document overflow, overflowing checked text elements, or intersections between checked heading, paragraph, caption, date, and metadata blocks.
- Visually inspected Washington's desktop reading section and 320px phone reading, dates, and archive. The 320px check also has no horizontal document overflow. Geometry checks do not replace visual checks or physical-device testing.
- All 44 automated tests pass. Production build passes with the existing bundle-size advisory.

## City page visual refresh — October 10, 2026

- Dark continuous backgrounds, large photographic heroes, full-width uncropped archive images, and a sticky translucent masthead with an explicit Back to map button.
- Existing photo assets are 1,400 pixels wide for the city stories. Gallery width is capped at 1,400 CSS pixels; no new resolution or detail was generated.
- Chrome: inspected Washington on desktop and a 390 × 844 viewport; phone document width matches its client width. Checked the archive jump and Back to map restoring the 1963 atlas. Chicago's no-photo story renders its geographic context and archive-empty state.
- 44 tests pass; production build passes with the existing bundle-size advisory.

## Story discovery — October 10, 2026

- 44 automated tests pass, including navigation through single-year stories, returning cities, shared start years, and coverage endpoints.
- Production build passes with the existing bundle-size advisory.
- Previous/next controls jump between published story start years. The expandable city-story list changes the map year before readers select a place to open its article.
- Dates represent editorial story coverage, not city founding or disappearance. No new historical claims or boundary datasets were added in this pass.
- Browser visual and interaction checks have not been performed for these new controls.

> **Stale in one respect.** This run predates the period slideshow and the
> period card. Where it says "memorial drift", the build now cross-fades
> period-filtered plates in front of the canvas instead. The layer is still
> compositor-only by construction — CSS opacity and transform, a timer that
> fires once per plate rather than per frame — but that is reasoning, and the
> numbers below were not re-measured against it.


Validated locally on 2026-10-06 using Node 24.12 and Chrome.

- Production build: passes with Vite 7.3.7.
- Automated tests: 5 pass (year bounds, subscriptions, snapshot boundaries, marker visibility and packaged geography).
- npm dependency audit: zero reported vulnerabilities after updating Vite to 7.3.7 and sharp to 0.35.5.
- Asset regeneration: passes with sharp 0.35.5 and cached upstream inputs. 51 regions, 102 elevation tiles, 247 rivers, 274 lakes.
- Typeface and placeholder-plate generators both re-run cleanly; plate output is deterministic for a fixed seed.
- Desktop layouts inspected at 1920 × 1040 and 1230 × 920.
- Timeline bar measured before and after compaction: roughly 260px tall, now roughly 150px, returning that space to the map.
- Phone and tablet layouts inspected at a true 390 × 844 and 768 × 844 by rendering the page in a sized iframe; no horizontal document overflow at either width. Note that headless Chrome clamps its own window width, so a bare `--window-size=390` screenshot is cropped rather than reflowed and is not a valid responsive check.
- Year snapshot buttons, typed year jump, arrow-key scrubber, location selection, deselection when scrubbing before visibility, zoom, overhead and reset controls checked in Chrome.
- Era highlight verified at 1865: the tint is modulated by the land's own brightness, so relief, rivers and borders stay legible under the colour.
- Playback checked from 2025: advances to 2026, then stops.
- Idle check: `data-frames` read 3 and 2 across observations separated by virtual time with no input, so an idle map requests no renders. The memorial drift runs throughout and does not request any. Camera input does request renders.
- Opening scene: 6 draw calls and 45,744 triangles. The coastal shelf replaced the extruded base, so the triangle count barely moved and the draw-call count did not.
- Camera limits checked by driving the controls to each extreme (max tilt, both azimuth limits, max pull-back, max pan) and screenshotting: the sea sheet still fills the frame in every case, with no horizon, no sheet edge and no empty space in view. Pull-back is capped at 1.22x the framing distance, which follows the aspect ratio.
- Coast shelf inspected at magnification on the Pacific, Gulf and Florida coasts: no dark wall, and no folded geometry on the Aleutians or other small islands.
- Drawer checked open and closed at 1920px and at 390px: opens on hover, pins on click, closes on Escape, and the page gutters clear its handle at every breakpoint.
- Memorial drift confirmed to advance by comparing frames at 5 s and 130 s. Compositor-driven animations do not advance under Chrome's virtual time, so `--disable-threaded-animations` is required to observe this headlessly.
- Asset sizes: terrain 202 KB, normals 404 KB, surface 39 KB, sea 88 KB, map JSON approximately 336 KB (the dissolved outline added about 74 KB), eight placeholder plates 289 KB, two variable fonts 81 KB.
- Production JavaScript: approximately 557 KB raw / 144 KB gzip. CSS approximately 15 KB raw / 4 KB gzip. Vite emits its standard 500 KB chunk-size advisory because Three.js is bundled. No build error.
- No WebGL errors observed during normal operation.

Limits: responsive emulation is not a physical-phone GPU/battery benchmark. No unsupported frame-rate or battery-life guarantee is made. Headless software rendering (SwiftShader) was used for screenshots, so it measures correctness and draw-call counts, not real GPU frame timing. Real multitouch gestures and forced WebGL-context loss were not device-tested. The blurred memorial layer was not profiled on a low-end mobile GPU; it is compositor-only by construction, but that is reasoning, not a measurement. WebMCP registration was not validated in a supported agent-enabled page context; it is optional and feature-detected. The earlier highlight checks below describe the former illustrative layer. The historical layer is validated in the latest section; terrain colors remain illustrative cartography rather than land-cover data.

## City story navigation — October 9, 2026

- Existing suite plus place/camera tests: all 32 tests pass.
- Production Vite build passes; existing Three.js bundle-size advisory remains.
- Chrome desktop (2560 × 1305): Washington marker selection, transition, split hero, return to map, browser history.
- Chrome mobile viewport (390 × 844): article navigation, no horizontal overflow in the city page, related-place navigation, direct-link reload, return to map, and cancellation during descent.
- Unit coverage: each city has cited sections and local visual assets, route validation/year boundaries, finite animation, cancellation, reduced-motion timing, tab hiding, camera targeting beyond normal pan limits, and restoration of controls/view.
- Washington and Montgomery use existing cleared archive images. Six remaining city collections explicitly show geographic context and an empty photographic archive. No external asset downloads or runtime dependencies added.
