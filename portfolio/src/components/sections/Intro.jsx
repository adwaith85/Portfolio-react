import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content } from "../../data/content";
import { swarm } from "../cursors/swarmApi";
import { createPhotoDissolve } from "../../engine/photoDissolve";
import { handoff } from "../../engine/handoff";
import { makeOverlay, clearOverlays, dragBox } from "../../engine/swarmBuild";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import { themeColor, useTheme } from "../../theme/theme";
import { safeRefresh } from "../../hooks/useSmoothScroll";
import ThemeToggle from "../ui/ThemeToggle";

gsap.registerPlugin(ScrollTrigger);

const RED = () => themeColor("accent");
const INK = () => themeColor("ink");
const rgbTriplet = (value) => {
  const h = value.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
};
const rgba = (value, amount) => `rgb(${rgbTriplet(value)} / ${amount})`;
const SHOW_PLUS = true; // small "+" after the counter stats

// local to the intro: other sections keep reading content.hero.stats
const INTRO_STATS = [
  { value: 6, label: "PROJECTS DEVELOPED" },
  { value: 5, label: "LIVE DEPLOYMENTS" },
  { value: "MERN", label: "DEVELOPMENT STACK", text: true },
];

// Cursor pools: 12 agents type / click, 8 spare agents draw dashed boxes.
// Indices are 0..19 (the hover pointer is registered separately by CursorSwarm).
const TYPISTS = 12;
const BX = Array.from({ length: 8 }, (_, i) => 12 + i);
const HOP = 0.28; // cursor travel in real seconds

// every element the initial CSS hides and the build reveals (keep in sync with global.css)
/* Only elements the timeline explicitly brings back with autoAlpha belong here.
   Others (rule, sketch, real, counters, char containers) are revealed by clip,
   scale or per-character opacity and are covered by the CSS first-paint rule. */
const HIDE_SEL = [
  "[data-role]",
  "[data-hello]",
  "[data-line]",
  "[data-title]",
  "[data-title-line]",
  "[data-gl]",
  "[data-loc]",
  "[data-loc-icon]",
  "[data-loc-text]",
  "[data-row-inner]",
  "[data-stat-label]",
  "[data-stat-text]",
  "[data-plus]",
  "[data-rule-handle]",
  "[data-caret]",
  "[data-pen]",
  "[data-glow]",
  "[data-social-icon]",
  "[data-social-label]",
  "[data-dl-label]",
  "[data-dl-icon]",
].join(",");

/*
  Photo glow: red on the right edge, blue on the left (follows your body when the
  photo has a transparent background). Applied ONLY to a transparent cutout —
  never to an opaque photo, so the hair is always shown exactly as in the file.
*/
const PHOTO_GLOW = () =>
  `drop-shadow(14px 0 24px ${rgba(themeColor("photoGlow"), 0.3)}) ` +
  `drop-shadow(-12px 0 24px ${rgba(themeColor("buildGlow"), 0.22)})`;

// opaque photos only: a short side/bottom edge blend, never near the hair (top stays fully opaque)
const OPAQUE_MASK = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, rgb(var(--fg-rgb)) 6%, rgb(var(--fg-rgb)) 94%, transparent 100%), linear-gradient(to bottom, rgb(var(--fg-rgb)) 0%, rgb(var(--fg-rgb)) 88%, transparent 100%)",
  maskImage:
    "linear-gradient(to right, transparent 0%, rgb(var(--fg-rgb)) 6%, rgb(var(--fg-rgb)) 94%, transparent 100%), linear-gradient(to bottom, rgb(var(--fg-rgb)) 0%, rgb(var(--fg-rgb)) 88%, transparent 100%)",
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

/* checks /photo.png: "alpha" (transparent bg), "opaque" (has a box), or "missing".
   Starts on the fast default so the photo area exists on the very first paint. */
function usePhotoKind() {
  const [kind, setKind] = useState("alpha");

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 8;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 8, 8);
        const d = ctx.getImageData(0, 0, 8, 8).data;
        const corners = [0, 7, 56, 63].map((p) => d[p * 4 + 3]);
        setKind(corners.every((a) => a < 40) ? "alpha" : "opaque");
      } catch {
        setKind("opaque");
      }
    };
    img.onerror = () => setKind("missing");
    img.src = "/photo.webp";
  }, []);

  return kind;
}

/* text split into letters so it can be typed one by one */
function Typed({ text }) {
  const words = String(text).split(" ");
  return words.map((w, wi) => (
    <span key={wi}>
      <span className="inline-block whitespace-nowrap">
        {[...w].map((c, i) => (
          <span key={i} data-ch>
            {c}
          </span>
        ))}
      </span>
      {wi < words.length - 1 ? " " : ""}
    </span>
  ));
}

/* Types letters, but only writes the characters that actually changed and
   follows the typing edge from a pre-captured rect (or one captured on start). */
function typeChars(container, { duration = 0.8, agent = null, rects: preRects = null } = {}) {
  const tl = gsap.timeline();
  if (!container) return tl;
  const chars = [...container.querySelectorAll("[data-ch]")];
  let rects = preRects;
  const st = { n: 0 };
  let last = -1;

  tl.to(st, {
    n: chars.length,
    duration,
    ease: "none",
    onStart() {
      if (!rects) rects = chars.map((c) => c.getBoundingClientRect());
    },
    onUpdate() {
      const k = Math.floor(st.n);
      if (k !== last) {
        for (let i = Math.max(0, last); i < chars.length && i < k; i++) {
          chars[i].style.opacity = "1";
        }
        for (let i = Math.max(0, k); i < last; i++) {
          chars[i].style.opacity = "0";
        }
        last = k;
      }
      if (agent !== null && k > 0 && rects && rects[k - 1]) {
        swarm.placeAtRect(agent, rects[k - 1], 1, 0.85, 3, 0);
      }
    },
    onComplete() {
      chars.forEach((c) => {
        c.style.opacity = "1";
      });
    },
  });
  return tl;
}

/* same look as the shared typeReveal, but the rect is pre-captured (or
   captured on start) and the agent follows it with transform-only writes. */
function typeRevealFast(
  el,
  { duration = 0.7, smooth = false, caret = null, agent = null, rect: preRect = null } = {}
) {
  const tl = gsap.timeline();
  if (!el) return tl;
  const n = Math.max(4, (el.textContent || "").length);
  let rect = preRect;

  tl.set(el, { autoAlpha: 1 });
  tl.fromTo(
    el,
    { clipPath: "inset(-20% 100% -20% -5%)" },
    {
      clipPath: "inset(-20% -5% -20% -5%)",
      duration,
      ease: smooth ? "power2.out" : `steps(${n})`,
      onStart() {
        if (!rect) rect = el.getBoundingClientRect();
        if (caret) gsap.set(caret, { autoAlpha: 1 });
      },
      onUpdate() {
        const r = this.ratio;
        if (caret) caret.style.left = `${r * 100}%`;
        if (agent !== null && rect) swarm.placeAtRect(agent, rect, r, 0.8, 4, 0);
      },
      onComplete() {
        if (caret) gsap.set(caret, { autoAlpha: 0 });
        gsap.set(el, { clearProps: "clipPath" });
      },
    }
  );
  return tl;
}

/* SVG filter: the pencil-sketch look only (the real photo is never filtered) */
function Filters() {
  return (
    <svg
      width="0"
      height="0"
      className="pointer-events-none absolute"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="sketch-edge" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feGaussianBlur stdDeviation="0.9" />
          <feConvolveMatrix
            order="3"
            kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
            divisor="1"
            bias="0"
            edgeMode="duplicate"
            preserveAlpha="true"
          />
          {/* the 12 sets line strength: higher = more lines */}
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.9  12 0 0 0 0"
          />
        </filter>
      </defs>
    </svg>
  );
}

const SIL =
  "M200 40c-52 0-88 44-88 104 0 40 14 70 36 90-6 16-8 28-8 38-70 20-124 56-132 118v210h384V390c-8-62-62-98-132-118 0-10-2-22-8-38 22-20 36-50 36-90 0-60-36-104-88-104z";

/* placeholder until photo.png exists */
function Silhouette({ outline = false, ...rest }) {
  useTheme();
  return (
    <svg
      viewBox="0 0 400 600"
      className={outline ? "absolute inset-0 size-full" : "relative block h-full w-auto"}
      {...rest}
    >
      <path
        d={SIL}
        fill={outline ? "none" : themeColor("silFill")}
        stroke={outline ? `rgb(${rgbTriplet(themeColor("cursor"))})` : themeColor("silStroke")}
        strokeWidth={outline ? 3 : 2}
      />
      {!outline && (
        <>
          <text
            x="200"
            y="470"
            textAnchor="middle"
            fill={themeColor("silText")}
            fontSize="17"
            letterSpacing="2"
            style={{ fontFamily: "var(--t-font-body)" }}
          >
            ADD YOUR PHOTO
          </text>
          <text
            x="200"
            y="496"
            textAnchor="middle"
            fill={themeColor("silText2")}
            fontSize="14"
            style={{ fontFamily: "var(--t-font-body)" }}
          >
            public/photo.png
          </text>
        </>
      )}
    </svg>
  );
}

/* two stacked layers: the real photo, and a sketch version drawn over it */
function Photo({ kind }) {
  const opaque = kind === "opaque";
  useTheme();

  if (kind === "missing") {
    return (
      <div data-stack className="relative h-full">
        <Silhouette data-real style={{ filter: PHOTO_GLOW() }} />
        <Silhouette data-sketch outline />
        <i
          data-pen
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[rgb(var(--cursor-rgb)/0.9)] shadow-[0_0_14px_3px_rgb(var(--fg-rgb) / 0.45)]"
        />
      </div>
    );
  }

  // If public/photo.png is not a transparent cutout, replace it with a background-removed PNG for perfect hair edges.
  return (
    <div data-stack className="relative h-full" style={opaque ? OPAQUE_MASK : undefined}>
      <img
        data-real
        src="/photo.webp"
        alt="Adwaith A Kumar"
        className="relative block h-full w-auto max-w-none opacity-100"
        style={opaque ? undefined : { filter: PHOTO_GLOW() }}
      />
      <img
        data-sketch
        src="/photo.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full max-w-none"
        style={{ filter: "grayscale(1) contrast(1.6) brightness(1.1)" }}
      />
      <i
        data-pen
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[rgb(var(--cursor-rgb)/0.9)] shadow-[0_0_14px_3px_rgb(var(--fg-rgb) / 0.45)]"
      />
    </div>
  );
}

const rand = (a, b) => a + Math.random() * (b - a);

function edgePositions(n) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pad = 18;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const side = i % 4;
    const t = Math.random();
    if (side === 0) pts.push({ x: pad + t * (w - pad * 2), y: pad + Math.random() * 28 });
    else if (side === 1) pts.push({ x: w - pad - Math.random() * 28, y: pad + t * (h - pad * 2) });
    else if (side === 2) pts.push({ x: pad + t * (w - pad * 2), y: h - pad - Math.random() * 28 });
    else pts.push({ x: pad + Math.random() * 28, y: pad + t * (h - pad * 2) });
  }
  for (let i = pts.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts;
}

function rectOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function prepareNameChars(nameLine, period) {
  if (!nameLine) return [];
  const textNode = [...nameLine.childNodes].find(
    (n) => n.nodeType === 3 && n.textContent.trim().length
  );
  if (!textNode) return [...nameLine.querySelectorAll("[data-name-ch]")];
  const frag = document.createDocumentFragment();
  const chars = [];
  [...textNode.textContent].forEach((ch) => {
    const s = document.createElement("span");
    s.setAttribute("data-ch", "");
    s.setAttribute("data-name-ch", "");
    s.style.opacity = "0";
    s.textContent = ch;
    frag.appendChild(s);
    chars.push(s);
  });
  nameLine.insertBefore(frag, period || textNode);
  nameLine.removeChild(textNode);
  return chars;
}

function captureAllRects(root) {
  const $ = (s) => root.querySelector(s);
  const all = (s) => [...root.querySelectorAll(s)];
  const rects = new Map();
  const add = (el) => {
    if (el && !rects.has(el)) rects.set(el, rectOf(el));
  };

  [
    "[data-role]",
    "[data-status-text]",
    "[data-dot]",
    "[data-ghost]",
    "[data-stack]",
    "[data-real]",
    "[data-sketch]",
    "[data-pen]",
    "[data-glow]",
    "[data-hello]",
    "[data-name]",
    "[data-line]",
    "[data-period]",
    "[data-title]",
    "[data-sub]",
    "[data-loc]",
    "[data-dl]",
    "[data-dl-icon]",
    "[data-dl-label]",
  ].forEach((s) => add($(s)));

  all(
    "[data-gl],[data-title-line],[data-stat],[data-social],[data-social-icon],[data-social-label],[data-ch]"
  ).forEach(add);

  all("[data-stat]").forEach((row) => {
    [
      "[data-rule]",
      "[data-rule-handle]",
      "[data-row-inner]",
      "[data-stat-label]",
      "[data-stat-num]",
      "[data-plus]",
      "[data-stat-text]",
    ].forEach((s) => add(row.querySelector(s)));
  });

  const charRects = new Map();
  ["[data-status-text]", "[data-sub]", "[data-line]"].forEach((s) => {
    const c = $(s);
    if (c) {
      const ch = [...c.querySelectorAll("[data-ch]")];
      if (ch.length) {
        charRects.set(c, ch.map((x) => rects.get(x) || rectOf(x)));
      }
    }
  });

  return { rects, charRects, hostRect: rectOf(root) };
}

function applyHidden(el) {
  const all = (s) => [...el.querySelectorAll(s)];
  gsap.set(all(HIDE_SEL), { autoAlpha: 0 });
  // containers/revealed elements not fully covered by HIDE_SEL
  gsap.set(all("[data-status-text],[data-sub],[data-period],[data-dl],[data-social],[data-stat-num],[data-rule],[data-sketch],[data-real]"), {
    autoAlpha: 0,
  });
  gsap.set(all("[data-ch]"), { opacity: 0 });
  gsap.set(all("[data-gl]"), { autoAlpha: 0 });
  gsap.set(all("[data-dot]"), { autoAlpha: 0, scale: 0 });
  gsap.set(all("[data-period],[data-title]"), { color: INK() });
  gsap.set(all("[data-rule]"), { clipPath: "inset(0 100% 0 0)" });
  gsap.set(all("[data-sketch]"), { clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set(all("[data-real]"), { clipPath: "inset(0% -60% 100% -60%)" });
  all("[data-stat-num]").forEach((n) => {
    if (n.dataset.kind === "count") n.textContent = "00";
  });
}

/* The whole intro as one timeline. Times are in real seconds from the start. */
function buildIntro(root, cursors = true, pre = {}) {
  const $ = (s) => root.querySelector(s);
  const all = (s) => [...root.querySelectorAll(s)];

  const role = $("[data-role]");
  const statusText = $("[data-status-text]");
  const dot = $("[data-dot]");
  const ghost = $("[data-ghost]");
  const letters = all("[data-gl]");
  const stack = $("[data-stack]");
  const real = $("[data-real]");
  const sketch = $("[data-sketch]");
  const pen = $("[data-pen]");
  const glow = $("[data-glow]");
  const hello = $("[data-hello]");
  const nameWrap = $("[data-name]");
  const nameLine = $("[data-line]");
  const period = $("[data-period]");
  const title = $("[data-title]");
  const titleLines = all("[data-title-line]");
  const sub = $("[data-sub]");
  const loc = $("[data-loc]");
  const statRows = all("[data-stat]");
  const dl = $("[data-dl]");
  const dlIcon = $("[data-dl-icon]");
  const dlLabel = $("[data-dl-label]");
  const socials = all("[data-social]");
  const socialIcons = all("[data-social-icon]");
  const socialLabels = all("[data-social-label]");

  const rects = pre.rects || new Map();
  const charRects = pre.charRects || new Map();
  const hostRect = pre.hostRect || null;
  const ovs = pre.overlays || BX.map(() => makeOverlay(root));

  const R = (el) => rects.get(el) || null;
  const CR = (el) => charRects.get(el) || null;

  const tl = gsap.timeline({ paused: true });
  tl.timeScale(1);
  handoff.claim(tl);

  gsap.ticker.lagSmoothing(120, 16);

  // will-change hints on big animated layers during build
  [sketch, real, pen, glow].forEach((el) => {
    if (el) el.style.willChange = "opacity, clip-path, transform";
  });

  // At t=0 (cursor mode) claim all 20 agents and place in a tight centre cluster
  if (cursors) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 20; i++) {
      swarm.claim(i);
      const wrap = swarm.els([i])[0];
      if (wrap) {
        gsap.set(wrap, {
          x: cx + rand(-28, 28),
          y: cy + rand(-18, 18),
          opacity: 1,
          visibility: "visible",
          force3D: true,
        });
      }
    }
  }

  /* 12 typists (0..11) and 8 box artists (12..19). */
  const freeT = new Array(TYPISTS).fill(0);
  const reserveT = (idx, t, span) => {
    freeT[idx] = Math.max(freeT[idx], t + span);
  };

  const clickAt = (ag, t) => {
    tl.add(() => {
      if (cursors) swarm.click(ag);
    }, t);
  };

  const go = (ag, el, t, opts = {}) => {
    if (cursors) {
      tl.add(
        swarm.moveTo(ag, el, {
          duration: HOP,
          ease: "power3.out",
          rect: R(el),
          ...opts,
        }),
        t
      );
    }
    clickAt(ag, t + HOP);
    return t + HOP;
  };

  const box = (ag, el, t, tag, { dur = 0.3, pad = 3 } = {}) => {
    if (!el) return t;
    dragBox(tl, ovs[ag - 12], ag, el, root, t, {
      tag,
      dur,
      pad,
      travel: HOP,
      rect: R(el),
      hostRect,
      withCursor: cursors,
    });
    return t + HOP + dur; // box drawn by here
  };

  const typeStep = (ag, el, t, duration, opts = {}) => {
    if (!el) return t;
    const start = go(ag, el, t, opts.move || { offset: { x: 0, y: 0.55 } });
    tl.set(el, { autoAlpha: 1 }, start);
    if (opts.chars) {
      tl.add(
        typeChars(el, {
          duration,
          agent: cursors ? ag : null,
          rects: CR(el),
        }),
        start
      );
    } else {
      tl.add(
        typeRevealFast(el, {
          duration,
          smooth: Boolean(opts.smooth),
          caret: opts.caret || null,
          agent: cursors ? ag : null,
          rect: R(el),
        }),
        start
      );
    }
    return start + duration;
  };

  /* ---------- 0.00–0.80 TOP ROW + PORTFOLIO ---------- */
  // dashed boxes (drawn before elements appear)
  box(12, ghost, 0.0, "h1.ghost", { dur: 0.3, pad: 4 }); // PORTFOLIO word
  box(13, role, 0.0, "p.role", { dur: 0.3 });
  box(14, statusText, 0.0, "p.status", { dur: 0.3 });

  // role label (top line, includes name) - typed char-by-char by cursor
  {
    reserveT(0, 0.0, HOP + 0.35 + 0.05);
    const caret = $('[data-caret="role"]');
    const start = go(0, role, 0.0, { offset: { x: 0, y: 0.55 } });
    tl.set(role, { autoAlpha: 1 }, start);
    if (caret) tl.set(caret, { autoAlpha: 1 }, start);
    tl.add(
      typeChars(role, {
        duration: 0.35,
        agent: cursors ? 0 : null,
        rects: CR(role),
      }),
      start
    );
    if (caret) tl.set(caret, { autoAlpha: 0 }, start + 0.35);
  }

  // availability text
  reserveT(1, 0.02, HOP + 0.35 + 0.05);
  typeStep(1, statusText, 0.02, 0.35, { chars: true, move: { offset: { x: 0, y: 0.55 } } });

  // dot
  {
    const t = 0.0;
    const start = go(2, dot, t, { offset: { x: 0.5, y: 0.5 } });
    tl.fromTo(
      dot,
      { autoAlpha: 0, scale: 0 },
      { autoAlpha: 1, scale: 1, duration: 0.18, ease: "back.out(3)" },
      start
    );
    reserveT(2, t, HOP + 0.18 + 0.05);
  }

  // nine PORTFOLIO letters, one cursor each, stagger ~0.05
  letters.forEach((ch, i) => {
    const ag = 3 + i;
    const t = i * 0.05;
    const start = go(ag, ch, t, { offset: { x: 0.5, y: 0.5 } });
    tl.fromTo(
      ch,
      { autoAlpha: 0, scale: 0.6 },
      { autoAlpha: 1, scale: 1, duration: 0.18, ease: "back.out(2.4)" },
      Math.max(start, 0.58)
    );
    reserveT(ag, t, HOP + 0.2 + 0.05);
  });

  /* ---------- 0.20–1.50 PHOTO ---------- */
  // box drawn before sketch
  box(15, stack, 0.2, "figure.photo", { dur: 0.3, pad: 0 });

  // sketch draw (pen follows) - agent 3 after letter 0 (ends ~0.76)
  {
    const skT = 0.78;
    const skStart = go(3, stack, skT, { offset: { x: 0.5, y: 0 } });
    reserveT(3, skT, HOP + 0.55 + 0.05);
    tl.set(sketch, { autoAlpha: 1 }, skStart);
    tl.set(pen, { autoAlpha: 1 }, skStart);
    const skRect = R(stack);
    tl.fromTo(
      sketch,
      { clipPath: "inset(0% 0% 100% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.55,
        ease: "power2.inOut",
        onUpdate() {
          if (cursors && skRect) {
            swarm.placeAtRect(
              3,
              skRect,
              0.5 + 0.22 * Math.sin(this.ratio * 14),
              this.ratio
            );
          }
        },
      },
      skStart
    );
    tl.fromTo(
      pen,
      { y: 0 },
      {
        y: skRect ? skRect.height : 0,
        duration: 0.55,
        ease: "power2.inOut",
      },
      skStart
    );

    // colour reveal - agent 4 after letter 1 (ends ~0.76)
    const paintT = 1.08;
    const paintStart = go(4, real, paintT, { offset: { x: 0.5, y: 0.2 } });
    reserveT(4, paintT, HOP + 0.45 + 0.05);
    tl.set(real, { autoAlpha: 1 }, paintStart);
    const realRect = R(real) || R(stack);
    tl.fromTo(
      real,
      { clipPath: "inset(0% -60% 100% -60%)" },
      {
        clipPath: "inset(-20% -60% 0% -60%)",
        duration: 0.45,
        ease: "power2.inOut",
        clearProps: "clipPath",
        onUpdate() {
          if (cursors && realRect) swarm.placeAtRect(4, realRect, 0.5, this.ratio, 0, 0);
        },
      },
      paintStart
    );
    const photoEnd = paintStart + 0.45;
    tl.to(pen, { autoAlpha: 0, duration: 0.12 }, photoEnd);
    tl.to(glow, { autoAlpha: 1, duration: 0.2 }, photoEnd);
    tl.to(
      sketch,
      {
        autoAlpha: 0,
        duration: 0.15,
        onComplete() {
          if (sketch) sketch.style.filter = "none";
        },
      },
      photoEnd + 0.04
    );
  }

  /* ---------- 0.30–1.30 LEFT BLOCK (stagger ~0.12) ---------- */
  box(16, hello, 0.3, "span.hello", { dur: 0.3 });
  box(17, nameWrap, 0.42, "h1.name", { dur: 0.3, pad: 6 });
  box(18, title, 0.66, "h2.title", { dur: 0.3 });
  box(19, sub, 0.9, "p.about", { dur: 0.3 });

  // use agents after their earlier jobs are done (no overlaps)
  reserveT(0, 0.64, HOP + 0.35 + 0.05); // ag0 free after role (~0.63)
  typeStep(0, hello, 0.64, 0.35, { smooth: true, move: { offset: { x: 0, y: 0.55 } } });

  reserveT(5, 0.78, HOP + 0.45 + 0.05); // ag5 free after letter 2 (~0.76)
  {
    const start = go(5, nameLine, 0.78, { offset: { x: 0, y: 0.55 } });
    tl.set(nameLine, { autoAlpha: 1 }, start);
    tl.add(
      typeChars(nameLine, {
        duration: 0.45,
        agent: cursors ? 5 : null,
        rects: CR(nameLine),
      }),
      start
    );
  }

  reserveT(6, 0.82, HOP + 0.18 + 0.05); // ag6 free after letter 3 (~0.81)
  {
    const start = go(6, period, 0.82, { offset: { x: 0.5, y: 0.5 } });
    tl.to(period, { autoAlpha: 1, scale: 1, color: RED(), duration: 0.18, ease: "back.out(3)" }, start);
  }

  // title lines
  reserveT(7, 0.88, HOP + 0.4 + 0.12); // ag7 free after letter 4 (~0.86)
  reserveT(8, 1.0, HOP + 0.4 + 0.12); // ag8 free after letter 5 (~0.91)
  tl.set(title, { autoAlpha: 1 }, 0.88 + HOP);
  titleLines.forEach((line, i) => {
    const ag = 7 + i;
    const t = 0.88 + i * 0.12;
    const start = go(ag, line, t, { offset: { x: 0, y: 0.55 } });
    tl.set(line, { color: INK() }, start);
    tl.add(
      typeRevealFast(line, {
        duration: 0.4,
        agent: cursors ? ag : null,
        rect: R(line),
      }),
      start
    );
    const paintAt = start + 0.4 + 0.03;
    clickAt(ag, paintAt);
    tl.to(line, { color: RED(), duration: 0.14 }, paintAt);
  });
  tl.to(title, { color: RED(), duration: 0.12 }, 1.0 + HOP + 0.4 + 0.08);

  // paragraph (typed in 3 line-parts by up to 3 cursors)
  {
    const t = 1.08; // after letters 6-8 are done
    const chars = sub ? [...sub.querySelectorAll("[data-ch]")] : [];
    const srects = CR(sub) || [];
    const groups = [[], [], []];
    const grects = [[], [], []];
    if (chars.length && srects.length) {
      const tops = srects.map((r) => r.top);
      const minY = Math.min(...tops);
      const maxY = Math.max(...tops);
      const band = (maxY - minY) / 3 || 1;
      chars.forEach((ch, idx) => {
        const y = srects[idx] ? srects[idx].top : minY;
        let g = Math.floor((y - minY) / band);
        if (g > 2) g = 2;
        if (g < 0) g = 0;
        groups[g].push(ch);
        grects[g].push(srects[idx]);
      });
    } else {
      const third = Math.ceil(chars.length / 3) || 1;
      chars.forEach((ch, idx) => {
        const g = Math.min(2, Math.floor(idx / third));
        groups[g].push(ch);
        grects[g].push(srects[idx]);
      });
    }
    tl.set(sub, { autoAlpha: 1 }, t + HOP);
    [9, 10, 11].forEach((ag, gi) => {
      const gchars = groups[gi];
      if (!gchars || !gchars.length) return;
      reserveT(ag, t, HOP + 0.45 + 0.05);
      if (cursors) {
        const firstRect = grects[gi][0];
        if (firstRect) {
          tl.add(() => {
            swarm.claim(ag);
            gsap.to(swarm.els([ag])[0], {
              x: firstRect.left + 2,
              y: firstRect.top + firstRect.height * 0.8,
              duration: HOP,
              ease: "power3.out",
              force3D: true,
            });
          }, t);
        } else {
          tl.add(swarm.moveTo(ag, gchars[0], { duration: HOP, ease: "power3.out" }), t);
        }
      }
      clickAt(ag, t + HOP);
      const st = { n: 0 };
      let last = -1;
      tl.to(
        st,
        {
          n: gchars.length,
          duration: 0.45,
          ease: "none",
          onUpdate() {
            const k = Math.floor(st.n);
            if (k !== last) {
              for (let i = Math.max(0, last); i < k && i < gchars.length; i++) {
                gchars[i].style.opacity = "1";
              }
              last = k;
            }
            if (cursors && k > 0 && grects[gi][k - 1]) {
              swarm.placeAtRect(ag, grects[gi][k - 1], 1, 0.85, 3, 0);
            }
          },
          onComplete() {
            gchars.forEach((c) => {
              c.style.opacity = "1";
            });
          },
        },
        t + HOP
      );
    });
  }

  // location (agent 0 after hello) - built below paragraph: icon appears, text typed by cursor
  box(12, loc, 1.02, "p.location", { dur: 0.3 });
  const locIcon = loc ? loc.querySelector("[data-loc-icon]") : null;
  const locText = loc ? loc.querySelector("[data-loc-text]") : null;
  const locWorkT = 1.28;
  const locStart = go(0, loc, locWorkT, { offset: { x: 0, y: 0.55 } });
  tl.set(loc, { autoAlpha: 1 }, locStart);
  if (locIcon) {
    tl.fromTo(
      locIcon,
      { autoAlpha: 0, scale: 0.6, y: 4 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.12, ease: "back.out(2.2)" },
      locStart
    );
  }
  if (locText) {
    tl.add(
      typeChars(locText, {
        duration: 0.3,
        agent: cursors ? 0 : null,
        rects: CR(locText),
      }),
      locStart + 0.04
    );
  } else if (loc) {
    tl.add(
      typeRevealFast(loc, {
        duration: 0.3,
        smooth: true,
        agent: cursors ? 0 : null,
        rect: R(loc),
      }),
      locStart
    );
  }
  reserveT(0, locWorkT, HOP + 0.34 + 0.05);

  /* ---------- 0.70–1.80 STATS (rows stagger ~0.22) ---------- */
  statRows.forEach((row, i) => {
    const t = 0.7 + i * 0.22;
    const boxerAg = 13 + i; // 13,14,15
    box(boxerAg, row, t, "li.stat", { pad: 2, dur: 0.26 });

    const rule = row.querySelector("[data-rule]");
    const handle = row.querySelector("[data-rule-handle]");
    const inner = row.querySelector("[data-row-inner]");
    const label = row.querySelector("[data-stat-label]");
    const num = row.querySelector("[data-stat-num]");
    const plus = row.querySelector("[data-plus]");
    const textEl = row.querySelector("[data-stat-text]");

    const ag = 1 + i; // 1,2,3 reused
    // row 2 (ag3) must wait for photo sketch (ends ~1.61)
    const minWorkT = i === 2 ? 1.64 + HOP : 0;
    const workT = Math.max(t + HOP + 0.26 + 0.02, minWorkT);
    const travelStart = Math.max(workT - HOP, 0);
    reserveT(ag, travelStart, HOP + 0.6);
    if (cursors) {
      tl.add(
        swarm.moveTo(ag, rule || row, {
          duration: HOP,
          ease: "power3.out",
          rect: R(rule || row),
          offset: { x: 0, y: 0.5 },
        }),
        travelStart
      );
    }
    clickAt(ag, workT);

    const target = rule || row;
    tl.set(target, { autoAlpha: 1 }, workT);
    if (handle) tl.set(handle, { autoAlpha: 1 }, workT);

    const p = { v: 0 };
    const ruleRect = R(target);
    tl.to(
      p,
      {
        v: 1,
        duration: 0.32,
        ease: "power2.out",
        onUpdate() {
          if (rule) rule.style.clipPath = `inset(0 ${(1 - p.v) * 100}% 0 0)`;
          if (handle) handle.style.left = `${p.v * 100}%`;
          if (cursors && ruleRect) swarm.placeAtRect(ag, ruleRect, p.v, 0.5, 0, 0);
        },
      },
      workT
    );
    if (handle) tl.set(handle, { autoAlpha: 0 }, workT + 0.34);
    // build card content area
    if (inner) {
      tl.fromTo(
        inner,
        { autoAlpha: 0, clipPath: "inset(0 0 100% 0)" },
        {
          autoAlpha: 1,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.18,
          ease: "power2.out",
          clearProps: "clipPath",
        },
        workT + 0.08
      );
    }
    if (num) tl.set(num, { autoAlpha: 1 }, workT + 0.12);

    if (label) {
      tl.add(
        typeRevealFast(label, {
          duration: 0.28,
          agent: cursors ? ag : null,
          rect: R(label),
        }),
        workT + 0.16
      );
    }
    if (num && num.dataset.kind === "count") {
      const o = { v: 0 };
      const to = Number(num.dataset.to) || 0;
      let lastN = -1;
      tl.to(
        o,
        {
          v: to,
          duration: 0.36,
          ease: "power2.out",
          onUpdate: () => {
            const val = Math.round(o.v);
            if (val !== lastN) {
              num.textContent = String(val).padStart(2, "0");
              lastN = val;
            }
          },
        },
        workT + 0.2
      );
    }
    if (textEl) {
      // MERN text: use agent 4 after photo paint (ends ~1.81) to avoid overlap with agent 11 paragraph
      const tag = 4;
      const mt = Math.max(workT + 0.2, 1.82);
      reserveT(tag, mt - HOP, HOP + 0.32);
      if (cursors) {
        tl.add(
          swarm.moveTo(tag, textEl, {
            duration: HOP,
            ease: "power3.out",
            rect: R(textEl),
            offset: { x: 0, y: 0.6 },
          }),
          mt - HOP
        );
      }
      clickAt(tag, mt);
      tl.add(
        typeRevealFast(textEl, {
          duration: 0.28,
          agent: cursors ? tag : null,
          rect: R(textEl),
        }),
        mt
      );
    }
    if (plus) {
      tl.fromTo(
        plus,
        { autoAlpha: 0, scale: 0.5 },
        { autoAlpha: 1, scale: 1, duration: 0.14, ease: "back.out(3)" },
        workT + 0.48
      );
    }
  });

  /* ---------- 1.30–2.05 BUTTONS ---------- */
  const buttons = [dl, ...socials];
  const buttonIcons = [dlIcon, ...socialIcons];
  const buttonLabels = [dlLabel, ...socialLabels];
  buttons.forEach((btn, i) => {
    const t = 1.3 + i * 0.18;
    const boxerAg = 16 + i; // 16,17,18
    box(boxerAg, btn, t, ["a.cv", "a.github", "a.linkedin"][i], { pad: 2, dur: 0.24 });

    const ag = 5 + i; // 5,6,7 reused
    const workT = t + HOP + 0.24 + 0.02; // after box drawn
    const travelStart = workT - HOP;
    reserveT(ag, Math.max(freeT[ag] || 0, travelStart), HOP + 0.22);
    if (cursors) {
      tl.add(
        swarm.moveTo(ag, btn, {
          duration: HOP,
          ease: "power3.out",
          rect: R(btn),
          offset: { x: 0.5, y: 0.5 },
        }),
        travelStart
      );
    }
    clickAt(ag, workT);
    // build button structure: draw/reveal the container, then place icon and type label
    tl.set(btn, { transformOrigin: "0% 50%" }, workT);
    tl.fromTo(
      btn,
      { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" },
      {
        autoAlpha: 1,
        clipPath: "inset(0 0% 0 0)",
        duration: 0.18,
        ease: "power2.out",
        clearProps: "clipPath,transformOrigin",
        onUpdate() {
          if (cursors) {
            const r = R(btn);
            if (r) swarm.placeAtRect(ag, r, this.ratio, 0.5, 0, 0);
          }
        },
      },
      workT
    );
    const icon = buttonIcons[i];
    if (icon) {
      tl.fromTo(
        icon,
        { scale: 0, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.16, ease: "back.out(3)" },
        workT + 0.08
      );
    }
    const label = buttonLabels[i];
    if (label) {
      tl.add(
        typeRevealFast(label, {
          duration: 0.16,
          agent: cursors ? ag : null,
          rect: R(label),
        }),
        workT + 0.06
      );
    }
  });

  /* ---------- FINISH (total ~2.4s) ---------- */
  const fadeStart = 2.22;
  // fade temporary build overlays only (keep JSX selection boxes CSS-controlled)
  tl.to(all("[data-ov]"), { autoAlpha: 0, duration: 0.12 }, fadeStart);

  if (cursors) {
    const scatterEdges = edgePositions(20);
    const wraps = swarm.els([...Array(20).keys()]).filter(Boolean);
    if (wraps.length) {
      tl.to(
        wraps,
        {
          x: (i) => (scatterEdges[i] ? scatterEdges[i].x : 0),
          y: (i) => (scatterEdges[i] ? scatterEdges[i].y : 0),
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
          stagger: 0.003,
        },
        fadeStart
      );
    }
  }

  // final cleanup: appended at true end, nothing after
  tl.add(() => {
    gsap.ticker.lagSmoothing(500, 33);
    swarm.setBuilding(false);
    [sketch, real, pen, glow].forEach((el) => {
      if (el) el.style.willChange = "";
    });
    // ensure all hero content is fully visible in final state
    gsap.set(all(HIDE_SEL), { clearProps: "opacity,visibility,autoAlpha" });
    gsap.set(
      all(
        "[data-status-text],[data-sub],[data-period],[data-dl],[data-social],[data-stat-num],[data-rule]"
      ),
      { clearProps: "opacity,visibility,autoAlpha" }
    );
    all("[data-ch]").forEach((c) => {
      c.style.opacity = "1";
    });
    gsap.set(all("[data-gl]"), { autoAlpha: 1, clearProps: "opacity,visibility" });
    gsap.set(all("[data-dot]"), { autoAlpha: 1, scale: 1, clearProps: "opacity,visibility" });
    gsap.set(all("[data-period]"), { autoAlpha: 1, scale: 1, color: RED() });
    gsap.set(all("[data-title],[data-title-line]"), { color: RED() });
    gsap.set(all("[data-rule]"), { clearProps: "clipPath,opacity,visibility" });
    gsap.set(all("[data-rule-handle],[data-pen],[data-caret]"), { autoAlpha: 0 });
    gsap.set(all("[data-sketch]"), { autoAlpha: 0, clearProps: "clipPath,filter" });
    gsap.set(all("[data-real]"), { autoAlpha: 1, clearProps: "clipPath" });
    gsap.set(all("[data-glow]"), { autoAlpha: 1 });
    all("[data-stat-num]").forEach((n) => {
      if (n.dataset.kind === "count") {
        n.textContent = String(Number(n.dataset.to) || 0).padStart(2, "0");
      }
    });
    swarm.stopAll();
    swarm.hideAll();
    swarm.setIntroDone(true);
    clearOverlays(root);
  }, Math.max(tl.duration(), fadeStart + 0.2) + 0.05);

  tl.remeasure = () => {
    const fresh = captureAllRects(root);
    fresh.rects.forEach((v, k) => rects.set(k, v));
    fresh.charRects.forEach((v, k) => charRects.set(k, v));
  };

  return tl;
}

export default function Intro() {
  const { hero } = content;
  const enabled = useAgentsEnabled();
  const kind = usePhotoKind();
  const theme = useTheme();
  const root = useRef(null);
  const ghost = useRef(null);
  const photoDrift = useRef(null);
  const photoWrap = useRef(null);
  const glowWrap = useRef(null);
  const dust = useRef(null);
  const introTl = useRef(null);
  const dissolveCleanup = useRef(null);
  const buildDone = useRef(false);
  const finishNowRef = useRef(null);
  const kindRef = useRef(kind);
  kindRef.current = kind;

  // only the first name is shown in the hero
  const firstName = hero.name.split(" ")[0];

  const destroyDissolve = () => {
    if (dissolveCleanup.current) {
      try {
        dissolveCleanup.current();
      } catch {}
      dissolveCleanup.current = null;
    }
  };

  const createDissolveLate = () => {
    destroyDissolve();
    if (!root.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    try {
      dissolveCleanup.current = createPhotoDissolve({
        trigger: root.current,
        canvas: dust.current,
        photoEl: photoWrap.current,
        glowEl: glowWrap.current,
        getImg: () => {
          const n = root.current?.querySelector("[data-real]");
          return n && n.tagName === "IMG" ? n : null;
        },
        mode: kindRef.current,
      });
      // one refresh after late creation so ScrollTrigger picks it up
      safeRefresh();
    } catch {
      dissolveCleanup.current = null;
    }
  };

  /* Apply hidden state before first paint, start the build once ready, and
     never leave the page blank. */
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    buildDone.current = false;
    applyHidden(el);
    el.classList.remove("intro-prep");

    const allSel = (s) => [...el.querySelectorAll(s)];
    let tl = null;
    let watchdog = null;
    let started = false;
    let cancelled = false;
    let off = () => {};
    let timer = null;
    let fontReady = false;
    let swarmReady = false;
    const timeouts = [];

    const after = (ms, fn) => {
      const id = setTimeout(fn, ms);
      timeouts.push(id);
      return id;
    };

    const showFinalState = () => {
      gsap.set(allSel(HIDE_SEL), { clearProps: "opacity,visibility,autoAlpha" });
      gsap.set(
        allSel(
          "[data-status-text],[data-sub],[data-period],[data-dl],[data-social],[data-stat-num],[data-rule]"
        ),
        { clearProps: "opacity,visibility,autoAlpha" }
      );
      allSel("[data-ch]").forEach((c) => {
        c.style.opacity = "1";
      });
      gsap.set(allSel("[data-gl]"), { autoAlpha: 1, clearProps: "opacity,visibility" });
      gsap.set(allSel("[data-dot]"), { scale: 1, clearProps: "opacity,visibility,autoAlpha" });
      gsap.set(allSel("[data-period]"), { color: RED(), autoAlpha: 1, scale: 1 });
      gsap.set(allSel("[data-title]"), { color: RED() });
      allSel("[data-title-line]").forEach((l) => {
        l.style.color = RED();
      });
      gsap.set(allSel("[data-rule]"), { clearProps: "clipPath" });
      gsap.set(allSel("[data-rule-handle],[data-pen],[data-caret]"), { autoAlpha: 0 });
      gsap.set(allSel("[data-sketch]"), { autoAlpha: 0, clearProps: "clipPath,filter,willChange" });
      gsap.set(allSel("[data-real]"), { autoAlpha: 1, clearProps: "clipPath,willChange" });
      gsap.set(allSel("[data-glow]"), { autoAlpha: 1, clearProps: "willChange" });
      allSel("[data-stat-num]").forEach((n) => {
        if (n.dataset.kind === "count") {
          n.textContent = String(Number(n.dataset.to) || 0).padStart(2, "0");
        }
      });
      clearOverlays(el);
      gsap.ticker.lagSmoothing(500, 33);
      swarm.setBuilding(false);
      swarm.stopAll();
      swarm.hideAll();
      swarm.setIntroDone(true);
    };

    const onBuildComplete = () => {
      if (buildDone.current) return;
      buildDone.current = true;
      // create dissolve after build completes (idle callback with timeout fallback)
      const schedule = (fn) => {
        if (typeof requestIdleCallback === "function") {
          const id = requestIdleCallback(fn, { timeout: 500 });
          return () => cancelIdleCallback(id);
        }
        const id = setTimeout(fn, 60);
        return () => clearTimeout(id);
      };
      const cancelIdle = schedule(() => {
        if (!cancelled) createDissolveLate();
      });
      // store cancel in case of unmount before idle fires
      timeouts.push({ cancelIdle });
    };

    const finishNow = (reason) => {
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
      }
      if (tl) {
        try {
          if (tl.progress() < 1) tl.progress(1);
        } catch {}
      }
      showFinalState();
      onBuildComplete();
    };
    finishNowRef.current = finishNow;

    const startWatchdog = () => {
      watchdog = setTimeout(() => {
        if (!tl || cancelled) return;
        try {
          if (tl.progress() < 1) finishNow("timeout");
        } catch {
          finishNow("timeout");
        }
      }, 6000);
    };

    const onResize = () => {
      if (tl && tl.remeasure) tl.remeasure();
    };
    window.addEventListener("resize", onResize);

    if (reduced) {
      // Reduced motion: show finished state immediately, no dissolve.
      const nameLine = el.querySelector("[data-line]");
      const period = el.querySelector("[data-period]");
      prepareNameChars(nameLine, period);
      showFinalState();
      swarm.setIntroDone(true);
      return () => {
        cancelled = true;
        window.removeEventListener("resize", onResize);
        gsap.ticker.lagSmoothing(500, 33);
      };
    }

    const run = async () => {
      try {
        // prewarm: fonts -> decode photo -> DOM/overlays -> rects -> 2 rAF -> play
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready.catch(() => {});
        }
        if (cancelled) return;

        let useCursors = enabled;
        if (enabled) {
          let swarmResolved = false;
          await new Promise((resolve) => {
            let timeoutId = null;
            const done = () => {
              if (timeoutId) clearTimeout(timeoutId);
              resolve();
            };
            const offReady = swarm.whenReady(() => {
              swarmResolved = true;
              try {
                offReady();
              } catch {}
              done();
            });
            const poll = () => {
              if (swarmResolved) return;
              // if agents got registered, treat as ready
              if (swarm.els([0]).length > 0) {
                swarmResolved = true;
                try {
                  offReady();
                } catch {}
                done();
                return;
              }
              if (!cancelled) requestAnimationFrame(poll);
            };
            requestAnimationFrame(poll);
            timeoutId = setTimeout(() => {
              swarmResolved = swarmResolved || swarm.els([0]).length > 0;
              try {
                offReady();
              } catch {}
              done();
            }, 3000);
            off = () => {
              if (timeoutId) clearTimeout(timeoutId);
              try {
                offReady();
              } catch {}
            };
          });
          useCursors = swarmResolved || swarm.els([0]).length > 0;
        }
        if (cancelled) return;

        // prepare per-char name before rect capture
        const nameLine = el.querySelector("[data-line]");
        const period = el.querySelector("[data-period]");
        prepareNameChars(nameLine, period);
        // hide newly created name chars
        el.querySelectorAll("[data-name-ch]").forEach((c) => {
          c.style.opacity = "0";
        });

        // create overlays (and keep host relative)
        const overlays = BX.map(() => makeOverlay(el));

        // decode photo
        const photoImg = el.querySelector("[data-real]");
        if (photoImg && typeof photoImg.decode === "function") {
          await photoImg.decode().catch(() => {});
        }
        if (cancelled) return;

        // capture all rects once in one batch
        const { rects, charRects, hostRect } = captureAllRects(el);

        // wait two animation frames
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (cancelled) return;

        if (!useCursors && enabled) {
          swarm.stopAll();
          swarm.hideAll();
        }

        tl = buildIntro(el, useCursors, { rects, charRects, hostRect, overlays });
        introTl.current = tl;

        tl.eventCallback("onComplete", () => {
          onBuildComplete();
        });

        if (useCursors) {
          swarm.setBuilding(true);
        }
        startWatchdog();

        tl.play();
      } catch {
        if (!cancelled) finishNow("error");
      }
    };

    // 400ms guard: don't block forever if fonts/swarm stall, but still do prewarm steps as possible
    timer = setTimeout(() => {
      // allow run to proceed even if something is slow; we don't force flags here because run awaits properly
    }, 400);
    void run();

    return () => {
      cancelled = true;
      off();
      if (timer) clearTimeout(timer);
      if (watchdog) clearTimeout(watchdog);
      timeouts.forEach((t) => {
        if (t && typeof t.cancelIdle === "function") t.cancelIdle();
        else clearTimeout(t);
      });
      window.removeEventListener("resize", onResize);
      try {
        if (tl) tl.kill();
      } catch {}
      destroyDissolve();
      gsap.ticker.lagSmoothing(500, 33);
      swarm.setBuilding(false);
      clearOverlays(el);
      finishNowRef.current = null;
      introTl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* GSAP writes colors inline; refresh those when the palette changes. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const refresh = () => {
      gsap.set(el.querySelectorAll("[data-period],[data-title],[data-title-line]"), {
        color: RED(),
      });
      gsap.set(el.querySelectorAll("[data-line]"), { color: INK() });
    };
    window.addEventListener("themechange", refresh);
    return () => window.removeEventListener("themechange", refresh);
  }, [theme]);

  /* recreate dissolve on photo kind change after the intro build is done */
  useEffect(() => {
    if (buildDone.current) createDissolveLate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  /* mouse depth: PORTFOLIO and the photo both drift, in opposite directions (desktop only) */
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const ctx = gsap.context(() => {
      const opts = { duration: 0.9, ease: "power3.out" };
      const gx = gsap.quickTo(ghost.current, "x", opts);
      const gy = gsap.quickTo(ghost.current, "y", opts);

      const photo = photoDrift.current;
      const px = photo ? gsap.quickTo(photo, "x", opts) : null;
      const py = photo ? gsap.quickTo(photo, "y", opts) : null;

      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        gx(-nx * 36);
        gy(-ny * 18);
        if (px) px(nx * 22);
        if (py) py(ny * 14);
      };

      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    }, root);

    return () => ctx.revert();
  }, [kind]);

  /* leaving / returning to section 1: finish the build and make sure no cursor stays */
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const actuallyLeft = () => {
      if (!el) return true;
      const y = window.scrollY || window.pageYOffset || 0;
      return y >= el.offsetHeight - 1;
    };

    const guardedHide = () => {
      // never kill the cursors a following section currently owns
      if (!handoff.getSection()) {
        swarm.stopAll();
        swarm.hideAll();
      }
    };

    const st = ScrollTrigger.create({
      trigger: el,
      onLeave: () => {
        if (!actuallyLeft()) return;
        const tl = introTl.current;
        if (tl && tl.progress() < 1) {
          if (finishNowRef.current) finishNowRef.current("leave");
          else {
            try {
              tl.progress(1);
            } catch {}
          }
        }
        guardedHide();
      },
      onEnterBack: () => {
        // intro should be done; ensure no stray cursors linger
        guardedHide();
      },
    });

    return () => st.kill();
  }, []);

  return (
    <section
      id="home"
      ref={root}
      className="intro-prep sticky top-0 flex h-svh flex-col gap-[1.2svh] overflow-x-clip overflow-y-hidden px-gutter py-[2svh] lg:gap-0 lg:py-[4svh]"
    >
      <Filters />
      <ThemeToggle />

      {/* dust canvas: the powder the photo turns into while you scroll (clipped to this section) */}
      <canvas
        ref={dust}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[6] hidden size-full"
      />

      {/* TOP ROW: both ends stay on one line at every width */}
      <div className="relative z-[5] flex shrink-0 items-start justify-between gap-2 whitespace-nowrap [text-shadow:0_2px_10px_rgb(var(--shadow-rgb) / 0.9)]">
        <p
          data-cursor-hover
          className="font-medium uppercase leading-tight text-muted !text-[clamp(6.5px,2.25vw,0.78rem)] !tracking-[clamp(0em,0.2vw,0.08em)]"
        >
          <span className="relative inline-block">
            <span data-role className="inline-block text-red">
              <Typed text={hero.role[0]} />
            </span>
            <i
              data-caret="role"
              className="pointer-events-none invisible absolute left-0 top-[10%] h-[80%] w-[2px] bg-ink"
            />
          </span>
        </p>

        <p
          data-cursor-hover
          className="flex items-center gap-2 font-medium uppercase leading-tight text-muted !text-[clamp(6.5px,2.25vw,0.78rem)] !tracking-[clamp(0em,0.2vw,0.08em)]"
        >
          <i
            data-dot
            className="size-[7px] shrink-0 rounded-full bg-red shadow-[0_0_0_4px_rgb(var(--accent-rgb) / 0.25)]"
          />
          <span data-status-text>
            <Typed text={hero.availability} />
          </span>
        </p>
      </div>

      {/* GHOST: one solid Anton word, fully visible, centered behind the photo and all content */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[6svh] z-0 flex justify-center lg:top-[12svh]">
        <div ref={ghost}>
          <span data-ghost className="block select-none whitespace-nowrap font-display text-[min(24vw,17svh)] leading-[0.85] lg:text-[calc(min(20vw,35svh)+6px)]">
            {"PORTFOLIO".split("").map((ch, i) => (
              <span
                key={i}
                data-gl
                className="inline-block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, var(--t-accent) 0%, var(--t-accent-deep) 38%, var(--t-ghost-3) 72%, var(--t-ghost-4) 100%)",
                }}
              >
                {ch}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* MAIN: left text in flow, photo below it on mobile; three columns on desktop */}
      <div className="relative z-[3] min-h-0 flex-1 lg:absolute lg:inset-x-gutter lg:bottom-0 lg:top-[30svh] lg:mt-0 lg:grid lg:grid-cols-3 lg:items-center lg:isolate">
        {/* LEFT: hello, name, title, paragraph, location */}
        <div className="absolute inset-x-0 top-[12.5svh] z-[3] flex justify-center lg:static lg:col-start-1">
          <div className="w-full max-w-[28rem] text-left">
            <p className="mb-[1.2svh] pl-[0.4vw] leading-none lg:mb-[0.4svh]">
              <span
                data-hello
                data-cursor-hover
                className="inline-block origin-bottom-left -rotate-[8deg] font-script text-[min(4vw,6svh)] transition-[rotate] duration-300 hover:-rotate-[2deg] max-sm:text-[clamp(2.2rem,9vw,3rem)]"
              >
                Hello, I'm
              </span>
            </p>

            <h1 className="display mt-[1.4svh] text-[min(11vw,15svh)] max-sm:text-[clamp(3rem,20vw,5.5rem)] lg:mt-[0.3svh]">
              <span data-name data-cursor-hover className="group/name relative inline-block">
                <span data-line className="block w-fit">
                  {firstName}
                  <span data-period className="text-red">
                    .
                  </span>
                </span>
              </span>
            </h1>

            <h2 className="mt-[1.4svh] font-body text-[min(2.4vw,4.2svh)] font-extrabold uppercase leading-[1.1] tracking-tight text-red max-sm:text-[clamp(1.15rem,5.4vw,1.8rem)] lg:mt-[1svh]">
              <span
                data-title
                data-cursor-hover
                className="inline-block transition-colors duration-200 hover:text-ink!"
              >
                <span data-title-line className="block">
                  {hero.titleLines[0]}
                </span>
                <span data-title-line className="block">
                  {hero.titleLines[1]}
                </span>
              </span>
            </h2>

            <p
              data-sub
              data-cursor-hover
              className="mt-[1.4svh] max-w-[28rem] text-[min(1rem,2svh)] leading-relaxed text-ink/70 transition-colors duration-300 hover:text-ink max-sm:text-[clamp(0.68rem,1.5svh,0.9rem)] max-sm:leading-[1.4] [@media(max-height:700px)]:leading-snug [@media(max-height:600px)]:hidden lg:mt-[1svh] lg:[@media(max-height:640px)]:hidden"
            >
              <Typed text={hero.tagline} />
            </p>

            <p
              data-loc
              data-cursor-hover
              className="label group/loc mt-[1.4svh] flex items-center gap-2.5 transition-colors duration-200 hover:text-ink max-sm:!text-[clamp(0.7rem,1.5svh,0.82rem)] lg:mt-[1.2svh] lg:[@media(max-height:560px)]:hidden"
            >
              <svg
                data-loc-icon
                viewBox="0 0 24 24"
                className="size-4 shrink-0 fill-none stroke-red transition-transform duration-300 group-hover/loc:-translate-y-1"
                strokeWidth="1.8"
              >
                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              <span data-loc-text>
                <Typed text={content.about.location} />
              </span>
            </p>
          </div>
        </div>

        {/* PHOTO: below the left text on mobile (head can never overlap it); centre on desktop */}
        <div
          data-photo-hover
          data-cursor-hover
          className="absolute inset-x-0 bottom-[-2svh] z-[1] flex h-[56svh] justify-center lg:static lg:inset-x-auto lg:bottom-auto lg:order-none lg:col-start-2 lg:mt-0 lg:h-auto"
        >
          <div
            ref={photoDrift}
            className="pointer-events-none relative z-[1] flex h-full w-full items-end justify-center will-change-transform lg:absolute lg:inset-x-0 lg:-bottom-[6svh] lg:h-[83svh]"
          >
            <div className="relative h-full">
              <div ref={glowWrap} className="absolute inset-0 will-change-transform">
                <i
                  data-glow
                  className="absolute -inset-[8%] bg-[radial-gradient(ellipse_at_66%_55%,rgb(var(--accent-rgb) / 0.14),transparent_58%),radial-gradient(ellipse_at_34%_55%,var(--t-hero-glow-blue),transparent_52%)] blur-2xl"
                />
              </div>
              {/* extra side padding so the glow is never cut off */}
              <div ref={photoWrap} className="relative -mx-16 h-full px-16">
                <Photo kind={kind} />
              </div>
            </div>
          </div>
        </div>

        {/* readability gradient under the mobile right block (lower 22svh only) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[22svh] bg-gradient-to-t from-[var(--t-hero-mobile-scrim)] to-transparent lg:hidden"
        />

        {/* RIGHT: stats, CV, socials */}
        <div className="absolute inset-x-0 bottom-0 z-[5] [text-shadow:0_1px_8px_rgb(var(--shadow-rgb) / 0.85)] lg:static lg:col-start-3 lg:z-[3] lg:ml-auto lg:mt-0 lg:[text-shadow:none]">
          <div className="relative w-full lg:ml-auto lg:w-[min(36rem,30vw)]">
            <ul data-stats className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0">
              {INTRO_STATS.map((s) => (
                <li key={s.label} data-stat data-cursor-hover className="group/stat relative">
                  <div
                    data-row-inner
                    className="flex flex-col gap-0.5 py-[1.4svh] transition-[translate] duration-300 group-hover/stat:translate-x-2 [@media(max-height:700px)]:py-[1svh] lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:py-[1.8svh]"
                  >
                    <span className="display flex min-w-[0.85em] items-end text-[clamp(2.4rem,11vw,3.4rem)] leading-none text-red transition-[text-shadow] duration-300 group-hover/stat:[text-shadow:0_0_26px_rgb(var(--accent-rgb) / 0.65)] lg:text-[min(4.2vw,7.6svh)]">
                      <span
                        data-stat-num
                        data-kind={s.text ? "text" : "count"}
                        data-to={s.value}
                        className="tabular-nums"
                      >
                        {s.text ? (
                          <span data-stat-text>MERN</span>
                        ) : (
                          String(s.value).padStart(2, "0")
                        )}
                      </span>
                      {!s.text && SHOW_PLUS && (
                        <span
                          data-plus
                          className="mb-[0.1em] ml-[0.05em] text-[0.42em] leading-none"
                        >
                          +
                        </span>
                      )}
                    </span>
                    <span
                      data-stat-label
                      className="label inline-block text-right leading-tight !text-[clamp(0.62rem,2.6vw,0.8rem)] !tracking-[clamp(0em,0.2vw,0.08em)] transition-colors duration-300 group-hover/stat:text-ink lg:!text-[min(0.95vw,1.9svh)] lg:!tracking-[0.1em]"
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* the divider a cursor draws, with its blue drag handle */}
                  <i
                    data-rule
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[rgb(var(--cursor-rgb)/0.15)] transition-colors duration-300 group-hover/stat:bg-red"
                  />
                  <i
                    data-rule-handle
                    className="pointer-events-none absolute bottom-0 left-0 z-[2] size-2 -translate-x-1/2 translate-y-1/2 border border-[var(--t-build)] bg-[rgb(var(--cursor-rgb))]"
                  />
                </li>
              ))}
            </ul>

            {/* Download CV / GitHub / LinkedIn: one never-wrapping row */}
            <div className="mt-[1.2svh] grid w-full grid-cols-3 gap-2 lg:mt-[2svh]">
              <a
                data-dl
                data-cursor-hover
                href="/Adwaith_A_Kumar_Resume.pdf"
                download
                className="label relative inline-flex min-w-0 items-center justify-center gap-[0.15rem] overflow-hidden whitespace-nowrap rounded-full border border-[rgb(var(--cursor-rgb)/0.15)] !text-[clamp(0.55rem,2.8vw,0.76rem)] !tracking-[0.02em] leading-none text-ink transition-[color,border-color,box-shadow,translate] duration-[250ms] lg:gap-2 lg:!text-[min(0.82vw,1.65svh)]"
              >
                <i data-wipe aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-red" />
                <span data-dl-icon className="relative z-[1] inline-flex shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[0.9rem] shrink-0 fill-none stroke-red transition-transform duration-300 lg:size-4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
                  </svg>
                </span>
                <span data-dl-label className="relative z-[1] inline-block">
                  Download CV
                </span>
              </a>

              <a
                data-social
                data-cursor-hover
                href={content.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex min-w-0 items-center justify-center gap-[0.15rem] overflow-hidden whitespace-nowrap rounded-full border border-[rgb(var(--cursor-rgb)/0.15)] font-medium uppercase leading-none text-ink !text-[clamp(0.55rem,2.8vw,0.76rem)] !tracking-[0.02em] transition-[color,border-color,box-shadow,translate] duration-[250ms] lg:gap-2 lg:!text-[min(0.82vw,1.65svh)] lg:!tracking-[0.08em]"
              >
                <i data-wipe aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-red" />
                <span data-social-icon className="relative z-[1] inline-flex shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-[0.9rem] shrink-0 fill-current transition-transform duration-300 lg:size-4"
                  >
                    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
                  </svg>
                </span>
                <span data-social-label className="relative z-[1] inline-block">
                  GitHub
                </span>
              </a>

              <a
                data-social
                data-cursor-hover
                href={content.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex min-w-0 items-center justify-center gap-[0.15rem] overflow-hidden whitespace-nowrap rounded-full border border-[rgb(var(--cursor-rgb)/0.15)] font-medium uppercase leading-none text-ink !text-[clamp(0.55rem,2.8vw,0.76rem)] !tracking-[0.02em] transition-[color,border-color,box-shadow,translate] duration-[250ms] lg:gap-2 lg:!text-[min(0.82vw,1.65svh)] lg:!tracking-[0.08em]"
              >
                <i data-wipe aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-red" />
                <span data-social-icon className="relative z-[1] inline-flex shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-[0.9rem] shrink-0 fill-current transition-transform duration-300 lg:size-4"
                  >
                    <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 21 11 21 14.2V21h-4v-6.2c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.42 1.6-2.42 3.3V21H9z" />
                  </svg>
                </span>
                <span data-social-label className="relative z-[1] inline-block">
                  LinkedIn
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
