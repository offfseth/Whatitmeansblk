import { storyMoments, adjacentStoryYear } from '../state/storyMoments.js';

export function createStoryNavigator(root, locations, onYear) {
  const moments = storyMoments(locations);
  const navigation = document.createElement('div');
  navigation.className = 'story-steps';
  navigation.setAttribute('aria-label', 'Jump between city story start years');
  const buttons = [-1, 1].map(direction => {
    const button = document.createElement('button');
    button.type = 'button';
    button.onclick = () => onYear(Number(button.dataset.year));
    navigation.append(button);
    return { button, direction };
  });
  const details = document.createElement('details');
  details.className = 'story-browse';
  const summary = document.createElement('summary');
  summary.textContent = 'Browse city stories · ' + moments.length;
  const note = document.createElement('p');
  note.textContent = 'Choose a story to see its year on the map. Dates describe our story coverage, not when a city began or ended.';
  const list = document.createElement('ol');
  const entries = moments.map(moment => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    const date = document.createElement('span');
    date.textContent = moment.from === moment.to ? String(moment.from) : `${moment.from}–${moment.to}`;
    const title = document.createElement('strong');
    title.textContent = moment.name;
    const label = document.createElement('span');
    label.textContent = moment.label;
    button.append(date, title, label);
    button.onclick = () => onYear(moment.from);
    item.append(button);
    list.append(item);
    return { button, moment };
  });
  details.append(summary, note, list);
  root.append(navigation, details);
  return {
    update(year) {
      for (const { button, direction } of buttons) {
        const next = adjacentStoryYear(moments, year, direction);
        button.disabled = next === null;
        button.dataset.year = next ?? '';
        button.textContent = (direction < 0 ? '← Previous' : 'Next →') + (next === null ? '' : ` · ${next}`);
        button.setAttribute('aria-label', `${direction < 0 ? 'Previous' : 'Next'} city story start year${next === null ? '' : ', ' + next}`);
      }
      for (const { button, moment } of entries) {
        button.setAttribute('aria-pressed', String(year >= moment.from && year <= moment.to));
      }
    },
  };
}
