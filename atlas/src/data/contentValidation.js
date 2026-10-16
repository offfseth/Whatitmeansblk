/** Structural publication checks; factual and rights review still requires people. */
export function validateContent({ milestones, sources, eras, locations, archive }) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const https = url => { try { return new URL(url).protocol === 'https:'; } catch { return false; } };
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
  const ids = new Set();
  const placeIds = new Set(locations.map(place => place.id));
  for (const [id, source] of Object.entries(sources)) {
    check(source.id === id && Boolean(source.publisher && source.title && source.type), `Source ${id}: missing bibliographic metadata`);
    check(https(source.url), `Source ${id}: an HTTPS evidence link is required`);
    check(date(source.accessedAt), `Source ${id}: missing access date`);
  }
  for (const event of milestones) {
    check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.id) && !ids.has(event.id), `Milestone ${event.id}: invalid or duplicate ID`);
    ids.add(event.id);
    check(Number.isInteger(event.year) && Number.isInteger(event.endYear) && event.year >= 1619 && event.endYear >= event.year, `${event.id}: invalid year range`);
    check(Boolean(event.date && event.title && event.location && event.summary && event.context && event.topics?.length), `${event.id}: incomplete editorial record`);
    check(event.sourceIds?.length > 0 && event.sourceIds.every(id => Object.hasOwn(sources, id)), `${event.id}: missing or unknown evidence source`);
    check(date(event.reviewedAt), `${event.id}: missing review date`);
    check(event.placeIds?.every(id => placeIds.has(id)), `${event.id}: unknown map place`);
    check(event.textRights === 'original-summary', `${event.id}: text must be an original summary`);
    // The current milestone renderer is text-only. Do not silently accept assets
    // or quotes that bypass its evidence/credit UI; extend the contract first.
    check(Array.isArray(event.images) && event.images.length === 0, `${event.id}: milestone media requires a reviewed rendering/rights workflow`);
    check(Array.isArray(event.quotations) && event.quotations.length === 0, `${event.id}: quotations require a reviewed rendering/rights workflow`);
  }
  for (const era of eras) check(era.sourceIds?.length > 0 && era.sourceIds.every(id => Object.hasOwn(sources, id)), `Chapter ${era.year}: missing or unknown sources`);
  for (const plate of archive) {
    check(plate.rights === 'cleared' && Boolean(plate.basis?.trim()), `${plate.src}: uncleared image or missing reuse basis`);
    check(plate.placeholder || (https(plate.source) && Boolean(plate.credit && plate.caption)), `${plate.src}: missing item source or credit`);
  }
  return errors;
}
