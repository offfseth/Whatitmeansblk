import { sources } from '../data/sources.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dates = (from, to) => from === to ? String(from) : `${from}–${to}`;
const evidence = ids => [...new Set(ids)].map(id => {
  const source = sources[id];
  return `<li><small>${escape(source.publisher)}</small><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a></li>`;
}).join('');

export function createMapMilestones(root, { onClose, onStory, onYear }) {
  const controller = new AbortController();
  root.addEventListener('click', event => {
    if (event.target.closest('[data-close-map-place]')) onClose();
    const story = event.target.closest('[data-open-map-story]');
    if (story) onStory(story.dataset.openMapStory, Number(story.dataset.storyYear));
    const year = event.target.closest('[data-milestone-year]');
    if (year) onYear(Number(year.dataset.milestoneYear));
  }, { signal: controller.signal });
  let renderKey = '';
  function render(coverage, selectedId, scope) {
    const place = coverage.places.find(place => place.id === selectedId);
    const broad = selectedId === '@broad' && coverage.broad.length > 0;
    const key = `${selectedId}|${coverage.window.from}|${coverage.window.to}|${scope}`;
    root.hidden = !place && !broad;
    if (root.hidden) { renderKey = ''; return; }
    if (renderKey === key) return;
    renderKey = key;
    const entries = broad ? coverage.broad.map(event => ({ event })) : place.entries;
    root.innerHTML = `<div class="map-place-heading"><p>${broad ? 'Beyond one city' : escape(place.region)} · ${coverage.window.label}</p>
      <button type="button" data-close-map-place aria-label="Close place details">×</button>
      <h2 id="map-place-title" tabindex="-1">${broad ? 'Across regions & the nation' : escape(place.name)}</h2>
      <span>${entries.length} ${entries.length === 1 ? 'milestone' : 'milestones'}${place?.stories.length ? ` · ${place.stories.length} city ${place.stories.length === 1 ? 'story' : 'stories'}` : ''} in this ${scope === 'year' ? 'year' : 'period'}</span></div>
      <div class="map-place-body">${entries.map(({ event, connection }) => `<article class="map-event">
        <p class="map-event-date">${escape(event.date)}</p><h3>${escape(event.title)}</h3>
        ${connection ? `<p class="map-event-connection"><strong>Why here:</strong> ${escape(connection.role)}<br><small>Mapped for ${dates(connection.from, connection.to)}</small></p>` : ''}
        <p>${escape(event.summary)}</p><details><summary>Place context & sources</summary>
          <p>${escape(event.geography.note)}</p><ul>${evidence([...event.sourceIds, ...(connection?.sourceIds ?? [])])}</ul>
        </details><div class="map-event-actions"><a href="./milestones.html?event=${event.id}">Full entry & references ↗</a>
        ${scope !== 'year' ? `<button type="button" data-milestone-year="${connection?.from ?? event.year}">Show ${connection?.from ?? event.year} only</button>` : ''}</div></article>`).join('')}
      ${place?.stories.length ? `<section class="map-place-stories"><h3>Read the city stories</h3>${place.stories.map(story => `<button type="button" data-open-map-story="${place.id}" data-story-year="${Math.max(story.from, coverage.window.from)}"><small>${dates(story.from, story.to)}</small>${escape(story.label)} ↗</button>`).join('')}</section>` : ''}
      ${place ? `<details class="map-point-note"><summary>About this map point</summary><p>${escape(place.coordinateNote)}</p>${place.coordinateSourceIds.length ? `<ul>${evidence(place.coordinateSourceIds)}</ul>` : '<a href="/data/history-attribution.md" target="_blank" rel="noopener">Map method & sources ↗</a>'}</details>` : ''}
      <a class="map-all-events" href="./milestones.html${place ? '?place=' + place.id : ''}">Browse ${place ? 'all milestones for this place' : 'the milestone collection'} ↗</a></div>`;
    root.scrollTop = 0;
  }
  return { render, focus() { root.querySelector('h2')?.focus({ preventScroll: true }); }, dispose() { controller.abort(); } };
}
