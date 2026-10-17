import { placeStories, nearestStoryYear, getPlaceStory } from '../data/placeStories.js';
import { milestoneRoute, parseMilestoneRoute } from '../state/milestoneRoute.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const external = (url, label) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">↗</span></a>`;
const coordinates = ([lon, lat]) => `${Math.abs(lat).toFixed(3)}° N / ${Math.abs(lon).toFixed(3)}° W`;
const milestoneLink = (entry, content, current = false) => `<a data-milestone href="${escape(milestoneRoute(entry.id, entry))}"${current ? ' aria-current="page"' : ''}>${content}</a>`;
const storyButton = story => `<button data-place="${escape(story.id)}" data-story-year="${story.year}"><small>${escape(story.period)}</small><span>${escape(story.label)}</span></button>`;

// One page template keeps the original city essays and the milestone reader aligned.
export function placePageMarkup(story, year) {
  const milestone = story.kind === 'milestone';
  const hero = story.images[0];
  const placeId = milestone ? story.placeId : story.id;
  const cite = indices => `<div class="place-citations">${indices.map(index => {
    const source = story.sources[index];
    return `<a class="place-citation" href="${escape(source[2])}" target="_blank" rel="noopener noreferrer">[${index + 1}] ${escape(source[0])} ↗</a>`;
  }).join('')}</div>`;
  const chapters = milestone
    ? `<nav class="place-chapters" aria-label="Milestones in this ${story.scope === 'year' ? 'year' : 'period'}"><span class="place-section-label">${story.scope === 'year' ? 'This year' : 'This historical period'} · ${escape(story.windowLabel)}</span>${story.chapters.map(chapter => milestoneLink(chapter, `<small>${escape(chapter.period)}</small><span>${escape(chapter.label)}</span>`, chapter.id === story.id)).join('')}</nav>`
    : `<nav class="place-chapters" aria-label="Stories from this place"><span class="place-section-label">This place through time</span>${story.chapters.map(chapter => `<button data-place="${escape(story.id)}" data-story-year="${chapter.from}" aria-current="${chapter.id === story.chapterId ? 'true' : 'false'}"><small>${escape(chapter.period)}</small><span>${escape(chapter.label)}</span></button>`).join('')}</nav>`;
  const image = (plate, eager = false) => `<img src="${escape(plate.src)}" alt="${escape(plate.caption)}" width="1600" height="1100" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high" ' : ''}style="object-position:${plate.focus?.[0] ?? 50}% ${plate.focus?.[1] ?? 50}%">`;
  const caption = plate => `<figcaption><span>${escape(plate.caption)}.</span><small>${escape(plate.credit)} · ${external(plate.source, 'Original record')}</small></figcaption>`;
  const geographicPlate = placeId
    ? `<img src="/places/${escape(placeId)}.svg" alt="Modern geographic reference point for ${escape(story.name)} on a map of the United States" width="460" height="520"><span class="place-map-coordinates">${coordinates(story.coordinates)}</span><figcaption><span>${escape(story.name)} · Geographic context</span><small>Modern boundaries · U.S. Census / U.S. Atlas. This reference point is not an exact event address. <a href="/data/milestone-map-method.md">Map method &amp; attribution ↗</a></small></figcaption>`
    : `<div class="place-scope-plate"><span class="place-section-label">Beyond one city</span><p>${escape(story.period)}</p><h2>${escape(story.name)}</h2><span>${escape(story.geographyNote)}</span></div>`;
  const related = milestone ? story.related.map(entry => milestoneLink(entry, `<small>${escape(entry.period)}</small><span>${escape(entry.title)} ↗</span>`)).join('')
    : placeStories.filter(place => place.id !== story.id)
      .map(place => { const entryYear = nearestStoryYear(place.id, year); return { ...getPlaceStory(place.id, entryYear), entryYear }; })
      .sort((a, b) => Math.abs(a.entryYear - year) - Math.abs(b.entryYear - year)).slice(0, 3)
      .map(place => `<button data-place="${escape(place.id)}" data-story-year="${place.entryYear}"><small>${escape(place.region)}</small><span>${escape(place.name)} ↗</span><p>${escape(place.period)} · ${escape(place.label)}</p></button>`).join('');
  const libraryURL = './milestones.html' + (placeId ? '?place=' + encodeURIComponent(placeId) : '');
  return `
    <header class="place-masthead"><button class="place-brand" data-atlas-back aria-label="Black Atlas — return to map">Black Atlas<span>.</span></button><span class="place-edition">A history in place</span><nav aria-label="On this page"><button data-story-section="place-story">The story</button><button data-story-section="place-archive">The archive</button><button data-story-section="place-sources">Sources</button></nav><button class="place-back" data-atlas-back><span aria-hidden="true">↖</span> Back to map</button></header>
    <article><section class="place-hero" aria-labelledby="place-title"><div class="place-hero-copy"><div class="place-breadcrumb">The atlas <span>/</span> ${escape(story.region)}</div><p class="place-location">${escape(story.name)}</p><span class="place-theme">${escape(story.theme)}</span><h1 id="place-title" tabindex="-1">${escape(story.title)}</h1><p class="place-dek">${escape(story.dek)}</p><div class="place-byline"><span>Black Atlas · ${milestone ? 'Historical milestones' : 'Place stories'}</span><span>${escape(story.period)}</span></div><button class="place-read" data-story-section="place-story">Explore the story <span aria-hidden="true">↓</span></button></div>
    <figure class="place-hero-image${hero ? '' : ' is-cartography'}">${hero ? image(hero, true) + caption(hero) : geographicPlate}</figure></section>
    <div class="place-reading"><aside class="place-index" aria-label="Story details"><span class="place-section-label">${placeId ? 'In this place' : 'Geographic reach'}</span><p>${escape(story.name)}</p><span class="place-index-region">${escape(story.region)}</span>${story.coordinates ? `<div class="place-coordinate-line">${coordinates(story.coordinates)}</div>` : ''}<span class="place-entry-year">Entered from the ${year} atlas.<br>${milestone ? 'Event dates' : 'Story coverage'}: ${escape(story.period)}.</span>${chapters}
    ${milestone && story.cityStories.length ? `<nav class="place-chapters" aria-label="Longer city stories"><span class="place-section-label">Read the city stories</span>${story.cityStories.map(storyButton).join('')}</nav>` : ''}
    ${milestone && story.connections.length > 1 ? `<nav class="place-chapters" aria-label="Places connected to this milestone"><span class="place-section-label">This event in other places</span>${story.connections.map(entry => milestoneLink(entry, `<span>${escape(entry.name)}</span><small>${escape(entry.role)}</small>`, entry.placeId === placeId)).join('')}</nav>` : ''}</aside>
    <div class="place-prose" id="place-story" tabindex="-1"><span class="place-section-label">The story</span>${story.sections.map(section => `<section><h2>${escape(section.title)}</h2>${section.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}${cite(section.sourceIndices ?? [section.source])}</section>`).join('')}
    ${milestone && story.coordinateNote ? `<details class="place-point-note"><summary>About this map point</summary><p>${escape(story.coordinateNote)}</p><a href="/data/milestone-map-method.md">Mapping method &amp; geographic sources ↗</a></details>` : ''}</div></div>
    <section class="place-dates" aria-labelledby="place-dates-title"><div><span class="place-section-label">${milestone ? 'Dates & context' : 'A few defining moments'}</span><h2 id="place-dates-title">History, in time.</h2></div><ol>${story.dates.map(([date, text], index) => `<li><span>${escape(date)}</span><div><p>${escape(text)}</p>${story.dateSources ? cite(story.dateSources[index]) : ''}</div></li>`).join('')}</ol></section>
    <section class="place-archive" id="place-archive" tabindex="-1" aria-labelledby="place-archive-title"><div class="place-section-heading"><div><span class="place-section-label">The archive</span><h2 id="place-archive-title">The visual record.</h2></div><p>${hero ? 'Look closer. Each image carries its own date, caption, and source.' : 'A space for the photographs, documents, and voices that carry this history.'}</p></div>${hero ? `<div class="place-gallery">${story.images.map(plate => `<figure>${image(plate)}${caption(plate)}<details class="place-image-rights"><summary>About this image</summary><p>${escape(plate.basis)}</p></details></figure>`).join('')}</div>` : `<div class="place-archive-empty"><span aria-hidden="true">↳</span><div><h3>This archive is still growing.</h3><p>${milestone ? 'No historical images or quotations have been reproduced for this milestone. Explore the linked source records below; archival material will be added after its reuse basis is documented.' : `Historical photographs for ${escape(story.name)} are still being gathered. Explore the source material below while this collection takes shape.`}</p></div></div>`}</section>
    <section class="place-sources" id="place-sources" tabindex="-1" aria-labelledby="place-sources-title"><span class="place-section-label">Keep reading</span><h2 id="place-sources-title">Follow the sources.</h2><ol>${story.sources.map(([publisher, title, url], index) => `<li><span class="place-source-number">${String(index + 1).padStart(2, '0')}</span><div><small>${escape(publisher)}</small>${external(url, title)}${story.sourceDetails ? `<small>${escape(story.sourceDetails[index].type)} · Accessed ${escape(story.sourceDetails[index].accessedAt)}</small>` : ''}</div></li>`).join('')}</ol><p class="place-source-note">${milestone ? `Original Black Atlas summary · Reviewed ${escape(story.reviewedAt)}. References support the historical account; a citation is not permission to reproduce source text or images.` : 'An introduction to this place, with more stories to come. Image credits appear beside each photograph.'}</p><p><a href="${escape(libraryURL)}">${placeId ? 'Explore all milestones connected to this place' : 'Explore the milestone collection'} ↗</a> · <a href="/data/content-policy.md">Sourcing &amp; reuse policy</a></p></section></article>
    <footer class="place-footer"><div class="place-section-heading"><div><span class="place-section-label">The story continues</span><h2>${milestone ? 'Keep exploring this history.' : 'Another place. Another chapter.'}</h2></div><button class="place-back" data-atlas-back>Return to the map <span aria-hidden="true">↗</span></button></div>${related ? `<div class="place-related">${related}</div>` : `<a class="place-library-link" href="${escape(libraryURL)}">Browse the milestone collection ↗</a>`}<div class="place-colophon"><span>Black Atlas.</span><span>A history in place.</span></div></footer>`;
}

export function createPlacePage(root, { onBack, onNavigate, onMilestone }) {
  const events = new AbortController();
  root.addEventListener('click', event => {
    if (event.target.closest('[data-atlas-back]')) onBack();
    const next = event.target.closest('[data-place]');
    if (next) onNavigate(next.dataset.place, Number(next.dataset.storyYear));
    const milestone = event.target.closest('[data-milestone]');
    if (milestone && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      const route = parseMilestoneRoute(milestone.hash);
      if (route) { event.preventDefault(); onMilestone(route.id, route); }
    }
    const section = event.target.closest('[data-story-section]');
    if (section) {
      const target = root.querySelector('#' + section.dataset.storySection);
      target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      target?.focus({ preventScroll: true });
    }
  }, { signal: events.signal });
  root.addEventListener('error', event => {
    if (event.target.tagName !== 'IMG') return;
    const figure = event.target.closest('figure');
    event.target.hidden = true;
    const notice = document.createElement('p');
    notice.className = 'place-image-error';
    notice.textContent = 'This image could not be loaded. Its caption and original source are below.';
    figure?.prepend(notice);
  }, { capture: true, signal: events.signal });
  return { render: (story, year) => { root.innerHTML = placePageMarkup(story, year); }, dispose: () => events.abort() };
}
