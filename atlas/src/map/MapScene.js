import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { animateFlight } from "./cameraFlight.js";
import { historicalSnapshot, mapCategories } from "../data/historicalMap.js";

const PROJ_W = 975,
  PROJ_H = 610,
  UNIT = 20; // projection units per world unit
const SEA_SPAN = 2.4; // sea sheet covers this multiple of the projection box
// The land sits only just proud of the water. A tall plate reads as a cut-out
// pasted onto a sea however its edge is shaded, so the height difference itself
// has to stay small; relief and shading carry the dimension instead.
const LAND_TOP = 0.15,
  SEA_Y = -0.05;
/** The coast descends instead of being cut off: each step moves out from the
 * shoreline, drops a little, and shifts colour from the land's own tone at the
 * water's edge through wet shelf to the dark of the basin. `tint` multiplies
 * the terrain texture, so every coast keeps its local colour at the top. */
const COAST_PROFILE = [
  { out: 0, y: LAND_TOP, tint: [1, 1, 1] },
  { out: 0.06, y: 0.135, tint: [0.96, 0.94, 0.89] }, // near flat, meets the land
  { out: 0.18, y: 0.04, tint: [0.72, 0.73, 0.67] }, // foreshore
  { out: 0.3, y: -0.06, tint: [0.52, 0.6, 0.59] }, // the waterline
  { out: 0.4, y: -0.26, tint: [0.3, 0.42, 0.45] }, // shelf break, under water
];

/** Owns WebGL only. Data, dates and event content stay outside this class.
 * The canvas is transparent, but the sea sheet it draws is not: anything put
 * behind the canvas in the DOM is hidden by the water, which is why the
 * period slideshow in src/ui/archiveStage.js paints in front of it instead. */
export class MapScene {
  constructor(container, data, locations, onSelect, onError, onCamera) {
    this.container = container;
    this.data = data;
    this.locations = locations;
    this.onSelect = onSelect;
    // Told where the camera is looking, once per rendered frame, so layers
    // outside WebGL (the period band) can follow it.
    this.onCamera = onCamera;
    this.frame = 0;
    this.framesRendered = 0;
    this.disposed = false;
    this.markers = [];
    this.cleanups = [];
    this.textures = [];
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 260);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive United States map. Drag to orbit, right-drag to pan, scroll to zoom. Location buttons are available beside the map.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    container.prepend(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // No damping, auto-rotation or continuous animation loop: idle means zero renders.
    this.controls.enableDamping = false;
    // Limits are set so the sea sheet always fills the frame: tilting further
    // over, turning further round or pulling further back would all bring its
    // edge, or the empty space past it, into view. maxDistance is recomputed
    // per aspect ratio in resize().
    this.controls.minPolarAngle = 0.12;
    this.controls.maxPolarAngle = 0.82;
    this.controls.minAzimuthAngle = -0.5;
    this.controls.maxAzimuthAngle = 0.5;
    this.controls.minDistance = 22;
    this.controls.maxDistance = 90;
    this.controls.maxTargetRadius = 6.5;
    this.controls.screenSpacePanning = false;
    this.controls.zoomSpeed = 0.8;
    this.controls.rotateSpeed = 0.55;
    this.controls.addEventListener("change", () => this.invalidate("controls"));

    // Warm key light from the north-west, matching the direction baked into the
    // relief, with a cool fill opposite it so far slopes keep their shape.
    this.scene.add(new THREE.HemisphereLight("#cfe1e8", "#4a3a2b", 1.5));
    const sun = new THREE.DirectionalLight("#ffe7c0", 2.15);
    sun.position.set(-25, 40, -20);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight("#6d8e99", 0.5);
    fill.position.set(30, 14, 28);
    this.scene.add(fill);

    this.buildSea();
    this.buildLand();
    this.buildMarkers();
    this.addMapLabels();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    const listen = (target, type, fn, options) => {
      target.addEventListener(type, fn, options);
      this.cleanups.push(() => target.removeEventListener(type, fn, options));
    };
    let down = null;
    listen(this.renderer.domElement, "pointerdown", (e) => {
      down = { x: e.clientX, y: e.clientY, time: performance.now() };
    });
    listen(this.renderer.domElement, "pointerup", (e) => {
      if (
        !down ||
        Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 ||
        performance.now() - down.time > 600
      )
        return;
      down = null;
      const rect = this.renderer.domElement.getBoundingClientRect();
      const cursor = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(cursor, this.camera);
      const hit = ray.intersectObjects(
        this.markers.filter((m) => m.mesh.visible).map((m) => m.mesh),
        false,
      )[0];
      if (hit) onSelect(hit.object.userData.id);
    });
    listen(this.renderer.domElement, "pointercancel", () => {
      down = null;
    });
    listen(this.renderer.domElement, "webglcontextlost", (e) => {
      e.preventDefault();
      onError(
        "The graphics connection was interrupted. Reload to restore the map.",
      );
    });
    listen(document, "visibilitychange", () => {
      if (document.hidden && this.frame) {
        cancelAnimationFrame(this.frame);
        this.frame = 0;
      } else if (!document.hidden) this.invalidate();
    });
    this.resize();
    this.reset();
  }
  load(file, options = {}) {
    const texture = new THREE.TextureLoader().load(
      file,
      () => this.invalidate(),
      undefined,
      () => this.container.dispatchEvent(new CustomEvent("asseterror")),
    );
    // Colour maps are sRGB; normals and the roughness pack are plain data.
    if (options.srgb) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(
      4,
      this.renderer.capabilities.getMaxAnisotropy(),
    );
    this.textures.push(texture);
    return texture;
  }
  buildSea() {
    const water = this.load("/data/sea.webp", { srgb: true });
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(
        (PROJ_W / UNIT) * SEA_SPAN,
        (PROJ_H / UNIT) * SEA_SPAN,
      ),
      // Same lighting model as the land, so the two surfaces stay in the same
      // exposure. Low roughness is what makes the water read as water: it keeps
      // a soft sheen where the land goes matte.
      new THREE.MeshStandardMaterial({
        map: water,
        transparent: true,
        roughness: 0.34,
        metalness: 0,
      }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = SEA_Y;
    this.scene.add(sea);
  }
  buildLand() {
    const topParts = [],
      ranges = [];
    let offset = 0;
    for (const state of this.data.states.features) {
      const polygons =
        state.geometry.type === "MultiPolygon"
          ? state.geometry.coordinates
          : [state.geometry.coordinates];
      for (const polygon of polygons) {
        const toPoints = (ring) =>
          ring.map(
            ([x, y]) =>
              new THREE.Vector2((x - PROJ_W / 2 - 0) / UNIT, (305 - y) / UNIT),
          );
        const shape = new THREE.Shape(toPoints(polygon[0]));
        for (const hole of polygon.slice(1))
          shape.holes.push(new THREE.Path(toPoints(hole)));
        const source = new THREE.ShapeGeometry(shape);
        const geom = source.toNonIndexed();
        source.dispose();
        const pos = geom.getAttribute("position"),
          uv = geom.getAttribute("uv");
        for (let i = 0; i < pos.count; i++)
          uv.setXY(
            i,
            (pos.getX(i) * UNIT + PROJ_W / 2) / PROJ_W,
            (pos.getY(i) * UNIT + 305) / PROJ_H,
          );
        geom.rotateX(-Math.PI / 2);
        geom.translate(0, LAND_TOP, 0);
        ranges.push({ id: state.id, start: offset, count: pos.count });
        offset += pos.count;
        topParts.push(geom);
      }
    }
    this.ranges = ranges;
    const top = mergeGeometries(topParts);
    topParts.forEach((g) => g.dispose());
    const colors = new Float32Array(
      top.getAttribute("position").count * 3,
    ).fill(1);
    top.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage),
    );
    top.setAttribute(
      "emphasis",
      new THREE.BufferAttribute(
        new Float32Array(colors.length / 3),
        1,
      ).setUsage(THREE.DynamicDrawUsage),
    );
    this.terrain = this.load("/data/terrain.webp", { srgb: true });
    this.normals = this.load("/data/normals.webp");
    this.surface = this.load("/data/surface.webp");
    this.topMaterial = new THREE.MeshStandardMaterial({
      map: this.terrain,
      normalMap: this.normals,
      normalScale: new THREE.Vector2(1.15, 1.15),
      // Green channel drives roughness and blue drives metalness, so rivers and
      // lakes painted into the surface map catch the sun the way water does.
      roughnessMap: this.surface,
      metalnessMap: this.surface,
      roughness: 1,
      metalness: 1,
      vertexColors: true,
    });
    // Tint the illustrative layer by the land's own brightness so the era
    // highlight colours the terrain instead of painting over it.
    this.topMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "attribute float emphasis; varying float vEmphasis;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n vEmphasis = emphasis;",
      );
      shader.fragmentShader =
        "varying float vEmphasis;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        "float eLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));\n" +
          " diffuseColor.rgb = mix(diffuseColor.rgb, vColor * (0.42 + eLum * 1.3), vEmphasis);",
      );
    };
    this.land = new THREE.Mesh(top, this.topMaterial);
    this.scene.add(this.land);
    this.buildCoast();
    const lines = [];
    this.border = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(lines, 3),
      ),
      new THREE.LineBasicMaterial({
        color: "#f6e6c8",
        transparent: true,
        opacity: 0.3,
      }),
    );
    this.scene.add(this.border);
  }
  /** A continental slope around every shoreline, lake shores included, so the
   * land descends into the water instead of ending in a cut-out wall. */
  buildCoast() {
    const rows = COAST_PROFILE.length;
    const positions = [],
      normals = [],
      uvs = [],
      colors = [],
      indices = [];
    // Outward-and-upward facing normal of each profile segment, expressed as
    // (horizontal, vertical) in the plane that contains the outward direction.
    const slope = [];
    for (let r = 0; r < rows - 1; r++) {
      const dOut = COAST_PROFILE[r + 1].out - COAST_PROFILE[r].out,
        dY = COAST_PROFILE[r + 1].y - COAST_PROFILE[r].y,
        length = Math.hypot(dOut, dY) || 1;
      slope.push([-dY / length, dOut / length]);
    }
    for (const polygon of this.data.outline.coordinates)
      for (let ringIndex = 0; ringIndex < polygon.length; ringIndex++) {
        // Rings arrive closed; the repeated last point would make a degenerate
        // quad and a broken normal.
        const points = polygon[ringIndex]
          .slice(0, -1)
          .map(([px, py]) => [(px - PROJ_W / 2) / UNIT, (py - 305) / UNIT]);
        const n = points.length;
        if (n < 3) continue;
        let area = 0;
        for (let i = 0; i < n; i++) {
          const a = points[i],
            b = points[(i + 1) % n];
          area += a[0] * b[1] - b[0] * a[1];
        }
        // Ring zero is the shoreline and slopes away from the land; the rest
        // are lakes and have to slope the other way, into the water.
        const facing = (Math.sign(area) || 1) * (ringIndex === 0 ? 1 : -1);
        const outward = points.map((_, i) => {
          let x = 0,
            z = 0;
          for (const [a, b] of [
            [points[(i - 1 + n) % n], points[i]],
            [points[i], points[(i + 1) % n]],
          ]) {
            const dx = b[0] - a[0],
              dz = b[1] - a[1],
              length = Math.hypot(dx, dz);
            if (!length) continue;
            x += (dz / length) * facing;
            z += (-dx / length) * facing;
          }
          const length = Math.hypot(x, z);
          return length ? [x / length, z / length] : [0, 0];
        });
        // An island or lake narrower than the shelf cannot carry a full-width
        // one: the slope would fold back through itself and read as a dark
        // blob. Scale the shelf, and its drop, to the size of the ring.
        let minX = Infinity,
          maxX = -Infinity,
          minZ = Infinity,
          maxZ = -Infinity;
        for (const [x, z] of points) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
        }
        const spread = THREE.MathUtils.clamp(
          Math.max(maxX - minX, maxZ - minZ) / 2.6,
          0.1,
          1,
        );
        const sink = 0.4 + 0.6 * spread;
        const base = positions.length / 3;
        for (let r = 0; r < rows; r++) {
          const step = COAST_PROFILE[r];
          const before = slope[Math.max(0, r - 1)],
            after = slope[Math.min(slope.length - 1, r)];
          const nh = (before[0] + after[0]) / 2,
            nv = (before[1] + after[1]) / 2,
            nl = Math.hypot(nh, nv) || 1;
          for (let i = 0; i < n; i++) {
            positions.push(
              points[i][0] + outward[i][0] * step.out * spread,
              LAND_TOP + (step.y - LAND_TOP) * sink,
              points[i][1] + outward[i][1] * step.out * spread,
            );
            normals.push(
              (outward[i][0] * nh) / nl,
              nv / nl,
              (outward[i][1] * nh) / nl,
            );
            // Sample the terrain at the shoreline itself, so each coast keeps
            // its own colour as it goes under.
            uvs.push(
              (points[i][0] * UNIT + PROJ_W / 2) / PROJ_W,
              (305 - points[i][1] * UNIT) / PROJ_H,
            );
            colors.push(step.tint[0], step.tint[1], step.tint[2]);
          }
        }
        // Which way round the quads wind depends on `facing`; getting it wrong
        // makes the renderer treat the outer face as a back face and flip its
        // normal, which lights the whole slope from inside and turns it black.
        for (let r = 0; r < rows - 1; r++)
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n,
              a = base + r * n + i,
              b = base + r * n + j,
              c = base + (r + 1) * n + i,
              d = base + (r + 1) * n + j;
            if (facing > 0) indices.push(a, b, c, b, d, c);
            else indices.push(a, c, b, b, c, d);
          }
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    this.scene.add(
      new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          map: this.terrain,
          vertexColors: true,
          roughness: 0.92,
          metalness: 0,
        }),
      ),
    );
  }
  buildMarkers() {
    const geometry = new THREE.SphereGeometry(0.22, 12, 8),
      haloGeometry = new THREE.RingGeometry(0.32, 0.4, 24);
    for (const location of this.locations) {
      const point = this.data.locations.find(
        (l) => l.id === location.id,
      )?.point;
      if (!point) continue;
      const group = new THREE.Group();
      group.position.set(
        (point[0] - PROJ_W / 2) / UNIT,
        LAND_TOP + 0.33,
        (point[1] - 305) / UNIT,
      );
      const material = new THREE.MeshBasicMaterial({ color: "#e2642a" }),
        mesh = new THREE.Mesh(geometry, material);
      mesh.userData.id = location.id;
      const halo = new THREE.Mesh(
        haloGeometry,
        new THREE.MeshBasicMaterial({
          color: "#e8a24f",
          side: THREE.DoubleSide,
        }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = -0.32;
      group.add(mesh, halo);
      this.scene.add(group);
      const button = document.createElement("button");
      button.className = "map-label";
      button.textContent = location.name;
      button.setAttribute("aria-label", "Select " + location.name);
      button.onclick = () => this.onSelect(location.id);
      this.container.append(button);
      this.markers.push({ id: location.id, group, mesh, halo, button });
    }
  }
  addMapLabels() {
    this.mapLabels = [
      ["PACIFIC OCEAN", -24, 4],
      ["ATLANTIC OCEAN", 23, 4],
      ["GULF OF MEXICO", 7, 14.5],
      ["ALASKA · INSET", -18, 15],
      ["HAWAIʻI · INSET", -8, 15],
    ].map(([name, x, z]) => {
      const el = document.createElement("span");
      el.className = "ocean-label";
      el.textContent = name;
      this.container.append(el);
      return { el, position: new THREE.Vector3(x, SEA_Y, z) };
    });
  }
  update(year, visibleIds, selectedId) {
    this.updateHistory(year);
    for (const m of this.markers) {
      const visible = visibleIds.has(m.id);
      m.group.visible = visible;
      m.mesh.visible = visible;
      m.button.hidden = !visible;
      m.button.classList.toggle("selected", m.id === selectedId);
      m.button.setAttribute("aria-pressed", String(m.id === selectedId));
      m.mesh.material.color.set(m.id === selectedId ? "#fbead0" : "#e2642a");
      m.halo.scale.setScalar(m.id === selectedId ? 1.4 : 1);
    }
    this.invalidate();
  }
  updateHistory(year) {
    const snapshot = historicalSnapshot(this.data.history, this.data, year);
    this.container.dataset.boundaryYear = String(year);
    this.container.dataset.boundaryCount = String(snapshot.entries.length);
    if (snapshot.key === this.boundaryKey) return;
    this.boundaryKey = snapshot.key;
    if (this.historyLayer) {
      this.scene.remove(this.historyLayer);
      this.historyLayer.traverse(object => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
    }
    const layer = this.historyLayer = new THREE.Group();
    const lines = [];
    const categories = new Map();
    for (const feature of snapshot.entries) {
      const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
      if (!categories.has(feature.category)) categories.set(feature.category, []);
      const parts = categories.get(feature.category);
      for (const polygon of polygons) {
        const toPoints = ring => ring.map(([x,y]) => new THREE.Vector2((x - PROJ_W / 2) / UNIT, (305 - y) / UNIT));
        const shape = new THREE.Shape(toPoints(polygon[0]));
        for (const hole of polygon.slice(1)) shape.holes.push(new THREE.Path(toPoints(hole)));
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, LAND_TOP + 0.018, 0);
        parts.push(geometry);
        for (const ring of polygon)
          for (let i = 1; i < ring.length; i++)
            for (const [x,y] of [ring[i-1], ring[i]]) lines.push((x - PROJ_W / 2) / UNIT, LAND_TOP + 0.035, (y - 305) / UNIT);
      }
    }
    // One draw call per affiliation instead of one per state.
    for (const [category, parts] of categories) {
      if (!parts.length) continue;
      const geometry = mergeGeometries(parts);
      parts.forEach(part => part.dispose());
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: mapCategories[category].color,
        transparent: true, opacity: 0.5, depthWrite: false,
      }));
      mesh.renderOrder = 1;
      layer.add(mesh);
    }
    this.border.geometry.dispose();
    this.border.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    this.border.material.opacity = 0.65;
    this.border.renderOrder = 2;
    this.scene.add(layer);
    this.container.dataset.boundaryYear = String(year);
    this.container.dataset.boundaryCount = String(snapshot.entries.length);
  }
  setRelief(show) {
    this.topMaterial.normalScale.setScalar(show ? 1.15 : 0);
    this.invalidate();
  }
  setBorders(show) {
    this.border.visible = show;
    this.invalidate();
  }
  /** Where the camera is, normalised against its own limits.
   *
   *   yaw   -1 … 1  full left to full right
   *   tilt   0 … 1  straight down to the most oblique angle allowed
   *   dolly  0 … 1  closest to furthest
   *
   * Normalised rather than raw so that callers never need to know the limits,
   * and keep working if the limits are retuned. */
  cameraState() {
    const c = this.controls;
    const s = new THREE.Spherical().setFromVector3(
      this.camera.position.clone().sub(c.target),
    );
    const span = (v, lo, hi) =>
      hi - lo < 1e-6 ? 0 : THREE.MathUtils.clamp((v - lo) / (hi - lo), 0, 1);
    return {
      yaw: span(s.theta, c.minAzimuthAngle, c.maxAzimuthAngle) * 2 - 1,
      tilt: span(s.phi, c.minPolarAngle, c.maxPolarAngle),
      dolly: span(s.radius, c.minDistance, c.maxDistance),
    };
  }
  /** Distance at which the whole map is framed, for the current aspect. */
  framingDistance() {
    return Math.max(
      51,
      29 / (Math.tan((19 * Math.PI) / 180) * this.camera.aspect),
    );
  }
  captureView() {
    return { position: this.camera.position.clone(), target: this.controls.target.clone() };
  }
  restoreView(view) {
    this.cancelFlight();
    if (!view) return;
    this.camera.position.copy(view.position);
    this.controls.target.copy(view.target);
    this.controls.update();
    this.invalidate();
  }
  cancelFlight() {
    this.flight?.abort();
    this.restoreFlightLimits?.();
    this.restoreFlightLimits = null;
    this.flight = null;
  }
  async flyToLocation(id, { duration = 1500, signal } = {}) {
    const marker = this.markers.find((entry) => entry.id === id);
    if (!marker || this.disposed || signal?.aborted) return false;
    this.cancelFlight();
    const flight = this.flight = new AbortController();
    const abort = () => flight.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const start = this.captureView();
    const target = marker.group.position.clone();
    target.y = LAND_TOP;
    const position = target.clone().add(new THREE.Vector3(0, 7.5, 4.2));
    const limits = { enabled: this.controls.enabled, minDistance: this.controls.minDistance, maxTargetRadius: this.controls.maxTargetRadius };
    const restoreLimits = () => Object.assign(this.controls, limits);
    this.restoreFlightLimits = restoreLimits;
    this.controls.enabled = false;
    this.controls.minDistance = 2;
    this.controls.maxTargetRadius = Infinity;
    try {
      return await animateFlight({ duration, signal: flight.signal, update: (progress) => {
        this.camera.position.lerpVectors(start.position, position, progress);
        this.controls.target.lerpVectors(start.target, target, progress);
        this.controls.update();
        this.invalidate("city-flight");
      } });
    } finally {
      signal?.removeEventListener("abort", abort);
      if (this.flight === flight) {
        restoreLimits();
        this.restoreFlightLimits = null;
        this.flight = null;
      }
    }
  }
  setPaused(paused) {
    this.paused = paused;
    if (paused) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    } else this.invalidate();
  }
  reset() {
    /* A little further out than the distance that merely fits the land, so
     * the full-bleed stage keeps air around the subject for the margins to
     * live in. Still inside maxDistance, which stays at 1.22x framing, so
     * the sea sheet continues to cover the frame. */
    const distance = this.framingDistance() * 1.14;
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, distance * 0.83, distance * 0.56);
    this.controls.update();
    this.invalidate();
  }
  zoom(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * factor,
        this.controls.minDistance,
        this.controls.maxDistance,
      ),
    );
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.invalidate();
  }
  topView() {
    this.camera.position
      .copy(this.controls.target)
      .add(new THREE.Vector3(0, 58, 0.01));
    this.controls.update();
    this.invalidate();
  }
  resize() {
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    if (!w || !h) return;
    const crossed = this.camera.aspect < 1 !== w / h < 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    // Allow a little pull-back past the framing distance, never enough to clear
    // the sea sheet. Tall windows frame from further out, so this follows them.
    this.controls.maxDistance = Math.min(118, this.framingDistance() * 1.22);
    if (crossed && !this.flight && !this.paused) this.reset();
    this.invalidate("resize");
  }
  invalidate(reason = "other") {
    if (import.meta.env.DEV) {
      this.reasons ??= {};
      this.reasons[reason] = (this.reasons[reason] ?? 0) + 1;
      this.renderer.domElement.dataset.requests = JSON.stringify(this.reasons);
    }
    if (!this.frame && !this.disposed && !this.paused && !document.hidden)
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.render();
        this.onCamera?.(this.cameraState());
      });
  }
  render() {
    this.renderer.render(this.scene, this.camera);
    this.framesRendered++;
    if (import.meta.env.DEV) {
      const d = this.renderer.domElement.dataset;
      d.frames = String(this.framesRendered);
      d.drawCalls = String(this.renderer.info.render.calls);
      d.triangles = String(this.renderer.info.render.triangles);
      d.pixelRatio = String(this.renderer.getPixelRatio());
    }
    const width = this.container.clientWidth,
      height = this.container.clientHeight,
      point = new THREE.Vector3();
    const place = (el, position) => {
      point.copy(position).project(this.camera);
      const x = (point.x * 0.5 + 0.5) * width,
        y = (-point.y * 0.5 + 0.5) * height;
      el.style.transform =
        "translate(-50%, -50%) translate(" + x + "px," + y + "px)";
      el.style.visibility =
        point.z > 1 || x < 0 || x > width || y < 0 || y > height
          ? "hidden"
          : "visible";
      return { x, y };
    };
    const occupied = [];
    for (const m of this.markers) {
      if (!m.group.visible) continue;
      const p = place(m.button, m.group.position);
      const collides = occupied.some(
        (q) => Math.abs(q.x - p.x) < 115 && Math.abs(q.y - p.y) < 30,
      );
      m.button.classList.toggle("compact", collides);
      if (!collides) occupied.push(p);
    }
    this.mapLabels.forEach((l) => place(l.el, l.position));
  }
  stats() {
    return {
      frames: this.framesRendered,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      pixelRatio: this.renderer.getPixelRatio(),
    };
  }
  dispose() {
    this.disposed = true;
    this.cancelFlight();
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.cleanups.forEach((fn) => fn());
    const geometries = new Set(),
      materials = new Set();
    this.scene.traverse((obj) => {
      if (obj.geometry) geometries.add(obj.geometry);
      if (obj.material)
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
          (m) => materials.add(m),
        );
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.markers.forEach((m) => m.button.remove());
    this.mapLabels.forEach((l) => l.el.remove());
  }
}
