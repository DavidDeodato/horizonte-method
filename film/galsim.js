// galsim.js — colisão de galáxias SIMULADA (problema restrito de 3 corpos, estilo Toomre & Toomre 1972).
// Dois núcleos massivos se atraem (com atrito dinâmico para fundirem); dezenas de milhares de estrelas-teste
// orbitam seus núcleos e são arrancadas pela maré: braços, pontes e caudas surgem sozinhos da física.
// Tudo é calculado uma vez no carregamento e guardado em instantâneos → o filme interpola (determinístico).
import * as THREE from 'three';
export function simulateCollision({ N = 40000, steps = 3200, every = 10, dt = .006, seed = 5 } = {}) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const M = [1, .85], EPS = .12, EPS_C = .25;
  // órbita dos núcleos: aproximação com parâmetro de impacto (passagem rasante, depois fusão)
  const c = [[-2.1, 0, -.6], [2.1, .25, .6]], v = [[0, 0, 0], [0, 0, 0]];
  { const rel = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]], d = Math.hypot(...rel), u = rel.map(x => x / d), perp = [-u[2], 0, u[0]];
    const vr = rel.map((_, i) => -.32 * u[i] + .42 * perp[i]); const mt = M[0] + M[1]; v[0] = vr.map(x => -x * M[1] / mt); v[1] = vr.map(x => x * M[0] / mt); }
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), gal = new Uint8Array(N);
  const normals = [[0, 1, 0], [.35, .88, .32]].map(n => { const l = Math.hypot(...n); return n.map(x => x / l); });
  for (let i = 0; i < N; i++) { const g = i < N * .55 ? 0 : 1; gal[i] = g; const n = normals[g]; const bulge = r() < .16;
    const a = [1, 0, 0], e1 = norm(cross(n, Math.abs(n[0]) < .9 ? a : [0, 0, 1])), e2 = cross(n, e1);
    let p, vv;
    if (bulge) { const rr = Math.pow(r(), 1.8) * .22; const th = r() * 6.283, ph = Math.acos(2 * r() - 1); p = [rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph) * .6, rr * Math.sin(ph) * Math.sin(th)];
      const vc = Math.sqrt(M[g] * rr * rr / Math.pow(rr * rr + EPS * EPS, 1.5)); const rd = [r() - .5, r() - .5, r() - .5]; vv = rd.map(x => x * vc * .9); }
    else { const rr = Math.min(2.0, .14 + -Math.log(1 - r() * .97) * .55), th = r() * 6.283; const arm = Math.sin(2 * (th - Math.log(rr) * 1.1)); if (arm < .1 && r() < .82) { i--; continue; }
      const h = (r() - .5) * .03; p = [0, 1, 2].map(k => e1[k] * Math.cos(th) * rr + e2[k] * Math.sin(th) * rr + n[k] * h);
      const vc = Math.sqrt(M[g] * rr * rr / Math.pow(rr * rr + EPS * EPS, 1.5)); const t = [0, 1, 2].map(k => -e1[k] * Math.sin(th) + e2[k] * Math.cos(th)); vv = t.map(x => x * vc); }
    for (let k = 0; k < 3; k++) { pos[i * 3 + k] = c[g][k] + p[k]; vel[i * 3 + k] = v[g][k] + vv[k]; }
    const rr = Math.hypot(...p), hii = !bulge && rr > .3 && r() < .07; const cc = bulge ? [1, .8, .55] : hii ? [1, .32, .5] : rr < .35 ? [1, .86, .66] : rr < .7 ? [.85, .85, .9] : [.5 + .2 * r(), .66 + .15 * r(), 1];
    const dim = bulge ? .22 : .9 * Math.min(1, .3 + rr * 1.1); col.set(cc.map(x => x * dim), i * 3); size[i] = bulge ? 1.4 + r() : hii ? 2.4 + r() * 2 : .8 + r() * 1.2; }
  const K = Math.floor(steps / every) + 1, snaps = new Float32Array(K * N * 3), cent = new Float32Array(K * 6); let k = 0;
  const snap = () => { snaps.set(pos, k * N * 3); cent.set([...c[0], ...c[1]], k * 6); k++; };
  snap();
  for (let st = 1; st <= steps; st++) {
    // núcleos: atração mútua + atrito dinâmico depois do primeiro encontro (fazem a fusão acontecer)
    const rel = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]], d2 = rel[0] ** 2 + rel[1] ** 2 + rel[2] ** 2 + EPS_C * EPS_C, inv = 1 / Math.pow(d2, 1.5), d = Math.sqrt(d2);
    for (let q = 0; q < 3; q++) { v[0][q] += M[1] * rel[q] * inv * dt; v[1][q] -= M[0] * rel[q] * inv * dt; }
    const fr = Math.exp(-dt * .9 / Math.max(.35, d * d)); const mt = M[0] + M[1]; const vcm = [0, 1, 2].map(q => (v[0][q] * M[0] + v[1][q] * M[1]) / mt);
    for (let g = 0; g < 2; g++) for (let q = 0; q < 3; q++) v[g][q] = vcm[q] + (v[g][q] - vcm[q]) * fr;
    for (let g = 0; g < 2; g++) for (let q = 0; q < 3; q++) c[g][q] += v[g][q] * dt;
    for (let i = 0; i < N; i++) { const o = i * 3; let ax = 0, ay = 0, az = 0;
      for (let g = 0; g < 2; g++) { const dx = c[g][0] - pos[o], dy = c[g][1] - pos[o + 1], dz = c[g][2] - pos[o + 2], q2 = dx * dx + dy * dy + dz * dz + EPS * EPS, f = M[g] / (q2 * Math.sqrt(q2)); ax += dx * f; ay += dy * f; az += dz * f; }
      vel[o] += ax * dt; vel[o + 1] += ay * dt; vel[o + 2] += az * dt; pos[o] += vel[o] * dt; pos[o + 1] += vel[o + 1] * dt; pos[o + 2] += vel[o + 2] * dt; }
    if (st % every === 0) snap(); }
  return { N, K, snaps, cent, col, size, gal };
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { const l = Math.hypot(...a); return a.map(x => x / l); }
}
// Pontos que mostram a simulação no instante u ∈ [0,1] (interpolando os instantâneos)
export function collisionPoints(sim, H) {
  const g = new THREE.BufferGeometry(), P = new Float32Array(sim.N * 3); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aC', new THREE.BufferAttribute(sim.col, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sim.size, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uScale: { value: H * 2.6 }, uB: { value: 1 }, uNear: { value: 0 }, uMax: { value: 9 } },
    vertexShader: 'attribute vec3 aC;attribute float aS;uniform float uScale,uB,uNear,uMax;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=aC*uB*smoothstep(uNear*.4,uNear,-mv.z);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aS*uScale/(-mv.z),1.,uMax);}',
    fragmentShader: 'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vC*(1.-smoothstep(.1,.5,d))*.55,1.);}' });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false;
  pts.userData = { m, setU(u) { const f = Math.min(sim.K - 1.0001, Math.max(0, u * (sim.K - 1))), a = Math.floor(f), w = f - a, A = a * sim.N * 3, B = (a + 1) * sim.N * 3, S = sim.snaps;
      for (let i = 0; i < sim.N * 3; i++) P[i] = S[A + i] + (S[B + i] - S[A + i]) * w; g.attributes.position.needsUpdate = true;
      const ca = sim.cent.subarray(a * 6, a * 6 + 6), cb = sim.cent.subarray((a + 1) * 6, (a + 1) * 6 + 6); return [0, 1, 2, 3, 4, 5].map(i => ca[i] + (cb[i] - ca[i]) * w); } };
  return pts;
}
