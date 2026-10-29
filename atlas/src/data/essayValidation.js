// Structural safeguards; source interpretation still requires editorial review.
export function validateEssays({ essays, milestones, sources }) {
  const errors = [];
  const known = new Set(milestones.map(event => event.id));
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const evidence = (block, label) => {
    check(typeof block?.text === 'string' && Boolean(block.text.trim()), `${label}: missing text`);
    check(Array.isArray(block?.sourceIds) && block.sourceIds.length > 0 &&
      block.sourceIds.every(id => Object.hasOwn(sources, id)), `${label}: missing or unknown paragraph/date evidence`);
  };
  for (const id of Object.keys(essays)) check(known.has(id), `${id}: essay has no milestone`);
  for (const event of milestones) {
    const essay = essays[event.id];
    if (!essay) { errors.push(`${event.id}: missing in-depth essay`); continue; }
    check(/^\d{4}-\d{2}-\d{2}$/.test(essay.reviewedAt) && Number.isFinite(Date.parse(essay.reviewedAt)), `${event.id}: missing essay review date`);
    check(Array.isArray(essay.sections) && essay.sections.length >= 4, `${event.id}: incomplete essay sections`);
    const sectionIds = new Set(['overview', 'geography']);
    for (const section of essay.sections ?? []) {
      check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.id) && !sectionIds.has(section.id), `${event.id}: invalid or duplicate section ID`);
      sectionIds.add(section.id);
      check(typeof section.title === 'string' && section.title.trim(), `${event.id}/${section.id}: missing heading`);
      check(Array.isArray(section.paragraphs) && section.paragraphs.length > 0, `${event.id}/${section.id}: missing paragraphs`);
      for (const paragraph of section.paragraphs ?? []) evidence(paragraph, `${event.id}/${section.id}`);
    }
    check(Array.isArray(essay.timeline) && essay.timeline.length >= 3, `${event.id}: incomplete context timeline`);
    for (const moment of essay.timeline ?? []) {
      check(typeof moment.date === 'string' && moment.date.trim(), `${event.id}: missing timeline date label`);
      evidence(moment, `${event.id}/${moment.date}`);
    }
    evidence(essay.sourceNote, `${event.id}/source note`);
  }
  return errors;
}
