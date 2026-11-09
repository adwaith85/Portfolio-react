import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content } from "../../data/content";
import { swarm } from "../cursors/swarmApi";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  BLUE,
  Words,
  SPOTLIGHT_STYLE,
  makeOverlay,
  clearOverlays,
  dragBox,
  typeWords,
  popIn,
  tiltTiles,
} from "../../engine/swarmBuild";

gsap.registerPlugin(ScrollTrigger);

/* Cursor leases: exactly twenty agents, five per stop. */
const AG = {
  stop1: [0, 1, 2, 3, 4],
  stop2: [5, 6, 7, 8, 9],
  stop3: [10, 11, 12, 13, 14],
  stop4: [15, 16, 17, 18, 19],
};
const STAGE_AG = [AG.stop1, AG.stop2, AG.stop3, AG.stop4];

const NORMAL = { fill: "#121212", edge: "rgba(255,255,255,0.1)" };
const HOT = { fill: "#2a0a0f", edge: "rgba(214,26,41,0.45)" };

const MAP_STYLE = `
@keyframes eduPinFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes eduHoverRipple {
  0% { opacity: .55; transform: translate(-50%, -50%) scale(.45); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.9); }
}
@keyframes eduArrowBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
@keyframes eduBorderSweep {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.edu-pin-float { animation: eduPinFloat 3.8s ease-in-out infinite; }
.edu-pin-shadow { transform: translate(-50%, -50%) scaleY(.35); }
.edu-node-anchor { left: .125rem; top: 2.2rem; }
.edu-pin[data-done] [data-pin-shape] { fill: #d61a29; stroke: #d61a29; }
.edu-pin[data-done] [data-icon] { color: #ffffff; }
.edu-sign-post { transform-origin: top center; }

@media (min-width: 1024px) {
  .edu-node-anchor { left: calc(var(--nx) - 1.5rem); top: 50%; }
  .edu-card3d { transform: rotateY(var(--ry, 0deg)); }
}

@media (hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .edu-card3d {
    transition: transform 400ms cubic-bezier(0.22,1,0.36,1),
      box-shadow 400ms cubic-bezier(0.22,1,0.36,1);
  }
  .edu-card3d:hover {
    transform: rotateY(var(--ry, 0deg)) translateZ(22px) scale(1.015);
    box-shadow: 0 38px 80px -24px rgba(0,0,0,.82),
      0 0 62px -12px rgba(214,26,41,.4);
  }
  .edu-stop:hover .edu-focus { opacity: 1 !important; filter: none !important; }
  .edu-shine {
    position: absolute;
    inset: -40% -60%;
    z-index: 4;
    pointer-events: none;
    background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,.1) 50%, transparent 58%);
    transform: translateX(-140%) skewX(-18deg);
    opacity: 0;
    transition: transform 700ms cubic-bezier(0.22,1,0.36,1),
      opacity 400ms cubic-bezier(0.22,1,0.36,1);
  }
  .edu-card3d:hover .edu-shine {
    transform: translateX(140%) skewX(-18deg);
    opacity: 1;
  }
  .edu-border {
    position: absolute;
    inset: -1px;
    z-index: 3;
    border-radius: 4px;
    padding: 1px;
    pointer-events: none;
    opacity: 0;
    background: linear-gradient(120deg, rgba(214,26,41,0) 0%, rgba(214,26,41,.9) 35%, rgba(255,255,255,.4) 50%, rgba(214,26,41,.9) 65%, rgba(214,26,41,0) 100%);
    background-size: 200% 100%;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    transition: opacity 400ms cubic-bezier(0.22,1,0.36,1);
  }
  .edu-card3d:hover .edu-border {
    opacity: 1;
    animation: eduBorderSweep 3s linear infinite;
  }
  .edu-stop:hover .edu-pin-lift { transform: translateY(-8px); }
  .edu-stop:hover .edu-pin-shadow {
    transform: translate(-50%, -50%) scale(.7, .25);
    opacity: .35;
    filter: blur(5px);
  }
  .edu-stop:hover .edu-hover-ripple { animation: eduHoverRipple 700ms ease-out; }
  .edu-stop:hover .edu-leader { border-color: rgba(214,26,41,.75); }
  .edu-card3d:hover .edu-stamp-inner {
    transform: scale(1.06);
    box-shadow: 0 0 20px rgba(214,26,41,.55);
  }
  .edu-learn:hover { background-color: rgba(255,255,255,.05); }
  .edu-learn:hover .edu-fdot {
    transform: scale(1.8);
    box-shadow: 0 0 12px rgba(214,26,41,.8);
  }
  .edu-learn:hover .edu-ftext {
    transform: translateX(4px);
    color: #f2efeb;
  }
  .edu-sign:hover {
    transform: translateY(-3px) rotate(-2deg);
    border-color: rgba(214,26,41,.9) !important;
  }
  .edu-sign:hover .edu-sign-arrow { animation: eduArrowBounce 600ms ease-in-out infinite; }
  .edu-stop:hover [data-ghost] {
    color: rgba(242,239,235,.10);
    transform: translateX(6px);
  }
}

/* ---------- achievements certificate fan ---------- */
@keyframes eduAchShine {
  0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
  18% { opacity: 1; }
  100% { transform: translateX(140%) skewX(-18deg); opacity: 0; }
}

.edu-ach-card {
  --cardw: clamp(5.5rem, 24vw, 8rem);
  --rot: var(--rm, 0deg);
  --drop: var(--ym, 0px);
  width: var(--cardw);
  margin-left: calc(var(--cardw) * -0.18);
  transform-origin: 50% 230%;
  transform: rotate(var(--rot)) translateY(var(--drop));
  z-index: var(--z, 10);
  transition: transform 450ms cubic-bezier(0.22,1,0.36,1),
    opacity 450ms cubic-bezier(0.22,1,0.36,1),
    filter 450ms cubic-bezier(0.22,1,0.36,1);
}
.edu-ach-card:first-child { margin-left: 0; }
.edu-ach-frame {
  border: 1px solid rgba(255,255,255,0.1);
  background: #121212;
  box-shadow: 0 18px 40px -16px rgba(0,0,0,0.8);
  transition: box-shadow 450ms cubic-bezier(0.22,1,0.36,1),
    border-color 450ms cubic-bezier(0.22,1,0.36,1);
}
.edu-ach-cap {
  opacity: 0;
  transform: translate(-50%, 0.55rem);
  transition: opacity 450ms cubic-bezier(0.22,1,0.36,1),
    transform 450ms cubic-bezier(0.22,1,0.36,1);
}
.edu-ach-shine {
  position: absolute;
  inset: -30%;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.08) 50%, transparent 58%);
  transform: translateX(-140%) skewX(-18deg);
  opacity: 0;
}
.edu-ach-card:focus { outline: none; }

@media (min-width: 1024px) {
  .edu-ach-card {
    --cardw: clamp(7.5rem, 17vw, 15rem);
    margin-left: calc(var(--cardw) * -0.14);
    --rot: var(--r, 0deg);
    --drop: var(--y, 0px);
  }
}

@media (hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .edu-ach-fan:has(.edu-ach-card:hover) .edu-ach-card { opacity: 0.55; filter: brightness(0.8); }
  .edu-ach-fan:has(.edu-ach-card:hover) .edu-ach-card:hover { opacity: 1; filter: none; }
  .edu-ach-card:hover {
    transform: rotate(0deg) translateY(-42px) scale(1.18);
    z-index: 60;
  }
  .edu-ach-card:hover .edu-ach-frame {
    border-color: rgba(214,26,41,0.6);
    box-shadow: 0 30px 60px -18px rgba(214,26,41,0.5),
      0 18px 40px -16px rgba(0,0,0,0.8);
  }
  .edu-ach-card:hover .edu-ach-cap { opacity: 1; transform: translate(-50%, 0); }
  .edu-ach-card:hover .edu-ach-shine {
    animation: eduAchShine 900ms cubic-bezier(0.22,1,0.36,1) forwards;
  }
}

/* touch / keyboard: same raised state without hover */
.edu-ach-card:focus,
.edu-ach-card:focus-visible {
  transform: rotate(0deg) translateY(-42px) scale(1.18);
  z-index: 60;
}
.edu-ach-card:focus .edu-ach-frame,
.edu-ach-card:focus-visible .edu-ach-frame {
  border-color: rgba(214,26,41,0.6);
  box-shadow: 0 30px 60px -18px rgba(214,26,41,0.5),
    0 18px 40px -16px rgba(0,0,0,0.8);
}
.edu-ach-card:focus .edu-ach-cap,
.edu-ach-card:focus-visible .edu-ach-cap {
  opacity: 1;
  transform: translate(-50%, 0);
}
.edu-ach-card:focus .edu-ach-shine,
.edu-ach-card:focus-visible .edu-ach-shine {
  animation: eduAchShine 900ms cubic-bezier(0.22,1,0.36,1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .edu-pin-float { animation: none; }
  .edu-border, .edu-shine, .edu-hover-ripple, .edu-sign-arrow { animation: none !important; }
  .edu-ach-card, .edu-ach-frame, .edu-ach-cap { transition: none; }
  .edu-ach-shine { animation: none !important; }
}
`;

/* design-tool selection box that a cursor drags out over a frame */
function SelBox({ tag }) {
  const corners = [
    "-left-1 -top-1",
    "-right-1 -top-1",
    "-bottom-1 -left-1",
    "-bottom-1 -right-1",
  ];
  return (
    <span
      data-sel
      className="pointer-events-none absolute left-0 top-0 z-[3] border border-dashed"
      style={{ borderColor: BLUE }}
    >
      {corners.map((c) => (
        <i
          key={c}
          data-handle
          className={`absolute size-2 border bg-white ${c}`}
          style={{ borderColor: BLUE }}
        />
      ))}
      <b
        data-tag
        className="absolute -top-6 left-0 whitespace-nowrap rounded-sm px-1.5 py-[3px] text-[10px] font-semibold leading-none text-white"
        style={{ background: BLUE }}
      >
        {tag}
      </b>
    </span>
  );
}

function Shell({ tag, colors = NORMAL, className = "", children, ...rest }) {
  return (
    <div data-frame {...rest} className={`relative ${className}`}>
      <span
        data-bg
        data-fill={colors.fill}
        data-edge={colors.edge}
        className="absolute inset-0 rounded-[3px] border transition-colors duration-300 group-hover/card:border-red/50!"
        style={{ backgroundColor: colors.fill, borderColor: colors.edge }}
      />
      <i data-bar className="absolute left-0 top-0 h-[2px] w-full origin-left bg-red" />
      <SelBox tag={tag} />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/* ---------- cursor building blocks ---------- */

/* same look as the shared drawFrame, every timing roughly halved */
function drawFrameFast(tl, frame, ag, t0 = 0) {
  const sel = frame.querySelector("[data-sel]");
  const handles = sel ? sel.querySelectorAll("[data-handle]") : [];
  const tag = sel ? sel.querySelector("[data-tag]") : null;
  const bg = frame.querySelector("[data-bg]");
  const bar = frame.querySelector("[data-bar]");
  const p = { v: 0 };

  tl.add(swarm.moveTo(ag, frame, { duration: 0.25, offset: { x: 0, y: 0 } }), t0);
  if (sel) tl.set(sel, { autoAlpha: 1 }, t0 + 0.25);
  tl.add(() => swarm.click(ag), t0 + 0.25);

  tl.to(
    p,
    {
      v: 1,
      duration: 0.28,
      ease: "power2.out",
      onUpdate: () => {
        const r = (1 - p.v) * 100;
        if (sel) {
          sel.style.width = `${p.v * 100}%`;
          sel.style.height = `${p.v * 100}%`;
        }
        if (bg) bg.style.clipPath = `inset(0 ${r}% ${r}% 0)`;
        swarm.placeAt(ag, frame, p.v, p.v);
      },
    },
    t0 + 0.28
  );
  if (handles.length) {
    tl.fromTo(
      handles,
      { scale: 0 },
      { scale: 1, duration: 0.12, stagger: 0.015, ease: "back.out(3)" },
      t0 + 0.53
    );
  }
  if (tag) {
    tl.fromTo(tag, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.1 }, t0 + 0.53);
  }
  tl.add(swarm.moveTo(ag, frame, { duration: 0.18, offset: { x: 0.5, y: 0.5 } }), t0 + 0.58);
  tl.add(() => swarm.click(ag), t0 + 0.76);
  if (bg) {
    tl.to(
      bg,
      { backgroundColor: bg.dataset.fill, borderColor: bg.dataset.edge, duration: 0.2 },
      t0 + 0.76
    );
  }
  tl.fromTo(
    frame,
    { scale: 1 },
    { scale: 1.02, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.inOut" },
    t0 + 0.79
  );
  if (bar) tl.to(bar, { scaleX: 1, duration: 0.22, ease: "power3.out" }, t0 + 0.84);
  if (sel) tl.to(sel, { autoAlpha: 0, duration: 0.12 }, t0 + 0.88);
  return t0 + 0.84;
}

function buildStop(stopEl, i, host) {
  const ags = STAGE_AG[i];
  const [A, B, C, D, E] = ags;
  const card = stopEl.querySelector("[data-card]");
  const ov = {};
  ags.forEach((k) => (ov[k] = makeOverlay(host)));
  const tl = gsap.timeline();
  cursorIntro(tl, ags, 0);

  if (!card) return tl;

  let end = 0;

  // a) c1 drags the card frame out corner to corner
  const base = drawFrameFast(tl, card, A, 0.06);
  end = Math.max(end, base);

  // b) c2 clicks the pin and it pops, icon and ripple draw in
  const node = stopEl.querySelector("[data-node]");
  const nodeRing = stopEl.querySelector("[data-node-ring]");
  const icon = stopEl.querySelector("[data-icon]");
  if (node) {
    const at = 0.1;
    tl.add(swarm.moveTo(B, node, { duration: 0.2 }), at);
    tl.add(() => swarm.click(B), at + 0.2);
    tl.fromTo(
      node,
      { autoAlpha: 0, scale: 0.45 },
      { autoAlpha: 1, scale: 1, duration: 0.24, ease: "back.out(3)" },
      at + 0.2
    );
    if (nodeRing) {
      tl.fromTo(
        nodeRing,
        { autoAlpha: 0.8, scale: 0.55 },
        { autoAlpha: 0, scale: 2.1, duration: 0.36, ease: "power2.out" },
        at + 0.2
      );
    }
    if (icon) {
      tl.fromTo(
        icon,
        { autoAlpha: 0, scale: 0.4, rotate: -20 },
        { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.2, ease: "back.out(3)" },
        at + 0.3
      );
    }
    end = Math.max(end, at + 0.55);
  }

  // c) c3 wipes in the ghost year, writes the narrator and the KM marker
  const ghost = stopEl.querySelector("[data-ghost]");
  const narrator = stopEl.querySelector("[data-narrator]");
  const km = stopEl.querySelector("[data-km]");
  let tStory = 0.12;
  if (ghost) {
    tl.add(swarm.moveTo(C, ghost, { duration: 0.2 }), tStory);
    tl.add(() => swarm.click(C), tStory + 0.2);
    tl.fromTo(
      ghost,
      { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" },
      {
        autoAlpha: 1,
        clipPath: "inset(0 0% 0 0)",
        duration: 0.35,
        ease: "power3.out",
        onComplete() {
          gsap.set(ghost, { clearProps: "clipPath" });
        },
      },
      tStory + 0.2
    );
    tStory += 0.4;
  }
  const tNarr = typeWords(tl, narrator, C, tStory, 0.012);
  const tKm = typeWords(tl, km, C, Math.max(0, tNarr - 0.06), 0.012);
  end = Math.max(end, tNarr, tKm, tStory + 0.4);

  // d) c1 writes the stage tag, title, place; the stamp pops on
  const stageTag = card.querySelector("[data-stage]");
  const title = card.querySelector("[data-title]");
  const place = card.querySelector("[data-place]");
  const stamp = card.querySelector("[data-stamp]");
  const tTextStart = Math.max(base - 0.05, 0.4);
  const tTag = typeWords(tl, stageTag, A, tTextStart, 0.012);
  const tTitle = typeWords(tl, title, A, tTextStart + 0.14, 0.012);
  const tPlace = typeWords(tl, place, A, tTextStart + 0.3, 0.012);
  let tText = Math.max(tTag, tTitle, tPlace);
  if (stamp) {
    tl.set(stamp.querySelectorAll("[data-w]"), { autoAlpha: 1 }, tText + 0.05);
    tl.fromTo(
      stamp,
      { autoAlpha: 0, scale: 1.4, rotate: -6 },
      { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.26, ease: "back.out(2)" },
      tText + 0.05
    );
    tText += 0.28;
  }
  end = Math.max(end, tText);

  // facts: the merged period/duration row is selected and written
  let tRows = Math.max(0, tText - 0.1);
  [...card.querySelectorAll("[data-row]")].forEach((row, k) => {
    const ag = k % 2 ? B : A;
    const tr = dragBox(tl, ov[ag], ag, row, host, tRows, {
      tag: "div.row",
      dur: 0.18,
      pad: 2,
    });
    const rule = row.querySelector("[data-drule]");
    if (rule) tl.to(rule, { scaleX: 1, duration: 0.2, ease: "power3.out" }, tr - 0.08);
    typeWords(tl, row.querySelector("[data-rk]"), ag, tr, 0.012);
    const trv = typeWords(tl, row.querySelector("[data-rv]"), ag, Math.max(0, tr - 0.02), 0.012);
    tRows = Math.max(tRows, trv);
  });
  end = Math.max(end, tRows);

  // e) c2 selects and writes "What I studied"
  const studiedWrap = card.querySelector("[data-studied]");
  const studiedLabel = card.querySelector("[data-studied-label]");
  const studiedText = card.querySelector("[data-studied-text]");
  let tStudied = Math.max(tTextStart + 0.2, base - 0.1);
  if (studiedWrap) {
    tStudied = dragBox(tl, ov[B], B, studiedWrap, host, tStudied, {
      tag: "div.studied",
      dur: 0.18,
      pad: 2,
    });
  }
  const tStudiedLabel = typeWords(tl, studiedLabel, B, tStudied, 0.012);
  tStudied = typeWords(tl, studiedText, B, Math.max(0, tStudiedLabel - 0.02), 0.008);
  end = Math.max(end, tStudied);

  // c4 and c5 alternate the three learned bullets
  const learnedLabel = card.querySelector("[data-learned-label]");
  const tLearned = typeWords(tl, learnedLabel, E, Math.max(0, tStudiedLabel + 0.1), 0.012);
  let tBullets = tLearned;
  [...card.querySelectorAll("[data-fitem]")].forEach((item, k) => {
    const ag = k % 2 ? D : E;
    const at = Math.max(0, tLearned + k * 0.1);
    let te = dragBox(tl, ov[ag], ag, item, host, at, {
      tag: "li.learned",
      dur: 0.18,
      pad: 2,
    });
    const dot = item.querySelector("[data-fdot]");
    if (dot) te = popIn(tl, ag, dot, Math.max(0, te - 0.02), { travel: 0.12, from: { autoAlpha: 0, scale: 0 } });
    te = typeWords(tl, item.querySelector("[data-ftext]"), ag, Math.max(0, te - 0.02), 0.008);
    tBullets = Math.max(tBullets, te);
  });
  end = Math.max(end, tLearned, tBullets);

  // f) c3 finishes with the road sign for the next stop
  const signAnchor = host.querySelector(`[data-sign-anchor="${stopEl.dataset.stop}"]`);
  let tNext = tKm;
  if (signAnchor) {
    const sign = signAnchor.querySelector("[data-sign]");
    const pop = signAnchor.querySelector("[data-sign-pop]");
    const next = signAnchor.querySelector("[data-next]");
    const arrow = signAnchor.querySelector("[data-arrow]");
    const at = Math.max(0, tKm + 0.08);
    if (sign) tl.set(sign, { autoAlpha: 1 }, at);
    if (pop) {
      tl.fromTo(
        pop,
        { scale: 0.82, y: 10 },
        { scale: 1, y: 0, duration: 0.26, ease: "back.out(2)" },
        at
      );
    }
    tNext = typeWords(tl, next, C, at + 0.02, 0.008);
    if (arrow) {
      tNext = popIn(tl, C, arrow, Math.max(0, tNext - 0.02), {
        travel: 0.12,
        from: { autoAlpha: 0, scale: 0 },
      });
    }
    end = Math.max(end, tNext);
  }

  // g) stop 04: c5 bounces the YOU ARE HERE badge and starts its ring
  if (i === 3) {
    const badge = card.querySelector("[data-badge]");
    const ring = card.querySelector("[data-ring]");
    const at = Math.max(end, tBullets) + 0.05;
    const pinRing = stopEl.querySelector("[data-pin-ring]");
    if (badge) {
      tl.add(swarm.moveTo(E, badge, { duration: 0.2 }), at);
      tl.add(() => swarm.click(E), at + 0.2);
      tl.fromTo(badge, { y: -10 }, { y: 0, duration: 0.5, ease: "bounce.out" }, at + 0.2);
    }
    if (ring) tl.to(ring, { autoAlpha: 1, duration: 0.2 }, at + 0.25);
    if (pinRing) {
      tl.fromTo(
        pinRing,
        { autoAlpha: 0.8, scale: 0.5 },
        { autoAlpha: 0, scale: 2.2, duration: 0.8, ease: "power2.out" },
        at + 0.25
      );
    }
    end = Math.max(end, at + 0.6);
  }

  // h) the whole lease leaves as soon as the stop is built
  const out = end + 0.1;
  cursorOutro(tl, ags, { at: out, duration: 0.25 });
  tl.add(() => ags.forEach((k) => swarm.hide(k)), out + 0.26);
  return tl;
}

/* Fast certificate-fan build. Reuses agents 0-7, whose stops have finished. */
function buildAchievements(achEl, host) {
  const ags = [0, 1, 2, 3, 4, 5, 6, 7];
  const tl = gsap.timeline();
  cursorIntro(tl, ags, 0);

  const cards = [...achEl.querySelectorAll("[data-ach-card]")];
  const hand = achEl.querySelector("[data-hand]");
  const heading = achEl.querySelector("[data-ach-h]");
  const tagline = achEl.querySelector("[data-ach-sub]");
  const fine = window.matchMedia("(pointer: fine) and (min-width: 768px)").matches;
  const ov6 = fine ? makeOverlay(host) : null;
  const ov7 = fine ? makeOverlay(host) : null;

  const desktop = window.matchMedia("(min-width: 1024px)").matches;
  const spread = desktop ? 11 : 8;
  const center = (cards.length - 1) / 2;
  let end = 0;

  // five cards swing out of the pile, one cursor each
  cards.forEach((card, i) => {
    const ag = i;
    const inner = card.querySelector("[data-ach-inner]");
    const at = i * 0.08;
    // start upright so the arc rotation is countered, then release it
    if (inner) gsap.set(inner, { rotate: -(i - center) * spread });

    tl.add(swarm.moveTo(ag, card, { duration: 0.22 }), at);
    tl.add(() => swarm.click(ag), at + 0.22);
    if (inner) {
      tl.to(
        inner,
        {
          autoAlpha: 1,
          rotate: 0,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: "back.out(1.6)",
          onUpdate() {
            swarm.placeAt(ag, card, 0.5, 0.62);
          },
        },
        at + 0.2
      );
    }
    const bar = card.querySelector("[data-bar]");
    if (bar) tl.to(bar, { scaleX: 1, duration: 0.25, ease: "power3.out" }, at + 0.32);
    end = Math.max(end, at + 0.68);
  });

  // the hand rises under the fan, clicked by cursor 5
  if (hand) {
    const at = 0.22;
    tl.add(swarm.moveTo(5, hand, { duration: 0.2 }), at);
    tl.add(() => swarm.click(5), at + 0.2);
    tl.to(hand, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, at + 0.2);
    end = Math.max(end, at + 0.62);
  }

  // heading and tagline, one cursor each
  if (heading) {
    const at = 0.34;
    const tr = dragBox(tl, ov6, 6, heading, host, at, {
      tag: "h3.achievements",
      dur: 0.18,
      pad: 3,
    });
    end = Math.max(end, typeWords(tl, heading, 6, tr, 0.012));
  }
  if (tagline) {
    const at = 0.42;
    const tr = dragBox(tl, ov7, 7, tagline, host, at, {
      tag: "p.tagline",
      dur: 0.18,
      pad: 3,
    });
    end = Math.max(end, typeWords(tl, tagline, 7, tr, 0.008));
  }

  const out = end + 0.1;
  cursorOutro(tl, ags, { at: out, duration: 0.25 });
  tl.add(() => ags.forEach((i) => swarm.hide(i)), out + 0.26);
  return tl;
}

function StageIcon({ stage, className = "size-6" }) {
  const common = {
    viewBox: "0 0 24 24",
    className: `fill-none ${className}`,
    strokeWidth: "1.8",
    stroke: "currentColor",
    "aria-hidden": "true",
  };
  if (stage === "01") {
    return (
      <svg {...common}>
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        <path d="M6.5 7h11l1 12.5a1 1 0 0 1-1 1.5H6.5a1 1 0 0 1-1-1.5L6.5 7z" />
        <path d="M9 11h6" />
      </svg>
    );
  }
  if (stage === "02") {
    return (
      <svg {...common}>
        <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5z" />
        <path d="M7 11.5V16c0 1.5 2.2 2.5 5 2.5s5-1 5-2.5v-4.5" />
        <path d="M21 9.5V14" />
      </svg>
    );
  }
  if (stage === "03") {
    return (
      <svg {...common}>
        <path d="m8.5 8-4 4 4 4" />
        <path d="m15.5 8 4 4-4 4" />
        <path d="m13.5 5-3 14" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3.5c3 1.8 4.5 4.8 4.5 8.5L14 15h-4l-2.5-3c0-3.7 1.5-6.7 4.5-8.5z" />
      <circle cx="12" cy="9" r="1.5" />
      <path d="m9.5 15-2 3 3-.8" />
      <path d="m14.5 15 2 3-3-.8" />
      <path d="M12 18v3" />
    </svg>
  );
}

export default function Education() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { education, achievements } = content;

  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (s) => [...el.querySelectorAll(s)];

    const route = el.querySelector("[data-route]");
    const roads = all("[data-road]");
    const progPaths = all("[data-progress]");
    const progPath = progPaths[0] || null;
    const traveller = el.querySelector("[data-traveller]");
    const nodes = all("[data-node]");
    const anchors = all("[data-node-anchor]");
    const signAnchors = all("[data-sign-anchor]");
    const floor = el.querySelector("[data-floor]");
    const ghostWraps = all("[data-ghost-wrap]");
    const achievementsEl = el.querySelector("[data-achievements]");

    let alive = true;
    let resizeTimer = 0;
    let pathST = null;
    let fractions = [];
    let total = 0;

    const markNode = (node, done) => {
      if (!node) return;
      if (done) node.setAttribute("data-done", "");
      else node.removeAttribute("data-done");
    };

    const applyProgress = (p) => {
      const v = Math.min(1, Math.max(0, p || 0));
      progPaths.forEach((path) => {
        path.style.strokeDashoffset = String(1 - v);
      });
      if (traveller && progPath && total > 0) {
        const q = progPath.getPointAtLength(v * total);
        gsap.set(traveller, { x: q.x - 6, y: q.y - 6 });
      }
      nodes.forEach((node, k) => markNode(node, v >= (fractions[k] ?? 1) - 0.002));
    };

    const drawPath = () => {
      if (!route || !progPath || anchors.length < 2) return;
      const rr = route.getBoundingClientRect();
      const pts = anchors.map((a) => {
        const r = a.getBoundingClientRect();
        return { x: r.left + r.width / 2 - rr.left, y: r.top - rr.top };
      });
      const mobile = !window.matchMedia("(min-width: 1024px)").matches;
      let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1];
        const b = pts[k];
        const my = (a.y + b.y) / 2;
        const w = mobile ? (k % 2 ? 14 : -14) : (k % 2 ? 18 : -18);
        d += ` C ${(a.x + w).toFixed(2)} ${my.toFixed(2)}, ${(b.x - w).toFixed(2)} ${my.toFixed(2)}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
      }
      roads.forEach((path) => {
        path.setAttribute("d", d);
        const sw = Number(path.getAttribute("data-sw") || 1);
        path.setAttribute("stroke-width", mobile ? (sw * 0.6).toFixed(2) : String(sw));
      });
      total = progPath.getTotalLength() || 0;
      fractions = pts.map((pt) => {
        let best = 0;
        let bestD = Infinity;
        const steps = 600;
        for (let s = 0; s <= steps; s++) {
          const len = (s / steps) * total;
          const q = progPath.getPointAtLength(len);
          const dd = (q.x - pt.x) ** 2 + (q.y - pt.y) ** 2;
          if (dd < bestD) {
            bestD = dd;
            best = len;
          }
        }
        return total ? best / total : 0;
      });

      // road signs stand at the midpoint of each curve between two stops
      signAnchors.forEach((anchor, k) => {
        if (k + 1 >= fractions.length || !total) return;
        const len = ((fractions[k] + fractions[k + 1]) / 2) * total;
        const q = progPath.getPointAtLength(len);
        anchor.style.left = `${mobile ? Math.max(q.x, 82) : q.x}px`;
        anchor.style.top = `${q.y}px`;
      });
    };

    if (reduced) {
      all("[data-sel]").forEach((n) => (n.style.display = "none"));
      const finish = () => {
        if (!alive) return;
        drawPath();
        applyProgress(1);
        if (traveller) gsap.set(traveller, { autoAlpha: 1 });
      };
      finish();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(finish);
      const onReducedResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(finish, 160);
      };
      window.addEventListener("resize", onReducedResize);
      return () => {
        alive = false;
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onReducedResize);
      };
    }

    // hidden starting state, so nothing flashes before its group is reached
    const ctx = gsap.context(() => {
      gsap.set(
        all(
          "[data-w],[data-fdot],[data-stamp],[data-node],[data-node-ring],[data-pin-ring],[data-ghost],[data-sel],[data-tag],[data-arrow],[data-ring],[data-sign]"
        ),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-handle]"), { scale: 0 });
      gsap.set(all("[data-bar]"), { scaleX: 0 });
      gsap.set(all("[data-drule]"), { scaleX: 0 });
      gsap.set(all("[data-bg]"), {
        clipPath: "inset(0 100% 100% 0)",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.12)",
      });
      gsap.set(all("[data-sel]"), { width: "0%", height: "0%" });
      gsap.set(all("[data-traveller]"), { autoAlpha: 0 });
      gsap.set(all("[data-ach-inner]"), { autoAlpha: 0, y: 40, scale: 0.8 });
      gsap.set(all("[data-hand]"), { autoAlpha: 0, y: 30 });
    }, root);

    const setupPath = () => {
      if (!alive) return;
      drawPath();
      if (traveller) gsap.set(traveller, { autoAlpha: 1 });
      if (pathST) pathST.kill();
      pathST = ScrollTrigger.create({
        trigger: route,
        start: "top 65%",
        end: "bottom 55%",
        scrub: 0.6,
        onUpdate: (self) => {
          applyProgress(self.progress);
          if (floor) gsap.set(floor, { y: self.progress * -60 });
          if (ghostWraps.length) gsap.set(ghostWraps, { y: self.progress * 40 });
        },
      });
      const progress = pathST.progress || 0;
      applyProgress(progress);
      if (floor) gsap.set(floor, { y: progress * -60 });
      if (ghostWraps.length) gsap.set(ghostWraps, { y: progress * 40 });
      ScrollTrigger.refresh();
    };

    const groups = all("[data-stop]").map((stopEl, i) => ({
      element: stopEl,
      agents: STAGE_AG[i],
      start: "top 80%",
      speed: 2.8,
      build: (node) => buildStop(node, i, el),
    }));

    if (achievementsEl) {
      groups.push({
        element: achievementsEl,
        agents: [0, 1, 2, 3, 4, 5, 6, 7],
        start: "top 82%",
        speed: 2.8,
        back: 3.2,
        build: (node) => buildAchievements(node, el),
      });
    }

    const stop = createViewportReveal({
      root: el,
      sectionId: "education",
      enabled,
      reduced,
      start: "top 95%",
      speed: 2.8,
      back: 3.2,
      groups,
    });
    const stopTilt = tiltTiles(el, "[data-tile]", { max: 5 });

    setupPath();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (alive) setupPath();
      });
    }

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (alive) setupPath();
      }, 160);
    };
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      if (pathST) pathST.kill();
      stopTilt();
      stop();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled]);

  const spot = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] rounded-[3px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      style={SPOTLIGHT_STYLE}
    />
  );

  return (
    <section
      id="education"
      data-env="education"
      ref={root}
      className="edu-section relative flex min-h-svh flex-col border-t border-line px-gutter py-[8svh]"
    >
      <h2 className="sr-only">Education</h2>
      <style>{MAP_STYLE}</style>

      <div data-route className="relative flex-1">
        {/* perspective grid floor + faint route glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute left-[-20%] top-0 h-[85%] w-[140%]"
            style={{ transform: "perspective(900px) rotateX(58deg)", transformOrigin: "top" }}
          >
            <div
              data-floor
              className="h-full w-full opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, rgba(255,255,255,0.05) 0 1px, transparent 1px 56px), repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0 1px, transparent 1px 56px)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, #000 18%, #000 78%, transparent)",
                maskImage:
                  "linear-gradient(to bottom, transparent, #000 18%, #000 78%, transparent)",
              }}
            />
          </div>
          <span
            className="absolute -right-[10%] top-[10%] size-[38rem] rounded-full opacity-[0.16]"
            style={{ background: "radial-gradient(circle, rgba(214,26,41,0.85), transparent 65%)" }}
          />
          <span
            className="absolute -left-[12%] top-[40%] size-[34rem] rounded-full opacity-[0.12]"
            style={{ background: "radial-gradient(circle, rgba(76,141,255,0.85), transparent 65%)" }}
          />
          <span
            className="absolute bottom-[4%] right-[16%] size-[30rem] rounded-full opacity-[0.1]"
            style={{ background: "radial-gradient(circle, rgba(214,26,41,0.8), transparent 65%)" }}
          />
        </div>

        <svg
          data-path-svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <path
              key={n}
              data-road
              data-sw="34"
              fill="none"
              stroke="#050505"
              strokeWidth="34"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(0,${n})`}
            />
          ))}
          <path
            data-road
            data-sw="33"
            fill="none"
            stroke="#2b2b30"
            strokeWidth="33"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            data-road
            data-sw="30"
            fill="none"
            stroke="#1a1a1e"
            strokeWidth="30"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            data-road
            data-sw="2"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2"
            strokeDasharray="10 12"
            strokeLinecap="round"
          />
          <path
            data-road
            data-progress
            data-sw="30"
            fill="none"
            stroke="#d61a29"
            strokeOpacity="0.85"
            strokeWidth="30"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{ filter: "drop-shadow(0 0 10px rgba(214,26,41,0.7))" }}
          />
          <path
            data-road
            data-progress
            data-sw="1.5"
            fill="none"
            stroke="#ff5a64"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
          />
        </svg>

        <span
          data-traveller
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-[3] size-3 rounded-full bg-red shadow-[0_0_0_4px_rgba(214,26,41,0.16),0_0_18px_6px_rgba(214,26,41,0.4)]"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-red/50 motion-reduce:animate-none" />
          <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </span>

        <ol className="group/route relative z-[2] flex flex-col [perspective:1400px]">
          {education.map((e, i) => {
            const cardLeft = i % 2 === 0;
            const when = [e.period, e.duration].filter(Boolean).join(" · ");

            return (
              <li
                key={e.stage}
                data-stop={e.stage}
                className="edu-stop group/stop relative pb-[7svh] [transform-style:preserve-3d] lg:min-h-[70svh] lg:pb-0"
              >
                <div className="edu-focus relative grid h-full grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 gap-y-3 transition-[opacity,filter] duration-[400ms] [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover/route:opacity-[0.55] group-hover/route:brightness-[0.85] group-hover/route:saturate-[0.75] hover:opacity-100! hover:brightness-100! hover:saturate-100! motion-reduce:transition-none lg:h-full lg:grid-cols-[minmax(0,40%)_minmax(0,1fr)_minmax(0,40%)] lg:items-center lg:gap-0">
                  <div
                    data-story
                    className={`relative order-1 col-start-2 row-start-1 min-w-0 overflow-hidden lg:row-start-1 lg:self-center ${
                      cardLeft
                        ? "lg:order-3 lg:col-start-3 lg:justify-self-end lg:text-right"
                        : "lg:order-1 lg:col-start-1 lg:justify-self-start"
                    }`}
                  >
                    <div data-ghost-wrap className="relative [transform-style:preserve-3d]">
                      <span
                        data-ghost
                        className="display pointer-events-none block text-[clamp(4.5rem,20vw,8rem)] leading-none text-ink/[0.06] transition-[color,transform] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover/stop:text-ink/[0.10] group-hover/stop:translate-x-1.5 motion-reduce:transform-none motion-reduce:transition-none lg:text-[min(13vw,26svh)]"
                      >
                        {e.year}
                      </span>
                    </div>
                    <p
                      data-narrator
                      className="font-script relative -mt-[0.08em] text-[clamp(1.45rem,4.4vw,2.2rem)] leading-tight text-red"
                    >
                      <Words text={e.story} />
                    </p>
                    <span
                      className={`mt-[1.2svh] flex items-center gap-2 ${
                        cardLeft ? "lg:flex-row-reverse" : ""
                      }`}
                    >
                      <span className="h-0 min-w-8 flex-1 border-t border-dotted border-line/70" />
                      <span data-km className="label block shrink-0 text-muted">
                        <Words text={`KM ${e.stage}`} />
                      </span>
                    </span>
                  </div>

                  <div
                    className={`order-3 col-start-2 row-start-2 min-w-0 [transform-style:preserve-3d] lg:row-start-1 lg:self-center ${
                      cardLeft
                        ? "lg:order-1 lg:col-start-1 lg:justify-self-start"
                        : "lg:order-3 lg:col-start-3 lg:justify-self-end"
                    }`}
                  >
                    <div
                      data-tile
                      className="group/card relative w-full [transform-style:preserve-3d]"
                    >
                      <div
                        className="edu-card3d relative w-full rounded-[3px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7),0_0_48px_-12px_rgba(214,26,41,0.28)] [transform-style:preserve-3d]"
                        style={{ "--ry": cardLeft ? "4deg" : "-4deg" }}
                      >
                        <span aria-hidden="true" className="edu-border" />
                        <Shell
                          data-card={`edu-${e.stage}`}
                          tag={`article.edu-${e.stage}`}
                          colors={i >= 2 ? HOT : NORMAL}
                          className="w-full"
                        >
                          <div className="relative flex h-full flex-col p-3 lg:p-[min(1.1rem,2.1svh)]">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                data-stage
                                className="label block w-fit text-gold transition-colors duration-200 hover:text-ink"
                              >
                                <Words text={`LEVEL ${e.stage} · ${e.level}`} />
                              </p>
                              <span data-stamp className="inline-flex shrink-0">
                                <span
                                  data-badge={i === 3 ? "" : undefined}
                                  className={`edu-stamp-inner label inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.58rem] tracking-[0.12em] transition-[transform,box-shadow] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none ${
                                    i === 3
                                      ? "border-red bg-red text-white"
                                      : "border-red/60 text-red"
                                  }`}
                                >
                                  {i === 3 && (
                                    <i
                                      data-ring
                                      aria-hidden="true"
                                      className="relative flex size-1.5 shrink-0"
                                    >
                                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70 motion-reduce:animate-none" />
                                      <span className="relative size-1.5 rounded-full bg-white" />
                                    </i>
                                  )}
                                  <span>
                                    <Words text={e.status.toUpperCase()} />
                                  </span>
                                </span>
                              </span>
                            </div>

                            <h3
                              data-title
                              className="display mt-1.5 block w-fit text-[clamp(1.2rem,4.6vw,1.65rem)] transition-colors duration-300 hover:text-red lg:text-[min(1.6vw,3.3svh)]"
                            >
                              <Words text={e.title} />
                            </h3>
                            <p
                              data-place
                              className="mt-0.5 block text-[0.78rem] leading-snug text-ink/75 transition-colors duration-200 hover:text-ink"
                            >
                              <Words text={e.place} />
                            </p>

                            <dl className="mt-2">
                              <div
                                data-row
                                className="group/row relative grid grid-cols-[4.5rem_1fr] gap-2 py-1 transition-colors duration-200 hover:bg-white/[0.04]"
                              >
                                <i
                                  data-drule
                                  className="absolute left-0 top-0 h-px w-full origin-left bg-white/10"
                                />
                                <dt
                                  data-rk
                                  className="label block w-fit self-center text-ink/45 transition-colors duration-200 group-hover/row:text-red"
                                >
                                  <Words text="Period" />
                                </dt>
                                <dd
                                  data-rv
                                  className="block w-fit text-[0.76rem] text-ink/75 transition-[translate] duration-200 group-hover/row:translate-x-1"
                                >
                                  <Words text={when} />
                                </dd>
                              </div>
                            </dl>

                            <div data-studied className="mt-2">
                              <p
                                data-studied-label
                                className="label block w-fit transition-colors duration-200 hover:text-ink"
                              >
                                <Words text="What I studied" />
                              </p>
                              <p
                                data-studied-text
                                className="mt-0.5 block text-[min(0.9rem,1.95svh)] leading-relaxed text-ink/75"
                              >
                                <Words text={e.studied} />
                              </p>
                            </div>

                            <div className="mt-2">
                              <p
                                data-learned-label
                                className="label block w-fit transition-colors duration-200 hover:text-ink"
                              >
                                <Words text="What I learned" />
                              </p>
                              <ul className="mt-0.5 grid gap-0.5">
                                {e.learned.map((item) => (
                                  <li
                                    key={item}
                                    data-fitem
                                    className="edu-learn relative flex items-start gap-2 rounded-[3px] px-1.5 py-1 transition-[background-color] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                                  >
                                    <i data-fdot className="mt-[0.38rem] inline-flex shrink-0">
                                      <span className="edu-fdot block size-1.5 rounded-full bg-red transition-[transform,box-shadow] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none" />
                                    </i>
                                    <span
                                      data-ftext
                                      className="edu-ftext block text-[0.76rem] leading-snug text-ink/70 transition-[transform,color] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none"
                                    >
                                      <Words text={item} />
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </Shell>
                        {spot}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 z-[4] overflow-hidden rounded-[3px]"
                        >
                          <span className="edu-shine" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`edu-leader pointer-events-none absolute top-1/2 hidden h-0 border-t border-dotted border-line/70 transition-colors duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:block ${
                      cardLeft ? "left-[40%] w-[2%]" : "left-[58%] w-[2%]"
                    }`}
                  />
                </div>

                {/* 3D map pin, its tip sits exactly on the road centre */}
                <span
                  data-node-anchor
                  className="edu-node-anchor pointer-events-none absolute z-[4] h-0 w-12 [transform-style:preserve-3d]"
                  style={{ "--nx": cardLeft ? "42%" : "58%" }}
                >
                  <span data-node className="edu-pin absolute bottom-0 left-0 block size-12 origin-bottom">
                    <span className="edu-pin-lift block size-full transition-transform duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none">
                      <span
                        className="edu-pin-float block size-full"
                        style={{ animationDelay: `${i * 0.35}s` }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="block size-full overflow-visible drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
                        >
                          <path
                            data-pin-shape
                            d="M12 24C12 24 21 14.6 21 8.6A9 9 0 1 0 3 8.6C3 14.6 12 24 12 24Z"
                            className="fill-bg transition-colors duration-300"
                            stroke="rgba(160,156,154,0.7)"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          data-icon
                          className="absolute left-1/2 top-[36%] block -translate-x-1/2 -translate-y-1/2 text-white transition-colors duration-300"
                        >
                          <StageIcon stage={e.stage} className="size-[22px]" />
                        </span>
                      </span>
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="edu-pin-shadow pointer-events-none absolute left-1/2 top-0 block h-2 w-8 rounded-full bg-black/60 blur-[3px] transition-[transform,opacity,filter] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  />
                  <span
                    data-node-ring
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-0 block size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red/60 opacity-0"
                  />
                  <span
                    aria-hidden="true"
                    className="edu-hover-ripple pointer-events-none absolute left-1/2 top-0 block size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red/60 opacity-0"
                  />
                  {i === 3 && (
                    <span
                      data-pin-ring
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-0 block size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red/70 opacity-0"
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        {/* "next stop" road signs, positioned at curve midpoints by drawPath */}
        {education.slice(0, -1).map((e) => (
          <div
            key={`sign-${e.stage}`}
            data-sign-anchor={e.stage}
            aria-hidden="true"
            className="pointer-events-none absolute z-[3] -translate-x-1/2 -translate-y-full"
            style={{ left: 0, top: 0 }}
          >
            <div data-sign className="pointer-events-auto origin-bottom">
              <div data-sign-pop className="origin-bottom">
                <div className="edu-sign rounded-[5px] border border-white/25 bg-[#2f3b35]/95 px-2.5 py-1.5 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.8)] transition-[transform,border-color] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none">
                  <p
                    data-next
                    className="label flex max-w-[9rem] items-start gap-1.5 text-[0.56rem] leading-snug text-white/90 lg:max-w-[15rem] lg:text-[0.6rem]"
                  >
                    <span className="min-w-0">
                      <Words text={e.next} />
                    </span>
                    <span
                      data-arrow
                      aria-hidden="true"
                      className="edu-sign-arrow inline-block shrink-0 text-[0.85rem] leading-none"
                    >
                      ↓
                    </span>
                  </p>
                </div>
                <span className="edu-sign-post mx-auto block h-6 w-[2px] bg-white/30" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- achievements: certificates held in a fan ---------- */}
      <div data-achievements className="relative mt-[10svh] pb-[6svh]">
        <div className="edu-ach-fan group/fan relative mx-auto h-[34svh] max-w-5xl lg:h-[min(46svh,30rem)]">
          <ul className="absolute inset-x-0 bottom-0 flex items-end justify-center">
            {achievements.items.map((item, i, arr) => {
              const n = arr.length;
              const center = (n - 1) / 2;
              const d = i - center;
              const angle = d * 11;
              const angleM = d * 8;
              const drop = (Math.abs(d) - center) * 16;
              const dropM = (Math.abs(d) - center) * 12;
              const src = item.image
                ? /^https?:\/\//i.test(item.image)
                  ? item.image
                  : `/${item.image}`
                : "";

              return (
                <li
                  key={item.title}
                  data-ach-card
                  tabIndex={0}
                  role="img"
                  aria-label={item.title}
                  className="edu-ach-card group/ac relative aspect-[4/3] flex-none rounded-[3px]"
                  style={{
                    "--r": `${angle}deg`,
                    "--y": `${drop}px`,
                    "--rm": `${angleM}deg`,
                    "--ym": `${dropM}px`,
                    "--z": String(20 - Math.abs(d)),
                  }}
                >
                  <div className="edu-ach-cap pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-[16rem] max-w-[16rem] rounded-[4px] border border-white/10 bg-black/70 p-3 backdrop-blur-md">
                    <p className="display text-[0.95rem] leading-tight text-ink">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[0.78rem] leading-snug text-ink/75">
                      {item.caption}
                    </p>
                    <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-white/10" />
                  </div>

                  <div
                    data-ach-inner
                    className="edu-ach-frame relative h-full w-full overflow-visible rounded-[3px]"
                  >
                    <i
                      data-bar
                      className="absolute left-0 top-0 z-20 h-[2px] w-full origin-left bg-red"
                    />
                    <div className="absolute inset-[6px] overflow-hidden rounded-[2px]">
                      {src ? (
                        <img
                          src={src}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-white/15 bg-black/20 px-2 text-center">
                          <svg
                            viewBox="0 0 24 24"
                            className="size-6 text-red"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            aria-hidden="true"
                          >
                            <path d="M5 4.5h14v11H5z" />
                            <path d="M8 8h8M8 11h5" />
                            <path d="M9 15.5v5l3-1.4 3 1.4v-5" />
                          </svg>
                          <span className="label text-[0.52rem] leading-tight text-muted">
                            CERTIFICATE {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                      )}
                      <span className="edu-ach-shine" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            data-hand
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
          >
            <div className="relative mx-auto h-10 w-[min(22rem,60%)] rounded-t-[46%] rounded-b-[18%] border border-white/10 bg-[#141416] shadow-[0_-1px_0_rgba(214,26,41,0.35),0_-16px_40px_-22px_rgba(214,26,41,0.35)]">
              {[0, 1, 2, 3].map((f) => (
                <span
                  key={f}
                  className="absolute -top-3 h-7 w-[17%] rounded-full border border-white/10 bg-[#141416]"
                  style={{
                    left: `${8 + f * 23}%`,
                    transform: `rotate(${[-8, -3, 3, 8][f]}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <h3
          data-ach-h
          className="display mt-[3svh] text-center text-[clamp(2.4rem,9vw,4.2rem)] text-ink lg:text-[min(5vw,9svh)]"
        >
          <Words text={achievements.title} />
          <span data-w className="inline-block text-red">.</span>
        </h3>
        <p
          data-ach-sub
          className="mx-auto mt-3 max-w-[34rem] text-center text-[0.95rem] leading-relaxed text-ink/65"
        >
          <Words text={achievements.tagline} />
        </p>
      </div>
    </section>
  );
}
