import test from "node:test";
import assert from "node:assert/strict";
import { createArchiveStage, DWELL_MS, FADE_MS } from "../src/ui/archiveStage.js";

// Small DOM fixture: these tests exercise navigation/timers without WebGL.
function setup(t, reduced = false) {
  const saved = new Map();
  function install(name, value) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  const motion = {
    matches: reduced,
    addEventListener(type, listener) { this.listener = listener; },
    removeEventListener() { this.listener = null; },
  };
  const root = {
    children: [],
    append(node) { this.children.push(node); node.isConnected = true; },
    replaceChildren() { this.children.forEach((node) => { node.isConnected = false; }); this.children = []; },
  };
  install("window", { matchMedia: () => motion });
  install("ResizeObserver", class { observe() {} disconnect() {} });
  install("cancelAnimationFrame", () => {});
  install("Image", class {
    isConnected = false;
    style = { setProperty() {} };
    classes = new Set();
    classList = { toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name) };
    remove() { root.children = root.children.filter((node) => node !== this); this.isConnected = false; }
  });
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  const shown = [];
  const stage = createArchiveStage(root, (plate, index, count) => shown.push({ src: plate.src, index, count }), { followCamera: false });
  t.after(() => {
    stage.dispose();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const plates = ["a", "b", "c"].map((src) => ({ src, focus: [50, 50] }));
  return { stage, shown, plates, root, motion, tick: (ms) => t.mock.timers.tick(ms) };
}

test("manual photographs wrap in both directions and report matching captions/counts", (t) => {
  const { stage, shown, plates } = setup(t);
  stage.setPlates(plates);
  stage.setPaused(true);
  stage.previous();
  assert.deepEqual(shown.at(-1), { src: "c", index: 2, count: 3 });
  stage.next();
  assert.deepEqual(shown.at(-1), { src: "a", index: 0, count: 3 });
  stage.next();
  assert.deepEqual(shown.at(-1), { src: "b", index: 1, count: 3 });
});

test("pause and drawer/tab hiding stop advances without resetting the current photo", (t) => {
  const { stage, shown, plates, tick } = setup(t);
  stage.setPlates(plates);
  tick(DWELL_MS);
  assert.equal(shown.at(-1).src, "b");
  stage.setHidden(true);
  tick(DWELL_MS * 3);
  assert.equal(shown.length, 2);
  stage.setPaused(true);
  stage.setHidden(false);
  tick(DWELL_MS * 2);
  assert.equal(shown.length, 2, "closing the drawer must preserve the reader's pause");
  stage.setPaused(false);
  tick(DWELL_MS);
  assert.equal(shown.at(-1).src, "c");
});

test("chapter changes reset the photograph, retire old images, and preserve pause", (t) => {
  const { stage, shown, plates, root, tick } = setup(t);
  stage.setPlates(plates);
  stage.next();
  stage.setPaused(true);
  stage.setPlates([{ src: "new-chapter" }]);
  tick(FADE_MS + 101);
  assert.deepEqual(root.children.map((node) => node.src), ["new-chapter"]);
  assert.deepEqual(shown.at(-1), { src: "new-chapter", index: 0, count: 1 });
  stage.setPlates(plates);
  tick(DWELL_MS * 2);
  assert.equal(shown.at(-1).src, "a");
});

test("reduced motion starts still but permits deliberate playback and manual navigation", (t) => {
  const { stage, shown, plates, motion, tick } = setup(t, true);
  stage.setPlates(plates);
  tick(DWELL_MS * 2);
  assert.equal(shown.length, 1);
  stage.next();
  assert.equal(shown.at(-1).src, "b");
  stage.setPaused(false);
  tick(DWELL_MS);
  assert.equal(shown.at(-1).src, "c");
  motion.listener();
  tick(DWELL_MS * 2);
  assert.equal(shown.at(-1).src, "c");
});
