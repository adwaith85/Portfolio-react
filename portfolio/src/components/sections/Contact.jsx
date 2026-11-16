import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { ENVS, envCss } from "../../theme/palette";
import {
  createViewportReveal,
  cursorClick,
  cursorIntro,
  cursorMove,
  cursorOutro,
  cursorType,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
  tiltTiles,
  typeWords,
} from "../../engine/swarmBuild";
import { swarm } from "../cursors/swarmApi";

/* ============================================================
   FORM ENDPOINT: ADD YOUR URL HERE LATER
   Paste the endpoint URL from your form service between the quotes.
   Examples: "https://formspree.io/f/xxxxxxx"
             "https://api.web3forms.com/submit"
   ============================================================ */
const FORM_ENDPOINT = "";

/* Some services need an extra field (for example Web3Forms needs an access key).
   Add it here if your service requires it, otherwise leave it empty.
   Example: { access_key: "YOUR_KEY" } */
const FORM_EXTRA_FIELDS = {};

const CONTACT = ENVS.contact;

/* Disjoint cursor leases: heading [0,1], form [2,3,4]. */
const AGENTS = [0, 1, 2, 3, 4];
const OUTRO = 0.35;

/* Front view of a cylinder outline: straight vertical walls, shallow convex arcs at top and bottom. */
const CYLINDER_PATH =
  "M0,0.07 C0.25,0.01 0.75,0.01 1,0.07 L1,0.93 C0.75,0.99 0.25,0.99 0,0.93 Z";

/* ---------- small helpers ---------- */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const centerOf = (el, hostRect) => {
  const r = el.getBoundingClientRect();
  return {
    x: r.left - hostRect.left + r.width / 2,
    y: r.top - hostRect.top + r.height / 2,
  };
};

/* Catmull-Rom curve through the points */
function smoothPath(points) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const validate = ({ name, email, message }) => {
  const errors = {};
  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 80) errors.name = "Name must be 80 characters or fewer.";

  if (!email) errors.email = "Please enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";

  if (!message) errors.message = "Please write a short message.";
  else if (message.length > 2000)
    errors.message = "Message must be 2000 characters or fewer.";

  return errors;
};

/* Cursor build: heading, form card, fields, submit. Cursors leave at the end. */
function buildContact(host) {
  const tl = gsap.timeline();
  const q = (selector) => host.querySelector(selector);
  const [H1, H2, F1, F2, F3] = AGENTS;

  cursorIntro(tl, AGENTS, 0);

  const ovH1 = makeOverlay(host);
  const ovH2 = makeOverlay(host);
  const ovF1 = makeOverlay(host);

  const label = q("[data-contact-label]");
  const h1 = q("[data-contact-h1]");
  const h2 = q("[data-contact-h2]");

  let t = dragBox(tl, ovH1, H1, label, host, 0.04, {
    tag: "p.label",
    dur: 0.1,
    pad: 2,
  });
  t = typeWords(tl, label, H1, t, 0.014);

  let t1 = dragBox(tl, ovH2, H2, h1, host, 0.1, {
    tag: "h3.headline",
    dur: 0.12,
    pad: 3,
  });
  t1 = typeWords(tl, h1, H2, t1, 0.015);

  const t2 = cursorType(tl, h2, H1, {
    at: Math.max(0.18, t1 - 0.03),
    duration: 0.38,
    travel: 0.14,
    offset: { x: 0.5, y: 0.6 },
  });

  const formStart = Math.max(t, t1, t2) + 0.05;

  const card = q("[data-form-card]");
  const fields = [...host.querySelectorAll("[data-field]")];
  const submit = q("[data-submit]");

  dragBox(tl, ovF1, F1, card, host, formStart, {
    tag: "form",
    dur: 0.2,
    pad: 5,
  });
  tl.to(
    card,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" },
    formStart + 0.12
  );

  const fieldAgents = [F2, F3, F1];
  const firstField = formStart + 0.22;

  fields.forEach((field, k) => {
    const agent = fieldAgents[k % fieldAgents.length];
    const at = firstField + k * 0.12;
    cursorMove(tl, agent, field, {
      at,
      duration: 0.13,
      offset: { x: 0.36, y: 0.5 },
    });
    cursorClick(tl, agent, at + 0.13);
    tl.fromTo(
      field,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" },
      at + 0.13
    );
  });

  const submitAt = firstField + Math.max(0, fields.length - 1) * 0.12 + 0.36;
  cursorMove(tl, F2, submit, {
    at: submitAt,
    duration: 0.13,
    offset: { x: 0.5, y: 0.5 },
  });
  cursorClick(tl, F2, submitAt + 0.13);
  tl.fromTo(
    submit,
    { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" },
    submitAt + 0.13
  );

  const at = submitAt + 0.4 + OUTRO;
  cursorOutro(tl, AGENTS, { at, duration: 0.25 });
  tl.add(() => AGENTS.forEach((i) => swarm.hide(i)), at + 0.3);

  return tl;
}

const CONTACT_STYLE = `
.contact-shell {
  --card-w: min(66%, 330px);
  --card-h: 88%;
  --wall-gap: 10px;
  position: relative;
  width: 100%;
  height: 100%;
}
@media (min-width: 1024px) {
  .contact-shell {
    --card-w: 46%;
    --card-h: 92%;
    --wall-gap: 14px;
  }
}
.contact-card {
  position: relative;
  width: var(--card-w);
  height: var(--card-h);
  isolation: isolate;
  z-index: 10;
}
.contact-float {
  animation: contactFloat 8.4s ease-in-out infinite;
  will-change: transform;
}
@keyframes contactFloat {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-0.2deg); }
  50% { transform: translate3d(0, -7px, 0) rotate(0.25deg); }
}
.contact-glass,
.contact-sheen,
.contact-wall-dark {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.contact-glass {
  z-index: 0;
  background: none;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
/* container is intentionally invisible; keep the element for the build */
.contact-glass::after { content: none; }
.contact-sheen {
  z-index: 1;
  background: none;
}
.contact-wall-dark {
  z-index: 1;
  background: none;
}
.contact-form-pad {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(38px, 6.8svh, 60px) clamp(20px, 8.5%, 52px);
}
.contact-form-pad::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 56%;
  width: 116%;
  height: 72%;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: radial-gradient(ellipse at center, rgba(214, 26, 41, 0.2), rgba(214, 26, 41, 0.06) 48%, transparent 72%);
  filter: blur(30px);
  pointer-events: none;
  z-index: 0;
}
.contact-form-pad form { position: relative; z-index: 1; counter-reset: contact-field; }
@media (min-width: 1024px) {
  .contact-form-pad {
    padding: clamp(44px, 8svh, 78px) clamp(22px, 8.5%, 54px);
  }
}
.contact-field {
  width: 100%;
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.8rem 1rem;
  font-family: inherit;
  font-size: clamp(0.95rem, 1vw, 1.05rem);
  line-height: 1.42;
  color: #f8f5f1;
  outline: none;
  animation: contactFloat 7.4s ease-in-out infinite;
  box-shadow:
    0 20px 40px -20px #000,
    inset 0 1px 0 rgba(255, 255, 255, 0.055),
    inset 0 8px 20px rgba(0, 0, 0, 0.28);
  transition:
    border-color 240ms cubic-bezier(.2, .7, .2, 1),
    box-shadow 240ms cubic-bezier(.2, .7, .2, 1),
    background-color 240ms cubic-bezier(.2, .7, .2, 1);
}
.contact-form-pad [data-field]:nth-child(1) .contact-field { animation-delay: -0.35s; }
.contact-form-pad [data-field]:nth-child(2) .contact-field { animation-delay: -1.45s; }
.contact-form-pad [data-field]:nth-child(3) .contact-field { animation-delay: -2.55s; }
.contact-field::placeholder { color: rgba(242, 239, 235, 0.45); }
.contact-field:hover { border-color: rgba(255, 255, 255, 0.3); }
.contact-field:focus {
  border-color: rgba(214, 26, 41, 0.92);
  background: rgba(255, 255, 255, 0.072);
  animation-play-state: paused;
  box-shadow:
    0 20px 40px -20px #000,
    inset 3px 0 0 0 #d61a29,
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 0 0 3px rgba(214, 26, 41, 0.17),
    0 0 26px rgba(214, 26, 41, 0.26);
}
.contact-field[aria-invalid="true"] {
  border-color: #ff5964;
  background: rgba(214, 26, 41, 0.075);
  box-shadow:
    0 20px 40px -20px #000,
    inset 3px 0 0 0 #ff5964,
    0 0 0 3px rgba(214, 26, 41, 0.14),
    0 0 22px rgba(214, 26, 41, 0.18);
}
.contact-field[aria-invalid="true"]:focus {
  box-shadow:
    0 20px 40px -20px #000,
    inset 3px 0 0 0 #ff5964,
    0 0 0 3px rgba(214, 26, 41, 0.2),
    0 0 28px rgba(214, 26, 41, 0.3);
}
[data-sending="1"] .contact-field { animation-play-state: paused; }
.contact-field:disabled { opacity: 0.72; cursor: progress; }
.contact-label {
  display: block;
  margin-bottom: 0.38rem;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(242, 239, 235, 0.74);
  counter-increment: contact-field;
}
.contact-label::before {
  content: counter(contact-field, decimal-leading-zero) " /";
  margin-right: 0.55em;
  color: #ff5964;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(214, 26, 41, 0.55);
}
@media (hover: none) {
  .contact-field,
  .contact-send { min-height: 48px; }
}
.contact-liquid {
  border-color: rgba(255, 255, 255, 0.18) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(0, 0, 0, 0.28)) !important;
  box-shadow:
    0 20px 40px -20px #000,
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 10px 26px -18px rgba(214, 26, 41, 0.9) !important;
}
.contact-wave-anim {
  display: block;
  width: 200%;
  height: 13px;
  animation: contactWave 2.8s linear infinite;
}
@keyframes contactWave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.contact-send {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  overflow: hidden;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  transition:
    translate 240ms cubic-bezier(.2, .7, .2, 1),
    scale 180ms cubic-bezier(.2, .7, .2, 1),
    box-shadow 240ms cubic-bezier(.2, .7, .2, 1),
    border-color 240ms cubic-bezier(.2, .7, .2, 1),
    background-color 240ms cubic-bezier(.2, .7, .2, 1);
}
.contact-send::after {
  content: "";
  position: absolute;
  top: -20%;
  bottom: -20%;
  left: 0;
  width: 42%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  opacity: 0;
  pointer-events: none;
  transform: translateX(-180%) skewX(-18deg);
  transition:
    transform 300ms cubic-bezier(.2, .7, .2, 1),
    opacity 220ms cubic-bezier(.2, .7, .2, 1);
}
@media (hover: hover) {
  .contact-send:hover:not(:disabled) {
    translate: 0 -2px;
    border-color: rgba(255, 255, 255, 0.38);
    box-shadow:
      0 14px 34px -12px rgba(214, 26, 41, 0.72),
      0 0 26px rgba(214, 26, 41, 0.32);
  }
  .contact-send:hover:not(:disabled)::after {
    opacity: 1;
    transform: translateX(340%) skewX(-18deg);
  }
}
.contact-send:active:not(:disabled) {
  translate: 0 0;
  scale: 0.98;
}
.contact-send:focus-visible {
  outline: 2px solid rgba(255, 89, 100, 0.95);
  outline-offset: 3px;
  box-shadow:
    0 0 0 4px rgba(214, 26, 41, 0.2),
    0 0 30px rgba(214, 26, 41, 0.4);
}
.contact-send:disabled { cursor: progress; }
[data-sending="1"] .contact-send {
  background: transparent;
  border-color: rgba(255, 89, 100, 0.72);
  box-shadow: 0 0 22px rgba(214, 26, 41, 0.28);
}
[data-sending="1"] .contact-send::after { opacity: 0; }
.contact-status { text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65); }

/* ---------- section atmosphere ---------- */
#contact { isolation: isolate; }
#contact::before {
  content: "";
  position: absolute;
  inset: -12% -6%;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(58% 52% at 54% 48%, rgba(214, 26, 41, 0.11), rgba(214, 26, 41, 0.035) 44%, transparent 72%);
}
#contact::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 56px 56px, 56px 56px;
  opacity: 0.42;
  -webkit-mask-image: radial-gradient(ellipse 72% 74% at 50% 52%, #000 0%, rgba(0, 0, 0, 0.62) 54%, transparent 84%);
  mask-image: radial-gradient(ellipse 72% 74% at 50% 52%, #000 0%, rgba(0, 0, 0, 0.62) 54%, transparent 84%);
}
#contact > [data-contact-inner] { position: relative; z-index: 1; }
#contact .label { font-size: 0.85rem; letter-spacing: 0.14em; }

/* ---------- left photo frame ---------- */
#contact-photo-slot {
  border: 1px solid transparent;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.72), rgba(214, 26, 41, 0.6)) left 15px top 15px / 20px 1px no-repeat,
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(214, 26, 41, 0.6)) left 15px top 15px / 1px 20px no-repeat,
    linear-gradient(270deg, rgba(255, 255, 255, 0.72), rgba(214, 26, 41, 0.6)) right 15px top 15px / 20px 1px no-repeat,
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(214, 26, 41, 0.6)) right 15px top 15px / 1px 20px no-repeat,
    linear-gradient(90deg, rgba(214, 26, 41, 0.6), rgba(255, 255, 255, 0.72)) left 15px bottom 15px / 20px 1px no-repeat,
    linear-gradient(0deg, rgba(214, 26, 41, 0.6), rgba(255, 255, 255, 0.72)) left 15px bottom 15px / 1px 20px no-repeat,
    linear-gradient(270deg, rgba(214, 26, 41, 0.6), rgba(255, 255, 255, 0.72)) right 15px bottom 15px / 20px 1px no-repeat,
    linear-gradient(0deg, rgba(214, 26, 41, 0.6), rgba(255, 255, 255, 0.72)) right 15px bottom 15px / 1px 20px no-repeat,
    linear-gradient(155deg, rgba(20, 11, 13, 0.94), rgba(9, 9, 11, 0.98)) padding-box,
    linear-gradient(160deg, rgba(255, 255, 255, 0.52), rgba(214, 26, 41, 0.16) 42%, rgba(214, 26, 41, 0.72)) border-box;
  box-shadow:
    inset 0 0 68px rgba(0, 0, 0, 0.72),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 20px 54px -36px rgba(0, 0, 0, 0.9);
}
#contact-photo-slot::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='pn'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23pn)'/></svg>");
  opacity: 0.07;
  mix-blend-mode: overlay;
  z-index: 2;
}
#contact-photo-slot::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(120% 74% at 50% 108%, rgba(0, 0, 0, 0.78), transparent 58%),
    linear-gradient(180deg, rgba(214, 26, 41, 0.06), transparent 24%);
  box-shadow: inset 0 0 0 1px rgba(214, 26, 41, 0.16);
  z-index: 1;
}
@media (hover: hover) {
  #contact-photo-slot {
    transition:
      transform 280ms cubic-bezier(.2, .7, .2, 1),
      box-shadow 280ms cubic-bezier(.2, .7, .2, 1),
      border-color 280ms cubic-bezier(.2, .7, .2, 1);
  }
  #contact-photo-slot:hover {
    transform: perspective(1100px) rotateX(1.1deg) rotateY(-1.6deg) translateY(-3px);
    box-shadow:
      inset 0 0 68px rgba(0, 0, 0, 0.66),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 24px 62px -34px rgba(214, 26, 41, 0.72),
      0 0 0 1px rgba(214, 26, 41, 0.36);
  }
}
[data-sending="1"] .contact-float {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .contact-float,
  .contact-wave-anim { animation: none; }
  .contact-field,
  .contact-send,
  .contact-send::after,
  #contact-photo-slot { transition: none; animation: none; }
  .contact-send:hover,
  .contact-send:active,
  #contact-photo-slot:hover { translate: none; scale: none; transform: none; }
}
`;

export default function Contact() {
  const root = useRef(null);
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const formRef = useRef(null);
  const frontSvgRef = useRef(null);
  const successRef = useRef(null);
  const sendErrorRef = useRef(null);
  const fillRef = useRef(null);
  const waveRef = useRef(null);
  const shimmerRef = useRef(null);
  const burstRef = useRef(null);
  const btnRef = useRef(null);

  const enabled = useAgentsEnabled();
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("idle");

  const mountedRef = useRef(true);
  const sendingRef = useRef(false);
  const pendingRef = useRef(false);
  const sendTlRef = useRef(null);
  const statusTimerRef = useRef(null);
  const shimmerTweenRef = useRef(null);
  const abortRef = useRef(null);
  const savedValuesRef = useRef(null);
  const dustNodesRef = useRef([]);
  const lineData = useRef(null);

  const clearDust = useCallback(() => {
    dustNodesRef.current.forEach((n) => n && n.remove());
    dustNodesRef.current = [];
  }, []);

  const section =
    content.sections.find((s) => s.id === "contact") || {
      num: "07",
      label: "CONTACT",
      headline: ["LET'S WORK", "TOGETHER."],
    };

  const clearError = (key) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setFloatPaused = useCallback((paused) => {
    root.current
      ?.querySelectorAll(".contact-float, .contact-drift")
      .forEach((el) => {
        el.style.animationPlayState = paused ? "paused" : "";
      });
  }, []);

  /* One light line: up the left wall, over the top, down the right wall,
     under the form and into the submit button. */
  const drawLine = useCallback(() => {
    const stage = stageRef.current;
    const front = frontSvgRef.current;
    const card = cardRef.current;
    const btnEl = btnRef.current;
    if (!stage || !front || !card || !btnEl) return;

    const hostRect = stage.getBoundingClientRect();
    if (hostRect.width < 10 || hostRect.height < 10) return;

    const cr = card.getBoundingClientRect();
    const left = cr.left - hostRect.left - 8;
    const right = cr.left - hostRect.left + card.offsetWidth + 8;
    const top = cr.top - hostRect.top;
    const bottom = top + card.offsetHeight;
    const cx = (left + right) / 2;
    const btn = centerOf(btnEl, hostRect);
    const bh = btnEl.offsetHeight;

    const pts = [
      { x: left, y: bottom - 18 },
      { x: left, y: top + 30 },
      { x: left + 12, y: top + 10 },
      { x: cx, y: top - 6 },
      { x: right - 12, y: top + 10 },
      { x: right, y: top + 30 },
      { x: right, y: bottom - 30 },
      { x: right - 14, y: bottom - 8 },
      { x: cx + (right - cx) * 0.4, y: bottom + 2 },
      { x: btn.x, y: btn.y + bh / 2 + 16 },
      { x: btn.x, y: btn.y + bh / 2 },
    ];

    front.setAttribute("viewBox", `0 0 ${hostRect.width} ${hostRect.height}`);
    const d = smoothPath(pts);
    const gold = stage.querySelector('[data-seg="0"]');
    const core = stage.querySelector('[data-core="0"]');
    const track = stage.querySelector('[data-track="0"]');
    if (!gold) return;

    [gold, core, track].filter(Boolean).forEach((p) => p.setAttribute("d", d));
    const length = gold.getTotalLength();
    if (!length) return;
    [gold, core].filter(Boolean).forEach((p) => {
      p.setAttribute("stroke-dasharray", length);
      p.setAttribute("stroke-dashoffset", length);
      p.setAttribute("opacity", 0);
    });
    if (track) track.setAttribute("opacity", 0.08);

    lineData.current = {
      segments: [
        {
          index: 0,
          kind: "front",
          gold,
          core,
          track,
          pathEl: gold,
          length,
          start: 0,
          startFrac: 0,
          endFrac: 1,
        },
      ],
      total: length,
      fractions: [1],
    };
  }, []);

  const stopShimmer = useCallback(() => {
    if (shimmerTweenRef.current) {
      shimmerTweenRef.current.kill();
      shimmerTweenRef.current = null;
    }
    if (shimmerRef.current) {
      gsap.set(shimmerRef.current, { opacity: 0, xPercent: -120 });
    }
  }, []);

  const startShimmer = useCallback(() => {
    stopShimmer();
    if (!shimmerRef.current || prefersReduced()) return;
    shimmerTweenRef.current = gsap.fromTo(
      shimmerRef.current,
      { xPercent: -120, opacity: 0 },
      {
        xPercent: 120,
        opacity: 0.5,
        duration: 1.15,
        repeat: -1,
        repeatDelay: 0.18,
        ease: "sine.inOut",
      }
    );
  }, [stopShimmer]);

  /* Turn the typed text into per-character spans that drift away like dust */
  const dustText = useCallback((text, sourceEl, host, delay = 0) => {
    if (!sourceEl || !host || !text) return 0;
    const r = sourceEl.getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    const cs = window.getComputedStyle(sourceEl);
    const chars = [...String(text)];
    const padX = parseFloat(cs.paddingLeft) || 0;
    const padY = parseFloat(cs.paddingTop) || 0;
    const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 || 18;
    const fontSize = parseFloat(cs.fontSize) || 16;
    const charW = fontSize * 0.58;
    const maxChars = Math.max(1, Math.floor((r.width - padX * 2) / Math.max(4, charW)));
    chars.forEach((ch, idx) => {
      if (ch === "\n") return;
      const col = idx % maxChars;
      const row = Math.floor(idx / maxChars);
      const span = document.createElement("span");
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.cssText =
        "position:absolute;pointer-events:none;white-space:pre;will-change:transform,opacity,filter;z-index:40;";
      span.style.left = `${r.left - hr.left + padX + col * charW}px`;
      span.style.top = `${r.top - hr.top + padY + row * lineH}px`;
      span.style.font = cs.font;
      span.style.letterSpacing = cs.letterSpacing;
      span.style.color = cs.color;
      span.style.lineHeight = cs.lineHeight;
      host.appendChild(span);
      dustNodesRef.current.push(span);
      gsap.to(span, {
        x: 60 + Math.random() * 60,
        y: -20 - Math.random() * 20,
        rotation: -10 + Math.random() * 30,
        opacity: 0,
        filter: "blur(6px)",
        duration: 0.9,
        delay: delay + idx * 0.01,
        ease: "power2.in",
        onComplete: () => {
          span.remove();
          dustNodesRef.current = dustNodesRef.current.filter((n) => n !== span);
        },
      });
    });
    return 0.9 + Math.min(chars.length, 40) * 0.01;
  }, []);

  /* One field at a time: name, then email, then message */
  const dustField = useCallback(
    (wrap, host, index) => {
      if (!wrap || !host) return;
      const label = wrap.querySelector("label");
      const input = wrap.querySelector("input, textarea");
      const base = index * 0.3;
      if (label) {
        gsap.to(label, {
          x: 60 + Math.random() * 40,
          y: -20 - Math.random() * 12,
          rotation: 8 + Math.random() * 10,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.9,
          delay: base,
          ease: "power2.in",
        });
      }
      if (input) {
        const val = input.value || "";
        if (val) {
          const prev = input.style.color;
          gsap.delayedCall(base, () => {
            input.style.color = "transparent";
            input.style.caretColor = "transparent";
          });
          dustText(val, input, host, base + 0.03);
          gsap.delayedCall(base + 0.95, () => {
            if (input) {
              input.style.color = prev;
              input.style.caretColor = "";
            }
          });
        }
      }
    },
    [dustText]
  );

  /* Line travels around the form, then the button fills with red like water */
  const startSendAnimation = useCallback(() => {
    const data = lineData.current;
    const stage = stageRef.current;
    if (!data || !stage) return Promise.resolve();

    if (sendTlRef.current) {
      sendTlRef.current.kill();
      sendTlRef.current = null;
    }

    const { segments, total } = data;
    const frontHead = stage.querySelector("[data-head-front]");
    const golds = segments.map((s) => s.gold);
    const cores = segments.map((s) => s.core).filter(Boolean);
    const tracks = segments.map((s) => s.track).filter(Boolean);
    const progress = { v: 0 };
    const lineDur = 0.9;
    const fillDur = 0.55;

    gsap.set(fillRef.current, { scaleY: 0, opacity: 1 });
    gsap.set([...golds, ...cores], { autoAlpha: 1 });
    segments.forEach((s) => {
      s.gold.setAttribute("stroke-dasharray", s.length);
      s.gold.setAttribute("stroke-dashoffset", s.length);
      if (s.core) {
        s.core.setAttribute("stroke-dasharray", s.length);
        s.core.setAttribute("stroke-dashoffset", s.length);
      }
      if (s.track) s.track.setAttribute("opacity", 0.12);
    });
    if (frontHead) gsap.set(frontHead, { autoAlpha: 0 });
    stopShimmer();

    let resolveArrive;
    const arrived = new Promise((resolve) => {
      resolveArrive = resolve;
    });

    const tl = gsap.timeline({
      onComplete() {
        if (sendTlRef.current === tl) sendTlRef.current = null;
      },
    });

    tl.to(
      progress,
      {
        v: 1,
        duration: lineDur,
        ease: "power2.inOut",
        onUpdate() {
          const travelled = progress.v * total;
          segments.forEach((s) => {
            const local = Math.min(s.length, Math.max(0, travelled - s.start));
            const offset = s.length - local;
            s.gold.setAttribute("stroke-dashoffset", offset);
            if (s.core) s.core.setAttribute("stroke-dashoffset", offset);
          });

          const active = segments[0];
          const local = Math.min(active.length, Math.max(0, travelled - active.start));
          const point = active.pathEl.getPointAtLength(local);
          if (frontHead) {
            gsap.set(frontHead, { x: point.x, y: point.y, autoAlpha: 1 });
          }
        },
      },
      0
    );

    tl.to(
      fillRef.current,
      {
        scaleY: 1,
        duration: fillDur,
        ease: "power2.inOut",
        onUpdate() {
          if (!waveRef.current || !fillRef.current) return;
          const v = Number(gsap.getProperty(fillRef.current, "scaleY")) || 0;
          const height = btnRef.current ? btnRef.current.clientHeight : 0;
          waveRef.current.style.transform = `translateY(${(1 - v) * height - 8}px)`;
          waveRef.current.style.opacity = v > 0.02 && v < 1 ? "0.58" : "0";
        },
      },
      lineDur
    );

    tl.call(
      () => {
        if (pendingRef.current) startShimmer();
        resolveArrive();
      },
      [],
      lineDur + fillDur
    );

    tl.to([...golds, ...cores], { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, lineDur + 0.05);
    if (frontHead) {
      tl.to(frontHead, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, lineDur + 0.02);
    }
    tl.to(tracks, { attr: { opacity: 0.08 }, duration: 0.5, ease: "power1.out" }, lineDur + 0.05);
    tl.to(waveRef.current, { opacity: 0, duration: 0.25, ease: "power1.out" }, lineDur + fillDur);

    sendTlRef.current = tl;
    return arrived;
  }, [startShimmer, stopShimmer]);

  const playExplosion = useCallback(() => {
    const burst = burstRef.current;
    const btn = btnRef.current;
    const stage = stageRef.current;
    if (!burst || !btn || !stage || prefersReduced()) return;

    const stageRect = stage.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    gsap.set(burst, {
      x: btnRect.left - stageRect.left + btnRect.width / 2,
      y: btnRect.top - stageRect.top + btnRect.height / 2,
    });

    const ring = burst.querySelector("[data-shockwave]");
    if (ring) {
      gsap.fromTo(
        ring,
        { scale: 1, opacity: 0.85 },
        { scale: 1.25, opacity: 0, duration: 0.45, ease: "power2.out" }
      );
    }

    const nodes = [];
    const count = 26;
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("i");
      const gold = i % 8 === 0;
      const size = gold ? 4 : 3 + Math.random() * 3.5;
      const color = gold ? "#ffd24a" : i % 3 === 0 ? "#f2efeb" : "#d61a29";
      particle.setAttribute("data-particle", "");
      particle.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;border-radius:9999px;background:${color};opacity:0;pointer-events:none;`;
      burst.appendChild(particle);
      nodes.push(particle);
    }

    nodes.forEach((particle, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 30 + Math.random() * 70;
      gsap.fromTo(
        particle,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 0,
          opacity: 0,
          duration: 0.55 + Math.random() * 0.45,
          ease: "power2.out",
          delay: Math.random() * 0.08,
          onComplete: () => particle.remove(),
        }
      );
    });
  }, []);

  const clearStatusTimer = useCallback(() => {
    if (statusTimerRef.current) {
      statusTimerRef.current.kill();
      statusTimerRef.current = null;
    }
  }, []);

  const resetFill = useCallback(() => {
    gsap.killTweensOf(fillRef.current);
    gsap.set(fillRef.current, { scaleY: 0, opacity: 1 });
    if (waveRef.current) {
      waveRef.current.style.transform = "translateY(0px)";
      waveRef.current.style.opacity = "0";
    }
  }, []);

  /* Button explodes and disappears, "Message sent" shows, then after 3s the form returns */
  const showSuccess = useCallback(() => {
    if (!mountedRef.current) return;
    pendingRef.current = false;
    stopShimmer();
    clearStatusTimer();
    clearDust();

    const reduced = prefersReduced();
    if (!reduced) playExplosion();
    if (btnRef.current) {
      gsap.to(btnRef.current, {
        autoAlpha: 0,
        scale: 0.6,
        duration: reduced ? 0 : 0.2,
        ease: "power2.in",
      });
      btnRef.current.style.pointerEvents = "none";
    }
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        opacity: 0,
        duration: reduced ? 0 : 0.24,
        ease: "power2.in",
      });
    }
    if (waveRef.current) waveRef.current.style.opacity = "0";
    if (sendErrorRef.current) gsap.set(sendErrorRef.current, { autoAlpha: 0 });
    if (successRef.current) {
      gsap.killTweensOf(successRef.current);
      gsap.fromTo(
        successRef.current,
        { autoAlpha: 0, y: 6 },
        {
          autoAlpha: 1,
          y: 0,
          duration: reduced ? 0.2 : 0.35,
          delay: reduced ? 0 : 0.12,
          ease: "power2.out",
        }
      );
    }

    swarm.dismiss(AGENTS);
    savedValuesRef.current = null;
    setStatus("success");
    setSending(false);
    sendingRef.current = false;

    statusTimerRef.current = gsap.delayedCall(3, () => {
      if (!mountedRef.current) return;
      statusTimerRef.current = null;
      if (successRef.current) {
        gsap.to(successRef.current, { autoAlpha: 0, y: -4, duration: 0.3 });
      }
      resetFill();
      if (btnRef.current) {
        btnRef.current.style.pointerEvents = "";
        gsap.fromTo(
          btnRef.current,
          { autoAlpha: 0, scale: 0.8 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.4,
            delay: 0.2,
            ease: "back.out(1.6)",
          }
        );
      }
      setStatus("idle");
      setFloatPaused(false);
    });
  }, [clearDust, clearStatusTimer, playExplosion, resetFill, setFloatPaused, stopShimmer]);

  const failSend = useCallback(() => {
    pendingRef.current = false;
    stopShimmer();
    clearStatusTimer();
    clearDust();
    if (sendTlRef.current) {
      sendTlRef.current.kill();
      sendTlRef.current = null;
    }

    const stage = stageRef.current;
    if (stage) {
      gsap.to(
        stage.querySelectorAll("[data-seg], [data-core], [data-head-front]"),
        { autoAlpha: 0, duration: 0.3, ease: "power2.out" }
      );
      stage.querySelectorAll("[data-field]").forEach((wrap) => {
        const label = wrap.querySelector("label");
        const input = wrap.querySelector("input, textarea");
        [label, input].filter(Boolean).forEach((el) => {
          gsap.killTweensOf(el);
          gsap.set(el, { clearProps: "opacity,transform,filter,x,y,rotation" });
          el.style.opacity = "";
          el.style.transform = "";
          el.style.filter = "";
          if (input && el === input) {
            input.style.color = "";
            input.style.caretColor = "";
          }
        });
      });
    }
    if (formRef.current && savedValuesRef.current) {
      ["name", "email", "message"].forEach((k) => {
        if (formRef.current.elements?.[k] != null) {
          formRef.current.elements[k].value = savedValuesRef.current[k] || "";
        }
      });
    }
    gsap.to(fillRef.current, {
      scaleY: 0,
      duration: 0.4,
      ease: "power2.in",
    });
    if (waveRef.current) {
      waveRef.current.style.transform = "translateY(0px)";
      waveRef.current.style.opacity = "0";
    }
    if (btnRef.current) {
      btnRef.current.style.pointerEvents = "";
      gsap.to(btnRef.current, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.6)",
      });
    }
    if (successRef.current) gsap.set(successRef.current, { autoAlpha: 0 });
    if (sendErrorRef.current) {
      gsap.fromTo(
        sendErrorRef.current,
        { autoAlpha: 0, y: 6 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.3,
          delay: 0.12,
          ease: "power2.out",
        }
      );
    }

    setStatus("error");
    setSending(false);
    sendingRef.current = false;

    statusTimerRef.current = gsap.delayedCall(3, () => {
      if (!mountedRef.current) return;
      statusTimerRef.current = null;
      if (sendErrorRef.current) {
        gsap.to(sendErrorRef.current, { autoAlpha: 0, y: -4, duration: 0.3 });
      }
      setStatus("idle");
      resetFill();
      setFloatPaused(false);
    });
  }, [clearDust, clearStatusTimer, resetFill, setFloatPaused, stopShimmer]);

  const requestMessage = useCallback(async (payload) => {
    if (!FORM_ENDPOINT) {
      console.warn(
        "Contact form: FORM_ENDPOINT is empty. Preview mode, no email is sent."
      );
      await sleep(1200);
      return { ok: true };
    }

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok && data.success !== false };
    } catch (error) {
      return { ok: false, error };
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (sendingRef.current || !formRef.current) return;

    const data = new FormData(formRef.current);
    const honeypot = String(data.get("company") || "").trim();
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!honeypot) {
      const found = validate({ name, email, message });
      if (Object.keys(found).length) {
        setErrors(found);
        const first = ["name", "email", "message"].find((key) => found[key]);
        if (first) formRef.current.elements?.[first]?.focus();
        return;
      }
    }

    clearStatusTimer();
    setErrors({});
    if (sendErrorRef.current) {
      gsap.set(sendErrorRef.current, { autoAlpha: 0 });
    }
    if (successRef.current) gsap.set(successRef.current, { autoAlpha: 0 });
    if (btnRef.current) {
      gsap.set(btnRef.current, { autoAlpha: 1, scale: 1 });
      btnRef.current.style.pointerEvents = "";
    }
    setStatus("sending");
    setSending(true);
    sendingRef.current = true;
    pendingRef.current = true;
    savedValuesRef.current = { name, email, message };

    const reduced = prefersReduced();
    let lineDone = Promise.resolve();
    let dustDone = Promise.resolve();
    if (!reduced) {
      setFloatPaused(true);
      if (cardRef.current) {
        gsap.set(cardRef.current, { rotationX: 0, rotationY: 0 });
      }
      drawLine();
      lineDone = startSendAnimation();
      const fields = [...(formRef.current?.querySelectorAll("[data-field]") || [])];
      const host = stageRef.current || formRef.current;
      fields.forEach((f, i) => dustField(f, host, i));
      dustDone = new Promise((resolve) => {
        gsap.delayedCall(1.75, () => {
          formRef.current?.reset();
          if (host) {
            host.querySelectorAll("[data-field] label").forEach((l) => {
              gsap.set(l, { clearProps: "opacity,transform,filter,x,y,rotation" });
              l.style.opacity = "";
              l.style.transform = "";
              l.style.filter = "";
            });
          }
          resolve();
        });
      });
    } else {
      gsap.set(fillRef.current, { scaleY: 1, opacity: 1 });
      formRef.current?.reset();
    }

    const result = honeypot
      ? { ok: true }
      : await requestMessage({
          ...FORM_EXTRA_FIELDS,
          name,
          email,
          message,
          _replyto: email,
          subject: `New portfolio message from ${name}`,
        });

    if (!mountedRef.current) return;
    if (!result.ok) {
      failSend();
      return;
    }

    pendingRef.current = false;
    if (!reduced) await Promise.all([lineDone, dustDone]);
    if (!mountedRef.current) return;
    showSuccess();
  };

  useLayoutEffect(() => {
    mountedRef.current = true;
    const el = root.current;
    if (!el) return undefined;

    const reduced = prefersReduced();
    const all = (selector) => [...el.querySelectorAll(selector)];
    let alive = true;
    let raf = 0;
    let resizeTimer = 0;
    let stop = () => {};
    let stopTilt = () => {};
    let ctx = null;

    const scheduleDraw = () => {
      if (!alive) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (alive && !sendingRef.current) drawLine();
      });
    };

    scheduleDraw();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleDraw);
    }

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(scheduleDraw, 140);
    };
    window.addEventListener("resize", onResize);

    if (reduced) {
      return () => {
        alive = false;
        mountedRef.current = false;
        cancelAnimationFrame(raf);
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
      };
    }

    ctx = gsap.context(() => {
      gsap.set(all("[data-w]"), { autoAlpha: 0 });
      gsap.set(all("[data-contact-h2] [data-w]"), { autoAlpha: 1 });
      gsap.set(el.querySelector("[data-contact-h2]"), { autoAlpha: 0 });
      gsap.set(all("[data-field]"), { autoAlpha: 0, y: 12 });
      gsap.set(all("[data-submit]"), { autoAlpha: 0, y: 10 });
      gsap.set(el.querySelector("[data-form-card]"), {
        autoAlpha: 0,
        y: 14,
        scale: 0.99,
      });
      gsap.set(successRef.current, { autoAlpha: 0 });
      gsap.set(sendErrorRef.current, { autoAlpha: 0 });
      gsap.set(fillRef.current, { scaleY: 0 });
      gsap.set(shimmerRef.current, { opacity: 0, xPercent: -120 });
      gsap.set(all("[data-seg], [data-core], [data-head-front]"), {
        autoAlpha: 0,
      });
    }, root);

    stopTilt = tiltTiles(el, "[data-form-card]", { max: 5 });

    const host = el.querySelector("[data-contact-inner]") || el;
    stop = createViewportReveal({
      root: el,
      sectionId: "contact",
      enabled,
      reduced,
      start: "top 92%",
      speed: 1.5,
      back: 2.4,
      groups: [
        {
          element: host,
          agents: AGENTS,
          build: () => buildContact(host),
        },
      ],
    });

    return () => {
      alive = false;
      mountedRef.current = false;
      sendingRef.current = false;
      pendingRef.current = false;
      setSending(false);
      if (abortRef.current) abortRef.current.abort();
      if (sendTlRef.current) {
        sendTlRef.current.kill();
        sendTlRef.current = null;
      }
      if (statusTimerRef.current) {
        statusTimerRef.current.kill();
        statusTimerRef.current = null;
      }
      if (shimmerTweenRef.current) {
        shimmerTweenRef.current.kill();
        shimmerTweenRef.current = null;
      }
      clearDust();
      swarm.dismiss(AGENTS);
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      stop();
      stopTilt();
      clearOverlays(el);
      if (ctx) ctx.revert();
    };
  }, [enabled, drawLine, clearDust]);

  const liveText =
    status === "sending"
      ? "Sending your message."
      : status === "success"
        ? "Message sent."
        : status === "error"
          ? "Sending failed. Please try again."
          : "";

  return (
    <section
      id="contact"
      data-env="contact"
      data-sending={sending ? "1" : undefined}
      aria-busy={sending}
      ref={root}
      className="relative flex min-h-svh flex-col overflow-hidden border-t border-line px-gutter py-[8svh] lg:h-svh lg:min-h-0 lg:py-[2.8svh]"
      style={{ backgroundColor: CONTACT.bg }}
    >
      <h2 className="sr-only">Contact</h2>
      <style>{CONTACT_STYLE}</style>
      <style>{envCss("contact")}</style>
      <p className="sr-only" aria-live="polite">
        {liveText}
      </p>

      {/* Cylinder silhouette clipPath: vertical walls with shallow convex arcs top and bottom */}
      <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="contact-cylinder" clipPathUnits="objectBoundingBox">
            <path d={CYLINDER_PATH} />
          </clipPath>
        </defs>
      </svg>

      <div
        data-contact-inner
        className="relative flex w-full flex-1 flex-col justify-center gap-[2.4svh] lg:h-full lg:gap-[1.2svh]"
      >
        <header data-contact-head className="relative shrink-0">
          <p className="label mb-1.5 block w-fit">
            <span data-contact-label className="inline-block">
              <span className="text-red">
                <Words text={section.num} />
              </span>{" "}
              / <Words text={section.label} />
            </span>
          </p>
          <h3 className="display flex flex-wrap items-baseline gap-x-4 text-[min(5.8vw,9.5svh)] max-lg:text-[clamp(2.4rem,9.5vw,3.6rem)]">
            <span data-contact-h1 className="block w-fit text-ink">
              <Words text={section.headline[0]} />
            </span>
            <span data-contact-h2 className="block w-fit text-red">
              <Words text={section.headline[1]} />
            </span>
          </h3>
        </header>

        <div className="relative flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-0">
          {/* Left photo slot */}
          <div
            id="contact-photo-slot"
            aria-hidden="true"
            className="relative min-h-[20svh] w-full overflow-hidden rounded-[26px] border border-line/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.03),rgba(214,26,41,0.045))] lg:h-full lg:min-h-0 lg:w-[33%]"
          >
            {/* PHOTO GOES HERE */}
          </div>

          {/* Right form stage */}
          <div
            ref={stageRef}
            className="relative flex w-full min-w-0 items-center justify-center max-lg:h-[580px] max-lg:shrink-0 lg:ml-[3.5%] lg:h-full lg:flex-1"
          >
            <div className="contact-shell flex items-center justify-center">
              <div ref={cardRef} data-form-card className="contact-card">
                <div className="contact-float absolute inset-0">
                  <div
                    className="contact-glass"
                    style={{
                      clipPath: "url(#contact-cylinder)",
                      WebkitClipPath: "url(#contact-cylinder)",
                    }}
                  />
                  <div
                    className="contact-sheen"
                    style={{
                      clipPath: "url(#contact-cylinder)",
                      WebkitClipPath: "url(#contact-cylinder)",
                    }}
                  />
                  <div
                    className="contact-wall-dark"
                    style={{
                      clipPath: "url(#contact-cylinder)",
                      WebkitClipPath: "url(#contact-cylinder)",
                    }}
                  />

                  {/* Inner safe padding area for form fields & button */}
                  <div className="contact-form-pad">
                    <form
                      ref={formRef}
                      onSubmit={submit}
                      noValidate
                      className="flex w-full flex-col gap-[clamp(7px,1.4svh,14px)]"
                    >
                      <div data-field>
                        <label
                          htmlFor="contact-name"
                          className="contact-label mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
                        >
                          Name
                        </label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          maxLength={80}
                          placeholder="Your name"
                          aria-invalid={errors.name ? "true" : undefined}
                          aria-describedby={errors.name ? "contact-name-error" : undefined}
                          onChange={() => clearError("name")}
                          className="contact-field"
                        />
                        {errors.name && (
                          <p id="contact-name-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div data-field>
                        <label
                          htmlFor="contact-email"
                          className="contact-label mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
                        >
                          Email
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          aria-invalid={errors.email ? "true" : undefined}
                          aria-describedby={errors.email ? "contact-email-error" : undefined}
                          onChange={() => clearError("email")}
                          className="contact-field"
                        />
                        {errors.email && (
                          <p id="contact-email-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div data-field>
                        <label
                          htmlFor="contact-message"
                          className="contact-label mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
                        >
                          Message
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          rows={3}
                          maxLength={2000}
                          placeholder="Tell me what you have in mind"
                          aria-invalid={errors.message ? "true" : undefined}
                          aria-describedby={errors.message ? "contact-message-error" : undefined}
                          onChange={() => clearError("message")}
                          className="contact-field resize-none"
                        />
                        {errors.message && (
                          <p id="contact-message-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                            {errors.message}
                          </p>
                        )}
                      </div>

                      {/* Fixed-height button slot */}
                      <div
                        data-submit
                        className="relative mt-1 flex h-[56px] w-full items-center justify-center"
                      >
                        <div className="relative h-[48px] w-[clamp(170px,15vw,200px)] shrink-0">
                          {/* Liquid fill container */}
                          <div
                            className="contact-liquid pointer-events-none absolute inset-0 overflow-hidden rounded-full border border-white/15 bg-white/[0.04]"
                            aria-hidden="true"
                          >
                            <div
                              ref={fillRef}
                              className="absolute inset-0 origin-bottom"
                              style={{
                                transform: "scaleY(0)",
                                background:
                                  "linear-gradient(to top, #8c0a14 0%, #b3121f 55%, #d61a29 100%)",
                              }}
                            />
                            <div
                              ref={waveRef}
                              className="pointer-events-none absolute inset-x-0 top-0"
                              style={{ opacity: 0 }}
                            >
                              <svg
                                className="contact-wave-anim"
                                viewBox="0 0 120 12"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M0 6 Q 15 0 30 6 T 60 6 T 90 6 T 120 6 V 12 H 0 Z"
                                  fill="#e2333f"
                                  opacity="0.5"
                                />
                                <path
                                  d="M0 6 Q 15 0 30 6 T 60 6 T 90 6 T 120 6"
                                  fill="none"
                                  stroke="#ffb4b8"
                                  strokeWidth="1"
                                  opacity="0.8"
                                />
                              </svg>
                            </div>
                            <div
                              ref={shimmerRef}
                              className="absolute inset-y-0 left-0 w-1/2"
                              style={{
                                opacity: 0,
                                background:
                                  "linear-gradient(100deg, transparent, rgba(255,255,255,0.32), transparent)",
                              }}
                            />
                          </div>

                          <button
                            ref={btnRef}
                            type="submit"
                            disabled={sending}
                            className="contact-send absolute inset-0 z-10 rounded-full text-[0.85rem] font-semibold uppercase tracking-[0.18em] text-white"
                          >
                            Send message
                          </button>

                          <span
                            ref={successRef}
                            className="contact-status pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-1.5 whitespace-normal text-center text-[0.95rem] font-medium leading-tight tracking-wide text-ink"
                            style={{ visibility: "hidden" }}
                          >
                            <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
                              <path
                                d="M4 12.5 9.5 18 20 6.5"
                                fill="none"
                                stroke="#d61a29"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Message sent ✓
                          </span>

                          <span
                            ref={sendErrorRef}
                            className="contact-status pointer-events-none absolute inset-0 z-20 flex items-center justify-center whitespace-nowrap text-[0.85rem] font-semibold tracking-wide text-red"
                            style={{ visibility: "hidden" }}
                          >
                            Failed. Try again.
                          </span>
                        </div>
                      </div>

                      {/* Honeypot field */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                      >
                        <label htmlFor="contact-company">Company</label>
                        <input
                          id="contact-company"
                          name="company"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Light line: on layer above the form, ends at the submit button */}
              <svg
                ref={frontSvgRef}
                data-line-front
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
              >
                <defs>
                  <linearGradient id="contact-line-front" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#ff7a83" stopOpacity="0.98" />
                    <stop offset="48%" stopColor="#d61a29" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#d61a29" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <g>
                  <path
                    data-track="0"
                    fill="none"
                    stroke="#d61a29"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.12"
                  />
                  <path
                    data-seg="0"
                    data-kind="front"
                    fill="none"
                    stroke="url(#contact-line-front)"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0"
                    style={{
                      filter:
                        "drop-shadow(0 0 5px rgba(214,26,41,0.85)) drop-shadow(0 0 13px rgba(214,26,41,0.34))",
                    }}
                  />
                  <path
                    data-core="0"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0"
                  />
                </g>
                <g data-head-front opacity="0">
                  <circle r="5.6" fill="#d61a29" opacity="0.42" />
                  <circle r="2.4" fill="#ff5964" />
                  <circle r="1.2" fill="#ffffff" />
                </g>
              </svg>

              {/* Particle shockwave & burst */}
              <div
                ref={burstRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30"
              >
                <span
                  data-shockwave
                  className="absolute left-0 top-0 -ml-6 -mt-6 block size-12 rounded-full border-2 border-[#d61a29]"
                  style={{ opacity: 0 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}