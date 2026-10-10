import { placeStories, nearestStoryYear, getPlaceStory } from "../data/placeStories.js";

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const external = (url, label) => '<a href="' + escape(url) + '" target="_blank" rel="noreferrer">' + escape(label) + ' <span aria-hidden="true">↗</span></a>';
const coordinates = ([lon, lat]) => Math.abs(lat).toFixed(3) + '° N / ' + Math.abs(lon).toFixed(3) + '° W';

export function createPlacePage(root, { onBack, onNavigate }) {
  const events = new AbortController();
  root.addEventListener("click", (event) => {
    const back = event.target.closest("[data-atlas-back]");
    if (back) onBack();
    const next = event.target.closest("[data-place]");
    if (next) onNavigate(next.dataset.place, Number(next.dataset.storyYear));
    const section = event.target.closest("[data-story-section]");
    if (section) {
      const target = root.querySelector('#' + section.dataset.storySection);
      target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      target?.focus({ preventScroll: true });
    }
  }, { signal: events.signal });
  root.addEventListener("error", (event) => {
    if (event.target.tagName !== "IMG") return;
    const figure = event.target.closest("figure");
    event.target.hidden = true;
    const notice = document.createElement("p");
    notice.className = "place-image-error";
    notice.textContent = "This image could not be loaded. Its caption and original source are below.";
    figure?.prepend(notice);
  }, { capture: true, signal: events.signal });

  function render(story, year) {
    const hero = story.images[0];
    const related = placeStories.filter(place => place.id !== story.id)
      .map(place => { const nextYear = nearestStoryYear(place.id, year); return { ...getPlaceStory(place.id, nextYear), entryYear: nextYear }; })
      .sort((a, b) => Math.abs(a.entryYear-year) - Math.abs(b.entryYear-year)).slice(0, 3);
    const chapters = '<nav class="place-chapters" aria-label="Stories from this place"><span class="place-section-label">This place through time</span>' + story.chapters.map(chapter =>
      '<button data-place="' + escape(story.id) + '" data-story-year="' + chapter.from + '" aria-current="' + (chapter.id === story.chapterId ? 'true' : 'false') + '"><small>' + chapter.period + '</small><span>' + escape(chapter.label) + '</span></button>').join('') + '</nav>';
    const image = (plate, eager = false) => '<img src="' + escape(plate.src) + '" alt="' + escape(plate.caption) + '" width="1600" height="1100" loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async" ' + (eager ? 'fetchpriority="high" ' : '') + 'style="object-position:' + (plate.focus?.[0] ?? 50) + '% ' + (plate.focus?.[1] ?? 50) + '%">';
    const caption = (plate) => '<figcaption><span>' + escape(plate.caption) + '.</span><small>' + escape(plate.credit) + ' · ' + external(plate.source, 'Original record') + '</small></figcaption>';
    root.innerHTML = 
      '<header class="place-masthead"><button class="place-brand" data-atlas-back aria-label="Black Atlas — return to map">Black Atlas<span>.</span></button><span class="place-edition">A history in place</span><nav aria-label="On this page"><button data-story-section="place-story">The story</button><button data-story-section="place-archive">The archive</button><button data-story-section="place-sources">Sources</button></nav><button class="place-back" data-atlas-back><span aria-hidden="true">↖</span> Back to atlas</button></header>' +
      '<article><section class="place-hero" aria-labelledby="place-title"><div class="place-hero-copy"><div class="place-breadcrumb">The atlas <span>/</span> ' + escape(story.region) + '</div><p class="place-location">' + escape(story.name) + '</p><span class="place-theme">' + escape(story.theme) + '</span><h1 id="place-title" tabindex="-1">' + escape(story.title) + '</h1><p class="place-dek">' + escape(story.dek) + '</p><div class="place-byline"><span>Black Atlas · Place stories</span><span>' + escape(story.period) + '</span></div><button class="place-read" data-story-section="place-story">Explore the story <span aria-hidden="true">↓</span></button></div>' +
      '<figure class="place-hero-image' + (hero ? '' : ' is-cartography') + '">' + (hero ? image(hero, true) + caption(hero) : '<img src="/places/' + escape(story.id) + '.svg" alt="Modern geographic location of ' + escape(story.name) + ' marked on a map of the United States" width="460" height="520"><span class="place-map-coordinates">' + coordinates(story.coordinates) + '</span><figcaption><span>' + escape(story.name) + ' · Geographic context</span><small>Modern boundaries · U.S. Census / U.S. Atlas. Historical photographs are still being gathered.</small></figcaption>') + '</figure></section>' +
      '<div class="place-reading"><aside class="place-index" aria-label="Story details"><span class="place-section-label">In this place</span><p>' + escape(story.name) + '</p><span class="place-index-region">' + escape(story.region) + '</span><div class="place-coordinate-line">' + coordinates(story.coordinates) + '</div><span class="place-entry-year">Entered from the ' + year + ' atlas.<br>Story coverage: ' + escape(story.period) + '.</span>' + chapters + '</aside>' +
      '<div class="place-prose" id="place-story" tabindex="-1"><span class="place-section-label">01 / The story</span>' + story.sections.map((section) => '<section><h2>' + escape(section.title) + '</h2>' + section.paragraphs.map((paragraph) => '<p>' + escape(paragraph) + '</p>').join('') + '<a class="place-citation" href="' + escape(story.sources[section.source][2]) + '" target="_blank" rel="noreferrer">Source: ' + escape(story.sources[section.source][0]) + ' ↗</a></section>').join('') + '</div></div>' +
      '<section class="place-dates" aria-labelledby="place-dates-title"><div><span class="place-section-label">A few defining moments</span><h2 id="place-dates-title">History, in time.</h2></div><ol>' + story.dates.map(([date, text]) => '<li><span>' + escape(date) + '</span><p>' + escape(text) + '</p></li>').join('') + '</ol></section>' +
      '<section class="place-archive" id="place-archive" tabindex="-1" aria-labelledby="place-archive-title"><div class="place-section-heading"><div><span class="place-section-label">02 / The archive</span><h2 id="place-archive-title">The visual record.</h2></div><p>' + (hero ? 'Look closer. Each image carries its own date, caption, and source.' : 'A space for the photographs, documents, and voices that carry this history.') + '</p></div>' + (hero ? '<div class="place-gallery">' + story.images.map((plate) => '<figure>' + image(plate) + caption(plate) + '<details class="place-image-rights"><summary>About this image</summary><p>' + escape(plate.basis) + '</p></details></figure>').join('') + '</div>' : '<div class="place-archive-empty"><span aria-hidden="true">↳</span><div><h3>This archive is still growing.</h3><p>Historical photographs for ' + escape(story.name) + ' are still being gathered. Explore the source material below while this collection takes shape.</p></div></div>') + '</section>' +
      '<section class="place-sources" id="place-sources" tabindex="-1" aria-labelledby="place-sources-title"><span class="place-section-label">03 / Keep reading</span><h2 id="place-sources-title">Follow the sources.</h2><ol>' + story.sources.map(([publisher, title, url], i) => '<li><span class="place-source-number">' + String(i + 1).padStart(2, '0') + '</span><div><small>' + escape(publisher) + '</small>' + external(url, title) + '</div></li>').join('') + '</ol><p class="place-source-note">An introduction to this place, with more stories to come. Image credits appear beside each photograph.</p></section></article>' +
      '<footer class="place-footer"><div class="place-section-heading"><div><span class="place-section-label">The story continues</span><h2>Another place. Another chapter.</h2></div><button class="place-back" data-atlas-back>Return to the map <span aria-hidden="true">↗</span></button></div><div class="place-related">' + related.map((place) => '<button data-place="' + escape(place.id) + '" data-story-year="' + place.entryYear + '"><small>' + escape(place.region) + '</small><span>' + escape(place.name) + ' <span aria-hidden="true">↗</span></span><p>' + escape(place.period) + ' · ' + escape(place.label) + '</p></button>').join('') + '</div><div class="place-colophon"><span>Black Atlas.</span><span>A history in place.</span></div></footer>';
  }
  return { render, dispose: () => events.abort() };
}
