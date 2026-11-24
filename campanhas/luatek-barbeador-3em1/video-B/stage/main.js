// Vídeo B "Meia barba" — animação 2D por código a partir das imagens do ChatGPT.
// Tudo é função do tempo t (quadros filmados fora de ordem pelo film.mjs).
const W = 1080, H = 1920, FPS = 30;
const PREVIA = true;                       // carimbo "PRÉVIA" enquanto o produto não estiver fiel ao anúncio

// ---------- linha do tempo ----------
// img: arquivo; z: zoom (1 = cobre o quadro); f: ponto da imagem (1024x1536) no centro da tela
// jit: vibração do motor {c:[x,y], r:[rx,ry], de:t}; pelos: {e:[x,y], taxa}; brilho: faixa de luz {c,r,de,ate}
const CENAS = [
  { img: 'B1', t0: 0.0, t1: 3.0, z: [1.0, 1.07], f: [[560, 700], [600, 690]],
    jit: { c: [850, 1000], r: [175, 320], de: 0.35 } },
  { img: 'B2a', t0: 3.0, t1: 5.4, z: [1.12, 1.18], f: [[420, 760], [430, 740]],
    jit: { c: [370, 900], r: [200, 360] }, pelos: { e: [450, 705], taxa: 14 } },
  { img: 'B2b', t0: 5.4, t1: 8.0, z: [1.10, 1.20], f: [[470, 860], [480, 880]],
    jit: { c: [440, 1000], r: [210, 380] }, pelos: { e: [515, 860], taxa: 26 } },
  { img: 'B3a', t0: 8.0, t1: 10.2, z: [1.08, 1.14], f: [[600, 780], [560, 760]] },
  { img: 'B3b', t0: 10.2, t1: 13.0, z: [1.04, 1.12], f: [[480, 640], [480, 560]],
    jit: { c: [470, 760], r: [330, 760], de: 10.75 }, brilho: { c: [470, 230], r: [290, 150], de: 10.4, ate: 11.5 } },
  { img: 'B4a', t0: 13.0, t1: 18.0, z: [1.12, 1.06], f: [[430, 1050], [520, 760]],
    jit: { c: [390, 1150], r: [260, 420] } },
  { img: 'produto-aparador', t0: 18.0, t1: 19.9, z: [0.84, 0.87], f: [[512, 640], [512, 625]],
    brilho: { c: [512, 800], r: [300, 720], de: 18.2, ate: 19.4 } },
  { img: 'produto-nariz', t0: 19.9, t1: 22.0, z: [0.86, 0.89], f: [[512, 630], [512, 615]],
    brilho: { c: [512, 800], r: [300, 720], de: 20.3, ate: 21.5 } },
];
const CLAROES = [10.2, 19.9];              // clarão branco na troca de cabeça (clique)
const TITULOS = [
  { t0: 0.1, t1: 3.0, txt: ['METADE FEITA →'], dest: ['METADE'] },
  { t0: 3.0, t1: 8.0, txt: ['1 · APARADOR'], dest: ['APARADOR'] },
  { t0: 8.0, t1: 13.0, txt: ['CLIQUE → BARBEAR'], dest: ['BARBEAR'], y: 1230 },
  { t0: 13.0, t1: 18.0, txt: ['QUEIXO E PESCOÇO'], dest: [] },
  { t0: 18.0, t1: 22.0, txt: ['3 EM 1'], dest: ['3', 'EM', '1'], y: 245 },
];
// falas (até chegar o ElevenLabs, as palavras são espalhadas pela duração prevista de cada fala)
const FALAS = [
  { t0: 0.15, t1: 2.8, txt: 'Metade feita. Agora a outra metade.' },
  { t0: 3.15, t1: 5.3, txt: 'Primeiro o volume, com o aparador.' },
  { t0: 8.15, t1: 10.6, txt: 'Um clique, e troca pra cabeça de barbear.' },
  { t0: 13.15, t1: 15.7, txt: 'Queixo e pescoço com a mesma máquina.' },
  { t0: 18.15, t1: 21.6, txt: 'Tá no carrinho. Confere o preço de hoje.' },
];
const DESTAQUE = new Set(['metade', 'aparador', 'barbear', 'carrinho', 'clique', 'máquina']);
const TOTAL_S = 22.0;

// ---------- utilidades ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const oc = new OffscreenCanvas(W, H), octx = oc.getContext('2d');
const lerp = (a, b, u) => a + (b - a) * u;
const suave = u => u * u * (3 - 2 * u);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }   // aleatório determinístico

const IMGS = {};
async function carregar(n) { const im = new Image(); im.src = `../imgs/${n}.png`; await im.decode(); IMGS[n] = im; }

// grão de filme
const grao = new OffscreenCanvas(256, 256); {
  const g = grao.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (rnd(i) - 0.5) * 255; d.data.set([v, v, v, 255], i * 4); }
  g.putImageData(d, 0, 0);
}

// ---------- câmera ----------
function camera(c, t) {
  const im = IMGS[c.img], s0 = Math.max(W / im.width, H / im.height);
  const u = suave(clamp((t - c.t0) / (c.t1 - c.t0), 0, 1));
  const s = s0 * lerp(c.z[0], c.z[1], u);
  let fx = lerp(c.f[0][0], c.f[1][0], u) + Math.sin(t * 1.7) * 3 + Math.sin(t * 2.9 + 1) * 2;   // câmera na mão
  let fy = lerp(c.f[0][1], c.f[1][1], u) + Math.cos(t * 1.3) * 3;
  if (im.width * s > W) fx = clamp(fx, W / 2 / s, im.width - W / 2 / s);
  if (im.height * s > H) fy = clamp(fy, H / 2 / s, im.height - H / 2 / s);
  return { s, ox: W / 2 - fx * s, oy: H / 2 - fy * s, im };
}
const X = (cam, x) => cam.ox + x * cam.s, Y = (cam, y) => cam.oy + y * cam.s;

function mascaraElipse(g, cam, c, r, borda = 0.7) {
  g.save(); g.globalCompositeOperation = 'destination-in';
  g.setTransform(cam.s * r[0], 0, 0, cam.s * r[1], X(cam, c[0]), Y(cam, c[1]));
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(borda, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}

function desenharCena(c, t) {
  const cam = camera(c, t);
  ctx.setTransform(cam.s, 0, 0, cam.s, cam.ox, cam.oy); ctx.drawImage(cam.im, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);

  // vibração do motor: só a região da máquina treme (1–2 px)
  if (c.jit && t >= (c.jit.de ?? c.t0)) {
    const dx = Math.sin(t * 2 * Math.PI * 23) * 1.6, dy = Math.cos(t * 2 * Math.PI * 31) * 1.1;
    octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
    octx.setTransform(cam.s, 0, 0, cam.s, cam.ox + dx, cam.oy + dy); octx.drawImage(cam.im, 0, 0);
    mascaraElipse(octx, cam, c.jit.c, c.jit.r); ctx.drawImage(oc, 0, 0);
  }

  // pelos caindo da cabeça do aparador
  if (c.pelos) {
    const { e, taxa } = c.pelos, vida = 1.3, n0 = Math.floor((c.t0 - vida) * taxa), n1 = Math.floor(t * taxa);
    ctx.save(); ctx.strokeStyle = 'rgba(28,20,14,0.9)'; ctx.lineCap = 'round';
    for (let i = n0; i <= n1; i++) {
      const ts = i / taxa, a = t - ts; if (a < 0 || a > vida || ts < c.t0 - 0.2) continue;
      const vx = (rnd(i) - 0.5) * 140, vy = rnd(i + 9) * 60 - 10, g = 1100;
      const x = e[0] + (rnd(i + 3) - 0.5) * 70 + vx * a, y = e[1] + (rnd(i + 5) - 0.5) * 30 + vy * a + 0.5 * g * a * a;
      const L = 7 + rnd(i + 7) * 11, ang = rnd(i + 11) * 6.28 + a * (rnd(i + 13) - 0.5) * 12;
      ctx.lineWidth = Math.max(1.2, cam.s * 1.6); ctx.globalAlpha = clamp(1 - a / vida, 0, 1) * 0.9;
      const px = X(cam, x), py = Y(cam, y), l = L * cam.s / 2;
      ctx.beginPath(); ctx.moveTo(px - Math.cos(ang) * l, py - Math.sin(ang) * l); ctx.lineTo(px + Math.cos(ang) * l, py + Math.sin(ang) * l); ctx.stroke();
    }
    ctx.restore();
  }

  // faixa de luz passando pelo metal
  if (c.brilho && t > c.brilho.de && t < c.brilho.ate) {
    const u = (t - c.brilho.de) / (c.brilho.ate - c.brilho.de), b = c.brilho;
    octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
    const x0 = X(cam, b.c[0] - b.r[0] * 1.4), x1 = X(cam, b.c[0] + b.r[0] * 1.4), px = lerp(x0, x1, u);
    const gr = octx.createLinearGradient(px - 140, 0, px + 140, 0);
    gr.addColorStop(0, 'rgba(255,240,215,0)'); gr.addColorStop(0.5, 'rgba(255,240,215,0.55)'); gr.addColorStop(1, 'rgba(255,240,215,0)');
    octx.fillStyle = gr; octx.save(); octx.translate(px, H / 2); octx.rotate(-0.35); octx.translate(-px, -H / 2); octx.fillRect(0, -H, W, H * 3); octx.restore();
    mascaraElipse(octx, cam, b.c, b.r, 0.6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(oc, 0, 0); ctx.restore();
  }
}

// ---------- texto ----------
function textoContorno(txt, x, y, tam, cor = '#fff', alinhar = 'center') {
  ctx.font = `${tam}px 'Archivo Black'`; ctx.textAlign = alinhar; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillText(txt, x + 4, y + 4);                 // sombra dura
  ctx.lineWidth = tam * 0.15; ctx.strokeStyle = '#000'; ctx.strokeText(txt, x, y);
  ctx.fillStyle = cor; ctx.fillText(txt, x, y);
}
function linhaColorida(palavras, cx, y, tam, destaques) {             // palavras com destaque amarelo, centralizadas
  ctx.font = `${tam}px 'Archivo Black'`; const esp = ctx.measureText(' ').width;
  const larg = palavras.map(p => ctx.measureText(p).width), total = larg.reduce((a, b) => a + b, 0) + esp * (palavras.length - 1);
  let x = cx - total / 2;
  palavras.forEach((p, i) => { textoContorno(p, x, y, tam, destaques(p) ? '#FFD23F' : '#fff', 'left'); x += larg[i] + esp; });
}
function titulo(t) {
  for (const T of TITULOS) {
    if (t < T.t0 || t >= T.t1) continue;
    const a = t - T.t0, pop = a < 0.18 ? 0.6 + 0.5 * Math.sin((a / 0.18) * Math.PI / 2) * 1.08 : 1;
    ctx.save(); ctx.translate(540, T.y ?? 330); ctx.scale(pop, pop);
    linhaColorida(T.txt[0].split(' '), 0, 0, 74, p => T.dest.includes(p)); ctx.restore();
  }
}
const FUNCAO = new Set('o a os as um uma de do da em no na pra para com e que se é ou'.split(' '));
const CARTOES = [];
for (const L of FALAS) {                                         // palavras espalhadas pela duração da fala; cartões de 1–3 palavras
  const ws = L.txt.split(' '), peso = ws.map(w => w.length + 2), soma = peso.reduce((a, b) => a + b, 0);
  let tt = L.t0; const tw = ws.map((w, i) => { const a = tt; tt += (L.t1 - L.t0) * peso[i] / soma; return { w, t0: a, t1: tt }; });
  for (let i = 0; i < tw.length;) {
    const card = [tw[i++]];
    while (i < tw.length && card.length < 3 && !/[.,!?]$/.test(card[card.length - 1].w) &&
           (FUNCAO.has(card[card.length - 1].w.toLowerCase()) && card.length === 1)) card.push(tw[i++]);
    CARTOES.push({ txt: card.map(c => c.w).join(' '), t0: card[0].t0, t1: card[card.length - 1].t1 });
  }
}
function legenda(t) {
  const c = CARTOES.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const limpa = w => w.toLowerCase().replace(/[^\wà-ú]/g, '');
  linhaColorida(c.txt.split(' '), 540, 1376, 76, p => DESTAQUE.has(limpa(p)));
}

// ---------- quadro ----------
function renderFrame(f) {
  const t = f / FPS;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const c = CENAS.find(c => t >= c.t0 && t < c.t1) || CENAS[CENAS.length - 1];
  desenharCena(c, t);

  // vinheta e grão
  const vg = ctx.createRadialGradient(540, 900, 520, 540, 960, 1250);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.06; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grao, 'repeat'); ctx.translate((f * 73) % 256, (f * 41) % 256); ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore();

  // clarão do clique
  for (const tc of CLAROES) { const a = t - tc; if (a >= 0 && a < 0.2) { ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - a / 0.2)})`; ctx.fillRect(0, 0, W, H); } }

  titulo(t); legenda(t);

  // final: "cores sortidas" e seta para o carrinho (canto inferior esquerdo, onde o TikTok põe o produto)
  if (t >= 19.9) {
    textoContorno('cores sortidas', 540, 1462, 40, '#fff');
    const b = Math.abs(Math.sin(t * 5)) * 18;
    textoContorno('▼', 250, 1530 + b, 90, '#FFD23F');
  }
  if (PREVIA) { ctx.font = "30px 'Archivo Black'"; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,80,80,0.9)'; ctx.fillText('PRÉVIA · produto a corrigir', 60, 120); }
}

await Promise.all([...new Set(CENAS.map(c => c.img))].map(carregar));
await document.fonts.load("74px 'Archivo Black'");
window.TOTAL = Math.round(TOTAL_S * FPS);
window.renderFrame = renderFrame;
window.READY = true;
