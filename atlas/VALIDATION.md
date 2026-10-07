# Validation

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

Limits: responsive emulation is not a physical-phone GPU/battery benchmark. No unsupported frame-rate or battery-life guarantee is made. Headless software rendering (SwiftShader) was used for screenshots, so it measures correctness and draw-call counts, not real GPU frame timing. Real multitouch gestures and forced WebGL-context loss were not device-tested. The blurred memorial layer was not profiled on a low-end mobile GPU; it is compositor-only by construction, but that is reasoning, not a measurement. WebMCP registration was not validated in a supported agent-enabled page context; it is optional and feature-detected. Historical highlights are illustrative, not fact-checked history, and the land palette is illustrative cartography rather than land-cover data.
