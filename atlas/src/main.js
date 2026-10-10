import "./style.css";
import "./ui/placePage.css";
import { createPlaceExplorer } from "./ui/placeExplorer.js";
import { boundaryDescription, historicalSnapshot, mapCategories, isCivilWarSnapshot } from "./data/historicalMap.js";
import { nearestStoryYear, getPlaceStory } from "./data/placeStories.js";
import { MapScene } from "./map/MapScene.js";
import { locations } from "./data/locations.js";
import { eras, getEra, MIN_YEAR, MAX_YEAR } from "./data/eras.js";
import { createTimeline, visibleLocations } from "./state/timeline.js";
import {
  platesForYear,
  archiveIsPlaceholder,
  archiveCredits,
  unclearedPlates,
} from "./data/archive.js";
import { createArchiveStage } from "./ui/archiveStage.js";
import { createDrawer } from "./ui/drawer.js";
import { createSky } from "./ui/sky.js";

const icons = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
};
const icon = (name) =>
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  icons[name] +
  "</svg>";
document
  .querySelectorAll("[data-icon]")
  .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
const $ = (id) => document.getElementById(id),
  timeline = createTimeline(1963);
let mapData = null;
let scene = null,
  playback = null;
$("year-slider").max = MAX_YEAR;
$("year-input").max = MAX_YEAR;
$("date-range").textContent = "1619–" + MAX_YEAR;
$("ticks").innerHTML = [1619, 1700, 1800, 1900, MAX_YEAR]
  .map(
    (y) =>
      '<span style="left:' +
      ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100 +
      '%">' +
      y +
      "</span>",
  )
  .join("");
const chapterNames = [
  "Colonial America",
  "Revolution & republic",
  "Civil War",
  "Reconstruction",
  "The Great Migration",
  "Civil rights",
  "After the movement",
];
$("era-buttons").innerHTML = eras
  .map((era, index) =>
    `<button data-year="${era.year}" aria-label="${era.period}, ${era.span}">
      <span>${era.span}</span><strong>${chapterNames[index]}</strong>
    </button>`,
  )
  .join("");
/* The same photograph twice, doing two different jobs: the sky carries the
 * mood over the whole room, and the plate below carries the record. They
 * always show the same image, so the atmosphere is never something the
 * reader cannot go and read the credit for. */
const sky = createSky($("sky"));
// Captions and controls share the same slideshow state as the visible photograph.
const archiveStage = createArchiveStage($("archive-stage"), (plate, index, count) => {
  const placeholder = Boolean(plate.placeholder);
  sky.setPlate(placeholder ? null : plate);
  $("archive-feature").classList.toggle("is-placeholder", placeholder);
  $("archive-empty").hidden = !placeholder;
  $("photo-controls").hidden = placeholder;
  $("photo-year").hidden = placeholder;
  $("photo-year").textContent = plate.year ?? "";
  $("plate-count").textContent =
    String(index + 1).padStart(2, "0") + " / " + String(count).padStart(2, "0");
  $("photo-prev").disabled = $("photo-next").disabled = count < 2;
  $("plate-caption").textContent = placeholder
    ? "This chapter is waiting for its archival images."
    : plate.caption;
  $("plate-credit").textContent = placeholder
    ? "Explore its dates and places on the map below."
    : plate.rights === "cleared"
      ? plate.credit
      : "Rights not cleared · " + plate.credit;
  const source = $("plate-source");
  source.hidden = placeholder || !plate.source?.startsWith("https://");
  if (!source.hidden) source.href = plate.source;
  else source.removeAttribute("href");
}, { followCamera: false });
let photosPaused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function setPhotosPaused(value) {
  photosPaused = value;
  archiveStage.setPaused(value);
  $("photo-pause").innerHTML = icon(value ? "play" : "pause");
  $("photo-pause").setAttribute("aria-label", value ? "Play photographs" : "Pause photographs");
}
setPhotosPaused(photosPaused);
const photoMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const updatePhotoMotion = () => {
  if (photoMotion.matches) setPhotosPaused(true);
};
photoMotion.addEventListener("change", updatePhotoMotion);
$("photo-pause").onclick = () => setPhotosPaused(!photosPaused);
$("photo-prev").onclick = () => {
  setPhotosPaused(true);
  archiveStage.previous();
};
$("photo-next").onclick = () => {
  setPhotosPaused(true);
  archiveStage.next();
};
$("archive-credit").textContent = [
  archiveIsPlaceholder
    ? "Archival photographs are still being gathered. Chapters without images display an empty archive panel."
    : "Archive imagery: " + archiveCredits().join("; ") + ".",
  unclearedPlates.length &&
    "Some plates are shown here for prototype review and their rights have not been cleared for publication.",
]
  .filter(Boolean)
  .join(" ");

const status = $("map-status");
function showError(message) {
  status.hidden = false;
  status.textContent = message;
  status.classList.add("error");
  stopPlayback();
}
function stopPlayback() {
  clearInterval(playback);
  playback = null;
  $("play").innerHTML = icon("play");
  $("play").setAttribute("aria-label", "Play timeline");
}
function render({ year, selectedId }) {
  const visible = visibleLocations(locations, year);
  if (selectedId && !visible.some((l) => l.id === selectedId)) {
    timeline.select(null);
    return;
  }
  const era = getEra(year);
  $("year-output").value = String(year);
  $("year-slider").value = String(year);
  $("year-slider").style.setProperty(
    "--progress",
    ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100 + "%",
  );
  $("year-slider").setAttribute(
    "aria-valuetext",
    year + ", " + era.period + ", " + visible.length + " places with stories",
  );
  if (document.activeElement !== $("year-input"))
    $("year-input").value = String(year);
  $("era-title").textContent = chapterNames[eras.indexOf(era)];
  $("chapter-number").textContent =
    "Chapter " + String(eras.indexOf(era) + 1).padStart(2, "0") +
    " / " + String(eras.length).padStart(2, "0");
  $("archive-empty-years").textContent = era.span;
  $("era-span").textContent = era.span;
  $("era-period").textContent = era.period;
  $("era-meaning").textContent = era.meaning;
  $("layer-name").textContent = "Stories in their time";
  $("timeline-note").textContent = year < 1783 ? "Historical borders begin in 1783" : year > 2000 ? "Modern Census reference" : "Boundaries as of December 31";
  renderHistory(year, visible);
  archiveStage.setPlates(platesForYear(year));
  document.documentElement.style.setProperty("--era-color", era.color);
  document.querySelectorAll("#era-buttons [data-year]").forEach((button) => {
    const current = Number(button.dataset.year) === era.year;
    button.classList.toggle("active", current);
    button.setAttribute("aria-pressed", String(current));
  });
  const picker = $("location-picker");
  picker.replaceChildren(
    new Option(visible.length ? "Select a place" : "No stories for this year", ""),
    ...visible.map((l) => new Option(l.name + " · " + getPlaceStory(l.id, year).label, l.id)),
  );
  picker.value = selectedId ?? "";
  picker.disabled = visible.length === 0;
  scene?.update(year, new Set(visible.map((l) => l.id)), selectedId);
}
function renderHistory(year, visible) {
  const description = boundaryDescription(year);
  $("boundary-date").textContent = description.date;
  $("boundary-title").textContent = description.title;
  $("boundary-note").textContent = description.note;
  $("place-coverage").textContent = visible.length
    ? visible.length + (visible.length === 1 ? " place" : " places") + " with stories in " + year
    : "No published city stories for " + year + " yet.";
  const next = $("coverage-next");
  next.hidden = visible.length > 0;
  if (!visible.length) {
    const nearest = locations.map(l => nearestStoryYear(l.id, year))
      .sort((a,b) => Math.abs(a-year) - Math.abs(b-year) || a-b)[0];
    next.dataset.year = nearest;
    next.textContent = "Explore a covered year · " + nearest + " ↗";
  }
  document.querySelectorAll("[data-map-year]").forEach(button => {
    if (button.textContent === "Today") button.dataset.mapYear = MAX_YEAR;
    button.setAttribute("aria-pressed", String(Number(button.dataset.mapYear) === year));
  });
  const snapshot = mapData ? historicalSnapshot(mapData.history, mapData, year) : null;
  const keys = snapshot ? Object.keys(mapCategories).filter(key => snapshot.entries.some(f => f.category === key))
    : year < 1783 ? [] : isCivilWarSnapshot(year) ? ["union","confederacy","border","territory"] : ["state","territory"];
  $("history-legend").replaceChildren(...keys.map(key => {
    const item = document.createElement("span");
    const swatch = document.createElement("i");
    swatch.style.backgroundColor = mapCategories[key].color;
    swatch.setAttribute("aria-hidden", "true");
    item.append(swatch, mapCategories[key].label);
    return item;
  }));
  const list = $("jurisdiction-list");
  // Text equivalents of the colored jurisdictions, available to every reader.
  list.replaceChildren(...(snapshot?.entries ?? []).map(feature => {
    const item = document.createElement("li");
    item.textContent = feature.name + " · " + mapCategories[feature.category].label;
    return item;
  }));
}

const unsubscribe = timeline.subscribe(render);
$("year-slider").addEventListener("input", (e) => {
  stopPlayback();
  timeline.setYear(e.target.value);
});
$("year-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!$("year-form").reportValidity()) return;
  stopPlayback();
  timeline.setYear($("year-input").value);
});
document.querySelectorAll("[data-year]").forEach((b) =>
  b.addEventListener("click", () => {
    stopPlayback();
    timeline.setYear(b.dataset.year);
  }),
);
document.querySelectorAll("[data-map-year]").forEach(button => {
  button.onclick = () => { stopPlayback(); timeline.setYear(button.dataset.mapYear); };
});
$("coverage-next").onclick = () => { stopPlayback(); timeline.setYear($("coverage-next").dataset.year); };
$("play").onclick = () => {
  if (playback) {
    stopPlayback();
    return;
  }
  if (timeline.get().year === MAX_YEAR) timeline.setYear(MIN_YEAR);
  $("play").innerHTML = icon("pause");
  $("play").setAttribute("aria-label", "Pause timeline");
  playback = setInterval(() => {
    const y = timeline.get().year + 1;
    timeline.setYear(y);
    if (y >= MAX_YEAR) stopPlayback();
  }, 100);
};
const drawerUI = createDrawer({
  drawer: $("drawer"), handle: $("drawer-handle"), body: $("drawer-body"),
  backdrop: $("drawer-backdrop"), page: $("page-content"),
  onOpen(open) {
    archiveStage.setHidden(open || document.hidden);
    if (open) stopPlayback();
  },
});
/* Arrival, then exploration.
 *
 * The page opens as a title over a photograph with the land sitting back
 * behind it, which is the only moment the atlas gets to be a single image.
 * The first sign of intent — a drag on the land, a chapter, a year, a key,
 * a scroll — dissolves the title and brings the room up to full.
 *
 * The overture is pointer-transparent, so that first drag both dismisses it
 * and turns the land underneath: nothing has to be clicked away. Reduced
 * motion skips the opening state entirely, in CSS, because without the
 * dissolve there would be no way out of it.
 */
const exploring = new AbortController();
function beginExploring() {
  if (document.body.classList.contains("is-exploring")) return;
  document.body.classList.add("is-exploring");
  exploring.abort();
}
{
  const { signal } = exploring;
  const on = (target, type, options) =>
    target.addEventListener(type, beginExploring, { passive: true, signal, ...options });
  for (const type of ["pointerdown", "wheel", "keydown"]) on($("stage"), type);
  on($("stage"), "focusin");
  on(window, "scroll");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) beginExploring();
}
const placeExplorer = createPlaceExplorer({
  timeline, getScene: () => scene, archiveStage, stopPlayback,
  closeDrawer: () => drawerUI.close(),
});
$("location-picker").onchange = (e) => {
  if (e.target.value) placeExplorer.open(e.target.value);
};
$("zoom-in").onclick = () => scene?.zoom(0.8);
$("zoom-out").onclick = () => scene?.zoom(1.25);
$("reset-view").onclick = () => scene?.reset();
$("top-view").onclick = () => scene?.topView();
$("relief").onchange = (e) => scene?.setRelief(e.target.checked);
$("borders").onchange = (e) => scene?.setBorders(e.target.checked);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!placeExplorer.active) timeline.select(null);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPlayback();
  // Stop compositing the drifting plates while the tab is in the background.
  document.body.classList.toggle("archive-paused", document.hidden);
  archiveStage.setHidden(document.hidden || placeExplorer.active || $("drawer").classList.contains("is-open"));
});
$("map").addEventListener("asseterror", () =>
  showError("Some terrain imagery could not load. Reload to try again."),
);
try {
  const [data, history] = await Promise.all(["/data/map.json", "/data/historical-boundaries.json"].map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Map data could not be loaded: " + url);
    return response.json();
  }));
  data.history = history;
  mapData = data;
  scene = new MapScene(
    $("map"),
    data,
    locations,
    (id) => placeExplorer.open(id),
    showError,
    (camera) => sky.setView(camera),
  );
  render(timeline.get());
  placeExplorer.onSceneReady();
  status.hidden = true;
} catch (error) {
  console.error(error);
  showError(
    mapData ? "The 3D map could not start. Use a browser with WebGL enabled, then reload. The timeline and location selector remain available." : "The map data could not load. Reload to try again. City stories remain available through the location selector.",
  );
}
// Optional agent interface uses the exact same state actions as the visible controls.
const lifecycle = new AbortController();
const context = document.modelContext;
if (context?.registerTool) {
  try {
    Promise.resolve(
      context.registerTool(
        {
          name: "set_atlas_year",
          description: "Move the visible atlas timeline to a year.",
          inputSchema: {
            type: "object",
            properties: {
              year: { type: "integer", minimum: MIN_YEAR, maximum: MAX_YEAR },
            },
            required: ["year"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (
              !Number.isInteger(input?.year) ||
              input.year < MIN_YEAR ||
              input.year > MAX_YEAR
            )
              throw new Error("Year is outside the timeline.");
            stopPlayback();
            timeline.setYear(input.year);
            return timeline.get();
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(console.warn);
  } catch (error) {
    console.warn(error);
  }
}
if (import.meta.env.DEV)
  window.__atlas = {
    getState: timeline.get,
    stats: () => scene?.stats(),
    // Camera readings, for checking that layers outside WebGL follow it.
    camera: () => scene?.cameraState(),
    eye: () => scene && scene.camera.position.toArray().map((n) => +n.toFixed(2)),
  };
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    stopPlayback();
    unsubscribe();
    lifecycle.abort();
    photoMotion.removeEventListener("change", updatePhotoMotion);
    placeExplorer.dispose();
    drawerUI.dispose();
    archiveStage.dispose();
    sky.dispose();
    exploring.abort();
    scene?.dispose();
  });
