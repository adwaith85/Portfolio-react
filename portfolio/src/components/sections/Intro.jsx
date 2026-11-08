import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { scrollToId } from "../../hooks/useSmoothScroll";
import { swarm } from "../cursors/swarmApi";
import { typeReveal, dragSelect } from "../../engine/buildKit";
import { createPhotoDissolve } from "../../engine/photoDissolve";
import { handoff } from "../../engine/handoff";
import { makeOverlay, clearOverlays, dragBox } from "../../engine/swarmBuild";
import useAgentsEnabled from "../../engine/useAgentsEnabled";

const RED = "#d61a29";
const INK = "#f2efeb";
const SPEED = 1.35; // raise to make the whole intro faster
const SHOW_PLUS = true; // small "+" after the stat numbers (set false for exact numbers)

// which cursor does which job
const AG = {
  layout: 0,
  design: 1,
  content: 2,
  logic: 3,
  data: 4,
  motion: 5,
  api: 6,
  style: 7,
  ghost: 8,
  pin: 9,
  status: 10,
  tag: 11,
};

// spare cursors that drag a selection box over each element before it appears
const BX = [12, 13, 14, 15, 16, 17, 18, 19];

/*
  Photo glow: red on the right edge, blue on the left (follows your body when the
  photo has a transparent background).
*/
const PHOTO_GLOW =
  "drop-shadow(26px 0 34px rgba(214,26,41,0.6)) drop-shadow(-22px 0 34px rgba(50,110,255,0.45))";

// used while the photo still has its own dark rectangle: fades the box edges away
const FADE =
  "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 12%, #000 100%)";
const PHOTO_MASK = {
  WebkitMaskImage: FADE,
  maskImage: FADE,
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

/* checks /photo.png: "alpha" (transparent bg), "opaque" (has a box), or "missing" */
function usePhotoKind() {
  const [kind, setKind] = useState("loading");

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
    img.src = "/photo.png";
  }, []);

  return kind;
}

/* text split into letters so it can be typed one by one */
function Typed({ text }) {
  const words = text.split(" ");
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

/* types the letters inside `container` one at a time; an agent can follow the typing edge */
function typeChars(container, { duration = 0.8, agent = null } = {}) {
  const tl = gsap.timeline();
  if (!container) return tl;
  const chars = [...container.querySelectorAll("[data-ch]")];
  const st = { n: 0 };
  tl.to(st, {
    n: chars.length,
    duration,
    ease: "none",
    onUpdate() {
      const k = Math.floor(st.n);
      for (let i = 0; i < chars.length; i++) {
        chars[i].style.opacity = i < k ? "1" : "0";
      }
      if (agent !== null && k > 0) swarm.placeAt(agent, chars[k - 1], 1, 0.85, 3, 0);
    },
  });
  return tl;
}

/* SVG filters: the pencil-sketch look, and the hair/edge firming for the cutout photo */
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

        {/* slope = how strongly soft edges are made solid (1 = off, 2 = default, 3 = very firm) */}
        <filter id="solid-alpha" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="linear" slope="2" intercept="0" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}

const SIL =
  "M200 40c-52 0-88 44-88 104 0 40 14 70 36 90-6 16-8 28-8 38-70 20-124 56-132 118v210h384V390c-8-62-62-98-132-118 0-10-2-22-8-38 22-20 36-50 36-90 0-60-36-104-88-104z";

/* placeholder until photo.png exists */
function Silhouette({ outline = false, ...rest }) {
  return (
    <svg
      viewBox="0 0 400 600"
      className={outline ? "absolute inset-0 size-full" : "relative block h-full w-auto"}
      {...rest}
    >
      <path
        d={SIL}
        fill={outline ? "none" : "#131010"}
        stroke={outline ? "#ffffff" : "#2a2222"}
        strokeWidth={outline ? 3 : 2}
      />
      {!outline && (
        <>
          <text
            x="200"
            y="470"
            textAnchor="middle"
            fill="#4a4040"
            fontSize="17"
            letterSpacing="2"
            fontFamily="Manrope, sans-serif"
          >
            ADD YOUR PHOTO
          </text>
          <text
            x="200"
            y="496"
            textAnchor="middle"
            fill="#3a3232"
            fontSize="14"
            fontFamily="Manrope, sans-serif"
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

  if (kind === "missing") {
    return (
      <div data-stack className="relative h-full">
        <Silhouette data-real style={{ filter: PHOTO_GLOW }} />
        <Silhouette data-sketch outline />
        <i
          data-pen
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/90 shadow-[0_0_14px_3px_rgba(255,255,255,0.45)]"
        />
      </div>
    );
  }

  return (
    <div data-stack className="relative h-full" style={opaque ? PHOTO_MASK : undefined}>
      <img
        data-real
        src="/photo.png"
        alt="Adwaith A Kumar"
        className="relative block h-full w-auto max-w-none opacity-100"
        style={opaque ? undefined : { filter: PHOTO_GLOW }}
      />
      <img
        data-sketch
        src="/photo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full max-w-none"
        style={{ filter: "url(#sketch-edge)" }}
      />
      <i
        data-pen
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/90 shadow-[0_0_14px_3px_rgba(255,255,255,0.45)]"
      />
    </div>
  );
}

/* dashed selection box with corner handles and a tag, like a design tool */
function SelBox({ tag, className = "" }) {
  const corners = [
    "-left-1 -top-1",
    "-right-1 -top-1",
    "-bottom-1 -left-1",
    "-bottom-1 -right-1",
  ];
  return (
    <span
      data-sel
      className={`pointer-events-none absolute -left-3 -top-3 z-[3] border border-dashed border-[#4c8dff] ${className}`}
    >
      {corners.map((c) => (
        <i
          key={c}
          data-handle
          className={`absolute size-2 border border-[#4c8dff] bg-white ${c}`}
        />
      ))}
      <b
        data-tag
        className="absolute -top-6 left-0 whitespace-nowrap rounded-sm bg-[#4c8dff] px-1.5 py-[3px] text-[10px] font-semibold leading-none text-white"
      >
        {tag}
      </b>
    </span>
  );
}

/* React logo: three orbits and a nucleus */
function ReactLogo(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      {...props}
    >
      <g className="atom-spin">
        <ellipse cx="12" cy="12" rx="10.5" ry="4.2" />
        <ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(120 12 12)" />
      </g>
      <circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* The whole intro as one timeline. Times are in seconds from the start. */
function buildIntro(root) {
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
  const nameSel = nameWrap.querySelector("[data-sel]");
  const nameLine = $("[data-line]");
  const period = $("[data-period]");
  const title = $("[data-title]");
  const sub = $("[data-sub]");
  const btn = $("[data-btn]");
  const btnSel = btn.querySelector("[data-sel]");
  const btnBg = $("[data-btn-bg]");
  const btnText = $("[data-btn-text]");
  const btnArrow = $("[data-btn-arrow]");
  const loc = $("[data-loc]");
  const logo = $("[data-logo]");
  const tagText = $("[data-tag-text]");
  const statRows = all("[data-stat]");
  const dl = $("[data-dl]");
  const dlIcon = $("[data-dl-icon]");
  const dlLabel = $("[data-dl-label]");

  const B = 0.1; // small head start
  const at = (t) => B + t;

  const tl = gsap.timeline();
  tl.timeScale(SPEED);
  handoff.claim(tl); // this build owns the cursors until the next section takes over

  /* spare cursors draw a dashed selection box over every element as it is built */
  const ov = {};
  BX.forEach((i) => {
    ov[i] = makeOverlay(root);
  });
  const box = (i, el, t, tag, { dur = 0.25, pad = 3 } = {}) =>
    dragBox(tl, ov[i], i, el, root, at(t), { tag, dur, pad });
  box(BX[7], ghost, 0.0, "h1.ghost", { dur: 0.5, pad: 4 });
  box(BX[0], role, 0.0, "p.role");
  box(BX[1], statusText, 0.1, "p.status");
  box(BX[2], hello, 0.1, "span.hello");
  box(BX[4], stack, 0.2, "figure.photo", { dur: 0.5, pad: 0 });
  box(BX[6], logo, 0.35, "svg.react", { pad: 4 });
  box(BX[5], tagText, 0.5, "p.tagline");
  box(BX[3], title, 1.05, "h2.title");
  box(BX[4], sub, 1.3, "p.about");
  statRows.forEach((li, i) => {
    box([BX[7], BX[0], BX[1]][i % 3], li, 1.5 + i * 0.35, "li.stat", { pad: 2 });
  });
  box(BX[2], dl, 2.2, "a.cv", { pad: 2 });
  box(BX[3], loc, 2.7, "p.location", { pad: 2 });

  /* a cursor drags a divider line out, then the number counts up and the label types */
  const drawRow = (el, ag, t) => {
    const rule = el.querySelector("[data-rule]");
    const handle = el.querySelector("[data-rule-handle]");
    const inner = el.querySelector("[data-row-inner]");
    const label = el.querySelector("[data-stat-label]");
    const num = el.querySelector("[data-stat-num]");
    const plus = el.querySelector("[data-plus]");
    const p = { v: 0 };

    tl.add(
      swarm.moveTo(ag, rule, { duration: 0.45, offset: { x: 0, y: 0.5 } }),
      at(t)
    );
    tl.add(() => swarm.click(ag), at(t + 0.45));
    tl.set(handle, { autoAlpha: 1 }, at(t + 0.45));
    tl.to(
      p,
      {
        v: 1,
        duration: 0.55,
        ease: "power2.out",
        onUpdate: () => {
          rule.style.clipPath = `inset(0 ${(1 - p.v) * 100}% 0 0)`;
          handle.style.left = `${p.v * 100}%`;
          swarm.placeAt(ag, rule, p.v, 0.5, 0, 0);
        },
      },
      at(t + 0.5)
    );
    tl.set(handle, { autoAlpha: 0 }, at(t + 1.05));
    tl.to(inner, { autoAlpha: 1, duration: 0.25 }, at(t + 0.9));
    if (label) tl.add(typeReveal(label, { duration: 0.4 }), at(t + 1.0));
    if (num) {
      const o = { v: 0 };
      const to = Number(num.dataset.to) || 0;
      tl.to(
        o,
        {
          v: to,
          duration: 0.9,
          ease: "power2.out",
          onUpdate: () => {
            num.textContent = Math.round(o.v);
          },
        },
        at(t + 1.0)
      );
    }
    if (plus) tl.to(plus, { autoAlpha: 1, duration: 0.3 }, at(t + 1.5));
  };

  /* ---------- PORTFOLIO: letters are typed in, a cursor follows the text ---------- */
  const gp = { r: 0 };
  tl.add(
    swarm.moveTo(AG.ghost, ghost, { duration: 0.45, offset: { x: 0, y: 0.5 } }),
    at(0)
  );
  tl.add(() => swarm.click(AG.ghost), at(0.5));
  tl.to(
    letters,
    {
      autoAlpha: 1,
      yPercent: 0,
      scaleY: 1,
      duration: 0.5,
      ease: "back.out(1.6)",
      stagger: 0.1,
    },
    at(0.5)
  );
  tl.to(
    gp,
    {
      r: 1,
      duration: 0.9,
      ease: "none",
      onUpdate: () => swarm.placeAt(AG.ghost, ghost, gp.r, 0.55),
    },
    at(0.5)
  );

  /* ---------- top label: Layout clicks, text types in ---------- */
  tl.add(
    swarm.moveTo(AG.layout, role, { duration: 0.4, offset: { x: 0, y: 0.5 } }),
    at(0)
  );
  tl.add(() => swarm.click(AG.layout), at(0.4));
  tl.add(
    typeReveal(role, {
      duration: 0.45,
      caret: $('[data-caret="role"]'),
      agent: AG.layout,
    }),
    at(0.4)
  );

  /* ---------- status tag: dot pops, text is typed ---------- */
  tl.add(swarm.moveTo(AG.status, dot, { duration: 0.45 }), at(0));
  tl.add(() => swarm.click(AG.status), at(0.5));
  tl.to(dot, { scale: 1, duration: 0.35, ease: "back.out(3)" }, at(0.5));
  tl.add(typeChars(statusText, { duration: 0.8, agent: AG.status }), at(0.65));

  /* ---------- Hello, I'm (it sits on a diagonal) ---------- */
  tl.add(
    swarm.moveTo(AG.logic, hello, { duration: 0.5, offset: { x: 0, y: 0.6 } }),
    at(0.2)
  );
  tl.add(() => swarm.click(AG.logic), at(0.7));
  tl.add(
    typeReveal(hello, { duration: 0.5, smooth: true, agent: AG.logic }),
    at(0.7)
  );

  /* ---------- PHOTO: sketched line by line, then painted in ---------- */
  tl.add(
    swarm.moveTo(AG.design, stack, { duration: 0.5, offset: { x: 0.5, y: 0 } }),
    at(0.2)
  );
  tl.add(() => swarm.click(AG.design), at(0.75));
  tl.set(pen, { autoAlpha: 1 }, at(0.8));
  tl.fromTo(
    sketch,
    { clipPath: "inset(0% 0% 100% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.5,
      ease: "power1.inOut",
      onUpdate() {
        // the cursor zig-zags down the figure like a pencil
        swarm.placeAt(AG.design, stack, 0.5 + 0.34 * Math.sin(this.ratio * 18), this.ratio);
      },
    },
    at(0.8)
  );
  tl.fromTo(
    pen,
    { top: "0%" },
    { top: "100%", duration: 1.5, ease: "power1.inOut" },
    at(0.8)
  );
  tl.to(pen, { autoAlpha: 0, duration: 0.3 }, at(2.35));
  tl.fromTo(
    real,
    { clipPath: "inset(0% -60% 100% -60%)" },
    {
      clipPath: "inset(-20% -60% 0% -60%)",
      duration: 1.3,
      ease: "power2.inOut",
      clearProps: "clipPath",
    },
    at(1.6)
  );
  tl.to(sketch, { autoAlpha: 0, duration: 0.6 }, at(2.6));
  tl.to(glow, { autoAlpha: 1, duration: 0.9 }, at(2.2));

  /* ---------- name: box dragged by Layout, text typed by Content ---------- */
  tl.add(dragSelect(nameWrap, nameSel, { agent: AG.layout, duration: 0.5 }), at(1.0));
  tl.add(
    swarm.moveTo(AG.content, nameWrap, { duration: 0.45, offset: { x: 0, y: 0.5 } }),
    at(1.5)
  );
  tl.add(typeReveal(nameLine, { duration: 0.6, agent: AG.content }), at(2.0));

  /* ---------- the red full stop ---------- */
  tl.add(swarm.moveTo(AG.content, period, { duration: 0.45 }), at(2.6));
  tl.add(() => swarm.click(AG.content), at(3.1));
  tl.to(period, { color: RED, duration: 0.3 }, at(3.1));

  /* ---------- subtitle: types in white, then turns red ---------- */
  tl.add(
    swarm.moveTo(AG.logic, title, { duration: 0.45, offset: { x: 0, y: 0.5 } }),
    at(1.3)
  );
  tl.add(typeReveal(title, { duration: 0.5, agent: AG.logic }), at(1.8));
  tl.add(() => swarm.click(AG.logic), at(2.35));
  tl.to(title, { color: RED, duration: 0.35 }, at(2.35));

  /* ---------- paragraph: typed letter by letter ---------- */
  tl.add(
    swarm.moveTo(AG.data, sub, { duration: 0.5, offset: { x: 0, y: 0.1 } }),
    at(1.8)
  );
  tl.add(() => swarm.click(AG.data), at(2.3));
  tl.add(typeChars(sub, { duration: 1.4, agent: AG.data }), at(2.35));

  /* ---------- right side: React logo spins in, tagline is typed ---------- */
  tl.add(swarm.moveTo(AG.tag, logo, { duration: 0.5 }), at(0.9));
  tl.add(() => swarm.click(AG.tag), at(1.4));
  tl.fromTo(
    logo,
    { autoAlpha: 0, rotation: -120, scale: 0.4 },
    { autoAlpha: 1, rotation: 0, scale: 1, duration: 0.6, ease: "back.out(2.5)" },
    at(1.4)
  );
  tl.add(typeChars(tagText, { duration: 0.9, agent: AG.tag }), at(1.55));

  /* ---------- stat rows: three cursors each draw a divider, numbers count up ---------- */
  const statAgents = [AG.motion, AG.api, AG.style];
  statRows.forEach((li, i) => drawRow(li, statAgents[i], 1.2 + i * 0.35));

  /* ---------- Download CV ---------- */
  tl.add(
    swarm.moveTo(AG.pin, dl, { duration: 0.5, offset: { x: 0.1, y: 0.5 } }),
    at(2.6)
  );
  tl.add(() => swarm.click(AG.pin), at(3.1));
  tl.fromTo(
    dlIcon,
    { scale: 0, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(3)" },
    at(3.1)
  );
  tl.add(typeReveal(dlLabel, { duration: 0.45 }), at(3.2));

  /* ---------- button: box, fill, label typed ---------- */
  tl.add(dragSelect(btn, btnSel, { agent: AG.layout, duration: 0.4 }), at(2.5));
  tl.add(() => swarm.click(AG.layout), at(3.6));
  tl.to(btnBg, { scaleX: 1, duration: 0.35, ease: "power3.out" }, at(3.6));
  tl.add(typeChars(btnText, { duration: 0.55, agent: AG.layout }), at(3.8));
  tl.fromTo(
    btnArrow,
    { autoAlpha: 0, y: -8 },
    { autoAlpha: 1, y: 0, duration: 0.5, ease: "bounce.out" },
    at(4.3)
  );

  /* ---------- location ---------- */
  tl.add(swarm.moveTo(AG.logic, loc, { duration: 0.45 }), at(3.0));
  tl.add(() => swarm.click(AG.logic), at(3.5));
  tl.fromTo(
    loc,
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: 0.4 },
    at(3.5)
  );

  /* ---------- finish ---------- */
  tl.to(all("[data-sel]"), { autoAlpha: 0, duration: 0.3 }, at(4.6));
  tl.add(() => {
    Object.values(AG).forEach((i) => swarm.release(i));
  }, at(4.8));

  // one second after the build: every cursor fades away
  tl.add(swarm.fadeOut(0.5), at(5.8));

  return tl;
}

export default function Intro() {
  const { hero } = content;
  const enabled = useAgentsEnabled();
  const kind = usePhotoKind();
  const root = useRef(null);
  const ghost = useRef(null);
  const photoDrift = useRef(null);
  const photoWrap = useRef(null);
  const glowWrap = useRef(null);
  const dust = useRef(null);

  // only the first name is shown in the hero
  const firstName = hero.name.split(" ")[0];

  // order: live demos, projects, MERN training
  const stats = [hero.stats[1], hero.stats[0], hero.stats[2]].filter(Boolean);

  /* hide everything the build will reveal, then start the build (after the photo is checked) */
  useLayoutEffect(() => {
    if (kind === "loading") return;

    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // finished page, no animation
      el.querySelectorAll("[data-sel],[data-sketch],[data-pen]").forEach(
        (n) => (n.style.display = "none")
      );
      return;
    }

    const all = (s) => [...el.querySelectorAll(s)];

    const ctx = gsap.context(() => {
      gsap.set(
        all(
          "[data-role],[data-hello],[data-line],[data-title],[data-gl],[data-loc],[data-logo],[data-row-inner],[data-stat-label],[data-plus],[data-rule-handle],[data-sel],[data-caret],[data-pen],[data-glow],[data-btn-arrow],[data-dl-label],[data-dl-icon]"
        ),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-ch]"), { opacity: 0 });
      gsap.set(all("[data-gl]"), {
        yPercent: 45,
        scaleY: 1.3,
        transformOrigin: "50% 100%",
      });
      gsap.set(all("[data-dot]"), { scale: 0 });
      gsap.set(all("[data-period],[data-title]"), { color: INK });
      gsap.set(all("[data-rule]"), { clipPath: "inset(0 100% 0 0)" });
      gsap.set(all("[data-btn-bg]"), { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(all("[data-sketch]"), { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(all("[data-real]"), { clipPath: "inset(0% -60% 100% -60%)" });
      all("[data-stat-num]").forEach((n) => (n.textContent = "0"));
    }, root);

    let started = false;
    let off = () => {};
    let timer;

    const start = () => {
      if (started) return;
      started = true;
      off();
      clearTimeout(timer);
      ctx.add(() => {
        buildIntro(el);
      });
    };

    if (enabled) {
      // wait for the cursors, but never block longer than half a second
      off = swarm.whenReady(start);
      timer = setTimeout(start, 500);
    } else {
      start();
    }

    return () => {
      off();
      clearTimeout(timer);
      clearOverlays(el);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  /* scroll-driven photo dissolve: the whole photo turns into shining powder */
  useEffect(() => {
    if (kind === "loading") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    return createPhotoDissolve({
      trigger: root.current,
      canvas: dust.current,
      photoEl: photoWrap.current,
      glowEl: glowWrap.current,
      getImg: () => {
        const n = root.current.querySelector("[data-real]");
        return n && n.tagName === "IMG" ? n : null;
      },
      mode: kind,
    });
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

      const photo = photoDrift.current; // only exists once the photo has been checked
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

  return (
    <section
      id="home"
      ref={root}
      className="relative flex h-svh flex-col overflow-hidden px-gutter py-[4svh]"
    >
      <Filters />

      {/* dust canvas: the powder the photo turns into while you scroll (clipped to this section) */}
      <canvas
        ref={dust}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[6] hidden size-full"
      />

      {/* GHOST: PORTFOLIO word behind everything, typed in letter by letter */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[12svh] z-0 flex justify-center max-lg:top-[16svh]"
      >
        <div ref={ghost} className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
          <span
            data-ghost
            className="block select-none whitespace-nowrap font-display text-[min(18vw,32svh)] leading-[0.85] max-lg:text-[min(21vw,20svh)]"
          >
            {"PORTFOLIO".split("").map((ch, i) => (
              <span
                key={i}
                data-gl
                className="inline-block bg-[linear-gradient(180deg,#c4131f_0%,#8e0c16_38%,#3a060b_72%,#090909_100%)] bg-clip-text text-transparent"
              >
                {ch}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* PHOTO: bottom center, 10% smaller than before */}
      {kind !== "loading" && (
        <div
          ref={photoDrift}
          className="pointer-events-none absolute inset-x-0 -bottom-[2svh] z-[1] flex h-[83svh] justify-center max-lg:h-[58svh]"
        >
          <div className="relative h-full">
            <div ref={glowWrap} className="absolute inset-0">
              <i
                data-glow
                className="absolute -inset-[8%] bg-[radial-gradient(ellipse_at_66%_55%,rgba(214,26,41,0.28),transparent_58%),radial-gradient(ellipse_at_34%_55%,rgba(50,110,255,0.22),transparent_52%)] blur-2xl"
              />
            </div>
            {/* extra side padding so the glow is never cut off */}
            <div ref={photoWrap} className="relative -mx-16 h-full px-16">
              <Photo kind={kind} />
            </div>
          </div>
        </div>
      )}

      {/* TOP ROW */}
      <div className="relative z-[3] flex flex-wrap items-start justify-between gap-4">
        <p className="label">
          <span className="relative inline-block">
            <span data-role className="inline-block text-red">
              {hero.role[0]}
            </span>
            <i
              data-caret="role"
              className="pointer-events-none absolute left-0 top-[10%] h-[80%] w-[2px] bg-ink"
            />
          </span>
        </p>

        <p className="label flex items-center gap-2.5">
          <i
            data-dot
            className="size-[7px] rounded-full bg-red shadow-[0_0_0_4px_rgba(214,26,41,0.25)]"
          />
          <span data-status-text>
            <Typed text={hero.availability} />
          </span>
        </p>
      </div>

      {/* MAIN */}
      <div className="relative z-[3] flex min-h-0 flex-1 flex-col justify-end">
        {/* LEFT: name and details */}
        <div className="lg:max-w-[40vw]">
          <p className="mb-[0.6svh] pl-[0.4vw] leading-none">
            <span
              data-hello
              className="inline-block origin-bottom-left -rotate-[8deg] font-script text-[min(4vw,6svh)] transition-[rotate] duration-300 hover:-rotate-[2deg] max-sm:text-[2rem]"
            >
              Hello, I'm
            </span>
          </p>

          <h1 className="display mt-[0.5svh] text-[min(11vw,15svh)] max-sm:text-[clamp(3.4rem,19vw,5.4rem)]">
            <span data-name className="group/name relative inline-block">
              <span data-line className="block w-fit">
                {firstName}
                <span data-period className="text-red">
                  .
                </span>
              </span>
              <SelBox tag="h1.name" className="group-hover/name:visible! group-hover/name:opacity-100!" />
            </span>
          </h1>

          <h2 className="mt-[1.8svh] font-body text-[min(2.4vw,4.2svh)] font-extrabold uppercase leading-[1.1] tracking-tight text-red max-sm:text-[1.3rem]">
            <span data-title className="inline-block transition-colors duration-200 hover:text-ink!">
              {hero.titleLines[0]}
              <br />
              {hero.titleLines[1]}
            </span>
          </h2>

          {/* paragraph hides on very short screens so everything still fits */}
          <p
            data-sub
            className="mt-[1.6svh] max-w-[24rem] text-[min(1.05rem,2.3svh)] leading-relaxed text-ink/70 transition-colors duration-300 hover:text-ink [@media(max-height:640px)]:hidden"
          >
            <Typed text={hero.tagline} />
          </p>

          <a
            data-btn
            href="#projects"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("projects");
            }}
            className="group relative mt-[2.6svh] inline-flex w-fit"
          >
            <span className="relative block transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-y-1">
              <span
                data-btn-bg
                className="absolute inset-0 rounded-[2px] bg-linear-to-b from-[#e0303d] to-[#a8121e] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-3px_0_rgba(0,0,0,0.25),0_6px_0_#6a0a12,0_16px_26px_rgba(0,0,0,0.6)]"
              />
              <span className="relative inline-flex items-center gap-10 px-6 py-[min(1.1rem,2svh)] font-medium text-white">
                <span data-btn-text>
                  <Typed text="View my work" />
                </span>
                <span data-btn-arrow className="inline-block">
                  ↓
                </span>
              </span>
            </span>
            <SelBox tag="a.btn" className="group-hover:visible! group-hover:opacity-100!" />
          </a>

          <p
            data-loc
            className="label group/loc mt-[2.4svh] flex items-center gap-2.5 transition-colors duration-200 hover:text-ink [@media(max-height:560px)]:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0 fill-none stroke-red transition-transform duration-300 group-hover/loc:-translate-y-1"
              strokeWidth="1.8"
            >
              <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {content.about.location}
          </p>
        </div>

        {/* RIGHT: a narrow column pinned to the far right edge, numbers right beside their words */}
        <aside className="mt-[2.5svh] lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:w-[min(19rem,23vw)]">
          <div className="mb-[2.2svh] hidden items-center gap-3.5 lg:flex [@media(max-height:620px)]:hidden">
            <span className="grid size-[3.2rem] shrink-0 place-items-center rounded-full border border-red/30 transition-colors duration-300 hover:border-red [&:hover_.atom-spin]:[animation-duration:2.5s]">
              <ReactLogo data-logo className="size-7 text-red" />
            </span>
            <p
              data-tag-text
              className="text-[min(1.1rem,2.3svh)] leading-snug text-ink"
            >
              <Typed text="Every line." />
              <br />
              <Typed text="A working idea." />
            </p>
          </div>

          <ul
            data-stats
            className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0"
          >
            {stats.map((s) => (
              <li key={s.label} data-stat className="group/stat relative">
                <div
                  data-row-inner
                  className="flex flex-col gap-1 py-3 transition-[translate] duration-300 group-hover/stat:translate-x-2 lg:flex-row lg:items-center lg:gap-4 lg:py-[1.4svh]"
                >
                  <span className="display flex min-w-[0.85em] items-end text-[2.2rem] leading-none text-red transition-[text-shadow] duration-300 group-hover/stat:[text-shadow:0_0_26px_rgba(214,26,41,0.65)] lg:text-[min(4vw,7.4svh)]">
                    <span data-stat-num data-to={s.value} className="tabular-nums">
                      {s.value}
                    </span>
                    {SHOW_PLUS && (
                      <span
                        data-plus
                        className="mb-[0.1em] ml-[0.05em] text-[0.42em] leading-none"
                      >
                        +
                      </span>
                    )}
                  </span>
                  <span data-stat-label className="label inline-block transition-colors duration-300 group-hover/stat:text-ink">
                    {s.label}
                  </span>
                </div>

                {/* the divider a cursor draws, with its blue drag handle */}
                <i
                  data-rule
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/15 transition-colors duration-300 group-hover/stat:bg-red"
                />
                <i
                  data-rule-handle
                  className="pointer-events-none absolute bottom-0 left-0 z-[2] size-2 -translate-x-1/2 translate-y-1/2 border border-[#4c8dff] bg-white"
                />
              </li>
            ))}
          </ul>

          <a
            data-dl
            href="/Adwaith_A_Kumar_Resume.pdf"
            download
            className="label group/dl mt-[1.6svh] inline-flex items-center gap-3 text-ink transition-colors hover:text-red"
          >
            <svg
              data-dl-icon
              viewBox="0 0 24 24"
              className="size-4 fill-none stroke-red transition-transform duration-300 group-hover/dl:translate-y-[3px]"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
            </svg>
            <span data-dl-label className="inline-block">
              Download CV
            </span>
          </a>
        </aside>
      </div>
    </section>
  );
}