/** Cross-fading archival photographs with manual and automatic navigation.
 * The framed gallery uses followCamera: false; the optional camera helpers
 * below support a scene-mounted treatment. Captions share the active index.
 * Reduced motion starts paused, and explicit playback remains available.
 */

export const DWELL_MS = 7600;
/** Must stay in step with the opacity transition on .archive-plate. */
export const FADE_MS = 1500;

/** Movement limits. The overscan on .archive-stage is sized from all four
 * together; raising one without raising the overscan will show an edge.
 *
 * TURN_DEG is the horizontal swing, and is the one that costs the most room:
 * under perspective the edge rotating away from the viewer recedes towards
 * the middle of the band, so the stage has to reach well past it. The camera
 * itself only travels +/-28 degrees, and a backdrop should read as turning
 * less than the thing in front of it. */
const PAN_X = 2.6;
const PAN_Y = 2.2;
const TURN_DEG = 3;
const LEAN_DEG = 0.6;

/** Straight down is the one angle where the land fills the frame and the band
 * has nowhere to be, so it steps back rather than sitting on top of the map. */
const FADE_FLOOR = 0.34;

/** Slack on top of the computed overscan, for subpixel rounding. */
const SAFETY_PX = 10;

/** Clamp, but a non-finite reading falls back rather than poisoning the
 * transform: NaN would propagate into every custom property and blank the
 * band outright, which is a worse failure than ignoring one bad frame. */
const clamp = (v, lo, hi, fallback = lo) =>
  Number.isFinite(v) ? (v < lo ? lo : v > hi ? hi : v) : fallback;
const rad = (deg) => (deg * Math.PI) / 180;

/** Camera reading to band transform.
 *
 * DIRECTION, which is easy to get backwards and was: `yaw` is +1 when the
 * camera has orbited to +X, which is screen-right, and -1 when it has orbited
 * to screen-left. Whichever side the camera stands on is the side of the
 * world nearest to it, so that is the edge of the band that must swing
 * forward. CSS `rotateY` brings the LEFT edge forward for positive angles,
 * so the turn carries the same sign as the yaw... and then the whole thing is
 * negated, because the band must behave like scenery the camera is moving
 * around, not like a board being turned to face it: standing further to the
 * right shows you more of the right-hand side of a thing in the distance.
 *
 * The pan goes the other way from the yaw for the same reason a far hillside
 * slides the opposite way to a near fencepost when you move. */
export function viewTransform({ yaw = 0, tilt = 1 } = {}) {
  const y0 = clamp(yaw, -1, 1, 0);
  // Tilt runs 0 (straight down) to 1 (most oblique); measured from the
  // oblique end, because that is the resting view.
  const away = 1 - clamp(tilt, 0, 1, 1);
  return {
    x: -y0 * PAN_X,
    y: -away * PAN_Y,
    turn: -y0 * TURN_DEG,
    lean: -y0 * LEAN_DEG,
    fade: FADE_FLOOR + (1 - FADE_FLOOR) * (1 - away * away),
  };
}

/** How far the stage must reach past the band on each axis so that no camera
 * position can pull an edge into view.
 *
 * The stage is a plane turned by TURN_DEG under a perspective of `p`. Its far
 * edge is scaled towards the centre by p/(p + w*sin(turn)), which is what
 * eats the margin; the roll adds half a span times its sine on the other
 * axis, and the pans add their own share. The stage's size depends on the
 * overscan we are solving for, so iterate — it converges in two passes. */
export function overscanFor(bandW, bandH, p) {
  const sinT = Math.sin(rad(TURN_DEG));
  const sinL = Math.sin(rad(LEAN_DEG));
  let ox = 0,
    oy = 0;
  for (let i = 0; i < 4; i++) {
    const w = (bandW + 2 * ox) / 2;
    const h = (bandH + 2 * oy) / 2;
    const recede = 1 - p / (p + w * sinT);
    ox =
      w * recede +
      h * sinL +
      ((bandW + 2 * ox) * PAN_X) / 100 +
      SAFETY_PX;
    oy =
      h * recede +
      w * sinL +
      ((bandH + 2 * oy) * PAN_Y) / 100 +
      SAFETY_PX;
  }
  return { x: Math.ceil(ox), y: Math.ceil(oy) };
}

export function createArchiveStage(root, onPlate = () => {}, { followCamera = true } = {}) {
  const cache = new Map();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let plates = [],
    index = 0,
    timer = null,
    sweep = null,
    viewFrame = 0,
    view = null,
    hidden = false,
    paused = motion.matches,
    disposed = false;

  function element(plate) {
    let img = cache.get(plate.src);
    if (!img) {
      img = new Image();
      // The adjacent figcaption carries the photograph’s description and credit.
      img.alt = "";
      img.className = "archive-plate";
      img.decoding = "async";
      const [x, y] = plate.focus ?? [50, 42];
      img.style.setProperty("--focus-x", x + "%");
      img.style.setProperty("--focus-y", y + "%");
      img.src = plate.src;
      cache.set(plate.src, img);
    }
    return img;
  }

  function show(next) {
    if (!plates.length) return;
    index = (next + plates.length) % plates.length;
    const plate = plates[index],
      img = element(plate);
    if (!img.isConnected) root.append(img);
    for (const node of root.children)
      node.classList.toggle("is-current", node === img);
    // Alternating the drift keeps consecutive plates from all sliding the
    // same way, which reads as a pan rather than a sequence of photographs.
    img.classList.toggle("drift-back", index % 2 === 1);
    onPlate(plate, index, plates.length);
  }

  function schedule() {
    clearInterval(timer);
    timer = null;
    if (disposed || hidden || paused || plates.length < 2) return;
    timer = setInterval(() => show(index + 1), DWELL_MS);
  }

  /** Drop the previous period's plates once they have finished fading out. */
  function retire(keep) {
    clearTimeout(sweep);
    sweep = setTimeout(() => {
      for (const node of [...root.children])
        if (!keep.has(node)) node.remove();
    }, FADE_MS + 100);
  }

  /** Re-solve the overscan whenever the band changes size. */
  function measure() {
    if (!followCamera) return;
    const band = root.parentElement;
    if (!band) return;
    const r = band.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const p =
      parseFloat(getComputedStyle(band).perspective) || 1500;
    const { x, y } = overscanFor(r.width, r.height, p);
    root.style.setProperty("--overscan-x", x + "px");
    root.style.setProperty("--overscan-y", y + "px");
  }

  function applyView() {
    viewFrame = 0;
    if (disposed || !view) return;
    const v = viewTransform(view);
    root.style.setProperty("--view-x", v.x.toFixed(3) + "%");
    root.style.setProperty("--view-y", v.y.toFixed(3) + "%");
    root.style.setProperty("--view-turn", v.turn.toFixed(3) + "deg");
    root.style.setProperty("--view-lean", v.lean.toFixed(3) + "deg");
    root.style.setProperty("--view-fade", v.fade.toFixed(3));
  }

  // Turning reduced motion on mid-session stops the auto-advance at once.
  function motionChanged() {
    if (motion.matches) paused = true;
    schedule();
  }
  motion.addEventListener("change", motionChanged);
  const resize = new ResizeObserver(measure);
  if (root.parentElement) resize.observe(root.parentElement);
  measure();

  return {
    /** @param {import("../data/archive.js").ArchivePlate[]} next */
    setPlates(next) {
      if (disposed || !next?.length) return;
      const same =
        next.length === plates.length &&
        next.every((plate, i) => plate.src === plates[i].src);
      if (same) return;
      plates = next;
      show(0);
      retire(new Set(next.map((plate) => element(plate))));
      schedule();
    },
    /** Lean the band to match the camera. Safe to call per frame: the write is
     * coalesced, and the scene already reports once per rendered frame. */
    setView(next) {
      if (!followCamera) return;
      view = next;
      if (!viewFrame && !disposed)
        viewFrame = requestAnimationFrame(applyView);
    },
    previous() {
      if (disposed) return;
      show(index - 1);
      schedule();
    },
    next() {
      if (disposed) return;
      show(index + 1);
      schedule();
    },
    setPaused(value) {
      paused = Boolean(value);
      schedule();
    },
    /** Stop advancing while the page is hidden or the about drawer is open. */
    setHidden(value) {
      hidden = value;
      schedule();
    },
    dispose() {
      disposed = true;
      clearInterval(timer);
      clearTimeout(sweep);
      cancelAnimationFrame(viewFrame);
      resize.disconnect();
      root.replaceChildren();
      cache.clear();
      motion.removeEventListener("change", motionChanged);
    },
  };
}
