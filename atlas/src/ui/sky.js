/** The chapter photograph as atmosphere, above the land.
 *
 * Two stacked layers cross-fade so changing chapter dissolves rather than
 * cuts. The layers have no edges of their own: a mask fades them up from
 * nothing at the top of the viewport and back to nothing before the horizon,
 * so the photograph costs no layout space and never reads as a banner
 * pinned to the top of the page. It is also pulled towards the ink palette,
 * because a full-colour photograph behind a warm map fights it.
 *
 * This is mood, and mood is not evidence. The sharp, captioned, credited
 * plate stays on screen the whole time; nothing here is the only place a
 * photograph is shown, and a chapter with no cleared imagery shows no sky.
 */

import { viewTransform } from "./archiveStage.js";

/** The sky is scenery at a distance, so it answers the camera less than the
 * band in front of it did. Halving keeps the parallax reading as depth
 * rather than as the backdrop sliding about. */
const DISTANCE = 0.5;

export function createSky(root, { followCamera = true } = {}) {
  const layers = [0, 1].map(() => {
    const layer = document.createElement("div");
    layer.className = "sky-layer";
    root.append(layer);
    return layer;
  });
  let front = 0,
    current = null,
    view = null,
    frame = 0,
    disposed = false;

  function applyView() {
    frame = 0;
    if (disposed || !view) return;
    const v = viewTransform(view);
    root.style.setProperty("--sky-x", (v.x * DISTANCE).toFixed(3) + "%");
    root.style.setProperty("--sky-y", (v.y * DISTANCE).toFixed(3) + "%");
    root.style.setProperty("--sky-turn", (v.turn * DISTANCE).toFixed(3) + "deg");
  }

  return {
    /** @param {{src: string, focus?: [number, number]} | null} plate */
    setPlate(plate) {
      if (disposed) return;
      const src = plate?.placeholder ? null : (plate?.src ?? null);
      if (src === current) return;
      current = src;
      if (!src) {
        for (const layer of layers) layer.classList.remove("is-current");
        return;
      }
      front = 1 - front;
      const layer = layers[front];
      const [x, y] = plate.focus ?? [50, 42];
      layer.style.backgroundImage = `url("${src}")`;
      layer.style.setProperty("--focus-x", x + "%");
      layer.style.setProperty("--focus-y", y + "%");
      layer.classList.add("is-current");
      layers[1 - front].classList.remove("is-current");
    },
    /** Safe to call per rendered frame; the write is coalesced to one rAF. */
    setView(next) {
      if (!followCamera || disposed) return;
      view = next;
      if (!frame) frame = requestAnimationFrame(applyView);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      root.replaceChildren();
    },
  };
}
