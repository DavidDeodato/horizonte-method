// node qa.mjs <video.mp4> — piscadas pretas (quadro isolado escuro) e movimento na tela por janela de 10 s
import { spawnSync } from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path';
const src = path.resolve(process.argv[2]); const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
fs.copyFileSync(src, path.join(dir, 'v.mp4'));   // roda dentro da pasta temporária: evita escapar "C:" nos filtros do ffmpeg
const run = vf => spawnSync('ffmpeg', ['-hide_banner', '-i', 'v.mp4', '-vf', vf, '-f', 'null', '-'], { cwd: dir });
run('scale=320:180,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=y.txt');
run("scale=160:90,select='gt(scene,0)',metadata=print:key=lavfi.scene_score:file=s.txt");
const parse = (f, key) => { const o = []; let t = 0; for (const l of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) { const a = l.match(/pts_time:([\d.]+)/), b = l.match(new RegExp(key + '=([\\d.]+)')); if (a) t = +a[1]; else if (b) o.push([t, +b[1]]); } return o; };
const y = parse('y.txt', 'YAVG'), flick = [];
for (let i = 1; i < y.length - 1; i++) { const m = Math.min(y[i - 1][1], y[i + 1][1]); if (m > 20 && y[i][1] < m * .6) flick.push(y[i][0].toFixed(2) + 's'); }
console.log(`quadros: ${y.length} | piscadas pretas: ${flick.length} ${flick.join(' ')}`);
const win = {}; for (const [t, v] of parse('s.txt', 'scene_score')) { const k = Math.floor(t / 10) * 10; win[k] = (win[k] || 0) + v; }
console.log('movimento por janela de 10 s (quanto maior, mais acontece na tela):');
for (const k of Object.keys(win).map(Number).sort((a, b) => a - b)) { const v = win[k] / 300 * 100; console.log(`${String(k).padStart(4)}–${String(k + 10).padEnd(4)} ${v.toFixed(2).padStart(5)} ${'#'.repeat(Math.min(60, Math.round(v * 60)))}`); }
fs.rmSync(dir, { recursive: true, force: true });
