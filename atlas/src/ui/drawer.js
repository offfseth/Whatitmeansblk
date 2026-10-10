/** A hover preview becomes a modal when clicked or used with the keyboard. */
export function createDrawer({ drawer, handle, body, backdrop, page, onOpen }) {
  const events = new AbortController();
  const listen = (node, type, handler) =>
    node.addEventListener(type, handler, { signal: events.signal });
  let open = false;
  let pinned = false;
  let leaveTimer;
  let returnFocus;
  let scrollOverflow;

  function render() {
    drawer.classList.toggle("is-open", open);
    document.body.classList.toggle("drawer-open", open);
    handle.setAttribute("aria-expanded", String(open));
    body.inert = !open;
    page.inert = open;
    backdrop.hidden = !open;
    if (pinned) {
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
      drawer.setAttribute("aria-labelledby", "drawer-title");
    } else {
      drawer.removeAttribute("role");
      drawer.removeAttribute("aria-modal");
      drawer.removeAttribute("aria-labelledby");
    }
    onOpen?.(open);
  }

  function show(pin = false) {
    clearTimeout(leaveTimer);
    if (!open) {
      returnFocus = document.activeElement;
      scrollOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    open = true;
    pinned ||= pin;
    render();
    if (pin) body.querySelector("button, a, summary")?.focus({ preventScroll: true });
  }

  function close() {
    clearTimeout(leaveTimer);
    if (!open) return;
    const restore = drawer.contains(document.activeElement);
    open = pinned = false;
    render();
    document.body.style.overflow = scrollOverflow;
    if (restore) {
      const target = returnFocus?.isConnected && returnFocus !== document.body
        ? returnFocus : handle;
      target.focus({ preventScroll: true });
    }
  }

  listen(drawer, "pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    show();
  });
  listen(drawer, "pointerleave", () => {
    if (!pinned && !body.contains(document.activeElement))
      leaveTimer = setTimeout(close, 180);
  });
  listen(handle, "click", () => pinned ? close() : show(true));
  listen(body, "pointerdown", () => {
    pinned = true;
    render();
  });
  listen(body, "focusin", () => {
    if (!pinned) {
      pinned = true;
      render();
    }
  });
  listen(backdrop, "click", close);
  listen(body.querySelector("[data-close-drawer]"), "click", close);
  listen(document, "keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    } else if (event.key === "Tab") {
      const controls = [...drawer.querySelectorAll("button, a[href], summary, textarea, input")]
        .filter((node) => !node.disabled && node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  render();
  return {
    close,
    dispose() {
      close();
      clearTimeout(leaveTimer);
      events.abort();
    },
  };
}
