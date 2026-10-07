import "./style.css";
import { MapScene } from "./map/MapScene.js";
import { locations } from "./data/locations.js";
import { eras, getEra, MIN_YEAR, MAX_YEAR } from "./data/eras.js";
import { createTimeline, visibleLocations } from "./state/timeline.js";
import { memorial, memorialIsPlaceholder } from "./data/memorial.js";

const icons = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
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
  timeline = createTimeline();
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
$("era-buttons").innerHTML = eras
  .map((e) => '<button data-year="' + e.year + '">' + e.year + "</button>")
  .join("");
// The memorial strip is built twice so the drift can loop without a seam, and
// is decorative: credits for it live in the footer, not in alt text.
$("memorial-track").replaceChildren(
  ...[...memorial, ...memorial].map((plate, index) => {
    const img = new Image();
    img.className = "memorial-plate";
    img.src = plate.src;
    img.alt = "";
    img.decoding = "async";
    if (index) img.loading = "lazy";
    return img;
  }),
);
$("memorial-credit").textContent = memorialIsPlaceholder
  ? "Background imagery: generated placeholder plates. They depict no person, place or event, and are stand-ins until licensed archival photographs are sourced and credited."
  : "Background imagery: " +
    memorial.map((m) => m.credit).join("; ") +
    ".";

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
    year + ", " + era.label + ", illustrative layer",
  );
  if (document.activeElement !== $("year-input"))
    $("year-input").value = String(year);
  $("era-title").textContent = era.title;
  $("layer-name").textContent = era.label;
  document.documentElement.style.setProperty("--era-color", era.color);
  document.querySelectorAll("[data-year]").forEach((button) => {
    const current = Number(button.dataset.year) === era.year;
    button.classList.toggle("active", current);
    button.setAttribute("aria-pressed", String(current));
  });
  const picker = $("location-picker");
  picker.replaceChildren(
    new Option("Select a place", ""),
    ...visible.map((l) => new Option(l.name, l.id)),
  );
  picker.value = selectedId ?? "";
  const selected = locations.find((l) => l.id === selectedId);
  $("selection").hidden = !selected;
  if (selected) {
    $("selection-name").textContent = selected.name;
    $("selection-region").textContent = selected.region;
    $("selection-date").textContent = String(year);
  }
  scene?.update(year, new Set(visible.map((l) => l.id)), selectedId);
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
$("close-selection").onclick = () => timeline.select(null);
$("location-picker").onchange = (e) => timeline.select(e.target.value || null);
$("zoom-in").onclick = () => scene?.zoom(0.8);
$("zoom-out").onclick = () => scene?.zoom(1.25);
$("reset-view").onclick = () => scene?.reset();
$("top-view").onclick = () => scene?.topView();
$("relief").onchange = (e) => scene?.setRelief(e.target.checked);
$("borders").onchange = (e) => scene?.setBorders(e.target.checked);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") timeline.select(null);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPlayback();
  // Stop compositing the drifting plates while the tab is in the background.
  document.body.classList.toggle("memorial-paused", document.hidden);
});
$("map").addEventListener("asseterror", () =>
  showError("Some terrain imagery could not load. Reload to try again."),
);
try {
  const response = await fetch("/data/map.json");
  if (!response.ok) throw new Error("Map data could not be loaded.");
  const data = await response.json();
  scene = new MapScene(
    $("map"),
    data,
    locations,
    (id) => timeline.select(id),
    showError,
  );
  render(timeline.get());
  status.hidden = true;
} catch (error) {
  console.error(error);
  showError(
    "The 3D map could not start. Use a browser with WebGL enabled, then reload. The timeline and location selector remain available.",
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
  window.__atlas = { getState: timeline.get, stats: () => scene?.stats() };
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    stopPlayback();
    unsubscribe();
    lifecycle.abort();
    scene?.dispose();
  });
