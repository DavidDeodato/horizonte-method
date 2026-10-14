import fs from 'fs'; const tr = JSON.parse(fs.readFileSync(process.argv[2])); const N = tr.length, fps = 30;
const dp = [], da = []; for (let i = 1; i < N; i++) { const a = tr[i - 1], b = tr[i]; dp.push(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); const dot = Math.abs(a[3] * b[3] + a[4] * b[4] + a[5] * b[5] + a[6] * b[6]); da.push(2 * Math.acos(Math.min(1, dot)) * 180 / Math.PI); }
const med = (arr, i, w) => { const s = arr.slice(Math.max(0, i - w), Math.min(arr.length, i + w)).slice().sort((x, y) => x - y); return s[s.length >> 1] || 0; };
const avg = (arr, a, b) => { let s = 0, n = 0; for (let i = Math.max(0, a); i < Math.min(arr.length, b); i++) { s += arr[i]; n++; } return n ? s / n : 0; };
const issues = [];
for (let i = 15; i < N - 16; i++) { const t = (i + 1) / fps; if (t > 205.9) break;
  // salto: deslocamento ou giro num quadro muito maior que a vizinhança (corte)
  const mp = med(dp, i, 15), ma = med(da, i, 15); if ((dp[i] > 8 * mp && dp[i] > 1e-3 && mp > 0) || (da[i] > 6 * ma && da[i] > 1.5)) issues.push(['JUMP', t.toFixed(2), dp[i].toPrecision(3), (mp || 0).toPrecision(3), da[i].toFixed(2)]);
  const df = Math.abs(tr[i + 1][7] - tr[i][7]), dfm = Math.abs(tr[i][7] - tr[i - 1][7]); if (df > .25 && df > 5 * dfm) issues.push(['FOV', t.toFixed(2), tr[i][7].toFixed(2), tr[i + 1][7].toFixed(2)]);
  // parada: vinha se movendo e para em <0,3 s
  const before = avg(dp, i - 15, i) , after = avg(dp, i, i + 9), ab = avg(da, i - 15, i), aa = avg(da, i, i + 9);
  const mvB = before > 0 || ab > .05; if (mvB && after < before * .12 && aa < Math.max(ab * .12, .02) && (ab > .08 || before > 0)) issues.push(['STOP', t.toFixed(2), before.toPrecision(3), after.toPrecision(3), ab.toFixed(3), aa.toFixed(3)]); }
// agrupa
const out = []; for (const x of issues) { const l = out.at(-1); if (l && l[0] === x[0] && x[1] - l[1] < .5) continue; out.push(x); }
console.log('quadros', N, 'problemas', out.length); out.forEach(x => console.log(x.join('  ')));