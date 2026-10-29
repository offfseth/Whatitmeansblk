import './ui/milestones.css';
import { milestones, milestoneTopics } from './data/milestones.js';
import { sources, discoverySource } from './data/sources.js';
import { eras } from './data/eras.js';
import { mapPlaces as locations, mapPlaceById } from './data/mapPlaces.js';
import { filterMilestones, filtersFromSearch, searchFromFilters } from './state/milestoneFilters.js';
import { milestoneRoute } from './state/milestoneRoute.js';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const external = (url, label) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
const pageSize = 12;
let filters = filtersFromSearch(location.search);
let visibleCount = pageSize;
let matches = [];

for (const era of eras) $('milestone-era').add(new Option(`${era.span} · ${era.period}`, String(era.year)));
for (const topic of milestoneTopics) $('milestone-topic').add(new Option(topic, topic));
$('library-stats').textContent = `${milestones.length} milestones · ${Object.keys(sources).length} references · 1619–2022`;
$('source-count').textContent = `(${Object.keys(sources).length})`;
$('discovery-note').innerHTML = `${external(discoverySource.url, 'HISTORY’s Black History Milestones')} was a starting point for selecting topics. ${escape(discoverySource.use)}`;

function sourceMarkup(source) {
  return `<span class="source-publisher">${escape(source.publisher)}</span>${external(source.url, source.title)}<small>${escape(source.type)} · Accessed ${source.accessedAt}</small>`;
}
$('source-register').innerHTML = Object.values(sources).sort((a, b) => a.publisher.localeCompare(b.publisher) || a.title.localeCompare(b.title))
  .map(source => `<li>${sourceMarkup(source)}</li>`).join('');

function card(event) {
  const permalink = `./?year=${event.year}&scope=period${milestoneRoute(event.id)}`;
  const evidenceIds = [...new Set([...event.sourceIds, ...event.geography.connections.flatMap(connection => connection.sourceIds)])];
  const mapLinks = event.geography.connections.map(connection => `<a href="./?year=${connection.from}&amp;scope=year&amp;place=${connection.placeId}">${escape(mapPlaceById.get(connection.placeId).name)} · ${connection.from}${connection.to === connection.from ? '' : '–' + connection.to} ↗</a>`).join('');
  return `<article class="milestone" id="event-${event.id}" aria-labelledby="title-${event.id}">
    <div class="milestone-date"><span>${event.year}</span><p>${escape(event.date)}</p></div>
    <div class="milestone-body"><p class="milestone-location">${escape(event.location)}</p>
      <h2 id="title-${event.id}" tabindex="-1"><a href="${permalink}">${escape(event.title)}</a></h2>
      <p class="milestone-summary">${escape(event.summary)}</p><p class="milestone-context">${escape(event.context)}</p>
      <ul class="milestone-topics" aria-label="Themes">${event.topics.map(topic => `<li>${escape(topic)}</li>`).join('')}</ul>
      <p class="milestone-context">${escape(event.geography.note)}</p>
      <details class="milestone-sources"${filters.event ? ' open' : ''}><summary>Sources &amp; references (${evidenceIds.length})</summary>
        <p>Evidence for this entry’s date, summary, context, and place connections.</p><ol>${evidenceIds.map(id => `<li>${sourceMarkup(sources[id])}</li>`).join('')}</ol>
        <p class="editorial-note">Original Black Atlas summary · Reviewed ${event.reviewedAt} · ${event.images.length ? 'Credited archival photograph in the full story. No reproduced quotations.' : 'No reproduced images or quotations.'}</p>
      </details>
      <div class="milestone-actions">${mapLinks || `<a href="./?year=${event.year}&amp;scope=year&amp;place=%40broad">View ${event.year} on the map ↗</a>`}<a href="${escape(permalink)}" aria-label="Read the full story: ${escape(event.title)}">Read the full story ↗</a></div>
    </div></article>`;
}

function syncControls() {
  $('milestone-search').value = filters.query;
  $('milestone-era').value = filters.era;
  $('milestone-topic').value = filters.topic;
  $('milestone-order').value = filters.order === 'newest' ? 'newest' : 'oldest';
  // Invalid select values are treated as unrestricted, keeping URL and UI aligned.
  filters.era = $('milestone-era').value;
  filters.topic = $('milestone-topic').value;
  filters.order = $('milestone-order').value;
}

function updateCount() {
  $('milestone-count').textContent = `${matches.length} of ${milestones.length} milestones · ${Math.min(visibleCount, matches.length)} shown`;
  $('load-milestones').hidden = visibleCount >= matches.length;
}

function render({ writeURL = false } = {}) {
  matches = filterMilestones(milestones, filters);
  $('milestone-results').innerHTML = matches.slice(0, visibleCount).map(card).join('');
  $('milestone-empty').hidden = matches.length > 0;
  const context = filters.event ? 'Viewing a linked milestone. Clear filters to browse all.'
    : filters.place ? `Place: ${locations.find(place => place.id === filters.place)?.name ?? filters.place}. Clear filters to browse all places.` : '';
  $('filter-context').textContent = context;
  updateCount();
  document.title = filters.event && matches.length === 1 ? `${matches[0].title} — Black Atlas` : 'Historical milestones — Black Atlas';
  if (writeURL) history.replaceState(null, '', location.pathname + searchFromFilters(filters) + location.hash);
}

const form = $('milestone-filters');
function applyControls() {
  filters = { ...filters, query: $('milestone-search').value, era: $('milestone-era').value,
    topic: $('milestone-topic').value, order: $('milestone-order').value, event: '' };
  visibleCount = pageSize;
  render({ writeURL: true });
}
form.addEventListener('submit', event => { event.preventDefault(); applyControls(); });
form.addEventListener('input', applyControls);
form.addEventListener('reset', event => {
  event.preventDefault();
  filters = filtersFromSearch(''); visibleCount = pageSize;
  syncControls(); render({ writeURL: true });
  $('milestone-search').focus();
});
$('load-milestones').addEventListener('click', () => {
  const start = visibleCount;
  visibleCount += pageSize;
  $('milestone-results').insertAdjacentHTML('beforeend', matches.slice(start, visibleCount).map(card).join(''));
  updateCount();
  if (matches[start]) $(`title-${matches[start].id}`).focus({ preventScroll: true });
});
window.addEventListener('popstate', () => {
  filters = filtersFromSearch(location.search); visibleCount = pageSize;
  syncControls(); render();
});
syncControls(); render();
