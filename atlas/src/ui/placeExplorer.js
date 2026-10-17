import { getPlaceStory, nearestStoryYear } from "../data/placeStories.js";
import { createPlacePage } from "./placePage.js";
import { parsePlaceRoute, placeRoute } from "../state/placeRoute.js";
import { getMilestoneStory } from '../data/milestoneStories.js';
import { milestoneRoute, parseMilestoneRoute, milestoneForPlace } from '../state/milestoneRoute.js';
import { mapCoverage } from '../state/mapCoverage.js';

/** Coordinates navigation and the finite camera move; prose never depends on WebGL. */
export function createPlaceExplorer({ timeline, getScene, archiveStage, stopPlayback, closeControls = () => {}, getScope = () => 'period', setScope = () => {} }) {
  const atlas = document.getElementById('atlas-view');
  const root = document.getElementById('place-page');
  const transition = document.getElementById('place-transition');
  const events = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let activeYear = null;
  let activeMilestone = null;
  let activeRoute = null;
  let flight = null;
  let sequence = 0;
  let savedView = null;
  let savedScroll = 0;
  let savedFocus = null;
  let savedYear = timeline.get().year;
  let savedScope = getScope();
  let atlasURL = location.pathname + location.search;
  let changingState = false;
  const originalTitle = document.title;
  const page = createPlacePage(root, {
    onBack: () => leave(true), onNavigate: (id, year) => open(id, { year }), onMilestone: openMilestone,
  });

  function select(id, year) {
    changingState = true;
    if (year !== undefined) timeline.setYear(year);
    timeline.select(id);
    changingState = false;
  }
  function open(id, { year = timeline.get().year, animate = true, push = true } = {}) {
    year = nearestStoryYear(id, year);
    if (year === null) return;
    const story = getPlaceStory(id, year);
    if (!story) return;
    return enter(story, { id, year, animate, push, route: placeRoute(id, year) });
  }
  function openMilestone(id, options = {}) {
    const story = getMilestoneStory(id, { year: timeline.get().year, scope: getScope(), ...options });
    if (!story) return;
    return enter(story, { id: story.placeId ?? '@broad', year: story.year, scope: story.scope,
      animate: options.animate ?? true, push: options.push ?? true, route: milestoneRoute(id, story) });
  }
  function openPlace(id) {
    const year = timeline.get().year;
    const entry = milestoneForPlace(id, year, getScope());
    if (entry) return openMilestone(entry.id, entry);
    const place = mapCoverage(year, getScope()).places.find(place => place.id === id);
    if (place?.stories.length) return open(id, { year });
  }
  async function enter(story, { id, year, animate, push, route, scope = getScope() }) {
    if (activeRoute === route) return;
    const token = ++sequence;
    flight?.abort();
    const wasReading = !root.hidden;
    if (!active) {
      savedScroll = window.scrollY;
      savedFocus = document.activeElement;
      savedYear = timeline.get().year;
      savedScope = getScope();
      savedView = getScene()?.captureView();
      atlasURL = location.pathname + location.search + (parsePlaceRoute(location.hash) || parseMilestoneRoute(location.hash) ? '' : location.hash);
    }
    active = id;
    activeYear = year;
    activeMilestone = story.kind === 'milestone' ? story.id : null;
    activeRoute = route;
    closeControls();
    stopPlayback();
    archiveStage.setHidden(true);
    if (push) history.pushState({ atlasPlace: id }, '', route);
    else if (location.hash !== route) history.replaceState({ atlasPlace: id }, '', route);
    setScope(scope);
    select(id, year);
    page.render(story, year);
    document.body.classList.add('is-exploring');
    atlas.inert = true;
    if (id !== '@broad' && animate && !motion.matches && !wasReading && getScene()) {
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
    document.title = (story.kind === 'milestone' ? story.title : story.name) + ' — Black Atlas';
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('place-title').focus({ preventScroll: true });
  }
  function leave(push = false, returnYear = savedYear) {
    if (!active) return;
    ++sequence;
    flight?.abort();
    flight = null;
    active = null;
    activeYear = null;
    activeMilestone = null;
    activeRoute = null;
    transition.hidden = true;
    root.hidden = true;
    atlas.hidden = false;
    atlas.inert = false;
    document.body.classList.remove('is-place-entering', 'is-place-open');
    if (push) history.pushState(null, '', atlasURL);
    setScope(savedScope);
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
        ? savedFocus : document.getElementById('location-picker');
      focus?.focus({ preventScroll: true });
    });
    archiveStage.setHidden(document.hidden);
    document.title = originalTitle;
  }
  function followURL() {
    const milestone = parseMilestoneRoute(location.hash);
    if (milestone) { openMilestone(milestone.id, { ...milestone, animate: false, push: false }); return; }
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
    if (activeMilestone) {
      if (selectedId !== active || year !== activeYear) leave(true, year);
      return;
    }
    if (selectedId !== active || !getPlaceStory(active, year)) leave(true, year);
    else if (year !== activeYear) open(active, { year, animate: false });
  });
  followURL();
  return {
    open,
    openPlace,
    openMilestone,
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
