// ship.js — a nave ODISSEIA X-12, construída só com formas simples + detalhe procedural.
// buildShip('A'|'B'|'C') -> THREE.Group com partes nomeadas (engines, ring, navLights, windows) para animar no filme.
// Eixo: nariz em +Z. Comprimento ~20 unidades.
import * as THREE from 'three';

const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ---------- texturas procedurais ----------
function panelTex(seed = 1, base = '#d9dadc') {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) { const w = 40 + R() * 260, h = 30 + R() * 200, x = R() * 1024, y = R() * 1024, v = (R() - .5) * 9;
    g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255 * 2.2})`; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(40,42,46,.55)'; g.lineWidth = 1.6; g.strokeRect(x, y, w, h); }
  for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(30,30,30,.5)'; g.fillRect(R() * 1024, R() * 1024, 2, 2); }       // rebites
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,45,30,.12)'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#d8661c' : '#1b1d21'; g.fillRect(R() * 900, R() * 1000, 120 + R() * 200, 10); }  // faixas de aviso
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function foilBump(seed = 3) {   // folha de isolamento térmico amassada (o detalhe "NASA")
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) { g.beginPath(); const x = R() * 512, y = R() * 512, r = 6 + R() * 34; g.moveTo(x, y);
    for (let k = 0; k < 5; k++) g.lineTo(x + (R() - .5) * r * 2, y + (R() - .5) * r * 2); g.closePath(); const v = 90 + R() * 80 | 0; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function cellTex() { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#0c1630'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 32) { g.fillStyle = `rgb(${18 + (x * y) % 9},${32 + (x + y) % 12},${70 + (x * 7 + y) % 20})`; g.fillRect(x + 2, y + 2, 28, 28); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function hullText(txt) { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d'); g.clearRect(0, 0, 1024, 256);
  g.font = 'bold 150px "Segoe UI", Arial'; g.letterSpacing = '18px'; g.fillStyle = 'rgba(28,30,34,.92)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 512, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function materials() {
  const foil = foilBump();
  return {
    hull: (() => { const t = panelTex(1); return new THREE.MeshPhysicalMaterial({ map: t, bumpMap: t, bumpScale: .9, roughness: .5, metalness: .12, clearcoat: .35, clearcoatRoughness: .35 }); })(),
    hull2: (() => { const t = panelTex(7, '#a7aab0'); return new THREE.MeshPhysicalMaterial({ map: t, bumpMap: t, bumpScale: .7, roughness: .42, metalness: .6, anisotropy: .5 }); })(),
    gold: new THREE.MeshPhysicalMaterial({ color: 0xc8922f, metalness: 1, roughness: .46, bumpMap: foil, bumpScale: 4, envMapIntensity: .55 }),
    metal: new THREE.MeshPhysicalMaterial({ color: 0x8c9096, metalness: 1, roughness: .36, anisotropy: .7, anisotropyRotation: 1.57 }),
    dark: new THREE.MeshPhysicalMaterial({ color: 0x1d1f23, metalness: .6, roughness: .5 }),
    rad: new THREE.MeshPhysicalMaterial({ color: 0x2a2c30, metalness: .3, roughness: .6, emissive: 0xff5a1a, emissiveIntensity: 0, emissiveMap: (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#fff'; for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 3, 256); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1); return t; })() }),
    solar: new THREE.MeshPhysicalMaterial({ map: cellTex(), metalness: .4, roughness: .2, clearcoat: 1 }),
    win: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, .78, .45).multiplyScalar(1.6), toneMapped: true }),
    nav: new THREE.MeshBasicMaterial({ color: new THREE.Color(5, .3, .2) }),
    nav2: new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, 5, .6) }),
    glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 1.6, 6), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    canopy: new THREE.MeshPhysicalMaterial({ color: 0x0a0f18, metalness: .9, roughness: .05, clearcoat: 1 }),
  };
}
const add = (p, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
const cylZ = (r1, r2, l, s = 48) => new THREE.CylinderGeometry(r1, r2, l, s, 1).rotateX(Math.PI / 2);
const PLUME_VS = `varying vec3 vP;varying vec3 vN;varying vec3 vW;void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const PLUME_FS = `uniform float uT,uP,uL,uR;varying vec3 vP;varying vec3 vN;varying vec3 vW;
 float h(vec3 p){p=fract(p*.3183+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){float z=clamp(-vP.z/uL,0.,1.);vec3 v=normalize(cameraPosition-vW);float rim=pow(abs(dot(normalize(vN),v)),4.);
  float flick=.75+.25*n(vec3(vP.xy*3.,vP.z*1.5+uT*38.));float dia=.65+.35*pow(abs(sin(z*uL*2.6-uT*2.)),6.)*(1.-z);
  float fade=pow(1.-z,1.8)*(.35+.65*smoothstep(0.,.12,z));vec3 core=vec3(.4,.62,1.),edge=vec3(.05,.18,1.),tail=vec3(.22,.05,.85);
  vec3 c=mix(mix(core,edge,smoothstep(0.,.3,z)),tail,smoothstep(.4,1.,z));gl_FragColor=vec4(c*rim*fade*flick*dia*uP*.5,1.);}`;
function plume(r, M) { const g = new THREE.Group(), L = 1;
  const mk = (rad0, rad1, k) => { const geo = new THREE.CylinderGeometry(rad1, rad0, 1, 48, 24, true).translate(0, -.5, 0).rotateX(Math.PI / 2);
    const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uP: { value: 0 }, uL: { value: 1 }, uR: { value: r } }, vertexShader: PLUME_VS, fragmentShader: PLUME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const me = new THREE.Mesh(geo, m); me.userData.k = k; g.add(me); return me; };
  g.userData.layers = [mk(r * .62, r * 1.25, 1), mk(r * .3, r * .55, 1.6)]; return g; }
// ---------- propulsor iônico (grade em colmeia que brilha) + jato quase invisível ----------
const BEAM_FS = `uniform float uT,uP,uL;varying vec3 vP;
 void main(){float along=clamp(-vP.z,0.,1.),x=vP.x*2.;float g=exp(-x*x*3.5)*(.5+.5*exp(-x*x*30.));
  float fade=pow(1.-along,2.2)*smoothstep(0.,.04,along+.01);float fl=.88+.12*sin(uT*60.+along*30.);
  vec3 c=mix(vec3(.55,.75,1.),vec3(.25,.35,1.),along);gl_FragColor=vec4(c*g*fade*fl*uP*.045,1.);}`;
function hexTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) { const cx = x * 15 + (y % 2) * 7.5, cy = y * 13; const d = Math.hypot(cx - 128, cy - 128); if (d > 122) continue;
    g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); } g.closePath(); g.fillStyle = `rgba(255,255,255,${.75 + .25 * (1 - d / 122)})`; g.fill(); }
  const t = new THREE.CanvasTexture(c); return t; }
let HEX = null;
function ionEngine(r, M) {
  const g = new THREE.Group(); HEX = HEX || hexTex();
  const hous = new THREE.MeshPhysicalMaterial({ color: 0x55585e, metalness: 1, roughness: .38, anisotropy: .7, emissive: 0xff5a10, emissiveIntensity: 0, envMapIntensity: .6 });
  add(g, cylZ(r * 1.08, r, .9, 48), hous, 0, 0, -.45); add(g, new THREE.TorusGeometry(r * 1.02, .06, 10, 64), M.metal, 0, 0, -.92);
  add(g, new THREE.TorusGeometry(r * .7, .03, 8, 48), M.dark, 0, 0, -.93);
  const grid = new THREE.Mesh(new THREE.CircleGeometry(r * .97, 64), new THREE.MeshBasicMaterial({ map: HEX, color: new THREE.Color(.22, .42, 1.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  grid.position.z = -.9; grid.rotation.y = Math.PI; g.add(grid);
  const back = new THREE.Mesh(new THREE.CircleGeometry(r * .97, 48), M.dark); back.position.z = -.88; back.rotation.y = Math.PI; g.add(back);
  const pl = new THREE.Group(); pl.position.z = -.92; g.add(pl); pl.userData.layers = [];
  for (let i = 0; i < 6; i++) { const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, -.5);
    const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uP: { value: 0 }, uL: { value: 1 } }, vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const me = new THREE.Mesh(geo, m); me.rotation.z = i * Math.PI / 6; me.scale.x = r * 2.8; me.userData.k = 1; pl.add(me); pl.userData.layers.push(me); }
  const light = new THREE.PointLight(0x6fa8ff, 0, 30, 2); light.position.z = -3.5; g.add(light);
  g.userData = { glow: [grid], bell: hous, plume: pl, light, l: .9, r }; return g; }
function magNozzle(M) { const g = new THREE.Group(); [.75, .62, .5].forEach((rr, i) => { add(g, new THREE.TorusGeometry(rr, .12, 12, 64), M.hull2, 0, 0, -.3 - i * .55); add(g, new THREE.TorusGeometry(rr, .125, 4, 64), M.gold, 0, 0, -.3 - i * .55).scale.z = .35; });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; add(g, new THREE.BoxGeometry(.08, .08, 1.5), M.metal, Math.cos(a) * .7, Math.sin(a) * .7, -.85); }
  const core = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 2.5, 8), transparent: true, opacity: 0 })); core.position.z = -.6; g.add(core); g.userData.core = core; return g; }
function radiator(M, sg) { const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#2b2d31'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 512; i += 16) { const gr = x.createLinearGradient(i, 0, i + 6, 0); gr.addColorStop(0, '#6d7076'); gr.addColorStop(.5, '#c9ccd2'); gr.addColorStop(1, '#55585e'); x.fillStyle = gr; x.fillRect(i + 5, 4, 6, 248); }
  x.fillStyle = '#1a1b1e'; x.fillRect(0, 0, 512, 6); x.fillRect(0, 250, 512, 6); for (let i = 0; i < 512; i += 128) x.fillRect(i, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: tex, bumpScale: 1.5, metalness: .55, roughness: .55, emissive: 0xff3a10, emissiveIntensity: 0, emissiveMap: tex });
  const W = 7.5, D = 3.2, x0 = 1.05, FM = M.metal.clone(); FM.roughness = .62; FM.metalness = .55; FM.anisotropy = 0;   // moldura fosca: sem reflexo estourado do sol
  add(g, new THREE.BoxGeometry(W, .06, D), mat, sg * (x0 + W / 2), 0, 0);
  [[W, .14, .14, 0, D / 2], [W, .14, .14, 0, -D / 2]].forEach(([w, h, d, , z]) => add(g, new THREE.BoxGeometry(w + .14, h, d), FM, sg * (x0 + W / 2), 0, z));
  add(g, new THREE.BoxGeometry(.14, .14, D), FM, sg * (x0 + W), 0, 0); add(g, new THREE.BoxGeometry(.3, .3, D * .7), M.hull2, sg * x0, 0, 0);
  [-1, 1].forEach(k => { const st = add(g, new THREE.CylinderGeometry(.05, .05, 2.6, 8), M.metal, sg * (x0 + 1.1), .5, k * .9); st.rotation.z = sg * 1.15; });
  g.position.z = -5.4; g.userData = { mat, tip: [sg * (x0 + W + .12), 0, -5.4] }; return g; }
function bell(r, l, M) { const pts = []; for (let i = 0; i <= 28; i++) { const u = i / 28; pts.push(new THREE.Vector2(r * (.32 + .68 * Math.pow(u, 1.5)), -u * l)); }
  const g = new THREE.Group();
  const bm = new THREE.MeshPhysicalMaterial({ color: 0x47474b, metalness: 1, roughness: .34, anisotropy: .8, side: THREE.DoubleSide, emissive: 0xff5a10, emissiveIntensity: 0 });
  const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 72).rotateX(Math.PI / 2), bm); b.castShadow = true; g.add(b);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, .05, 8, 72), M.dark); lip.position.z = -l; g.add(lip);
  for (let k = 1; k < 4; k++) { const rr = r * (.32 + .68 * Math.pow(k / 4, 1.5)); const band = new THREE.Mesh(new THREE.TorusGeometry(rr * 1.005, .025, 6, 72), M.dark); band.position.z = -k / 4 * l; g.add(band); }
  const inner = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p.x * .96, p.y)), 72).rotateX(Math.PI / 2), M.glow.clone()); inner.material.side = THREE.BackSide; g.add(inner);
  const throat = new THREE.Mesh(new THREE.CircleGeometry(r * .33, 32), M.glow.clone()); throat.position.z = -.05; throat.rotation.y = Math.PI; g.add(throat);
  const pl = plume(r * .98, M); pl.position.z = -l; g.add(pl);
  const light = new THREE.PointLight(0x6fa8ff, 0, 30, 2); light.position.z = -l - 1; g.add(light);
  g.userData = { glow: [inner, throat], bell: bm, plume: pl, light, l, r }; return g; }
function greebles(p, M, n, seed, fn) { const R = rng(seed), geo = new THREE.BoxGeometry(1, 1, 1), mats = [M.hull2, M.dark, M.metal]; mats.forEach((mt, k) => { const cnt = Math.floor(n / 3), im = new THREE.InstancedMesh(geo, mt, cnt), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i < cnt; i++) { const [pos, nrm] = fn(R); q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); s.set(.06 + R() * .2, .04 + R() * .1, .08 + R() * .3); v.copy(pos).addScaledVector(nrm, s.y / 2); m4.compose(v, q, s); im.setMatrixAt(i, m4); }
  im.castShadow = im.receiveShadow = true; p.add(im); }); }
function windowsRing(p, M, r, z, n, h = .12) { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, h, .05), M.win, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; q.setFromEuler(new THREE.Euler(0, 0, a)); m4.compose(new THREE.Vector3(Math.cos(a + Math.PI / 2) * r, Math.sin(a + Math.PI / 2) * r, z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); } p.add(im); return im; }
function navLights(p, M, pts) { return pts.map(([x, y, z], i) => add(p, new THREE.SphereGeometry(.09, 12, 8), i % 2 ? M.nav2 : M.nav, x, y, z)); }

// ---------- A · LANÇA: espinha longa, anel habitacional giratório, radiadores ----------
function shipA(M) {
  const s = new THREE.Group(), P = s.userData;
  add(s, cylZ(1.25, 1.25, 3.2), M.hull, 0, 0, 8);
  add(s, new THREE.LatheGeometry([0, .3, .6, .85, 1].map((u, i) => new THREE.Vector2(1.25 * Math.cos(u * Math.PI / 2.2) + .0, u * 2.4)), 48).rotateX(Math.PI / 2), M.hull, 0, 0, 9.6);
  P.windows = [windowsRing(s, M, 1.27, 8.9, 18), windowsRing(s, M, 1.27, 8.4, 18)];
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(3, .75), new THREE.MeshBasicMaterial({ map: hullText('ODISSEIA  X-12'), transparent: true, depthWrite: false })); nm.position.set(1.28, 0, 7.6); nm.rotation.y = Math.PI / 2; s.add(nm);
  // porta de acoplamento no nariz, blocos de RCS e folha dourada na traseira do módulo de comando
  add(s, cylZ(.42, .5, .5, 24), M.metal, 0, 0, 12.2); add(s, new THREE.TorusGeometry(.46, .06, 8, 32), M.dark, 0, 0, 12.45);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, g = new THREE.Group(); g.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 8.6); g.rotation.z = a; s.add(g);
    add(g, new THREE.BoxGeometry(.3, .35, .45), M.hull2); [[.0, .2, 0, 0, 0, 0], [0, 0, .25, Math.PI / 2, 0, 0], [0, 0, -.25, -Math.PI / 2, 0, 0]].forEach(([x, y, z, rx]) => add(g, new THREE.CylinderGeometry(.04, .07, .12, 10), M.dark, x, y + .15, z, rx)); }
  add(s, cylZ(1.27, 1.27, .9, 48), M.gold, 0, 0, 6.85);
  // espinha em treliça
  const L = 15, z0 = 6.4; for (const [x, y] of [[.55, .55], [-.55, .55], [.55, -.55], [-.55, -.55]]) add(s, cylZ(.07, .07, L, 8), M.metal, x, y, z0 - L / 2);
  { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, .05, 1.56), M.metal, 60), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); let k = 0;
    for (let i = 0; i < 15; i++) for (let f = 0; f < 4; f++) { const a = f * Math.PI / 2; q.setFromEuler(new THREE.Euler(Math.PI / 4 * (i % 2 ? 1 : -1), 0, a)); const v = new THREE.Vector3(Math.cos(a) * .55, Math.sin(a) * .55, z0 - .5 - i);
      q.setFromEuler(new THREE.Euler(0, 0, a)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(i % 2 ? .78 : -.78, 0, 0))); m4.compose(v, q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(k++, m4); } s.add(im); }
  // anel habitacional
  const ring = new THREE.Group(); ring.position.z = 3.4; s.add(ring); P.ring = ring;
  add(ring, new THREE.TorusGeometry(4.3, .5, 24, 128), M.hull); add(ring, new THREE.TorusGeometry(4.3, .52, 6, 128, Math.PI * 2), M.dark).scale.set(1, 1, .3);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const sp = add(ring, new THREE.CylinderGeometry(.14, .14, 3.6, 12), M.metal, Math.cos(a) * 2.35, Math.sin(a) * 2.35, 0, 0, 0, a + Math.PI / 2); }
  add(ring, cylZ(.85, .85, 1.6), M.hull2); P.windows.push(windowsRing(ring, M, 4.3, .51, 60, .1));
  // tanques dourados
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(s, cylZ(.55, .55, 3.6, 32), M.gold, Math.cos(a) * 1.35, Math.sin(a) * 1.35, -1.6); add(s, new THREE.SphereGeometry(.55, 24, 12), M.gold, Math.cos(a) * 1.35, Math.sin(a) * 1.35, .2).scale.z = .5; add(s, new THREE.SphereGeometry(.55, 24, 12), M.gold, Math.cos(a) * 1.35, Math.sin(a) * 1.35, -3.4).scale.z = .5; }
  // radiadores
  const RAD = [1, -1].map(sg => { const r = radiator(M, sg); s.add(r); return r; }); P.rads = RAD.map(r => ({ material: r.userData.mat }));
  // bloco do motor + 3 tubeiras
  add(s, cylZ(1.5, 1.7, 2.4), M.hull2, 0, 0, -8.4); add(s, cylZ(1.7, 1.2, .8), M.dark, 0, 0, -10);
  P.engines = [0, 1, 2].map(i => { const a = i / 3 * Math.PI * 2 + Math.PI / 2, b = ionEngine(.62, M); b.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, -10.35); s.add(b); return b; });
  const mn = magNozzle(M); mn.position.z = -10.4; s.add(mn); P.core = mn.userData.core;
  // antena
  add(s, new THREE.CylinderGeometry(.05, .05, 2.4, 8), M.metal, 0, 2.2, 6.6); const dish = add(s, new THREE.SphereGeometry(.9, 32, 12, 0, Math.PI * 2, 0, .9), M.hull2, 0, 3.3, 6.6, -Math.PI / 2 + .4); dish.material = M.hull2.clone(); dish.material.side = THREE.DoubleSide;
  { let i = 0; const bands = [[7.15, 1.25, 24], [9.2, 1.18, 20], [-7.6, 1.56, 28], [-8.6, 1.62, 28], [-9.4, 1.66, 28]];
    greebles(s, M, 384, 11, R => { const [z, r, n] = bands[i % bands.length], k = Math.floor(i / bands.length) % n; i++; const a = k / n * Math.PI * 2 + (z > 0 ? .1 : 0); return [new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z + (R() - .5) * .25), new THREE.Vector3(Math.cos(a), Math.sin(a), 0)]; }); }
  // tubulações correndo pela espinha (dão escala e lógica mecânica)
  for (const [x, y, rr] of [[.3, .62, .06], [-.3, .62, .05], [.62, -.25, .07], [-.62, .28, .045]]) add(s, cylZ(rr, rr, 14.6, 10), M.hull2, x, y, -1);
  P.nav = navLights(s, M, [RAD[0].userData.tip, RAD[1].userData.tip, [0, 1.3, 10.6], [0, -1.6, -9]]);
  return s;
}
// ---------- B · LÂMINA: casco em ponta de flecha, naceles duplas, aletas ----------
function shipB(M) {
  const s = new THREE.Group(), P = s.userData;
  const sh = new THREE.Shape(); sh.moveTo(0, 10.5); sh.lineTo(1.4, 6); sh.lineTo(3.6, -2); sh.lineTo(4.2, -7); sh.lineTo(1.8, -8); sh.lineTo(-1.8, -8); sh.lineTo(-4.2, -7); sh.lineTo(-3.6, -2); sh.lineTo(-1.4, 6); sh.closePath();
  const hull = new THREE.ExtrudeGeometry(sh, { depth: .9, bevelEnabled: true, bevelThickness: .35, bevelSize: .3, bevelSegments: 4 }); hull.rotateX(-Math.PI / 2); hull.translate(0, -.45, 0);
  const hm = add(s, hull, M.hull); hm.scale.y = 1;
  const top = new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: true, bevelThickness: .25, bevelSize: .2, bevelSegments: 3 }); top.rotateX(-Math.PI / 2); top.scale(.55, 1, .7); top.translate(0, .55, -1.4); add(s, top, M.hull2);
  add(s, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.canopy, 0, .95, 4.2).scale.set(.75, .45, 1.6);
  P.engines = [1, -1].map(sg => { add(s, cylZ(.95, .85, 7.5), M.hull2, sg * 3.7, 0, -4.2); add(s, cylZ(1.02, 1.02, .5), M.dark, sg * 3.7, 0, -1); add(s, new THREE.TorusGeometry(.98, .08, 8, 48), M.gold, sg * 3.7, 0, -6); const b = bell(.8, 1.6, M); b.position.set(sg * 3.7, 0, -8); s.add(b); return b; });
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(-3.2, 2.6); fin.lineTo(-4.4, 2.6); fin.lineTo(-2.2, 0); fin.closePath();
  [1, -1].forEach(sg => { const g = new THREE.ExtrudeGeometry(fin, { depth: .12, bevelEnabled: false }); g.rotateY(Math.PI / 2); const m = add(s, g, M.hull2, sg * 1.6, .5, -4.5, 0, 0, sg * -.25); });
  P.windows = [windowsRing(s, M, .0, 0, 0)];
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: hullText('X-12'), transparent: true, depthWrite: false })); nm.position.set(2.2, .82, 0); nm.rotation.x = -Math.PI / 2; nm.rotation.z = Math.PI / 2 + .3; s.add(nm);
  greebles(s, M, 180, 21, R => { const z = -7 + R() * 12, w = 3.4 * (1 - (z + 7) / 18), x = (R() - .5) * 2 * w * .8; return [new THREE.Vector3(x, .78, z), new THREE.Vector3(0, 1, 0)]; });
  P.nav = navLights(s, M, [[4.3, 0, -7], [-4.3, 0, -7], [0, .9, 10]]);
  return s;
}
// ---------- C · ARCA: casco hexagonal, anéis de tanques, painéis solares em X ----------
function shipC(M) {
  const s = new THREE.Group(), P = s.userData;
  add(s, new THREE.CylinderGeometry(2.3, 2.3, 10, 6, 1).rotateX(Math.PI / 2), M.hull, 0, 0, -2.5);
  add(s, new THREE.CylinderGeometry(1.4, 2.3, 2.2, 6, 1).rotateX(Math.PI / 2), M.hull2, 0, 0, 3.6);
  add(s, new THREE.CylinderGeometry(1.4, 1.4, 2.4, 6, 1).rotateX(Math.PI / 2), M.hull, 0, 0, 5.9);
  add(s, new THREE.CylinderGeometry(.6, 1.4, 1.4, 6, 1).rotateX(Math.PI / 2), M.canopy, 0, 0, 7.8);
  P.windows = [windowsRing(s, M, 1.38, 6.2, 24), windowsRing(s, M, 2.29, -1, 40)];
  for (const z of [-1.2, -4.6]) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(s, new THREE.SphereGeometry(.78, 24, 16), M.gold, Math.cos(a) * 2.75, Math.sin(a) * 2.75, z); }
  P.rads = [0, 1, 2, 3].map(i => { const a = Math.PI / 4 + i * Math.PI / 2, g = new THREE.Group(); g.rotation.z = a; s.add(g); add(g, new THREE.CylinderGeometry(.08, .08, 3, 8), M.metal, 0, 3.4, .6); const p = add(g, new THREE.BoxGeometry(2.4, 9, .05), M.solar, 0, 9.4, .6); return p; });
  add(s, cylZ(2.3, 2.9, 1.6), M.dark, 0, 0, -8.3);
  const b = bell(2.4, 3.6, M); b.position.z = -9.1; s.add(b); P.engines = [b];
  greebles(s, M, 240, 31, R => { const z = -7.4 + R() * 9.6, k = Math.floor(R() * 6), a = k / 6 * Math.PI * 2 + Math.PI / 6, r = 2.3 * Math.cos(Math.PI / 6), t = (R() - .5) * 2.2;
    const n = new THREE.Vector3(Math.cos(a), Math.sin(a), 0); return [new THREE.Vector3(n.x * r - n.y * t, n.y * r + n.x * t, z), n]; });
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .85), new THREE.MeshBasicMaterial({ map: hullText('ODISSEIA'), transparent: true, depthWrite: false })); nm.position.set(2.0, 0, -4.8); nm.rotation.y = Math.PI / 2; nm.rotation.z = 0; s.add(nm); nm.position.x = 2.0;
  P.nav = navLights(s, M, [[0, 2.4, 8.3], [0, -2.4, -8]]);
  return s;
}
export function buildShip(v = 'A', M = materials()) { const s = v === 'A' ? shipA(M) : v === 'B' ? shipB(M) : shipC(M); s.userData.M = M; return s; }
// potência 0..1 e tempo (para a cintilação). Ignição: começa tremida, estabiliza; o bocal esquenta e esfria devagar.
export function setEngine(ship, p, t = 0, heat = p) { (ship.userData.engines || []).forEach((e, i) => { const U = e.userData, P = Math.min(p, 1.15);   // motor iônico: liga suave, sem tremer (não é chama)
  U.glow.forEach(m => m.material.opacity = Math.min(.8, P * .7)); U.bell.emissiveIntensity = 0;
  U.plume.userData.layers.forEach(m => { const L = (1.2 + 3.2 * P) * U.r; m.scale.set(1, 1, L); m.material.uniforms.uT.value = t + i; m.material.uniforms.uP.value = P; m.material.uniforms.uL.value = L; m.visible = P > .01; });
  U.light.intensity = P * .7; });
  if (ship.userData.core) ship.userData.core.material.opacity = Math.min(1, p);
  (ship.userData.rads || []).forEach(r => r.material.emissiveIntensity = heat * .012); }
