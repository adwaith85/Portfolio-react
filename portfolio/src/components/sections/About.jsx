import { useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import {
  createViewportReveal,
  cursorIntro,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
  typeWords,
} from "../../engine/swarmBuild";
import { swarm } from "../cursors/swarmApi";

const IMG1 = "/img1.webp";
const IMG2 = "/photo.webp";

/* ─── cursor agent leases ─── */
const AG = {
  head:     [0, 1],
  photo:    [2, 3],
  intro:    [4, 5],
};

function endCursors(tl, agents, at) {
  const els = swarm.els(agents);
  if (!els.length) return;
  tl.to(els, { opacity: 0, duration: 0.12, ease: "power2.out" }, at);
  tl.add(() => agents.forEach((i) => swarm.hide(i)), at + 0.12);
}

/* ─── cursor builders ─── */
function buildHeading(rootEl) {
  const $ = (s) => rootEl.querySelector(s);
  const [a, b] = AG.head;
  const tl = gsap.timeline();
  cursorIntro(tl, AG.head, 0);
  const tl0 = typeWords(tl, $("[data-label]"), b, 0.01, 0.01);
  let t = typeWords(tl, $("[data-h1]"), a, 0.01, 0.015);
  t = typeWords(tl, $("[data-h2]"), a, t, 0.015);
  const t2 = typeWords(tl, $("[data-sub]"), b, Math.max(tl0, 0.1), 0.008);
  endCursors(tl, AG.head, Math.max(t, t2) + 0.05);
  return tl;
}

function buildPhoto(block, host) {
  const [A, B] = AG.photo;
  const q = (s) => block.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.photo, 0);

  const fig = q("[data-photo]");
  let t = dragBox(tl, ov, A, fig, host, 0.03, { tag: "figure.photo", dur: 0.15, travel: 0.06, pad: 0 });
  const img = q("[data-pimg]");
  if (img) {
    tl.fromTo(
      img,
      { clipPath: "inset(100% 0% 0% 0%)", autoAlpha: 1 },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.35, ease: "power3.out",
        onComplete() { gsap.set(img, { clearProps: "clipPath" }); }
      },
      t - 0.05
    );
  }
  t += 0.3;
  t = typeWords(tl, q("[data-name]"), A, Math.max(t, 0.2), 0.015);
  [...block.querySelectorAll("[data-drow]")].forEach((row, k) => {
    const ag = k % 2 ? B : A;
    const key = row.querySelector("[data-dk]");
    const val = row.querySelector("[data-dv]");
    const rule = row.querySelector("[data-drule]");
    if (rule) { tl.to(rule, { scaleX: 1, duration: 0.15, ease: "power3.out" }, t); t += 0.08; }
    const tk = typeWords(tl, key, ag, t, 0.012);
    t = typeWords(tl, val, ag, tk - 0.08, 0.009) + 0.04;
  });

  endCursors(tl, AG.photo, t + 0.05);
  return tl;
}

function buildIntro(block, host) {
  const B = AG.intro[1];
  const q = (s) => block.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.intro, 0);

  let tb = dragBox(tl, ov, B, q("[data-bio]"), host, 0.03, { tag: "p.bio", dur: 0.14, travel: 0.06 });
  tb = typeWords(tl, q("[data-bio]"), B, tb, 0.007);
  endCursors(tl, AG.intro, tb + 0.05);
  return tl;
}

/* ─── cursor-reveal image component ─── */
const HIDDEN_MASK = "radial-gradient(circle 0.01px at 0px 0px, #000 0%, transparent 100%)";

function RevealImage({ name }) {
  const containerRef = useRef(null);
  const radiusRef = useRef(0);
  const rafRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const hoverLayerRef = useRef(null);
  const baseLayerRef = useRef(null);
  const [imgOk, setImgOk] = useState(true);

  const applyMask = useCallback((x, y, r) => {
    const top = hoverLayerRef.current;
    const base = baseLayerRef.current;
    if (!top || !base) return;
    if (r < 0.5) {
      top.style.maskImage = HIDDEN_MASK;
      top.style.webkitMaskImage = HIDDEN_MASK;
      base.style.maskImage = "none";
      base.style.webkitMaskImage = "none";
      return;
    }
    const inside = `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 0%, #000 60%, transparent 100%)`;
    const outside = `radial-gradient(circle ${r}px at ${x}px ${y}px, transparent 0%, transparent 60%, #000 100%)`;
    top.style.maskImage = inside;
    top.style.webkitMaskImage = inside;
    base.style.maskImage = outside;
    base.style.webkitMaskImage = outside;
  }, []);

  const animateTo = useCallback((target) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startR = radiusRef.current;
    const startT = performance.now();
    const dur = 180;
    const tick = (now) => {
      const p = Math.min(1, (now - startT) / dur);
      const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      radiusRef.current = startR + (target - startR) * e;
      applyMask(posRef.current.x, posRef.current.y, radiusRef.current);
      rafRef.current = p < 1 ? requestAnimationFrame(tick) : null;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyMask]);

  const onMouseEnter = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    posRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    animateTo(80);
  }, [animateTo]);

  const onMouseMove = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    posRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    applyMask(posRef.current.x, posRef.current.y, radiusRef.current);
  }, [applyMask]);

  const onMouseLeave = useCallback(() => animateTo(0), [animateTo]);

  if (!imgOk) {
    return (
      <div className="relative flex h-full w-full items-center justify-center text-[0.72rem] text-muted/50">
        public/img1.webp
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="about-img-container relative h-full w-full cursor-none overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <img
        ref={baseLayerRef}
        data-pimg
        src={IMG1}
        alt={name}
        loading="lazy"
        draggable="false"
        onError={() => setImgOk(false)}
        className="about-photo-base absolute inset-0 z-0 h-full w-full object-cover object-top"
      />
      <img
        ref={hoverLayerRef}
        src={IMG2}
        alt=""
        aria-hidden="true"
        loading="lazy"
        draggable="false"
        className="about-photo-color absolute inset-0 z-10 h-full w-full object-cover object-top"
        style={{ maskImage: HIDDEN_MASK, WebkitMaskImage: HIDDEN_MASK }}
      />
    </div>
  );
}

/* ─── main component ─── */
export default function About() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { about } = content;
  const { label } = content.sections.find((s) => s.id === "about");
  const name = content.hero.name;

  // Heading lives here so the About copy stays exactly as requested.
  const headline = ["I'M THE PERSON.", "BEHIND THE CODE."];

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (s) => [...el.querySelectorAll(s)];

    if (reduced) {
      all("[data-sel]").forEach((n) => (n.style.display = "none"));
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(
        all("[data-w],[data-badge],[data-pin],[data-fdot],[data-carrow],[data-slink]"),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-pimg]"), { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(all("[data-drule]"), { scaleX: 0 });
    }, root);

    const headingEl = el.querySelector("header");
    const block = (n) => el.querySelector(`[data-block="${n}"]`);

    const groups = [
      headingEl && { element: headingEl, agents: AG.head, build: () => buildHeading(el) },
      block("photo") && { element: block("photo"), agents: AG.photo, build: (n) => buildPhoto(n, el) },
      block("intro") && { element: block("intro"), agents: AG.intro, build: (n) => buildIntro(n, el) },
    ].filter(Boolean);

    const stop = createViewportReveal({
      root: el,
      sectionId: "about",
      enabled,
      reduced,
      start: "top 95%",
      speed: 2.2,
      back: 2.2,
      groups,
    });

    return () => {
      stop();
      clearOverlays(el);
      [...AG.head, ...AG.photo, ...AG.intro].forEach((i) => swarm.hide(i));
      ctx.revert();
    };
  }, [enabled]);

  return (
    <section
      id="about"
      data-env="about"
      ref={root}
      className="relative isolate flex min-h-svh flex-col justify-center gap-[5svh] overflow-x-clip border-t border-line px-gutter py-[3.5svh]"
    >
      <style>{ABOUT_STYLE}</style>

      {/* ── heading ── */}
      <header className="relative z-20 flex shrink-0 flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <p
            data-label
            data-cursor-hover
            className="label mb-[0.8svh] block w-fit cursor-hover transition-colors duration-200 hover:text-ink"
          >
            <Words text={` ${label}`} />
          </p>
          <h2 className="about-heading display flex flex-wrap gap-x-[0.28em] text-[min(4.8vw,8.5svh)] max-lg:text-[clamp(1.9rem,8.6vw,3rem)]">
            <span
              data-h1
              data-cursor-hover
              className="about-head-line about-head-line--light cursor-hover block w-fit"
            >
              <Words text={headline[0]} />
            </span>
            <span
              data-h2
              data-cursor-hover
              className="about-head-line about-head-line--red cursor-hover block w-fit text-red"
            >
              <Words text={headline[1]} />
            </span>
          </h2>
        </div>
        <p
          data-sub
          data-cursor-hover
          className="about-sub block max-w-[26rem] text-[min(0.9rem,1.9svh)] leading-relaxed text-ink/65"
        >
          <Words text={about.tagline} />
        </p>
      </header>

      {/* ── two-column body ── */}
      <div className="about-body relative z-10 grid items-center gap-[2.5svh] lg:grid-cols-[minmax(0,46rem)_minmax(0,19rem)] lg:justify-start lg:gap-[7vw]">

        {/* ════ LEFT: text content ════ */}
        <div className="flex min-w-0 flex-col gap-[1.8svh]">

          {/* INTRO BIO */}
          <div data-block="intro" className="about-text-block">
            <p
              data-bio
              data-cursor-hover
              data-text={about.bio}
              className="about-bio about-reveal-host relative z-10 block w-full max-w-[46rem] leading-relaxed"
              tabIndex={0}
              aria-label={about.bio}
            >
              {about.bio.split(" ").map((w, i) => (
                <span key={i} className="about-reveal-word" style={{ transitionDelay: `${i * 16}ms` }} aria-hidden="true">
                  {i > 0 && " "}
                  <span data-w className="inline-block">{w}</span>
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* ════ RIGHT: image + caption ════ */}
        <div
          data-block="photo"
          className="about-photo-col relative z-10 flex min-w-0 flex-col items-center gap-[1.2svh] lg:items-start lg:justify-center"
        >
          <div className="about-photo-card mx-auto flex w-full flex-col lg:mx-0">
            <div data-photo className="about-img-wrap group/imgcard relative z-10" style={{ aspectRatio: "4/5" }}>
              <RevealImage name={name} />
            </div>

            {/* caption block below image */}
            <div className="relative z-10 mt-[1svh] flex w-full flex-col items-center text-center">
              <h3
                data-name
                data-cursor-hover
                className="about-name display mx-auto block w-fit cursor-hover text-[clamp(1.3rem,4.5vw,1.8rem)]"
              >
                <Words text={name} />
                <span className="text-red">.</span>
              </h3>

              <div data-drow data-cursor-hover className="about-row cursor-hover relative mt-[0.6svh] w-full py-[0.4svh] text-center">
                <p data-dv className="about-row-value text-center text-[min(0.82rem,1.75svh)] text-ink/80">
                  <Words text={about.role} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── scoped styles ─── */
const ABOUT_STYLE = `
/* ── text reveal: dim → bright on hover/focus ── */
.about-reveal-word {
  display: inline;
  color: rgba(242, 239, 235, 0.35);
  transition: color 200ms ease-out;
}
.about-reveal-host:focus-within .about-reveal-word,
.about-reveal-host:focus .about-reveal-word {
  color: rgba(242, 239, 235, 0.94);
}
@media (hover: hover) { .about-reveal-host:hover .about-reveal-word { color: rgba(242, 239, 235, 0.94); } }

/* ── intro paragraph: slightly larger + brighter ── */
.about-bio {
  font-size: clamp(1.25rem, 0.9vw + 0.95rem, 1.7rem);
  line-height: 1.55;
  color: rgba(242, 239, 235, 0.86);
  text-align: justify;
  text-align-last: justify;
  text-wrap: balance;
  hyphens: none;
  word-spacing: normal;
}
.about-bio .about-reveal-word {
  color: rgba(242, 239, 235, 0.62);
}
.about-bio:focus-within .about-reveal-word {
  color: rgba(242, 239, 235, 0.98);
}
.about-bio .about-reveal-word:focus-visible { color: #ff6f79; }
@media (hover: hover) {
  .about-bio:hover .about-reveal-word { color: rgba(242, 239, 235, 0.98); }
  .about-bio .about-reveal-word:hover { color: #ff6f79; }
}

/* ── tagline ── */
.about-sub {
  transition: color 200ms ease-out, text-shadow 200ms ease-out;
}
.about-sub:focus-visible {
  color: rgba(242, 239, 235, 0.96);
  text-shadow: 0 0 18px rgba(242, 239, 235, 0.12);
}
@media (hover: hover) { .about-sub:hover { color: rgba(242,239,235,.96); text-shadow: 0 0 18px rgba(242,239,235,.12); } }

/* ── heading words ── */
.about-head-line {
  transition: color 220ms ease-out, text-shadow 220ms ease-out;
}
.about-head-line--light:focus-visible {
  color: #ffffff;
  text-shadow: 0 0 28px rgba(242, 239, 235, 0.22);
}
.about-head-line--red:focus-visible {
  color: #ff3145;
  text-shadow: 0 0 30px rgba(214, 26, 41, 0.42);
}
@media (hover: hover) {
  .about-head-line--light:hover { color:#fff; text-shadow:0 0 28px rgba(242,239,235,.22); }
  .about-head-line--red:hover { color:#ff3145; text-shadow:0 0 30px rgba(214,26,41,.42); }
}
.about-heading span[data-cursor-hover] {
  cursor: default;
}

/* ── section label ── */
#about header [data-label] {
  transition: color 220ms ease-out, letter-spacing 220ms ease-out;
}
#about header [data-label]:focus-visible {
  color: var(--color-red, #d61a29);
  letter-spacing: 0.13em;
}
@media (hover: hover) {
  #about header [data-label]:hover { color:var(--color-red,#d61a29); letter-spacing:.13em; }
}

/* ── thin hairline dividers ── */
.about-rule-thin {
  background: rgba(255, 255, 255, 0.09);
  transition: background-color 220ms ease-out;
}
.about-row:focus-visible .about-rule-thin {
  background: rgba(214, 26, 41, 0.42);
}
@media (hover: hover) { .about-row:hover .about-rule-thin { background:rgba(214,26,41,.42); } }

/* ── meta dl: label / value rows ── */
.about-meta-dl {
  position: relative;
}
.about-row {
  transition: background-color 220ms ease-out;
}
.about-row:focus-visible {
  background-color: rgba(255, 255, 255, 0.03);
}
@media (hover: hover) { .about-row:hover { background-color:rgba(255,255,255,.03); } }
.about-row [data-dk] {
  transition: color 220ms ease-out;
}
.about-row:focus-visible [data-dk] {
  color: var(--color-red, #d61a29);
}
@media (hover: hover) { .about-row:hover [data-dk] { color:var(--color-red,#d61a29); } }
.about-row-value {
  font-size: clamp(0.8rem, 0.25vw + 0.72rem, 0.88rem);
  transition: transform 220ms ease-out, color 220ms ease-out;
}
.about-row:focus-visible .about-row-value {
  transform: translateX(3px);
  color: rgba(242, 239, 235, 1);
}
@media (hover: hover) { .about-row:hover .about-row-value { transform:translateX(3px); color:rgba(242,239,235,1); } }

/* ── image layers ── */
.about-img-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.about-photo-base,
.about-photo-color {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

/* ── photo card: ~9% larger, nudge right on desktop ── */
.about-photo-card {
  width: 100%;
  max-width: 304px;
  min-width: 0;
}
@media (min-width: 640px) {
  .about-photo-card { max-width: 327px; }
}
@media (min-width: 1024px) {
  .about-photo-card { max-width: 295px; }
}
@media (min-width: 1280px) {
  .about-photo-card { max-width: 318px; }
}

.about-img-wrap {
  width: 100%;
  transform-origin: center;
  transition: transform 220ms ease-out;
}
.about-img-wrap:focus-within {
  transform: translateY(-4px) scale(1.012);
}
@media (hover: hover) { .about-img-wrap:hover { transform:translateY(-4px) scale(1.012); } }
.about-img-wrap img {
  transition: transform 240ms ease-out;
  transform-origin: top center;
}
.about-img-wrap:focus-within img {
  transform: scale(1.035);
}
@media (hover: hover) { .about-img-wrap:hover img { transform:scale(1.035); } }

/* ── name ── */
.about-name {
  transition: color 220ms ease-out, text-shadow 220ms ease-out,
    letter-spacing 220ms ease-out;
}
.about-name:focus-visible {
  color: #ff3145;
  text-shadow: 0 0 20px rgba(214, 26, 41, 0.35);
  letter-spacing: 0.01em;
}
@media (hover: hover) { .about-name:hover { color:#ff3145; text-shadow:0 0 20px rgba(214,26,41,.35); letter-spacing:.01em; } }

/* ── body layout ── */
.about-body {
  min-height: 0;
  min-width: 0;
}

/* ── text blocks: free, no card ── */
.about-text-block {
  position: relative;
  min-width: 0;
}

/* ── responsive: tablet/mobile stack, centered photo, no offset ── */
@media (max-width: 1023px) {
  .about-photo-col {
    transform: none;
  }
  .about-photo-card {
    margin-left: auto;
    margin-right: auto;
  }
  .about-photo-color {
    display: none !important;
  }
  .about-photo-base {
    display: block !important;
  }
}

@media (max-width: 479px) {
  .about-row [data-dk] {
    width: 5.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-img-wrap,
  .about-img-wrap img {
    transition: none;
  }
  .about-img-wrap:hover {
    transform: none;
  }
}

.about-bio { position: relative; }
.about-bio::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  z-index: 11;
  pointer-events: none;
  color: transparent;
  background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,1) 50%, transparent 62%) no-repeat;
  background-size: 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: about-shine 3.6s ease-in-out 2s infinite;
}
@keyframes about-shine {
  0% { background-position: 94% 0; }
  60%, 100% { background-position: 6% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .about-bio::after { animation: none; display: none; }
}
`;
