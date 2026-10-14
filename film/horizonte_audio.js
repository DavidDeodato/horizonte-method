// horizonte3_audio.js — trilha do HORIZONTE v2: íntimo → BOOM → tema → BATERIA 120 BPM (supernova/pulsar/galáxias) → órgão pesado → silêncio → lá maior.
export function buildAudio(ctx, T0, DUR, X = {}) {
  const at = s => T0 + s, SR = ctx.sampleRate;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const nb = b => { const x = ctx.createBuffer(2, SR * 4, SR); for (let c = 0; c < 2; c++) { const d = x.getChannelData(c); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (b) { l = (l + .02 * w) / 1.02; d[i] = l * 3.5; } else d[i] = w; } } return x; };
  const WH = nb(0), BR = nb(1);
  const master = ctx.createGain(); master.gain.value = .8; const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .2; master.connect(comp); comp.connect(ctx.destination);
  const ir = ctx.createBuffer(2, SR * 5, SR); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.3) * (i < SR * .02 ? i / (SR * .02) : 1); }
  const rev = ctx.createConvolver(); rev.buffer = ir; const revG = ctx.createGain(); revG.gain.value = .5; rev.connect(revG); revG.connect(master);
  const music = ctx.createGain(); const mHP = ctx.createBiquadFilter(); mHP.type = 'highpass'; mHP.frequency.value = 45; const mLP = ctx.createBiquadFilter(); mLP.type = 'lowpass'; mLP.frequency.value = 10000;
  music.connect(mHP); mHP.connect(mLP); mLP.connect(master); const mW = ctx.createGain(); mW.gain.value = .6; mLP.connect(mW); mW.connect(rev);
  const drums = ctx.createGain(); drums.connect(master); const dW = ctx.createGain(); dW.gain.value = .18; drums.connect(dW); dW.connect(rev);
  const sfx = ctx.createGain(); sfx.connect(master); const sW = ctx.createGain(); sW.gain.value = .3; sfx.connect(sW); sW.connect(rev);
  const G = v => { const g = ctx.createGain(); g.gain.value = v; return g; }, F = (ty, f, q = .7) => { const b = ctx.createBiquadFilter(); b.type = ty; b.frequency.value = f; b.Q.value = q; return b; };
  const O = (ty, f, t, d) => { const o = ctx.createOscillator(); o.type = ty; o.frequency.value = f; o.start(at(t)); o.stop(at(t + d)); return o; };
  const N = (b, t, d) => { const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.start(at(t), rnd() * 3); s.stop(at(t + d)); return s; };
  const env = (p, t, pk, a, d) => { p.setValueAtTime(.0001, at(t)); p.exponentialRampToValueAtTime(Math.max(pk, .0002), at(t + a)); p.exponentialRampToValueAtTime(.0001, at(t + a + d)); };
  const bed = (p, t0, t1, v, fi, fo) => { p.setValueAtTime(0, at(t0)); p.linearRampToValueAtTime(v, at(t0 + fi)); p.setValueAtTime(v, at(t1 - fo)); p.linearRampToValueAtTime(0, at(t1)); };
  const duck = (t, d = .25, r = 1.5) => { music.gain.setValueAtTime(1, at(t - .02)); music.gain.linearRampToValueAtTime(d, at(t + .02)); music.gain.linearRampToValueAtTime(1, at(t + r)); };
  const pan = (n, p) => { const s = ctx.createStereoPanner(); s.pan.value = p; n.connect(s); return s; };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12); const pitchBus = [];
  function organ(t, m, d, v, bright = 1, bus = music, p = 0) { const f = hz(m), g = G(0); g.gain.setValueAtTime(0, at(t)); g.gain.linearRampToValueAtTime(v, at(t + .05)); g.gain.setValueAtTime(v, at(t + d)); g.gain.linearRampToValueAtTime(0, at(t + d + .4));
    [[.5, m < 48 ? .45 : m < 60 ? .12 : 0], [1, 1], [2, .55 * bright], [3, .22 * bright], [4, .16 * bright], [6, .06 * bright]].filter(q => q[1] > 0).forEach(([r, a], k) => { const o = O('sine', f * r, t, d + .45); const ga = G(a); o.connect(ga); ga.connect(g); pitchBus.push(o);
      if (r === 1) { const o2 = O('sine', f, t, d + .45); o2.detune.value = 4; const g2 = G(.5); o2.connect(g2); g2.connect(g); pitchBus.push(o2); } });
    (p ? pan(g, p) : g).connect(bus); }
  function choir(t0, t1, ms, v) { const out = G(0); bed(out.gain, t0, t1, v, 2, 2); out.connect(music); ms.forEach((m, i) => [-6, 6].forEach(dt => { const o = O('sawtooth', hz(m), t0, t1 - t0 + .1); o.detune.value = dt + (i % 2 ? 3 : -3); pitchBus.push(o);
      [[730, 1.2], [1090, .8], [2440, .35]].forEach(([fq, a]) => { const b = F('bandpass', fq, 7), g = G(a * .12); o.connect(b); b.connect(g); g.connect(out); }); })); }
  function pad(t0, t1, ms, v, cut = 1400) { const out = G(0); bed(out.gain, t0, t1, v, 2.5, 2.5); const lp = F('lowpass', cut, .6); lp.connect(out); out.connect(music); ms.forEach(m => [-7, 7].forEach(dt => { const o = O('sawtooth', hz(m), t0, t1 - t0 + .1); o.detune.value = dt; o.connect(lp); pitchBus.push(o); })); }
  function bell(t, m, v, d = 2.5, p = 0) { [[1, 1], [2.76, .35], [5.4, .12]].forEach(([r, a]) => { const o = O('sine', hz(m) * r, t, d), g = G(0); env(g.gain, t, v * a, .003, d / r ** .5); o.connect(g); pan(g, p).connect(music); }); }
  function tick(t, hi, v = .06) { const n = N(WH, t, .05), f = F('highpass', hi ? 3500 : 2400), g = G(0); env(g.gain, t, v, .001, .02); n.connect(f); f.connect(g); g.connect(sfx); const o = O('sine', hi ? 2100 : 1500, t, .08), g2 = G(0); env(g2.gain, t, v * .6, .001, .05); o.connect(g2); g2.connect(sfx); }
  function boom(t, size, v, dk = true) { const o = O('sine', 95, t, 4 * size); o.frequency.exponentialRampToValueAtTime(22, at(t + 2.2 * size)); const g = G(0); env(g.gain, t, v, .005, 3.5 * size); o.connect(g); g.connect(sfx);
    const n = N(BR, t, 4 * size), f = F('lowpass', 3000); f.frequency.exponentialRampToValueAtTime(60, at(t + 3 * size)); const g2 = G(0); env(g2.gain, t, v * 1.1, .004, 3.6 * size); n.connect(f); f.connect(g2); g2.connect(sfx);
    const c = N(WH, t, .4), hf = F('highpass', 2500), g3 = G(0); env(g3.gain, t, v * .4, .002, .25); c.connect(hf); hf.connect(g3); g3.connect(sfx); if (dk) duck(t, .2, 2 * size); }
  function whoosh(t, d, f0, f1, v, p0 = -.7, p1 = .7) { const n = N(WH, t, d), f = F('bandpass', f0, 1.2); f.frequency.setValueAtTime(f0, at(t)); f.frequency.exponentialRampToValueAtTime(f1, at(t + d)); const g = G(0);
    g.gain.setValueAtTime(.0001, at(t)); g.gain.exponentialRampToValueAtTime(v, at(t + d * .6)); g.gain.exponentialRampToValueAtTime(.0001, at(t + d)); const p = ctx.createStereoPanner(); p.pan.setValueAtTime(p0, at(t)); p.pan.linearRampToValueAtTime(p1, at(t + d)); n.connect(f); f.connect(g); g.connect(p); p.connect(sfx); }
  function riser(t, d, v) { const n = N(WH, t, d), f = F('bandpass', 300, 3); f.frequency.exponentialRampToValueAtTime(9000, at(t + d)); const g = G(0); g.gain.setValueAtTime(0, at(t)); g.gain.linearRampToValueAtTime(v, at(t + d)); g.gain.setValueAtTime(0, at(t + d + .01)); n.connect(f); f.connect(g); g.connect(sfx);
    for (let k = 0; k < 6; k++) { const o = O('sine', 55 * Math.pow(2, k), t, d + .02), gk = G(0); o.frequency.exponentialRampToValueAtTime(55 * Math.pow(2, k + 1), at(t + d)); const w = Math.exp(-Math.pow((k - 2.5) / 1.6, 2)) * v * .25; gk.gain.setValueAtTime(0, at(t)); gk.gain.linearRampToValueAtTime(w, at(t + d)); gk.gain.setValueAtTime(0, at(t + d + .01)); o.connect(gk); gk.connect(sfx); } }
  function suck(t, d, v) { const n = N(WH, t - d, d), f = F('lowpass', 400); f.frequency.setValueAtTime(400, at(t - d)); f.frequency.exponentialRampToValueAtTime(15000, at(t)); const g = G(0); g.gain.setValueAtTime(.0001, at(t - d)); g.gain.exponentialRampToValueAtTime(v, at(t - .01)); g.gain.setValueAtTime(0, at(t)); n.connect(f); f.connect(g); g.connect(sfx); }
  function heart(t, v) { [0, .2].forEach((dt, k) => { const o = O('sine', 62, t + dt, .35); o.frequency.exponentialRampToValueAtTime(34, at(t + dt + .14)); const g = G(0); env(g.gain, t + dt, k ? v * .6 : v, .004, .28); o.connect(g); g.connect(sfx); }); }
  // bateria sintetizada
  function kick(t, v) { const o = O('sine', 150, t, .5); o.frequency.exponentialRampToValueAtTime(40, at(t + .12)); const g = G(0); env(g.gain, t, v, .002, .4); o.connect(g); g.connect(drums); }
  function snare(t, v) { const n = N(WH, t, .3), f = F('bandpass', 1800, .7), g = G(0); env(g.gain, t, v, .001, .18); n.connect(f); f.connect(g); g.connect(drums); const o = O('triangle', 185, t, .2), g2 = G(0); env(g2.gain, t, v * .5, .001, .1); o.connect(g2); g2.connect(drums); }
  function hat(t, v) { const n = N(WH, t, .06), f = F('highpass', 8000), g = G(0); env(g.gain, t, v, .001, .035); n.connect(f); f.connect(g); pan(g, (rnd() - .5) * .5).connect(drums); }
  function tom(t, f0, v) { const o = O('sine', f0, t, .5); o.frequency.exponentialRampToValueAtTime(f0 * .5, at(t + .25)); const g = G(0); env(g.gain, t, v, .002, .35); o.connect(g); g.connect(drums); }
  function bassNote(t, m, d, v) { const o = O('sawtooth', hz(m), t, d + .05), o2 = O('square', hz(m) * .5, t, d + .05), f = F('lowpass', 500, 4), g = G(0); f.frequency.setValueAtTime(1600, at(t)); f.frequency.exponentialRampToValueAtTime(300, at(t + d)); env(g.gain, t, v, .005, d); o.connect(f); o2.connect(f); f.connect(g); g.connect(music); }
  const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  function ostinato(t0, t1, shift, v, beat, oct = 0, p = 0, dens = 2) { let k = 0; const bar = beat * 4; for (let t = t0; t < t1 - .05; t += beat / dens, k++) { const ch = PROG[Math.floor((t - t0) / (bar * 2)) % 4].map(m => m + shift + oct);
      const pat = [ch[0], ch[2], ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 12, ch[1] + 12, ch[2]]; organ(t, pat[k % 8] + 12, beat / dens * .9, v * (k % 8 === 0 ? 1.15 : .9), .7, music, p); } }

  // ===== 0–4 · INTRO =====
  heart(.3, .32); heart(1.35, .32); heart(2.4, .35); heart(3.45, .38);
  [[.3, 33], [1.4, 56]].forEach(([t0, n]) => { for (let i = 0; i < n; i += 2) { const t = t0 + i / 48, c = N(WH, t, .03), hf = F('highpass', 4500), g = G(0); env(g.gain, t, .03, .001, .01); c.connect(hf); hf.connect(g); g.connect(sfx); } });
  { const o = O('sine', 55, 0, 5), g = G(0); bed(g.gain, 0, 5, .06, 1.5, 1); o.connect(g); g.connect(sfx); }
  // ===== 4–24 · LANÇAMENTO =====
  shimmer(4.2, 6, [81, 88], .012); organ(5, 33, 19, .07, .35); pad(5, 24.2, [57, 64, 69, 72], .05, 900);
  boom(8.6, .7, .3); choir(8.8, 15.5, [57, 64, 69, 76], .06); bell(9.2, 81, .05, 4); bell(10.4, 76, .04, 4);
  engineSpin(16.5, 29.3, .07);

  for (let t = 18, k = 0; t < 26; t += .4167, k++) bassNote(t, [45, 45, 52, 45][k % 4], .3, .05 + (t - 18) * .006);       // pulso que acelera a vontade de partir
  // ===== 24–30 · O SALTO =====
  { const TC = 26.2, TG = 29.3; riser(TC, TG - TC, .45); suck(TG, .55, .5); const o = O('sine', 90, TG, 4), g = G(0); o.frequency.exponentialRampToValueAtTime(20, at(TG + 2.6)); env(g.gain, TG, 1, .008, 3.4); o.connect(g); g.connect(sfx); boom(TG, 1.3, .9);
    music.gain.setValueAtTime(1, at(TG - .6)); music.gain.linearRampToValueAtTime(0, at(TG)); music.gain.setValueAtTime(0, at(TG + .6)); music.gain.linearRampToValueAtTime(1, at(TG + 1.6)); shimmer(TG + .5, 2.5, [88, 95, 100], .018); }
  // ===== 30–108 · O CICLO DE UMA ESTRELA (um lugar só, time-lapse) =====
  const B72 = 60 / 72, PUL = (X && X.pulses) || [];
  [36, 43, 48].forEach((m, k) => { const o = O('sine', hz(m), 30, 12.6), g = G(0); o.frequency.exponentialRampToValueAtTime(hz(m + 5), at(42.3)); bed(g.gain, 30, 42.6, .09 - k * .02, 3, .3); o.connect(g); g.connect(sfx); });
  for (let t = 35.5, k = 0; t < 42.2; k++) { const o = O('sine', 52, t, .4), g = G(0); o.frequency.exponentialRampToValueAtTime(33, at(t + .2)); env(g.gain, t, .12 + k * .012, .004, .3); o.connect(g); g.connect(sfx); t += Math.max(.16, 1.15 * Math.pow(.84, k)); }
  pad(30.2, 43, [45, 52, 57, 60], .05, 700); choir(33, 46, [57, 64, 69], .045);
  ignite(42.4, .6); choir(42.5, 48, [57, 64, 69, 76, 81], .05); bell(42.6, 81, .06, 4); shimmer(42.5, 6, [88, 93, 96], .016);          // IGNIÇÃO: trovão que cresce + coro
  ostinato(44, 70, 0, .04, B72); for (let t = 46.5; t < 59.5; t += B72 / 2) if (rnd() < .55) bell(t, [81, 84, 86, 88, 91, 93][Math.floor(rnd() * 6)], .02, 1.6, rnd() * 1.4 - .7);
  for (let t = 50; t < 70; t += B72 * 8) organ(t, [45, 41, 36, 43][Math.floor((t - 50) / (B72 * 8)) % 4], B72 * 8 - .2, .085, .25);
  choir(60, 70.5, [57, 64, 69, 76], .045);
  [[70, [33, 45, 52, 57]], [76, [31, 43, 50, 55]]].forEach(([t, ch]) => ch.forEach((m, k) => organ(t, m, 6, k ? .045 : .11, .5)));
  for (let t = 70.5; t < 82; t += 1.5 - (t - 70) * .05) heart(t, .26);
  engulf(74.6, .45); engulf(78.1, .5);                                                                                       // planetas engolidos: chiado + gemido metálico
  music.gain.setValueAtTime(1, at(84.6)); music.gain.linearRampToValueAtTime(.05, at(85.9)); implode(84.5, 86, .35);        // colapso: tudo é sugado para dentro
  supernova(86, .95); music.gain.setValueAtTime(.05, at(86)); music.gain.linearRampToValueAtTime(1, at(88.5)); const B = .5, T1 = 87;                                                                                  // SUPERNOVA: impacto único, cauda longa e metálica
  function groove(t0, t1, v, dbl = false) { for (let t = t0, k = 0; t < t1 - .01; t += B, k++) { const bar = Math.floor((t - T1) / (B * 4)), ch = PROG[((bar % 4) + 4) % 4];
      if (k % 4 === 0 || k % 4 === 2 || (dbl && rnd() < .3)) kick(t, v); if (k % 4 === 1 || k % 4 === 3) snare(t, v * .55); hat(t, v * .12); hat(t + B / 2, v * .08);
      bassNote(t, ch[0] - 12, B * .45, v * .22); bassNote(t + B / 2, ch[0] - (k % 2 ? 0 : 12), B * .4, v * .16); if (k % 8 === 0) ch.forEach(m => organ(t, m + 12, B * 1.6, v * .05, 1)); } }
  groove(87, 106, .85, true); choir(87, 106.5, [57, 60, 64, 69], .045);
  shock(90.2, .5);                                                                                                            // onda de choque: vento + detritos passando
  { const n = N(WH, 94, 23), b = F('bandpass', 1900, .9), g = G(0); bed(g.gain, 94, 117, .012, 3, 4); n.connect(b); b.connect(g); g.connect(sfx); }   // estática de rádio
  { const o = O('sawtooth', 29.9, 95.5, 21.5), hp = F('highpass', 700, .7), lp = F('lowpass', 3500), g = G(0); bed(g.gain, 95.5, 116.8, .055, 2, 4); o.connect(hp); hp.connect(lp); lp.connect(g); g.connect(sfx); const o2 = O('square', 29.9, 95.5, 21.5), l2 = F('lowpass', 110, 2), g2 = G(0); bed(g2.gain, 95.5, 116.8, .08, 2, 4); o2.connect(l2); l2.connect(g2); g2.connect(sfx); }                      // PULSAR: cada clarão na tela é um clique
  for (let t = 104.6; t < 106.4; t += .125) tom(t, 90 + (t - 104.6) * 80, .38);
  engineSpin(103, 107.2, .06); saltoSfx(104.6, 107.2);                                                                           // a nave gira os motores e dobra o espaço
  // ===== 108–150 · ESCALA: vizinhança → galáxia → colisão → o centro (sem pancadas: só crescendo) =====
  pad(107.4, 126, [45, 52, 57, 64, 69, 76], .05, 2200); choir(110, 126, [57, 64, 69, 72, 76], .055);
  ostinato(112, 140, 0, .032, B72 * .75, 12, .35, 2);
  [[108.5, [33, 45]], [114.5, [29, 41]], [120.5, [24, 36]]].forEach(([t, ch]) => ch.forEach((m, k) => organ(t, m, 6, k ? .06 : .12, .4)));
  shimmer(117.4, 7, [81, 86, 88, 93], .014);
  // colisão: gemido gravitacional grave, coro grande, tambores lentos de passo largo
  groan(124, 142, .08); choir(124, 142, [45, 52, 57, 64, 69, 76], .06); pad(124, 142, [41, 48, 53, 60, 65], .045, 1600);
  [[124.5, [29, 41]], [130.5, [31, 43]], [136.5, [33, 45]]].forEach(([t, ch]) => ch.forEach((m, k) => organ(t, m, 6, k ? .06 : .12, .5)));
  for (let t = 124.6, k = 0; t < 139.8; t += .75, k++) { tom(t, k % 4 === 0 ? 70 : 95, k % 4 === 0 ? .42 : .22); if (k % 8 === 7) tom(t + .375, 120, .2); }
  glide(131, 6, [69, 76, 81], -7, .03);                                                                                       // as caudas de maré esticando
  // mergulho no centro
  for (let t = 138; t < 145.2; t += .5 * Math.pow(.86, (t - 138) / .5 * .3)) kick(t, .22 + (t - 138) * .05);
  // saltos de escala: o mesmo som de dobra, mais curto
  saltoLite(115.2); saltoLite(124); saltoLite(145.5);
  // colisão das rochas, ronco do motor durante a viagem, passagens de câmera
  crunch(55.2, .55);
  { const o = O('sawtooth', 46, 30, 77.4), lp = F('lowpass', 170, 2), g = G(0); bed(g.gain, 30.5, 107.2, .045, 2, .4); o.connect(lp); lp.connect(g); g.connect(sfx); const o2 = O('sawtooth', 46.6, 30, 77.4); o2.connect(lp); }
  [36.7, 46, 50.5, 59.5, 66.2, 72, 79.4, 84.2, 94, 99, 104.5].forEach((t, i) => whoosh(t - 1.1, 2.4, 260, 2400, .11, i % 2 ? .7 : -.7, i % 2 ? -.7 : .7));
  for (let T of [107.2, 115.2, 124]) { const o = O('sawtooth', 52, T + .3, (T === 124 ? 21 : 7.6)), lp = F('lowpass', 150, 2), g = G(0); bed(g.gain, T + .3, T + (T === 124 ? 21 : 7.7), .04, 1.5, .3); o.connect(lp); lp.connect(g); g.connect(sfx); }
  pad(140, 150.2, [57, 64, 69, 76, 81], .055, 3500); suck(150, .9, .45);
  // ===== 150–206 · BURACO NEGRO (um movimento só) =====
  [[150.1, [45, 57, 64, 69, 72, 76]], [156.3, [41, 53, 60, 65, 69, 77]], [162.3, [36, 48, 55, 60, 64, 72]], [168.3, [43, 55, 62, 67, 71, 74]], [174.3, [41, 53, 60, 65, 69, 72]], [180.3, [40, 52, 59, 64, 68, 71]], [186.3, [45, 57, 64, 69, 72, 76]]].forEach(([t, ch], i, arr) => {
    const d = (arr[i + 1] ? arr[i + 1][0] : 192.3) - t; ch.forEach((m, k) => organ(t, m, d - .1, k === 0 ? .13 : .05, .9)); });
  { const o = O('sine', 30, 150, 5), g = G(0); env(g.gain, 150, .5, .6, 4); o.connect(g); g.connect(sfx); }                 // o centro se abre: sub, sem pancada
  boom(152.05, 1.1, .7);
  choir(152, 192.4, [57, 64, 69, 76], .055); { const n = N(BR, 150, 56), f = F('lowpass', 200), g = G(0); bed(g.gain, 150, 206, .18, 6, .3); f.frequency.setValueAtTime(120, at(150)); f.frequency.linearRampToValueAtTime(420, at(200)); n.connect(f); f.connect(g); g.connect(sfx); }
  whoosh(156.5, 5, 300, 1800, .16, -.6, .6); whoosh(166.6, 4.5, 400, 2400, .18, .8, -.6); whoosh(177.6, 4.5, 2400, 300, .16, -.7, .5); whoosh(184.8, 4.6, 600, 3000, .14, .5, -.5);   // a câmera passa
  for (let t = 168, k = 0; t < 182; t += 1.1 + rnd() * .9, k++) whoosh(t, 1.6, 200, 900, .07, rnd() * 2 - 1, rnd() * 2 - 1);  // turbulência perto do disco
  for (let t = 176.5; t < 191; t += 1.6 + (t - 176) * .25) heart(t, .3);
  // ===== 192–206 · PONTO DE VISTA: tudo desce e estica =====
  organ(192.2, 45, 13.7, .12, .7); organ(192.2, 57, 13.7, .06, .7); organ(192.2, 64, 13.7, .05, .7); choir(192.2, 205.9, [57, 64, 69], .07);
  pitchBus.forEach(o => { o.detune.setValueAtTime(o.detune.value, at(192.2)); o.detune.linearRampToValueAtTime(o.detune.value - 2400, at(205.9)); });
  mLP.frequency.setValueAtTime(10000, at(194)); mLP.frequency.exponentialRampToValueAtTime(300, at(205.8));
  for (let t = 198; t < 205.6; t += .35 + rnd() * .4) { const n = N(WH, t, 1.2), f = F('bandpass', 2000 + rnd() * 2000, 4), g = G(0); f.frequency.exponentialRampToValueAtTime(120, at(t + 1.1)); env(g.gain, t, .08, .05, 1); n.connect(f); f.connect(g); pan(g, rnd() * 2 - 1).connect(sfx); }
  { const o = O('sine', 34, 196, 9.9), g = G(0); bed(g.gain, 196, 205.9, .3, 4, .02); o.connect(g); g.connect(sfx); }
  for (let t = 192.5, k = 0; t < 205; k++) { heart(t, .32 - k * .02); t += 1.4 + k * .55; }
  music.gain.setValueAtTime(1, at(205.85)); music.gain.linearRampToValueAtTime(0, at(205.9)); revG.gain.setValueAtTime(.5, at(205.85)); revG.gain.linearRampToValueAtTime(0, at(205.95)); revG.gain.setValueAtTime(0, at(209)); revG.gain.linearRampToValueAtTime(.5, at(209.4));
  // ===== 209–223 · DEPOIS: lá maior =====
  { const o = O('sine', hz(93), 210, 6), g = G(0); g.gain.setValueAtTime(0, at(210)); g.gain.linearRampToValueAtTime(.028, at(211.3)); g.gain.linearRampToValueAtTime(.018, at(214)); g.gain.linearRampToValueAtTime(0, at(216)); o.connect(g); g.connect(master); }
  const m2 = ctx.createGain(); m2.connect(master); const m2w = G(.8); m2.connect(m2w); m2w.connect(rev);
  bell(211.1, 76, .05, 4); bell(213.3, 73, .045, 4);
  [[213.6, [45, 57, 61, 64, 69, 73]], [217, [45, 52, 57, 61, 64, 69, 76]]].forEach(([t, ch]) => ch.forEach((m, k) => organ(t, m, DUR - t - .8, k === 0 ? .1 : .045, .6, m2)));
  shimmer(213.6, 9, [81, 85, 88, 93], .015); { const o = O('sine', 55, 217, 4), g = G(0); env(g.gain, 217, .32, .02, 3.5); o.connect(g); g.connect(sfx); }
  // relógio da relatividade: só no buraco negro, desacelerando
  for (let t = 151, k = 0; t < 203;) { tick(t, k % 2 === 0, .05); k++; const dil = t < 162 ? 1 : t < 176 ? 1 + (t - 162) / 14 : t < 192 ? 2 * Math.pow(3, (t - 176) / 16) : 6 * Math.pow(4, (t - 192) / 11); t += B72 * dil; }
  master.gain.setValueAtTime(.8, at(DUR - 3)); master.gain.linearRampToValueAtTime(0, at(DUR - .2));
  // ---------- sons de evento (cada fenômeno tem a sua assinatura) ----------
  function engineSpin(t0, t1, v) { const d = t1 - t0, out = G(0); bed(out.gain, t0, t1, v, 1.2, .08); out.connect(sfx);       // motor iônico: giro elétrico que sobe
    [[1, 'sawtooth', .5], [2.01, 'square', .18], [3.02, 'sawtooth', .1]].forEach(([r, ty, a]) => { const o = O(ty, 28 * r, t0, d + .1); o.frequency.exponentialRampToValueAtTime(140 * r, at(t0 + Math.min(3, d * .7))); o.frequency.exponentialRampToValueAtTime(190 * r, at(t1));
      const b = F('bandpass', 200 * r, 5), g = G(a); b.frequency.exponentialRampToValueAtTime(900 * r, at(t0 + Math.min(3, d * .7))); o.connect(b); b.connect(g); g.connect(out); });
    const w = O('sine', 900, t0, d + .1); w.frequency.exponentialRampToValueAtTime(3600, at(t0 + Math.min(3.5, d * .8))); w.frequency.exponentialRampToValueAtTime(4200, at(t1)); const wg = G(.035); w.connect(wg); wg.connect(out);
    const lfo = O('sine', 6, t0, d + .1); lfo.frequency.exponentialRampToValueAtTime(38, at(t0 + Math.min(3, d * .7))); const lg = G(v * .4); lfo.connect(lg); lg.connect(out.gain); }
  function ignite(t, v) {   // sem ruído nenhum: impacto grave limpo + acorde gigante que se abre + brilho + zumbido da estrela viva
    const s = O('sine', 58, t, 9), gs = G(0); s.frequency.exponentialRampToValueAtTime(27, at(t + 4)); env(gs.gain, t, v * 1.1, .02, 8); s.connect(gs); gs.connect(sfx);
    const br = G(0), lp = F('lowpass', 120, 2); lp.frequency.setValueAtTime(120, at(t)); lp.frequency.exponentialRampToValueAtTime(5000, at(t + 1.2)); lp.frequency.exponentialRampToValueAtTime(900, at(t + 8));
    br.gain.setValueAtTime(0, at(t)); br.gain.linearRampToValueAtTime(v * .22, at(t + .4)); br.gain.linearRampToValueAtTime(v * .12, at(t + 3)); br.gain.linearRampToValueAtTime(0, at(t + 9)); lp.connect(br); br.connect(music);
    [33, 45, 52, 57, 61, 64, 69, 73].forEach(m => [-8, 0, 8].forEach(dt => { const o = O('sawtooth', hz(m), t, 9.2); o.detune.value = dt; o.connect(lp); pitchBus.push(o); }));
    [81, 85, 88, 93, 97].forEach((m, i) => bell(t + .15 + i * .09, m, .045, 5, i % 2 ? .5 : -.5));
    const hum = O('sine', 55, t + 1, 12), hg = G(0); bed(hg.gain, t + 1, t + 13, v * .1, 3, 4); hum.connect(hg); hg.connect(sfx); }
  function engulf(t, v) {   // planeta afundando na estrela: gemido grave que desce + pressão que cresce, sem estalos nem chiado
    const o = O('sawtooth', 92, t - 1.5, 4.5), lp = F('lowpass', 260, 5), go = G(0); o.frequency.exponentialRampToValueAtTime(38, at(t + 2.8)); const vib = O('sine', 4.5, t - 1.5, 4.5), vg = G(3); vib.connect(vg); vg.connect(o.frequency);
    go.gain.setValueAtTime(.0001, at(t - 1.5)); go.gain.exponentialRampToValueAtTime(v * .7, at(t + .2)); go.gain.exponentialRampToValueAtTime(.0001, at(t + 3)); o.connect(lp); lp.connect(go); go.connect(sfx);
    const s = O('sine', 46, t - 1.2, 4), gs = G(0); s.frequency.exponentialRampToValueAtTime(30, at(t + 2.5)); gs.gain.setValueAtTime(.0001, at(t - 1.2)); gs.gain.exponentialRampToValueAtTime(v * .8, at(t + .3)); gs.gain.exponentialRampToValueAtTime(.0001, at(t + 2.8)); s.connect(gs); gs.connect(sfx);
    [57, 60].forEach((m, k) => organ(t - .5, m - 12 * k, 3, .04, .4)); }
  function implode(t0, t1, v) {   // colapso: um tom que sobe e some (sem o "sugar" do salto)
    const o = O('sine', 40, t0, t1 - t0), g = G(0); o.frequency.exponentialRampToValueAtTime(700, at(t1)); g.gain.setValueAtTime(.0001, at(t0)); g.gain.exponentialRampToValueAtTime(v, at(t1 - .05)); g.gain.setValueAtTime(0, at(t1)); o.connect(g); g.connect(sfx);
    const o2 = O('triangle', 80, t0, t1 - t0), g2 = G(0); o2.frequency.exponentialRampToValueAtTime(1400, at(t1)); g2.gain.setValueAtTime(.0001, at(t0)); g2.gain.exponentialRampToValueAtTime(v * .25, at(t1 - .05)); g2.gain.setValueAtTime(0, at(t1)); o2.connect(g2); g2.connect(sfx); }
  function supernova(t, v) {   // estrondos em cascata (trovão rolando) + acorde de impacto + anel metálico; nenhum "pumm" de salto
    [[0, 1], [.16, .8], [.38, .7], [.66, .55], [1.02, .45], [1.5, .35], [2.1, .25]].forEach(([d, a]) => { const tt = t + d, o = O('sine', 64, tt, 1.4), g = G(0); o.frequency.exponentialRampToValueAtTime(41, at(tt + .5)); env(g.gain, tt, v * a, .006, 1.1); o.connect(g); g.connect(sfx);
      const n = N(BR, tt, 1.2), f = F('lowpass', 420, .8), gn = G(0); env(gn.gain, tt, v * a * .55, .01, .9); n.connect(f); f.connect(gn); pan(gn, (d * 7 % 2) - 1).connect(sfx); });
    const r = N(BR, t, 8), rf = F('lowpass', 160, .7), rg = G(0); env(rg.gain, t, v * .6, .3, 7.5); r.connect(rf); rf.connect(rg); rg.connect(sfx);
    const lp = F('lowpass', 900, 1), br = G(0); lp.frequency.setValueAtTime(900, at(t)); lp.frequency.exponentialRampToValueAtTime(6000, at(t + .3)); lp.frequency.exponentialRampToValueAtTime(700, at(t + 5)); br.gain.setValueAtTime(0, at(t)); br.gain.linearRampToValueAtTime(v * .2, at(t + .05)); br.gain.linearRampToValueAtTime(0, at(t + 5)); lp.connect(br); br.connect(music);
    [38, 45, 50, 57, 62, 69].forEach(m => [-10, 10].forEach(dt => { const o = O('sawtooth', hz(m), t, 5.2); o.detune.value = dt; o.connect(lp); }));
    [1, 2.76, 5.4, 8.93, 13.3].forEach((rr, k) => { const om = O('sine', 174 * rr, t + .05, 7), gm = G(0); om.detune.value = k % 2 ? 7 : -7; env(gm.gain, t + .05, v * .1 / (k + 1), .002, 6 / Math.sqrt(k + 1)); om.connect(gm); pan(gm, k % 2 ? .5 : -.5).connect(sfx); }); }
  function shock(t, v) {   // onda de choque: vento que passa da esquerda para a direita + baque, sem estalinhos
    const n = N(WH, t - 1.5, 5.5), f = F('bandpass', 250, 1.2), g = G(0), p = ctx.createStereoPanner(); f.frequency.setValueAtTime(250, at(t - 1.5)); f.frequency.exponentialRampToValueAtTime(1600, at(t)); f.frequency.exponentialRampToValueAtTime(250, at(t + 3.8));
    g.gain.setValueAtTime(.0001, at(t - 1.5)); g.gain.exponentialRampToValueAtTime(v * .8, at(t)); g.gain.exponentialRampToValueAtTime(.0001, at(t + 4)); p.pan.setValueAtTime(-.8, at(t - 1.5)); p.pan.linearRampToValueAtTime(.8, at(t + 3)); n.connect(f); f.connect(g); g.connect(p); p.connect(sfx);
    const o = O('sine', 70, t, 1.5), go = G(0); o.frequency.exponentialRampToValueAtTime(40, at(t + 1)); env(go.gain, t, v * .9, .01, 1.2); o.connect(go); go.connect(sfx); }
  function pulse(t, v, p = 0) { const c = N(WH, t, .03), b = F('bandpass', 2600, 2), g = G(0); env(g.gain, t, v, .0008, .012); c.connect(b); b.connect(g); pan(g, p).connect(sfx);
    const o = O('sine', 95, t, .2), g2 = G(0); o.frequency.exponentialRampToValueAtTime(48, at(t + .1)); env(g2.gain, t, v * 1.6, .002, .12); o.connect(g2); g2.connect(sfx);
    const r = O('square', 1400, t, .06), rf = F('bandpass', 1400, 8), g3 = G(0); env(g3.gain, t, v * .25, .001, .04); r.connect(rf); rf.connect(g3); g3.connect(sfx); }
  function saltoSfx(TC, TG) { riser(TC, TG - TC, .45); suck(TG, .55, .5); const o = O('sine', 90, TG, 4), g = G(0); o.frequency.exponentialRampToValueAtTime(20, at(TG + 2.6)); env(g.gain, TG, 1, .008, 3.4); o.connect(g); g.connect(sfx); boom(TG, 1.3, .9); }
  function saltoLite(TG) { riser(TG - 1.5, 1.5, .3); suck(TG, .45, .36); const o = O('sine', 85, TG, 3), g = G(0); o.frequency.exponentialRampToValueAtTime(22, at(TG + 2)); env(g.gain, TG, .7, .008, 2.4); o.connect(g); g.connect(sfx); boom(TG, 1, .6); }
  function crunch(t, v) { const n = N(BR, t, 3), f = F('lowpass', 2400, .8), g = G(0); f.frequency.exponentialRampToValueAtTime(140, at(t + 2.2)); env(g.gain, t, v, .004, 2.4); n.connect(f); f.connect(g); g.connect(sfx);
    const o = O('sine', 75, t, 1.2), go = G(0); o.frequency.exponentialRampToValueAtTime(38, at(t + .6)); env(go.gain, t, v * .9, .003, .9); o.connect(go); go.connect(sfx);
  }
  function warpOut(t, v) { const o = O('sawtooth', 120, t - .9, 1.0), f = F('lowpass', 800, 3), g = G(0); o.frequency.exponentialRampToValueAtTime(3800, at(t)); f.frequency.exponentialRampToValueAtTime(9000, at(t)); g.gain.setValueAtTime(.0001, at(t - .9)); g.gain.exponentialRampToValueAtTime(v * .5, at(t - .03)); g.gain.setValueAtTime(0, at(t)); o.connect(f); f.connect(g); g.connect(sfx);
    const s = O('sine', 70, t, 2), gs = G(0); s.frequency.exponentialRampToValueAtTime(28, at(t + 1.2)); env(gs.gain, t, v, .006, 1.6); s.connect(gs); gs.connect(sfx); whoosh(t, 2.2, 5000, 300, v * .4, .3, -.3); shimmer(t + .1, 2.5, [93, 98], .012); }
  function warpIn(t, v) { const o = O('sawtooth', 4200, t - .25, .7), f = F('lowpass', 9000, 2), g = G(0); o.frequency.exponentialRampToValueAtTime(90, at(t + .4)); f.frequency.exponentialRampToValueAtTime(400, at(t + .4)); env(g.gain, t - .25, v * .45, .2, .5); o.connect(f); f.connect(g); g.connect(sfx);
    const s = O('sine', 60, t, 1.4), gs = G(0); s.frequency.exponentialRampToValueAtTime(34, at(t + .8)); env(gs.gain, t, v * .7, .01, 1.2); s.connect(gs); gs.connect(sfx); }
  function groan(t0, t1, v) { [[36.7, -.6], [37.4, .6], [55, 0]].forEach(([f0, p]) => { const o = O('sawtooth', f0, t0, t1 - t0), lp = F('lowpass', 140, 2), g = G(0); o.frequency.linearRampToValueAtTime(f0 * .94, at(t1)); bed(g.gain, t0, t1, v, 4, 3); o.connect(lp); lp.connect(g); pan(g, p).connect(sfx); }); }
  function glide(t, d, ms, semis, v) { const out = G(0); bed(out.gain, t, t + d, v, 1.5, 2); const lp = F('lowpass', 2400, .6); lp.connect(out); out.connect(music); ms.forEach(m => [-8, 8].forEach(dt => { const o = O('sawtooth', hz(m), t, d + .1); o.detune.value = dt; o.frequency.setValueAtTime(hz(m), at(t + 1)); o.frequency.exponentialRampToValueAtTime(hz(m + semis), at(t + d)); o.connect(lp); })); }
  function shimmer(t, d, ms, v) { ms.forEach((m, i) => { const o = O('sine', hz(m), t, d), g = G(0); g.gain.setValueAtTime(0, at(t)); g.gain.linearRampToValueAtTime(v, at(t + d * .35)); g.gain.linearRampToValueAtTime(0, at(t + d)); o.connect(g); pan(g, i % 2 ? .45 : -.45).connect(music); }); }
}
