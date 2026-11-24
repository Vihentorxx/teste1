// film.mjs — filma a página quadro a quadro (render determinístico) e codifica em MP4. Não precisa de servidor http:
// a própria ferramenta serve a pasta atual para o navegador.
// uso: node film.mjs stage/index.html <quadro_inicial> <quadro_final_exclusivo|0=até o fim> <saida.mp4> [--partes 3]
//      node film.mjs stage/index.html 0 0 x.mp4 --stills testes 15,90,200     (quadros de teste em JPEG)
//      node film.mjs stage/index.html 0 0 x.mp4 --resumo                      (tabela de planos x números-alvo)
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; for (const p of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/npm-tools/node_modules/playwright']) { if (!p) continue; try { pw = require(p); break; } catch {} }
if (!pw) { console.error('instale o playwright: npm i playwright && npx playwright install chromium'); process.exit(1); }
const argv = process.argv.slice(2), flag = n => argv.indexOf(n);
const [page0, f0s, f1s, out] = argv; const si = flag('--stills'), pi = flag('--partes'), ri = flag('--resumo');
const ROOT = process.cwd(), ORIGIN = 'http://palco.local';
const url = /^https?:/.test(page0) ? page0 : ORIGIN + '/' + page0.replace(/^\.?\//, '');

// ---- várias partes em paralelo: cada processo filma um pedaço; depois cola sem recodificar (~1,5x mais rápido com 3 em 4 núcleos)
if (pi > 0 && si < 0) {
  const N = +argv[pi + 1] || 3, total = await probeTotal(), f0 = +f0s, f1 = Math.min(+f1s || total, total), step = Math.ceil((f1 - f0) / N), me = fileURLToPath(import.meta.url), parts = [];
  const jobs = []; for (let k = 0; k < N; k++) { const a = f0 + k * step, b = Math.min(f1, a + step); if (a >= b) break; const o = out.replace(/\.mp4$/, `.parte${k}.mp4`); parts.push(o);
    jobs.push(new Promise(res => { const c = spawn(process.execPath, [me, page0, String(a), String(b), o], { stdio: ['ignore', 'inherit', 'inherit'] }); c.on('close', res); })); }
  const codes = await Promise.all(jobs); if (codes.some(c => c !== 0)) { console.error('uma parte falhou:', codes); process.exit(1); }
  const lst = out + '.lista.txt'; fs.writeFileSync(lst, parts.map(p => `file '${path.resolve(p)}'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', r));
  parts.forEach(p => fs.rmSync(p)); fs.rmSync(lst); console.log('ok', out, `(${f1 - f0} quadros em ${parts.length} partes)`); process.exit(0);
}

async function open() {
  const exe = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
  const opt = { headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--hide-scrollbars'] };
  let browser; try { browser = await pw.chromium.launch(process.env.CHROME ? { ...opt, executablePath: process.env.CHROME } : opt); }   // Chromium do Playwright; se faltar, o Chrome do sistema
  catch (e) { if (!exe) throw e; browser = await pw.chromium.launch({ ...opt, executablePath: exe }); }
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
  await page.route(ORIGIN + '/**', r => { const p = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return r.fulfill({ status: 404, body: 'não achei ' + p });
    r.fulfill({ status: 200, body: fs.readFileSync(p), contentType: MIME[path.extname(p)] || 'application/octet-stream' }); });
  page.on('pageerror', e => { console.error('[erro na página]', e.message); process.exitCode = 2; });
  page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && !/GPU stall|GL Driver/.test(m.text()))) console.error('[console]', m.text().slice(0, 300)); });
  await page.goto(url); await page.waitForFunction('window.READY === true', null, { timeout: 180000 });
  return { browser, page, total: await page.evaluate('window.TOTAL') };
}
async function probeTotal() { const { browser, total } = await open(); await browser.close(); return total; }

const { browser, page, total } = await open();
if (ri > 0) {                                       // resumo da decupagem contra os números medidos
  const S = await page.evaluate('window.SHOTS'); await browser.close();
  if (!S) { console.log('main.js não exporta window.SHOTS (use window.SHOTS = TL.summary)'); process.exit(0); }
  console.table(S.lista);
  const ok = (c, s) => console.log(`${c ? 'ok ' : 'VER'}  ${s}`);
  ok(S.planos >= 16 && S.planos <= 21, `planos: ${S.planos} (ref. 19–21 num curta de 60 s)`);
  ok(S.mediana >= 2.2 && S.mediana <= 3.6, `duração mediana: ${S.mediana.toFixed(2)} s (ref. ~3 s)`);
  ok(S.maior <= 13, `plano mais longo: ${S.maior.toFixed(1)} s (ref. ≤ ~5 s; até 13 s só com ação mudando a cada 1–2 s)`);
  ok(S.cortes <= 8, `cortes secos: ${S.cortes} (ref. 0–8)`); ok(S.efeito >= 1, `transições por efeito (clarão, cortina): ${S.efeito} (ref. ≥ 1)`);
  ok(S.duracao >= 55 && S.duracao <= 70, `duração: ${S.duracao.toFixed(1)} s (ref. 59–66 s)`); process.exit(0);
}
if (si > 0) {                                       // só quadros de teste (olhe antes de filmar tudo)
  const dir = argv[si + 1]; fs.mkdirSync(dir, { recursive: true });
  for (const f of argv[si + 2].split(',').map(Number)) { const t0 = Date.now(); await page.evaluate(f => window.renderFrame(f), f);
    await page.screenshot({ type: 'jpeg', quality: 94, path: `${dir}/q${String(f).padStart(5, '0')}.jpg` }); console.log(`quadro ${f} (${(f / 30).toFixed(2)} s) em ${Date.now() - t0} ms`); }
  console.log('quadros de teste salvos em', dir, '| total de quadros do vídeo:', total); await browser.close(); process.exit(process.exitCode || 0);
}
const f0 = +f0s, f1 = Math.min(+f1s || total, total), tmp = out.replace(/\.mp4$/, '.tmp.mp4');
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
  '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise(r => ff.on('close', r)); const t0 = Date.now();
for (let f = f0; f < f1; f++) {
  await page.evaluate(f => window.renderFrame(f), f);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if ((f - f0) % 60 === 59) console.log(`[${path.basename(out)}] quadro ${f + 1}/${f1}  ${((Date.now() - t0) / (f - f0 + 1)).toFixed(0)} ms/quadro`);
}
ff.stdin.end(); const code = await done; await browser.close();
if (code === 0 && !process.exitCode) { fs.renameSync(tmp, out); console.log('ok', out, `${f1 - f0} quadros em ${((Date.now() - t0) / 1000).toFixed(0)} s`); } else { console.error('falhou'); process.exit(1); }
