export const PHOTO_DWELL_MS = 8000;

// One clock keeps the header, archive frame and their credits in step.
export function createPhotoRotation(count, onChange, {
  paused = false, hidden = false, setTimer = setTimeout, clearTimer = clearTimeout,
} = {}) {
  let index = 0, timer, disposed = false;
  function update() {
    clearTimer(timer);
    if (disposed) return;
    onChange({ index, paused });
    if (!paused && !hidden && count > 1) timer = setTimer(() => {
      index = (index + 1) % count;
      update();
    }, PHOTO_DWELL_MS);
  }
  update();
  return {
    move(delta) { if (disposed || !count) return; index = (index + delta + count) % count; paused = true; update(); },
    setPaused(value) { paused = value; update(); },
    toggle() { paused = !paused; update(); },
    setHidden(value) { hidden = value; update(); },
    dispose() { disposed = true; clearTimer(timer); },
  };
}

export function mountPhotoRotation(root, count) {
  if (count < 2 || !root.querySelector('[data-photo-hero]')) return null;
  const events = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pageHidden = root.hidden;
  const rotation = createPhotoRotation(count, ({ index, paused }) => {
    root.querySelectorAll('[data-photo-hero]').forEach((img, i) => {
      img.classList.toggle('is-current', i === index);
      img.setAttribute('aria-hidden', String(i !== index));
    });
    for (const selector of ['[data-photo-caption]', '[data-photo-slide]']) {
      root.querySelectorAll(selector).forEach((node, i) => { node.hidden = i !== index; });
    }
    root.querySelectorAll('[data-photo-count]').forEach(node => { node.textContent = `${index + 1} / ${count}`; });
    root.querySelectorAll('[data-photo-action="toggle"]').forEach(button => {
      button.textContent = paused ? 'Play slideshow' : 'Pause slideshow';
    });
  }, { paused: motion.matches, hidden: pageHidden || document.hidden });
  const options = { signal: events.signal };
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-photo-action]')?.dataset.photoAction;
    if (action === 'toggle') rotation.toggle();
    if (action === 'previous') rotation.move(-1);
    if (action === 'next') rotation.move(1);
  }, options);
  // Stop before a focused caption/link could be replaced. Play explicitly resumes.
  root.addEventListener('focusin', event => {
    if (event.target.closest('[data-photo-action="toggle"]')) return;
    if (event.target.closest('.place-photo-controls, .place-hero-image, .place-gallery')) rotation.setPaused(true);
  }, options);
  document.addEventListener('visibilitychange', () => rotation.setHidden(pageHidden || document.hidden), options);
  motion.addEventListener('change', () => { if (motion.matches) rotation.setPaused(true); }, options);
  return {
    pause: () => rotation.setPaused(true),
    setHidden(value) { pageHidden = value; rotation.setHidden(value || document.hidden); },
    dispose() { events.abort(); rotation.dispose(); },
  };
}
