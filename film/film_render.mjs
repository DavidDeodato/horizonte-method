// node film_render.mjs <pagina.html> stills <saida_dir> "<query>" t1 t2 ...
// node film_render.mjs <pagina.html> full <saida.mp4> "<query>"
// Serve a pasta por http (módulos ES / three.js), renderiza quadro a quadro e junta com o áudio sintetizado.
import puppeteer from 'puppeteer-core';
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
const [page_, mode, out, qs = '', ...times] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, protocolTimeout: 0, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu'] });
const pg = await browser.newPage(); const errs = [];
pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text()); });
await pg.setViewport({ width: 1920, height: 1080 });
await pg.goto(`http://127.0.0.1:${srv.address().port}/${page_}?render=1&${qs}`);
await pg.waitForFunction(() => window.ready, { timeout: 120000 }).catch(() => errs.push('timeout: page not ready'));
console.log('GPU:', await pg.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; }));
if (errs.length) console.log('ERR\n' + errs.join('\n'));
const DUR = await pg.evaluate(() => window.DUR);
if (mode === 'audio') { fs.writeFileSync(out, Buffer.from(await pg.evaluate(() => window.renderAudioB64()), 'base64')); console.log('audio ok'); }
else if (mode === 'cam') { const tr = await pg.evaluate(() => { const o = []; for (let f = 0; f < Math.round(window.DUR * 30); f++) o.push(window.camTrace(f / 30)); return o; }); fs.writeFileSync(out, JSON.stringify(tr)); console.log('cam ok', tr.length); }
else if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true });
  for (const t of times.map(Number)) { const t0 = Date.now(); const b = await pg.evaluate(t => window.renderFrameJPEG(t, .9), t);
    fs.writeFileSync(path.join(out, `f_${String(t.toFixed(1)).padStart(5, '0')}.jpg`), Buffer.from(b, 'base64'));
    const st = await pg.evaluate(() => window.frameStats ? window.frameStats() : {}); console.log('t=', t, (Date.now() - t0) + 'ms', JSON.stringify(st)); }
} else {
  const wav = process.env.WAV || out.replace(/\.mp4$/, '.wav'); if (!process.env.WAV) fs.writeFileSync(wav, Buffer.from(await pg.evaluate(() => window.renderAudioB64()), 'base64'));
  const N = Math.round(DUR * 30);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) { const b = await pg.evaluate(t => window.renderFrameJPEG(t, .94), f / 30); if (!ff.stdin.write(Buffer.from(b, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
if (errs.length) console.log('ERR\n' + errs.join('\n'));
await browser.close(); srv.close();
