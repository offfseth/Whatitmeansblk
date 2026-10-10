/** A finite camera move. Cancellation and backgrounding always settle its promise. */
export function animateFlight({ duration = 1500, signal, update, request = requestAnimationFrame, cancel = cancelAnimationFrame, now = () => performance.now(), visibility = document }) {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let frame = 0;
    let done = false;
    const started = now();
    function finish(completed) {
      if (done) return;
      done = true;
      cancel(frame);
      signal?.removeEventListener("abort", abort);
      visibility.removeEventListener("visibilitychange", hidden);
      if (completed) update(1);
      resolve(completed);
    }
    const abort = () => finish(false);
    const hidden = () => { if (visibility.hidden) finish(true); };
    function tick(time) {
      const t = Math.min(1, Math.max(0, (time - started) / duration));
      // Smooth acceleration, then a gentle landing; no continuing idle loop.
      update(t * t * (3 - 2 * t));
      if (t >= 1) finish(true);
      else frame = request(tick);
    }
    signal?.addEventListener("abort", abort, { once: true });
    visibility.addEventListener("visibilitychange", hidden);
    if (duration <= 0 || visibility.hidden) finish(true);
    else frame = request(tick);
  });
}
