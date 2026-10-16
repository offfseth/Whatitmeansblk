import "./style.css";
import "./ui/placePage.css";
import "./ui/mapMilestones.css";
import { createMapMilestones } from './ui/mapMilestones.js';
import { mapCoverage, adjacentCoverageYear, readMapSearch } from './state/mapCoverage.js';
import { mapPlaces } from './data/mapPlaces.js';
import { createPlaceExplorer } from "./ui/placeExplorer.js";
import { boundaryDescription, historicalSnapshot, mapCategories, isCivilWarSnapshot } from "./data/historicalMap.js";
import { MapScene } from "./map/MapScene.js";
import { locations } from "./data/locations.js";
import { eras, getEra, MIN_YEAR, MAX_YEAR } from "./data/eras.js";
import { createTimeline } from "./state/timeline.js";
import {
  platesForYear,
  archiveIsPlaceholder,
  archiveCredits,
  unclearedPlates,
} from "./data/archive.js";
import { createArchiveStage } from "./ui/archiveStage.js";
import { createDrawer } from "./ui/drawer.js";
import { createSky } from "./ui/sky.js";
import { createStoryNavigator } from "./ui/storyNavigator.js";
import { milestones } from "./data/milestones.js";
import { sources } from "./data/sources.js";
import { filterMilestones } from "./state/milestoneFilters.js";

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
  timeline = createTimeline(new URLSearchParams(location.search).get('year') ?? 1963);
let mapData = null;
let scene = null,
  playback = null;
let mapScope = readMapSearch(location.search).scope;
timeline.select(readMapSearch(location.search).place || null);
const mapPanel = createMapMilestones($('map-place-panel'), {
  onClose: closeMapPlace,
  onStory: (id, year) => placeExplorer.open(id, { year }),
  onYear: year => { stopPlayback(); mapScope = 'year'; timeline.setYear(year); render(timeline.get()); mapPanel.focus(); },
});
function closeMapPlace() {
  timeline.select(null);
  $('location-picker').focus({ preventScroll: true });
}
function selectMapPlace(id) {
  stopPlayback();
  timeline.select(id || null);
  if (!id) return;
  if (window.matchMedia('(max-width: 960px)').matches) $('map-place-panel').scrollIntoView({ block: 'start', behavior: 'instant' });
  mapPanel.focus();
}
const storyNavigator = createStoryNavigator(document.querySelector('.history-places'), locations, year => {
  stopPlayback();
  timeline.setYear(year);
}, { includeSteps: false });
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
    "Unverified photographs are withheld from display and production assets.",
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
  const coverage = mapCoverage(year, mapScope);
  const visible = coverage.places;
  if (selectedId && !(selectedId === '@broad' && coverage.broad.length) && !visible.some((l) => l.id === selectedId)) {
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
    year + ", " + era.period + ", " + visible.length + " places in the " + (mapScope === 'year' ? 'selected year' : 'historical period'),
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
  const references = $("era-sources");
  references.replaceChildren('Sources: ', ...era.sourceIds.map((id, index) => {
    const link = document.createElement('a');
    link.href = sources[id].url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = `[${index + 1}]`; link.title = sources[id].publisher + ' — ' + sources[id].title;
    link.setAttribute('aria-label', 'Chapter source ' + (index + 1) + ': ' + link.title);
    return link;
  }));
  const chapterMilestones = filterMilestones(milestones, { era: era.year });
  $("chapter-milestones").href = './milestones.html?era=' + era.year;
  $("chapter-milestones").textContent = `Explore ${chapterMilestones.length} milestones ↗`;
  $("layer-name").textContent = mapScope === 'year' ? 'Milestones in this year' : 'Milestones in this period';
  $("timeline-note").textContent = year < 1783 ? "Historical borders begin in 1783" : year > 2000 ? "Modern Census reference" : "Boundaries as of December 31";
  renderHistory(year, coverage);
  archiveStage.setPlates(platesForYear(year));
  document.documentElement.style.setProperty("--era-color", era.color);
  document.querySelectorAll("#era-buttons [data-year]").forEach((button) => {
    const current = Number(button.dataset.year) === era.year;
    button.classList.toggle("active", current);
    button.setAttribute("aria-pressed", String(current));
  });
  const picker = $("location-picker");
  picker.replaceChildren(
    new Option(visible.length ? "Select a place" : "No mapped places in this window", ""),
    ...visible.map((place) => new Option(`${place.name} · ${place.entries.length} ${place.entries.length === 1 ? 'milestone' : 'milestones'}${place.stories.length ? ' + city stories' : ''}`, place.id)),
  );
  picker.value = visible.some(place => place.id === selectedId) ? selectedId : '';
  picker.disabled = visible.length === 0;
  mapPanel.render(coverage, selectedId, mapScope);
  scene?.update(year, new Set(visible.map((l) => l.id)), selectedId, new Map(visible.map(place => [place.id, place])));
  if (!playback && !location.hash.startsWith('#/place/')) {
    const params = new URLSearchParams(location.search);
    params.set('year', year); params.set('scope', mapScope);
    if (selectedId) params.set('place', selectedId); else params.delete('place');
    history.replaceState(null, '', location.pathname + '?' + params + location.hash);
  }
}
function renderHistory(year, coverage) {
  storyNavigator.update(year);
  const visible = coverage.places;
  const description = boundaryDescription(year);
  $("boundary-date").textContent = description.date;
  $("boundary-title").textContent = description.title;
  $("boundary-note").textContent = description.note;
  $('map-scope-note').textContent = `Pins: ${coverage.window.label}. Boundaries: ${year}.`;
  document.querySelectorAll('[data-map-scope]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapScope === mapScope)));
  $("place-coverage").textContent = `${visible.length} mapped places · ${coverage.events.length} milestones in ${coverage.window.label}`;
  const broad = $('broad-milestones');
  broad.hidden = !coverage.broad.length;
  broad.textContent = `Across regions & the nation · ${coverage.broad.length} milestones ↗`;
  const next = $("coverage-next");
  next.hidden = visible.length > 0 || coverage.broad.length > 0;
  if (!visible.length && !coverage.broad.length) {
    const nearest = adjacentCoverageYear(year, -1) ?? adjacentCoverageYear(year, 1);
    next.dataset.year = nearest;
    next.textContent = "Explore a covered year · " + nearest + " ↗";
  }
  for (const [id, direction] of [['previous-milestone', -1], ['next-milestone', 1]]) {
    const button = $(id), nextYear = adjacentCoverageYear(year, direction);
    button.disabled = nextYear === null;
    button.dataset.year = nextYear ?? '';
    button.textContent = `${direction < 0 ? '← Earlier' : 'Later →'}${nextYear === null ? '' : ' · ' + nextYear}`;
    button.setAttribute('aria-label', `${direction < 0 ? 'Previous' : 'Next'} milestone or city story year${nextYear === null ? '' : ', ' + nextYear}`);
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
document.querySelectorAll("#era-buttons [data-year]").forEach((b) =>
  b.addEventListener("click", () => {
    stopPlayback();
    timeline.setYear(b.dataset.year);
  }),
);
document.querySelectorAll("[data-map-year]").forEach(button => {
  button.onclick = () => { stopPlayback(); timeline.setYear(button.dataset.mapYear); };
});
$("coverage-next").onclick = () => { stopPlayback(); timeline.setYear($("coverage-next").dataset.year); };
document.querySelectorAll('[data-map-scope]').forEach(button => {
  button.onclick = () => { stopPlayback(); mapScope = button.dataset.mapScope; render(timeline.get()); };
});
$('broad-milestones').onclick = () => selectMapPlace('@broad');
for (const id of ['previous-milestone', 'next-milestone']) $(id).onclick = () => {
  stopPlayback(); timeline.setYear($(id).dataset.year);
};
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
  selectMapPlace(e.target.value);
};
$("zoom-in").onclick = () => scene?.zoom(0.8);
$("zoom-out").onclick = () => scene?.zoom(1.25);
$("reset-view").onclick = () => scene?.reset();
$("top-view").onclick = () => scene?.topView();
$("relief").onchange = (e) => scene?.setRelief(e.target.checked);
$("borders").onchange = (e) => scene?.setBorders(e.target.checked);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!placeExplorer.active && timeline.get().selectedId) closeMapPlace();
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
    mapPlaces,
    selectMapPlace,
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
    mapPanel.dispose();
    exploring.abort();
    scene?.dispose();
  });
