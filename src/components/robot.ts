import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const AMBER = "#FBBF24";
const NAVY = "#0E1524";

function rr(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function remapUV(g: THREE.BufferGeometry) {
  g.computeBoundingBox();
  const b = g.boundingBox!; const pos = g.attributes.position; const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
  uv.needsUpdate = true;
}
function frame(ow: number, oh: number, or: number, iw: number, ih: number, ir: number, depth: number, bevel: number) {
  const s = rr(ow, oh, or); s.holes.push(rr(iw, ih, ir) as unknown as THREE.Path);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 18 });
  remapUV(g); return g;
}

export type FaceMode = "eyes" | "map" | "quote";

export function mountRobot(canvas: HTMLCanvasElement, opts: { reduced: boolean }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  // three 0.160: environment intensity is per-material, set below
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight("#eef2fa", "#1a2332", 0.7));
  const key = new THREE.DirectionalLight("#fff6ea", 1.7); key.position.set(-3, 5, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 4, bottom: -4, near: 0.5, far: 20 });
  scene.add(key);
  const rim = new THREE.DirectionalLight("#e8eefc", 1.2); rim.position.set(4, 2, -4); scene.add(rim);
  const fill = new THREE.PointLight(AMBER, 2.2, 6); fill.position.set(-3.2, 1.2, 0.6); scene.add(fill);

  const envI = 0.9;
  const phys = (c: string, r: number) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, clearcoat: 0.45, clearcoatRoughness: 0.3, envMapIntensity: envI });
  const shell = phys("#eeebe6", 0.38), shellL = phys("#f8f6f2", 0.34);
  const dark = new THREE.MeshStandardMaterial({ color: "#1b1b1f", roughness: 0.55, metalness: 0.3, envMapIntensity: envI });
  const deep = new THREE.MeshStandardMaterial({ color: "#0f0f12", roughness: 0.6, metalness: 0.2, envMapIntensity: envI });
  const ped = new THREE.MeshStandardMaterial({ color: "#1A2332", roughness: 0.9, envMapIntensity: envI });
  const ring = new THREE.MeshPhysicalMaterial({ color: AMBER, roughness: 0.5, clearcoat: 0.35, emissive: AMBER, emissiveIntensity: 0.18, envMapIntensity: envI });

  const shadowed = (m: THREE.Mesh) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const box = (w: number, h: number, d: number, r: number, mat: THREE.Material) => shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat));
  const ball = (r: number, mat: THREE.Material) => shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat));
  const cyl = (r: number, h: number, mat: THREE.Material) => shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), mat));

  const robot = new THREE.Group(); scene.add(robot);

  /* torso */
  const torso = box(1.22, 1.12, 0.92, 0.24, shell); robot.add(torso);
  const chest = box(1.02, 0.26, 0.82, 0.1, shellL); chest.position.y = 0.5; robot.add(chest);
  [0.45, 0.75, 1].forEach((k, i) => {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.034, 16, 12), new THREE.MeshStandardMaterial({ color: AMBER, emissive: AMBER, emissiveIntensity: 0.6 + k }));
    led.position.set(-0.13 + i * 0.13, 0.2, 0.465); robot.add(led);
  });
  [-0.2, 0.2].forEach((x) => {
    const slot = box(0.08, 0.32, 0.04, 0.02, deep); slot.position.set(x, -0.16, 0.45); robot.add(slot);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 10, 20, Math.PI), dark); lip.position.set(x, 0.02, 0.46); robot.add(lip);
  });
  const pelvis = box(0.9, 0.2, 0.7, 0.08, dark); pelvis.position.y = -0.64; robot.add(pelvis);

  /* neck + head */
  const neck = cyl(0.17, 0.2, dark); neck.position.y = 0.64; robot.add(neck);
  const head = new THREE.Group(); head.position.y = 0.68; robot.add(head);
  const skull = box(1.5, 1.42, 1.3, 0.2, shell); skull.position.y = 0.78; head.add(skull);
  const back = box(1.28, 1.14, 0.9, 0.12, dark); back.position.set(0, 0.78, -0.3); head.add(back);
  for (let i = 0; i < 26; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03 + Math.random() * 0.18, 0.02, 0.02), deep);
    if (i % 3 === 0) { bar.position.set(-0.6 + Math.random() * 1.2, 0.78 + 0.72, -0.2 - Math.random() * 0.5); }
    else { bar.position.set(-0.6 + Math.random() * 1.2, 0.78 - 0.5 + Math.random() * 1, -0.76); }
    head.add(bar);
  }
  const faceRing = new THREE.Mesh(frame(1.5, 1.44, 0.3, 1.08, 1.02, 0.2, 0.1, 0.03), ring);
  faceRing.position.set(0, 0.78, 0.58); faceRing.castShadow = true; head.add(faceRing);
  const bezel = new THREE.Mesh(frame(1.08, 1.02, 0.2, 0.94, 0.88, 0.15, 0.06, 0), shellL); bezel.position.set(0, 0.78, 0.62); head.add(bezel);

  const face = document.createElement("canvas"); face.width = face.height = 512;
  const fctx = face.getContext("2d")!;
  const faceTex = new THREE.CanvasTexture(face); faceTex.colorSpace = THREE.SRGBColorSpace;
  const scrG = new THREE.ShapeGeometry(rr(0.9, 0.84, 0.14), 18); remapUV(scrG);
  const screen = new THREE.Mesh(scrG, new THREE.MeshPhysicalMaterial({ color: "#050608", roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, emissive: "#ffffff", emissiveMap: faceTex, emissiveIntensity: 1.6, envMapIntensity: envI }));
  screen.position.set(0, 0.78, 0.665); head.add(screen);

  [-1, 1].forEach((s) => {
    const ear = cyl(0.22, 0.14, shellL); ear.rotation.z = Math.PI / 2; ear.position.set(s * 0.8, 0.78, 0); head.add(ear);
    const cap = cyl(0.12, 0.06, dark); cap.rotation.z = Math.PI / 2; cap.position.set(s * 0.89, 0.78, 0); head.add(cap);
  });
  const cable = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 10, 30, Math.PI), dark);
  cable.rotation.set(0, Math.PI / 2, Math.PI / 2 + 0.3); cable.position.set(0.9, 0.5, -0.1); head.add(cable);

  /* arms */
  const forearms: THREE.Group[] = []; const shoulders: THREE.Group[] = [];
  [-1, 1].forEach((s) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.74, 0.32, 0); sh.rotation.z = s * 0.16; robot.add(sh); shoulders.push(sh);
    sh.add(ball(0.14, dark));
    const up = box(0.26, 0.48, 0.28, 0.1, shell); up.position.y = -0.3; sh.add(up);
    const el = ball(0.1, dark); el.position.y = -0.58; sh.add(el);
    const fa = new THREE.Group(); fa.position.y = -0.58; fa.rotation.x = -0.35; sh.add(fa); forearms.push(fa);
    const hand = box(0.3, 0.36, 0.3, 0.1, shellL); hand.position.y = -0.26; fa.add(hand);
    const thumb = box(0.08, 0.16, 0.1, 0.03, shellL); thumb.position.set(-s * 0.17, -0.2, 0.08); fa.add(thumb);
    if (s === 1) {
      // the torch: a short dark barrel with an amber lens, lighting the way
      const torch = new THREE.Group(); torch.position.set(0, -0.3, 0.18); torch.rotation.x = Math.PI / 2 + 0.35; fa.add(torch);
      const barrel = cyl(0.07, 0.5, dark); torch.add(barrel);
      const headC = cyl(0.11, 0.12, dark); headC.position.y = 0.3; torch.add(headC);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.09, 28), new THREE.MeshStandardMaterial({ color: AMBER, emissive: AMBER, emissiveIntensity: 2 }));
      lens.rotation.x = -Math.PI / 2; lens.position.y = 0.365; torch.add(lens);
      const beam = new THREE.SpotLight(AMBER, 6, 7, 0.42, 0.6, 1.2); beam.position.y = 0.37; torch.add(beam);
      const tgt = new THREE.Object3D(); tgt.position.y = 3; torch.add(tgt); beam.target = tgt;
    }
  });

  /* legs */
  [-1, 1].forEach((s) => {
    const hip = ball(0.13, dark); hip.position.set(s * 0.3, -0.74, 0); robot.add(hip);
    const leg = box(0.34, 0.42, 0.4, 0.1, shell); leg.position.set(s * 0.3, -0.98, 0); robot.add(leg);
    const ank = cyl(0.09, 0.1, dark); ank.position.set(s * 0.3, -1.22, 0); robot.add(ank);
    const foot = box(0.42, 0.16, 0.56, 0.06, shellL); foot.position.set(s * 0.3, -1.34, 0.06); robot.add(foot);
  });

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.6, 1.7), ped); pedestal.position.y = -2.22; pedestal.receiveShadow = true; scene.add(pedestal);

  /* face drawing */
  let mode: FaceMode = "eyes", prev: FaceMode = "eyes", fade = 1;
  let blink = 0, nextBlink = performance.now() + 2500 + Math.random() * 3000;
  function drawMode(m: FaceMode, a: number, eyeScale: number) {
    fctx.globalAlpha = a;
    if (m === "eyes") {
      fctx.fillStyle = "#F1FAEE"; fctx.shadowColor = "rgba(241,250,238,.8)"; fctx.shadowBlur = 18;
      for (const [x, y] of [[196, 262], [316, 252]]) { fctx.beginPath(); fctx.ellipse(x, y, 30, 38 * eyeScale, 0, 0, Math.PI * 2); fctx.fill(); }
      fctx.shadowBlur = 0;
    } else if (m === "map") {
      // a tiny coverage map: solid = confirmed, outline = partial, stripes = conflict, dashed = dark spot
      const grid = ["SSOSD", "SXSOS", "OSDSS", "SSSOD"]; const c = 58, g = 12, w = 5 * c + 4 * g, ox = (512 - w) / 2, oy = (512 - (4 * c + 3 * g)) / 2;
      grid.forEach((row, r) => row.split("").forEach((k, i) => {
        const x = ox + i * (c + g), y = oy + r * (c + g);
        fctx.strokeStyle = AMBER; fctx.fillStyle = AMBER; fctx.lineWidth = 4; fctx.setLineDash([]);
        if (k === "S") { fctx.fillRect(x, y, c, c); }
        else if (k === "O") { fctx.strokeRect(x + 2, y + 2, c - 4, c - 4); fctx.fillRect(x, y + c / 2, c, c / 2); }
        else if (k === "X") { fctx.strokeRect(x + 2, y + 2, c - 4, c - 4); fctx.save(); fctx.beginPath(); fctx.rect(x, y, c, c); fctx.clip(); for (let t = -c; t < c * 2; t += 14) { fctx.beginPath(); fctx.moveTo(x + t, y + c); fctx.lineTo(x + t + c, y); fctx.stroke(); } fctx.restore(); }
        else { fctx.setLineDash([9, 7]); fctx.strokeRect(x + 2, y + 2, c - 4, c - 4); fctx.setLineDash([]); }
      }));
    } else {
      fctx.fillStyle = "#F1FAEE"; fctx.shadowColor = "rgba(241,250,238,.7)"; fctx.shadowBlur = 18;
      fctx.font = "560px 'Arial Black', Arial, sans-serif"; fctx.textAlign = "center"; fctx.fillText("\u201C", 256, 470);
      fctx.shadowBlur = 0;
    }
    fctx.globalAlpha = 1;
  }
  function drawFace(now: number) {
    if (now > nextBlink) { blink = now; nextBlink = now + 2500 + Math.random() * 3000; }
    const bt = (now - blink) / 180; const eyeScale = bt < 1 ? 1 - 0.9 * Math.sin(bt * Math.PI) : 1;
    fctx.fillStyle = "#000"; fctx.fillRect(0, 0, 512, 512);
    if (fade < 1) { drawMode(prev, 1 - fade, eyeScale); fade = Math.min(1, fade + 0.05); }
    drawMode(mode, fade, eyeScale);
    faceTex.needsUpdate = true;
  }

  /* motion */
  const st = { p: 0, sp: 0, mx: 0, my: 0, smx: 0, smy: 0 };
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const A = { z: 11.6, y: 1.1, ly: 0.55, by: -0.42, hy: -0.6, hp: 0.16, hr: 0.22 };
  const B = { z: 6.9, y: 1.95, ly: 1.62, by: -0.2, hy: -0.06, hp: 0.04, hr: 0 };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const onScroll = () => { st.p = Math.min(2, Math.max(0, window.scrollY / window.innerHeight)); };
  const onMove = (e: PointerEvent) => { st.mx = (e.clientX / window.innerWidth) * 2 - 1; st.my = (e.clientY / window.innerHeight) * 2 - 1; };
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("resize", onResize);
  onResize(); onScroll(); st.sp = st.p;

  let raf = 0; const t0 = performance.now();
  const tick = (now: number) => {
    const t = (now - t0) / 1000;
    st.sp += (st.p - st.sp) * 0.08; st.smx += (st.mx - st.smx) * 0.06; st.smy += (st.my - st.smy) * 0.06;
    const k = ease(Math.min(1, st.sp));
    const zMul = window.innerWidth < 900 ? 1.25 : 1;
    const m = opts.reduced ? 0 : 1;
    camera.position.set(st.smx * 0.25 * m, lerp(A.y, B.y, k) - st.smy * 0.1 * m, lerp(A.z, B.z, k) * zMul);
    camera.lookAt(0, lerp(A.ly, B.ly, k), 0);
    robot.rotation.y = lerp(A.by, B.by, k) + st.smx * 0.12 * m;
    robot.position.y = Math.sin(1.4 * t) * 0.02 * m;
    head.rotation.set(lerp(A.hp, B.hp, k) + st.smy * 0.18 * m + Math.sin(0.9 * t) * 0.02 * m, lerp(A.hy, B.hy, k) + st.smx * 0.45 * m, lerp(A.hr, B.hr, k) + Math.sin(0.7 * t) * 0.02 * m);
    shoulders.forEach((s, i) => { s.rotation.x = Math.sin(1.4 * t + i) * 0.05 * m; });
    forearms.forEach((f, i) => { f.rotation.x = -0.35 + Math.sin(1.4 * t + i) * 0.06 * m; });
    const want: FaceMode = st.sp > 1.55 ? "quote" : st.sp > 0.7 ? "map" : "eyes";
    if (want !== mode) { prev = mode; mode = want; fade = 0; }
    drawFace(now);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll); window.removeEventListener("pointermove", onMove); window.removeEventListener("resize", onResize);
    scene.traverse((o) => { const mesh = o as THREE.Mesh; mesh.geometry?.dispose(); });
    [shell, shellL, dark, deep, ped, ring].forEach((x) => x.dispose());
    faceTex.dispose(); env.dispose(); pmrem.dispose(); renderer.dispose();
  };
}
export { NAVY };
