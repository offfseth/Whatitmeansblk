import { getPlaceStory, nearestStoryYear } from "../data/placeStories.js";
import { createPlacePage } from "./placePage.js";
import { parsePlaceRoute, placeRoute } from "../state/placeRoute.js";

/** Coordinates navigation and the finite camera move; prose never depends on WebGL. */
export function createPlaceExplorer({ timeline, getScene, archiveStage, stopPlayback, closeDrawer }) {
  const atlas = document.getElementById('atlas-view');
  const root = document.getElementById('place-page');
  const drawer = document.getElementById('drawer');
  const transition = document.getElementById('place-transition');
  const events = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let activeYear = null;
  let flight = null;
  let sequence = 0;
  let savedView = null;
  let savedScroll = 0;
  let savedFocus = null;
  let savedYear = timeline.get().year;
  let atlasURL = location.pathname + location.search;
  let changingState = false;
  const originalTitle = document.title;
  const page = createPlacePage(root, { onBack: () => leave(true), onNavigate: (id, year) => open(id, { year }) });

  function select(id, year) {
    changingState = true;
    if (year !== undefined) timeline.setYear(year);
    timeline.select(id);
    changingState = false;
  }
  async function open(id, { year = timeline.get().year, animate = true, push = true } = {}) {
    year = nearestStoryYear(id, year);
    if (year === null) return;
    const story = getPlaceStory(id, year);
    if (!story) return;
    if (active === id && activeYear === year) return;
    const token = ++sequence;
    flight?.abort();
    const wasReading = !root.hidden;
    if (!active) {
      savedScroll = window.scrollY;
      savedFocus = document.activeElement;
      savedYear = timeline.get().year;
      savedView = getScene()?.captureView();
      atlasURL = location.pathname + location.search + (parsePlaceRoute(location.hash) ? '' : location.hash);
    }
    active = id;
    activeYear = year;
    closeDrawer();
    stopPlayback();
    archiveStage.setHidden(true);
    select(id, year);
    if (push) history.pushState({ atlasPlace: id }, '', placeRoute(id, year));
    else if (location.hash !== placeRoute(id, year)) history.replaceState({ atlasPlace: id }, '', placeRoute(id, year));
    page.render(story, year);
    document.body.classList.add('is-exploring');
    drawer.inert = true;
    atlas.inert = true;
    if (animate && !motion.matches && !wasReading && getScene()) {
      const map = document.getElementById('map');
      map.scrollIntoView({ block: 'center', behavior: 'instant' });
      document.body.classList.add('is-place-entering');
      transition.hidden = false;
      document.getElementById('place-destination').textContent = story.name;
      document.getElementById('cancel-place').focus({ preventScroll: true });
      flight = new AbortController();
      await getScene().flyToLocation(id, { signal: flight.signal });
      if (token !== sequence) return;
    }
    if (token !== sequence) return;
    flight = null;
    transition.hidden = true;
    getScene()?.setPaused(true);
    atlas.hidden = true;
    root.hidden = false;
    document.body.classList.remove('is-place-entering');
    document.body.classList.add('is-place-open');
    document.title = story.name + ' — Black Atlas';
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('place-title').focus({ preventScroll: true });
  }
  function leave(push = false, returnYear = savedYear) {
    if (!active) return;
    ++sequence;
    flight?.abort();
    flight = null;
    const wasActive = active;
    active = null;
    activeYear = null;
    transition.hidden = true;
    root.hidden = true;
    atlas.hidden = false;
    atlas.inert = false;
    drawer.inert = false;
    document.body.classList.remove('is-place-entering', 'is-place-open');
    if (push) history.pushState(null, '', atlasURL);
    select(null, returnYear);
    const scene = getScene();
    scene?.restoreView(savedView);
    if (scene && !savedView) { scene.resize(); scene.reset(); }
    scene?.setPaused(false);
    // Layout and focus settle after the atlas becomes visible again.
    const token = sequence;
    requestAnimationFrame(() => {
      if (token !== sequence) return;
      window.scrollTo({ top: savedScroll, behavior: 'instant' });
      const focus = savedFocus?.isConnected && savedFocus !== document.body
        ? savedFocus : document.querySelector('.map-label[aria-label="Select ' + getPlaceStory(wasActive).name + '"]') ?? document.getElementById('location-picker');
      focus?.focus({ preventScroll: true });
    });
    archiveStage.setHidden(document.hidden);
    document.title = originalTitle;
  }
  function followURL() {
    const route = parsePlaceRoute(location.hash);
    if (route) open(route.id, { year: route.year, animate: false, push: false });
    else leave();
  }
  window.addEventListener('popstate', followURL, { signal: events.signal });
  window.addEventListener('hashchange', followURL, { signal: events.signal });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      leave(true);
    }
  }, { signal: events.signal });
  document.getElementById('cancel-place').addEventListener('click', () => leave(true), { signal: events.signal });
  // Changing the preference while flying finishes the same entry without motion.
  const finishMotion = () => { if (motion.matches) flight?.abort(); };
  motion.addEventListener('change', finishMotion);
  const unsubscribe = timeline.subscribe(({ selectedId, year }) => {
    if (changingState || !active) return;
    if (selectedId !== active || !getPlaceStory(active, year)) leave(true, year);
    else if (year !== activeYear) open(active, { year, animate: false });
  });
  followURL();
  return {
    open,
    get active() { return Boolean(active); },
    onSceneReady() {
      if (active) {
        getScene()?.setPaused(true);
      }
    },
    dispose() {
      ++sequence;
      flight?.abort();
      unsubscribe();
      events.abort();
      motion.removeEventListener('change', finishMotion);
      page.dispose();
    },
  };
}
