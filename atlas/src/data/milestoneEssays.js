import { earlyEssays, earlySources } from './essays/early.js';
import { middleEssays, middleSources } from './essays/middle.js';
import { laterEssays, laterSources } from './essays/later.js';

// Long-form accounts retain paragraph-level evidence, independently of the
// short discovery cards. These modules contain original text, not quotations.
export const milestoneEssays = { ...earlyEssays, ...middleEssays, ...laterEssays };
export const essaySources = { ...earlySources, ...middleSources, ...laterSources };

export function essaySourceIds(essay) {
  if (!essay) return [];
  return [...new Set([
    ...essay.sections.flatMap(section => section.paragraphs.flatMap(paragraph => paragraph.sourceIds)),
    ...essay.timeline.flatMap(moment => moment.sourceIds),
    ...essay.sourceNote.sourceIds,
  ])];
}
