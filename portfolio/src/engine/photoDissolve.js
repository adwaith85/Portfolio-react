import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* [color, share]. Mostly mixed reds, blacks and ash. A few pure white, a few pure red. */
const PALETTE = [
  ["#ffffff", 0.08], // pure white
  ["#e11d2a", 0.1], // pure red
  ["#9c0d18", 0.15], // deep red
  ["#5e0810", 0.13], // red + black
  ["#2a0508", 0.1], // almost black red
  ["#0b0b0b", 0.08], // black
  ["#ff737b", 0.12], // red + white
  ["#f6c3c6", 0.08], // white + a little red
  ["#b5b0b0", 0.08], // ash
  ["#6d6a6a", 0.08], // dark ash
];
const COLORS = PALETTE.map((p) => p[0]);
const CUM = [];
{
  let acc = 0;
  PALETTE.forEach(([, w]) => CUM.push((acc += w)));
  CUM[CUM.length - 1] = 1;
}

const LAUNCH = 0.22; // every speck lets go within this first share of the animation
const PHOTO_OUT = 0.2; // the photo itself fades out over this share
const END = 0.95; // everything is gone by here
const ORIGINAL = 0.12; // a speck wears your photo's own color for this share of its life
const MAX = 28000; // maximum number of specks
const LEVELS = 4; // fade steps (keeps drawing fast)
const SPARKLE = 0.14; // share of specks that shimmer like fine powder
const QN = 512; // photo colors are grouped into this many buckets for speed

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pickColor = () => {
  const r = Math.random();
  let i = 0;
  while (r > CUM[i]) i++;
  return i;
};

/* a delicate tiny glowing dot for micro-powder glistening */
function makeSprite(rgb) {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grd.addColorStop(0, `rgba(${rgb},1)`);
  grd.addColorStop(0.35, `rgba(${rgb},0.55)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 16, 16);
  return c;
}

export function createPhotoDissolve({
  trigger,
  canvas,
  photoEl,
  glowEl,
  getImg,
  mode, // "alpha" | "opaque" | "missing"
}) {
  const ctx = canvas.getContext("2d");
  const sprW = makeSprite("255,255,255");
  const sprR = makeSprite("255,76,88");

  let vw = 0;
  let vh = 0;
  let P = null; // the cloud of specks
  let buf = null;
  let state = "rest"; // rest | active | fade | gone
  let animTween = null;
  let isDissolved = false;

  const qStr = Array.from(
    { length: QN },
    (_, k) =>
      `rgb(${((k >> 6) & 7) * 32 + 16},${((k >> 3) & 7) * 32 + 16},${(k & 7) * 32 + 16})`
  );
  const origBins = Array.from({ length: QN }, () => []);
  const bins = Array.from({ length: COLORS.length * LEVELS }, () => []);
  const sparks = [];

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /* turns the photo into a cloud of tiny powder specks */
  const sample = (img) => {
    if (!img || !img.complete || !img.naturalWidth) return null;
    const rect = img.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w < 10 || h < 10) return null;

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const o = off.getContext("2d", { willReadFrequently: true });
    o.drawImage(img, 0, 0, w, h);

    let data;
    try {
      data = o.getImageData(0, 0, w, h).data;
    } catch {
      return null;
    }

    const step = Math.max(2, Math.round(Math.sqrt((w * h) / 95000)));
    const xs = [];
    const ys = [];
    const cs = [];

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const cx = Math.min(w - 1, x + (step >> 1));
        const cy = Math.min(h - 1, y + (step >> 1));
        const i = (cy * w + cx) * 4;
        if (data[i + 3] < 60) continue;
        if (mode === "opaque" && data[i] + data[i + 1] + data[i + 2] < 60) continue;
        xs.push(x + Math.random() * step);
        ys.push(y + Math.random() * step);
        cs.push(data[i], data[i + 1], data[i + 2]);
      }
    }

    const total = xs.length;
    const keep = total > MAX ? MAX / total : 1;
    const idx = [];
    for (let i = 0; i < total; i++) if (Math.random() < keep) idx.push(i);
    const n = idx.length;
    const sc = clamp(window.innerWidth / 1440, 0.6, 1.3);

    const S = {
      n,
      ox: new Float32Array(n),
      oy: new Float32Array(n),
      q: new Uint16Array(n),
      delay: new Float32Array(n),
      life: new Float32Array(n),
      ang: new Float32Array(n),
      dist: new Float32Array(n),
      rise: new Float32Array(n),
      wob: new Float32Array(n),
      ph: new Float32Array(n),
      tws: new Float32Array(n),
      size: new Float32Array(n),
      col: new Uint8Array(n),
      sp: new Uint8Array(n),
      sw: new Uint8Array(n),
    };

    for (let k = 0; k < n; k++) {
      const i = idx[k];
      S.ox[k] = xs[i];
      S.oy[k] = ys[i];
      S.q[k] =
        ((cs[i * 3] >> 5) << 6) | ((cs[i * 3 + 1] >> 5) << 3) | (cs[i * 3 + 2] >> 5);

      S.delay[k] = Math.random() * LAUNCH;
      S.life[k] = rand(0.42, 0.68);

      S.ang[k] = rand(0, 6.283);
      S.dist[k] = (15 + Math.pow(Math.random(), 1.6) * 190) * sc;
      S.rise[k] = rand(15, 95) * sc;
      S.wob[k] = rand(3, 14);
      S.ph[k] = rand(0, 6.283);
      S.tws[k] = rand(6, 18);
      // tiny micro-powders size:
      S.size[k] = rand(0.65, 1.35);
      S.col[k] = pickColor();
      S.sp[k] = Math.random() < SPARKLE ? 1 : 0;
      S.sw[k] = Math.random() < 0.5 ? 0 : 1;
    }

    buf = {
      x: new Float32Array(n),
      y: new Float32Array(n),
      s: new Float32Array(n),
      a: new Float32Array(n),
    };
    return S;
  };

  const rest = () => {
    if (state === "rest") return;
    state = "rest";
    photoEl.style.opacity = "";
    glowEl.style.opacity = "";
    ctx.clearRect(0, 0, vw, vh);
    canvas.style.display = "none";
  };

  const gone = () => {
    if (state === "gone") return;
    state = "gone";
    photoEl.style.opacity = "0";
    glowEl.style.opacity = "0";
    ctx.clearRect(0, 0, vw, vh);
    canvas.style.display = "none";
  };

  const fadeOnly = (p) => {
    state = "fade";
    photoEl.style.opacity = String(1 - clamp(p / 0.4));
    glowEl.style.opacity = String(1 - clamp(p / 0.4));
    canvas.style.display = "none";
  };

  const render = (p) => {
    if (p <= 0.001) return rest();

    const hb = trigger.getBoundingClientRect().bottom;
    if (p >= END || hb <= 0) return gone();

    const img = getImg();
    if (mode === "missing" || !img) return fadeOnly(p);
    if (!P) P = sample(img);
    if (!P) return fadeOnly(p);

    state = "active";
    canvas.style.display = "block";
    photoEl.style.opacity = String(1 - clamp(p / PHOTO_OUT));
    glowEl.style.opacity = String(1 - clamp(p / 0.28));

    const r = img.getBoundingClientRect();
    const G = 1 - clamp((p - 0.65) / 0.25); // smoothly fade out by end of animation

    for (let b = 0; b < bins.length; b++) bins[b].length = 0;
    for (let q = 0; q < QN; q++) origBins[q].length = 0;
    sparks.length = 0;

    const n = P.n;
    for (let i = 0; i < n; i++) {
      const t = clamp((p - P.delay[i]) / P.life[i]);
      const a = P.ang[i];
      const e = 1 - Math.pow(1 - t, 2.4);
      const k = P.dist[i] * e;
      const w = P.wob[i] * t;
      const ph = P.ph[i];

      buf.x[i] = r.left + P.ox[i] + Math.cos(a) * k + Math.cos(t * 5 + ph) * w;
      buf.y[i] =
        r.top + P.oy[i] + Math.sin(a) * k - P.rise[i] * t + Math.sin(t * 5 + ph) * w;
      buf.s[i] = P.size[i] * (1 - 0.5 * t);

      if (t < ORIGINAL) {
        origBins[P.q[i]].push(i);
        continue;
      }

      const tw = 0.6 + 0.4 * Math.sin(t * P.tws[i] * 3 + ph);
      const al = (t < 0.4 ? 1 : 1 - (t - 0.4) / 0.6) * G * tw;
      if (al < 0.06) continue;

      buf.a[i] = al;
      const lvl = Math.max(0, Math.ceil(al * LEVELS) - 1);
      bins[P.col[i] * LEVELS + lvl].push(i);
      if (P.sp[i]) sparks.push(i);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, vw, vh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, vw, Math.max(0, hb));
    ctx.clip();

    // pass 1: photo's own color specks
    ctx.globalAlpha = G;
    for (let q = 0; q < QN; q++) {
      const list = origBins[q];
      if (!list.length) continue;
      ctx.fillStyle = qStr[q];
      for (let j = 0; j < list.length; j++) {
        const i = list[j];
        ctx.fillRect(buf.x[i], buf.y[i], buf.s[i], buf.s[i]);
      }
    }

    // pass 2: palette colors (reds, black, white, ash)
    for (let b = 0; b < bins.length; b++) {
      const list = bins[b];
      if (!list.length) continue;
      ctx.fillStyle = COLORS[(b / LEVELS) | 0];
      ctx.globalAlpha = ((b % LEVELS) + 1) / LEVELS;
      for (let j = 0; j < list.length; j++) {
        const i = list[j];
        ctx.fillRect(buf.x[i], buf.y[i], buf.s[i], buf.s[i]);
      }
    }

    // pass 3: fine glistening micro-powder shine (tiny glowing dust, no oversized crosses)
    ctx.globalCompositeOperation = "lighter";
    for (let j = 0; j < sparks.length; j++) {
      const i = sparks[j];
      const g = buf.s[i] * 2.8 + 1.2;
      const x = buf.x[i];
      const y = buf.y[i];
      ctx.globalAlpha = buf.a[i] * 0.9;
      ctx.drawImage(P.sw[i] ? sprR : sprW, x - g / 2, y - g / 2, g, g);
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = buf.a[i];
      ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  fit();

  // pre-warm particle sampling
  const warm = setTimeout(() => {
    if (!P && state === "rest") P = sample(getImg());
  }, 1200);

  const startDissolve = () => {
    if (isDissolved) return;
    if (animTween) return;

    const img = getImg();
    if (!P && img) P = sample(img);

    const progressObj = { p: 0 };
    animTween = gsap.to(progressObj, {
      p: 1,
      duration: 1.25,
      ease: "power2.out",
      onUpdate: () => {
        render(progressObj.p);
      },
      onComplete: () => {
        animTween = null;
        isDissolved = true;
        gone();
      },
    });
  };

  const resetToRest = () => {
    if (animTween) {
      animTween.kill();
      animTween = null;
    }
    isDissolved = false;
    rest();
  };

  const st = ScrollTrigger.create({
    trigger,
    start: "top top-=15",
    onEnter: () => startDissolve(),
    onLeaveBack: () => resetToRest(),
    onRefresh: () => {
      fit();
      P = null;
      buf = null;
      const top = trigger.getBoundingClientRect().top;
      if (top < -20) {
        gone();
        isDissolved = true;
      } else {
        rest();
        isDissolved = false;
      }
    },
  });

  return () => {
    clearTimeout(warm);
    if (animTween) animTween.kill();
    st.kill();
    state = "x";
    rest();
  };
}
