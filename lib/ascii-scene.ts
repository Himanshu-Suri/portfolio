import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

type Row = [x: number, y: number, z: number, hex: string];

export type AsciiSceneData = {
  width: number;
  height: number;
  depthScale: number;
  background: string;
  groups: Record<string, Row[]>;
};

export type AsciiSceneOptions = {
  dataUrl: string;
  fontUrl: string;
  /** Idle left-right sway in radians. 0 turns it off. */
  sway?: number;
  /** How far the scene tilts toward the pointer, in radians. 0 turns it off. */
  parallax?: number;
  /** Extra room around the picture. 1 fits it exactly. */
  padding?: number;
  /**
   * Brightens dark tones with a gamma lift. 1 keeps the original colours;
   * around 1.6 makes a dark picture readable on a black page.
   */
  lift?: number;
};

export type AsciiSceneHandle = { dispose: () => void };

const FOV = 45;
const CHAR_ASPECT = 0.6; // narrower glyphs for a monospace look
const DEPTH_MULTIPLIER = 10; // same depth boost the original export used

/**
 * Renders the ASCII picture with one InstancedMesh per character instead of
 * one mesh per character. The original export built about 20,000 separate
 * meshes (20,000 draw calls); this needs about 70.
 */
export async function createAsciiScene(
  container: HTMLElement,
  options: AsciiSceneOptions,
): Promise<AsciiSceneHandle> {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const sway = reduceMotion ? 0 : (options.sway ?? 0.1);
  const parallax = reduceMotion ? 0 : (options.parallax ?? 0.35);
  const padding = options.padding ?? 1.08;
  const lift = Math.max(options.lift ?? 1, 0.1);

  const [data, font] = await Promise.all([
    fetch(options.dataUrl).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${options.dataUrl}`);
      return r.json() as Promise<AsciiSceneData>;
    }),
    new FontLoader().loadAsync(options.fontUrl),
  ]);

  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000);

  // Bounds of the picture, used to fit it inside whatever box it is given.
  const box = new THREE.Box3();
  const meshes: THREE.InstancedMesh[] = [];
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let instanceCount = 0;

  for (const [char, rows] of Object.entries(data.groups)) {
    const shapes = font.generateShapes(char, 1);
    if (shapes.length === 0 || rows.length === 0) continue;

    // Flat glyphs: the original extruded them by 0.02, which is invisible
    // at this scale and roughly triples the triangle count.
    const geometry = new THREE.ShapeGeometry(shapes, 2);
    geometry.center();
    geometry.scale(CHAR_ASPECT, 1, 1);

    const mesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      rows.length,
    );

    rows.forEach(([x, y, z, hex], i) => {
      dummy.position.set(x, y, z * DEPTH_MULTIPLIER);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(`#${hex}`);
      if (lift !== 1) {
        color.r = Math.pow(color.r, 1 / lift);
        color.g = Math.pow(color.g, 1 / lift);
        color.b = Math.pow(color.b, 1 / lift);
      }
      mesh.setColorAt(i, color);
      box.expandByPoint(dummy.position);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;

    group.add(mesh);
    meshes.push(mesh);
    instanceCount += rows.length;
  }

  // Centre the picture on the origin so it rotates about its middle.
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  group.position.set(-center.x, -center.y, -center.z);
  const pivot = new THREE.Group();
  scene.remove(group);
  pivot.add(group);
  scene.add(pivot);

  const fit = () => {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const byHeight = size.y / 2 / tan;
    const byWidth = size.x / 2 / (tan * camera.aspect);
    camera.position.set(0, 0, Math.max(byHeight, byWidth) * padding + size.z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  fit();

  const resizeObserver = new ResizeObserver(fit);
  resizeObserver.observe(container);

  // Pointer parallax on the whole window, so the picture follows the cursor
  // without capturing touch scrolling the way drag controls would.
  const target = { x: 0, y: 0 };
  const onPointerMove = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (parallax > 0) window.addEventListener("pointermove", onPointerMove);

  let visible = true;
  const visibility = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0 },
  );
  visibility.observe(container);

  let frame = 0;
  let disposed = false;
  const clock = new THREE.Clock();
  const tick = () => {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const goalY = target.x * parallax + Math.sin(t * 0.5) * sway;
    const goalX = target.y * parallax * 0.5;
    pivot.rotation.y += (goalY - pivot.rotation.y) * 0.05;
    pivot.rotation.x += (goalX - pivot.rotation.x) * 0.05;
    renderer.render(scene, camera);
  };
  tick();

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[ascii-scene] ${instanceCount} characters, ${meshes.length} draw calls`,
    );
  }

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        mesh.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
