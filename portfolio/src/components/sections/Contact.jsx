import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { logoUrl } from "../../data/stack";
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
  popIn,
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

/* Disjoint cursor leases: heading [0,1], cylinder [2,3,4], icons [5,6,7,8]. */
const AGENTS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const OUTRO = 0.9;

/* Front view of a cylinder outline: straight vertical walls, shallow convex arcs at top and bottom. */
const CYLINDER_PATH =
  "M0,0.07 C0.25,0.01 0.75,0.01 1,0.07 L1,0.93 C0.75,0.99 0.25,0.99 0,0.93 Z";

/* 10 path icons: VS Code (L) -> Git (R) -> React (L) -> GitHub (R) -> Node.js (L)
   -> Express (R) -> MongoDB (L) -> Postman (R) -> Docker (L) -> AWS (R) */
const ORBIT_ICONS = [
  { name: "VS Code", slug: "vscode", color: "#007ACC", side: "left" },
  { name: "Git", slug: "git", color: "#F05032", side: "right" },
  { name: "React", slug: "react", color: "#61DAFB", side: "left" },
  { name: "GitHub", slug: "github", color: "#FFFFFF", side: "right", white: true },
  { name: "Node.js", slug: "nodejs", color: "#339933", side: "left" },
  { name: "Express", slug: "express", color: "#FFFFFF", side: "right", white: true },
  { name: "MongoDB", slug: "mongodb", color: "#47A248", side: "left" },
  { name: "Postman", slug: "postman", color: "#FF6C37", side: "right" },
  { name: "Docker", slug: "docker", color: "#2496ED", side: "left" },
  {
    name: "AWS",
    slug: "amazonwebservices",
    cdnUrl:
      "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
    color: "#FF9900",
    side: "right",
  },
].map((item, index) => ({ ...item, y: 7 + (86 / 9) * index }));

/* 4 small decorative orbs tucked into the vertical gaps next to the cylinder */
const DECOR_ICONS = [
  { name: "HTML5", slug: "html5", color: "#E34F26", side: "left", y: 16.5 },
  { name: "CSS3", slug: "css3", color: "#1572B6", side: "right", y: 26 },
  { name: "JavaScript", slug: "javascript", color: "#F7DF1E", side: "left", y: 55 },
  { name: "TypeScript", slug: "typescript", color: "#3178C6", side: "right", y: 84 },
];

/* 0..8 join the 10 icons; 9 sweeps down around the bottom into the button. */
const segmentKind = (index) =>
  index === 9 ? "front" : index % 2 === 0 ? "front" : "back";

const CONTACT_STYLE = `
.contact-shell {
  --card-w: min(66%, 330px);
  --card-h: 88%;
  --orb: clamp(48px, 12vw, 54px);
  --wall-gap: calc(var(--orb) / 2 + 6px);
  --decor: 44px;
  position: relative;
  width: 100%;
  height: 100%;
}
@media (min-width: 1024px) {
  .contact-shell {
    --card-w: 46%;
    --card-h: 92%;
    --orb: clamp(60px, 4.2vw, 68px);
    --wall-gap: calc(var(--orb) / 2 + 10px);
    --decor: clamp(44px, 3.2vw, 48px);
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
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.008)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 0%, rgba(255, 255, 255, 0.015) 12%, rgba(255, 255, 255, 0.008) 55%, rgba(0, 0, 0, 0.18) 94%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.contact-sheen {
  z-index: 1;
  background: linear-gradient(90deg, transparent 3%, rgba(255, 255, 255, 0.11) 8%, rgba(255, 255, 255, 0.03) 14%, transparent 22%);
}
.contact-wall-dark {
  z-index: 1;
  background: linear-gradient(270deg, rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.07) 10%, transparent 18%);
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
@media (min-width: 1024px) {
  .contact-form-pad {
    padding: clamp(44px, 8svh, 78px) clamp(22px, 8.5%, 54px);
  }
}
.contact-field {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.035);
  padding: 0.58rem 0.75rem;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #f2efeb;
  outline: none;
  transition: border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
}
.contact-field::placeholder { color: rgba(242, 239, 235, 0.35); }
.contact-field:hover { border-color: rgba(255, 255, 255, 0.38); }
.contact-field:focus {
  border-color: rgba(214, 26, 41, 0.95);
  background: rgba(255, 255, 255, 0.045);
  box-shadow: 0 0 0 3px rgba(214, 26, 41, 0.16), 0 0 22px rgba(214, 26, 41, 0.25);
}
.contact-field[aria-invalid="true"] {
  border-color: #ff5964;
  box-shadow: 0 0 0 3px rgba(214, 26, 41, 0.12);
}
.contact-field:disabled { opacity: 0.72; cursor: progress; }
.contact-icon,
.contact-decor {
  position: absolute;
  transform: translate(-50%, -50%);
}
.contact-icons {
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: var(--card-h);
  transform: translateY(-50%);
}
.contact-icon-left {
  left: calc(50% - var(--card-w) / 2 - var(--wall-gap));
}
.contact-icon-right {
  left: calc(50% + var(--card-w) / 2 + var(--wall-gap));
}
.contact-decor-left {
  left: calc(50% - var(--card-w) / 2 - var(--wall-gap) - 4px);
}
.contact-decor-right {
  left: calc(50% + var(--card-w) / 2 + var(--wall-gap) + 4px);
}
.contact-drift {
  animation: contactDrift 7s ease-in-out infinite;
  will-change: transform;
}
@keyframes contactDrift {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg); }
  50% { transform: translate3d(0, -8px, 0) rotate(1.4deg); }
}
.contact-orb {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--orb);
  height: var(--orb);
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  background: radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.025) 48%, rgba(10, 10, 12, 0.36) 100%);
  box-shadow:
    0 12px 24px -14px rgba(0, 0, 0, 0.95),
    0 0 22px -6px var(--orb-glow, rgba(214, 26, 41, 0.5)),
    inset 0 1px 1px rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: auto;
  transition: border-color 220ms ease, box-shadow 220ms ease, translate 220ms ease, scale 220ms ease;
}
.contact-orb img,
.contact-orb svg {
  width: 68%;
  height: 68%;
  object-fit: contain;
}
.contact-orb-small {
  width: var(--decor);
  height: var(--decor);
}
.contact-orb:hover {
  translate: 0 -4px;
  scale: 1.08;
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow:
    0 16px 30px -14px rgba(0, 0, 0, 0.95),
    0 0 34px -4px var(--orb-glow, rgba(214, 26, 41, 0.6)),
    inset 0 1px 1px rgba(255, 255, 255, 0.32);
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
.contact-send { transition: border-color 200ms ease; }
.contact-send:hover { border-color: rgba(214, 26, 41, 0.72); }
.contact-send:focus-visible { outline: 2px solid rgba(214, 26, 41, 0.85); outline-offset: 3px; }
.contact-send:disabled { cursor: progress; }
[data-sending="1"] .contact-float,
[data-sending="1"] .contact-drift {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .contact-float,
  .contact-drift,
  .contact-wave-anim { animation: none; }
  .contact-field,
  .contact-orb { transition: none; }
}
`;

/* Fallback vector icons rendered in authentic brand colors */
function BrandSvg({ name, color }) {
  switch (name) {
    case "VS Code":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M23.15 2.587l-4.743-2.188c-.686-.316-1.517-.184-2.062.33L7.747 8.243 4.226 5.566c-.453-.346-1.09-.328-1.52.044L.43 7.784a1.055 1.055 0 00-.007 1.547l3.29 2.977-3.29 2.977a1.055 1.055 0 00.007 1.547l2.276 2.174c.43.372 1.067.39 1.52.044l3.52-2.677 8.598 7.514c.545.514 1.376.646 2.062.33l4.743-2.188a1.218 1.218 0 00.732-1.116V3.703a1.218 1.218 0 00-.732-1.116zm-4.708 14.54l-6.85-5.23 6.85-5.23v10.46z" />
        </svg>
      );
    case "Git":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M2.59 13.41l8 8a2 2 0 002.83 0l8-8a2 2 0 000-2.83l-8-8a2 2 0 00-2.83 0l-8 8a2 2 0 000 2.83zm13.16-2.16a1.75 1.75 0 11-2.47-2.47 1.75 1.75 0 012.47 2.47zM8.25 10.5a1.75 1.75 0 112.47 2.47l-1.22 1.23a1.75 1.75 0 11-1.24-1.23l1.22-1.23a1.75 1.75 0 01-1.23-1.24z" />
        </svg>
      );
    case "React":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={color} strokeWidth="1.5">
          <ellipse cx="12" cy="12" rx="4.2" ry="10" transform="rotate(30 12 12)" />
          <ellipse cx="12" cy="12" rx="4.2" ry="10" transform="rotate(90 12 12)" />
          <ellipse cx="12" cy="12" rx="4.2" ry="10" transform="rotate(150 12 12)" />
          <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
        </svg>
      );
    case "GitHub":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.4v3.5c0 .3.2.7.8.6A12 12 0 0012 .3" />
        </svg>
      );
    case "Node.js":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M12 1.5l9 5.2v10.6l-9 5.2-9-5.2V6.7l9-5.2zm0 2.4L4.8 8v8l7.2 4.1 7.2-4.1V8L12 3.9zm-2.4 6.7h4.8v1.6H12v2.4h2.4v1.6H9.6V10.6z" />
        </svg>
      );
    case "Express":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="800" fontFamily="sans-serif">
            ex
          </text>
        </svg>
      );
    case "MongoDB":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M12 1.5c-.3 0-6 5.8-6 12.3 0 4.9 3.6 8.7 6 8.7s6-3.8 6-8.7c0-6.5-5.7-12.3-6-12.3zm0 18.2c-1.8 0-4-3-4-6.8 0-4 3.2-8.3 4-9.3.8 1 4 5.3 4 9.3 0 3.8-2.2 6.8-4 6.8z" />
        </svg>
      );
    case "Postman":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <circle cx="12" cy="12" r="10" opacity="0.22" />
          <path d="M14.5 7.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM7 16l3.5-3.5 2 2L17 10l-1.5 6.5H7z" />
        </svg>
      );
    case "Docker":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M13.9 8.2h2v2h-2zm-2.6 0h2v2h-2zm-2.6 0h2v2h-2zm5.2-2.5h2v2h-2zm-2.6 0h2v2h-2zm-2.6 0h2v2h-2zm7.8 5h2v2h-2zm-13 0h2v2h-2zm20.8 1.4c-.4-.3-1.6-.4-2.5.2-.1-.7-.6-1.4-1.3-1.8l-.8-.5-.5.8c-.4.7-.5 1.5-.4 2.3-.6.4-1.7.5-3.4.5H2c-.4 1.7.2 3.8 1.5 5.1C5 20.3 8 21 11.2 21c6.5 0 11.3-3.6 12.3-8.8l.1-.6z" />
        </svg>
      );
    case "AWS":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <text x="12" y="11" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">
            aws
          </text>
          <path d="M5.5 14.5c4.5 3 8.5 3 13 0" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17.5 13.2l1.6 1.4-1.9 1" fill={color} />
        </svg>
      );
    case "HTML5":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M3 2l1.8 18.5L12 23l7.2-2.5L21 2H3zm14.8 5.6h-8.2l.2 2.6h7.7l-.7 7.7-4.8 1.5-4.8-1.5-.3-3.5h2.5l.2 1.7 2.4.7 2.4-.7.3-3.3H7.4l-.7-7.8h11.4l-.3 2.7z" />
        </svg>
      );
    case "CSS3":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M3 2l1.8 18.5L12 23l7.2-2.5L21 2H3zm14.7 6.4h-7.9l.2 2.5h7.5l-.8 8-4.7 1.5-4.7-1.5-.3-3.6h2.5l.2 1.8 2.3.7 2.3-.7.4-4.2H7.5l-.6-7.1h11.2l-.4 2.5z" />
        </svg>
      );
    case "JavaScript":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="3" fill="#F7DF1E" />
          <text x="13.5" y="18" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000000" fontFamily="sans-serif">
            JS
          </text>
        </svg>
      );
    case "TypeScript":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="3" fill="#3178C6" />
          <text x="13.5" y="18" textAnchor="middle" fontSize="13" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">
            TS
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill={color} opacity="0.25" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={color}>
            {name.slice(0, 2).toUpperCase()}
          </text>
        </svg>
      );
  }
}

/* Catmull-Rom curve: creates smooth bending curves around cylinder edges */
function smoothPath(points) {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
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

function centerOf(el, hostRect) {
  const r = el.getBoundingClientRect();
  return {
    x: r.left - hostRect.left + r.width / 2,
    y: r.top - hostRect.top + r.height / 2,
  };
}

/* One segment that visibly bends around the cylinder walls */
function wrapPoints(p0, p1, wallL, wallR, kind) {
  const dy = p1.y - p0.y;
  const midX = (wallL + wallR) / 2;
  const midY = (p0.y + p1.y) / 2;
  const out = 8;
  if (kind === "front") {
    return [
      p0,
      { x: wallL - out, y: p0.y + dy * 0.28 },
      { x: midX, y: midY + 8 },
      { x: wallR + out, y: p1.y - dy * 0.28 },
      p1,
    ];
  }
  return [
    p0,
    { x: wallR + out, y: p0.y + dy * 0.28 },
    { x: midX, y: midY - 8 },
    { x: wallL - out, y: p1.y - dy * 0.28 },
    p1,
  ];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Disjoint cursor build: heading [0,1], cylinder [2,3,4], icons [5,6,7,8] */
function buildContact(host) {
  const tl = gsap.timeline();
  const q = (selector) => host.querySelector(selector);
  const [H1, H2, F1, F2, F3, I1, I2, I3, I4] = AGENTS;

  cursorIntro(tl, AGENTS, 0);

  const ovH1 = makeOverlay(host);
  const ovH2 = makeOverlay(host);
  const ovF1 = makeOverlay(host);

  const label = q("[data-contact-label]");
  const h1 = q("[data-contact-h1]");
  const h2 = q("[data-contact-h2]");

  let t = dragBox(tl, ovH1, H1, label, host, 0.04, {
    tag: "p.label",
    dur: 0.15,
    pad: 2,
  });
  t = typeWords(tl, label, H1, t, 0.02);

  let t1 = dragBox(tl, ovH2, H2, h1, host, 0.14, {
    tag: "h3.headline",
    dur: 0.18,
    pad: 3,
  });
  t1 = typeWords(tl, h1, H2, t1, 0.022);

  const t2 = cursorType(tl, h2, H1, {
    at: Math.max(0.24, t1 - 0.03),
    duration: 0.52,
    travel: 0.2,
    offset: { x: 0.5, y: 0.6 },
  });

  const headEnd = Math.max(t, t1, t2);
  const formStart = headEnd + 0.08;

  const card = q("[data-form-card]");
  const fields = [...host.querySelectorAll("[data-field]")];
  const submit = q("[data-submit]");

  dragBox(tl, ovF1, F1, card, host, formStart, {
    tag: "form.cylinder",
    dur: 0.3,
    pad: 5,
  });
  tl.to(
    card,
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.48, ease: "power3.out" },
    formStart + 0.18
  );

  const fieldAgents = [F2, F3, F1];
  const firstField = formStart + 0.34;

  fields.forEach((field, k) => {
    const agent = fieldAgents[k % fieldAgents.length];
    const at = firstField + k * 0.18;
    cursorMove(tl, agent, field, {
      at,
      duration: 0.2,
      offset: { x: 0.36, y: 0.5 },
    });
    cursorClick(tl, agent, at + 0.2);
    tl.fromTo(
      field,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
      at + 0.2
    );
  });

  const submitAt = firstField + Math.max(0, fields.length - 1) * 0.18 + 0.58;
  cursorMove(tl, F2, submit, {
    at: submitAt,
    duration: 0.2,
    offset: { x: 0.5, y: 0.5 },
  });
  cursorClick(tl, F2, submitAt + 0.2);
  tl.fromTo(
    submit,
    { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
    submitAt + 0.2
  );

  const formEnd = submitAt + 0.55;
  const iconStart = formEnd + 0.12;
  const iconAgents = [I1, I2, I3, I4];
  const orbs = [...host.querySelectorAll("[data-orbit]")].filter(
    (orb) => orb.offsetParent !== null
  );

  orbs.forEach((orb, k) => {
    popIn(tl, iconAgents[k % iconAgents.length], orb, iconStart + k * 0.12, {
      travel: 0.22,
    });
  });

  const iconEnd = iconStart + Math.max(0, orbs.length - 1) * 0.12 + 0.55;
  const lastAction = Math.max(formEnd, iconEnd);

  const at = lastAction + OUTRO;
  cursorOutro(tl, AGENTS, { at, duration: 0.35 });
  tl.add(() => AGENTS.forEach((i) => swarm.hide(i)), at + 0.4);

  return tl;
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

function Orb({ item, decorative = false, index = 0 }) {
  const [failed, setFailed] = useState(false);
  const src = item.cdnUrl || (item.slug ? logoUrl(item.slug) : null);
  const showImg = Boolean(src && !failed);
  const place = decorative
    ? `contact-decor contact-decor-${item.side} hidden lg:block`
    : `contact-icon contact-icon-${item.side}`;

  return (
    <div className={place} style={{ top: `${item.y}%` }}>
      <div
        className="contact-drift"
        style={{
          animationDelay: `${-1.1 * index}s`,
          animationDuration: `${6.4 + (index % 4) * 0.7}s`,
        }}
      >
        <div
          data-orbit
          {...(decorative ? { "data-decorative": "" } : { "data-tech-icon": "" })}
          className={`contact-orb group/chip ${decorative ? "contact-orb-small" : ""}`}
          style={{ "--orb-glow": `${item.color}66` }}
          title={item.name}
        >
          <span data-tech-inner className="grid size-full place-items-center">
            {showImg ? (
              <img
                src={src}
                alt=""
                loading="lazy"
                draggable="false"
                onError={() => setFailed(true)}
                className="select-none object-contain"
                style={
                  item.white
                    ? { filter: "brightness(0) invert(1)" }
                    : undefined
                }
              />
            ) : (
              <BrandSvg name={item.name} color={item.color} />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const root = useRef(null);
  const stageRef = useRef(null);
  const backSvgRef = useRef(null);
  const frontSvgRef = useRef(null);
  const cardRef = useRef(null);
  const formRef = useRef(null);
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
  const lineData = useRef(null);
  const sendTlRef = useRef(null);
  const statusTimerRef = useRef(null);
  const shimmerTweenRef = useRef(null);
  const abortRef = useRef(null);

  const section =
    content.sections.find((s) => s.id === "contact") || {
      num: "07",
      label: "YOUR NEXT STORY",
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

  /* Measure the icons and button, then construct every helix segment */
  const drawLine = useCallback(() => {
    const stage = stageRef.current;
    const back = backSvgRef.current;
    const front = frontSvgRef.current;
    const card = cardRef.current;
    if (!stage || !back || !front || !card || !btnRef.current) return;

    const hostRect = stage.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    if (hostRect.width < 10 || hostRect.height < 10 || cardRect.width < 10) return;

    const icons = [...stage.querySelectorAll("[data-tech-icon]")];
    if (icons.length < 10) return;

    const cardW = card.offsetWidth || cardRect.width;
    const cardH = card.offsetHeight || cardRect.height;
    const wallL = cardRect.left - hostRect.left;
    const wallR = wallL + cardW;
    const cardTop = cardRect.top - hostRect.top;
    const cardBottom = cardTop + cardH;

    const iconPoints = icons.map((icon) => centerOf(icon, hostRect));
    const btn = centerOf(btnRef.current, hostRect);
    const btnRect = btnRef.current.getBoundingClientRect();

    const stageSegments = [];
    for (let i = 0; i < 9; i += 1) {
      stageSegments.push(
        wrapPoints(iconPoints[i], iconPoints[i + 1], wallL, wallR, segmentKind(i))
      );
    }

    const aws = iconPoints[9];
    const btnLeft = btn.x - btnRect.width / 2;
    stageSegments.push([
      aws,
      { x: wallR + 2, y: aws.y + 22 },
      { x: (wallL + wallR) / 2, y: cardBottom + 4 },
      { x: btnLeft - 22, y: btn.y + 12 },
      { x: btnLeft - 2, y: btn.y },
      btn,
    ]);

    back.setAttribute("viewBox", `0 0 ${hostRect.width} ${hostRect.height}`);
    front.setAttribute("viewBox", `0 0 ${hostRect.width} ${hostRect.height}`);

    const segments = [];
    let total = 0;
    for (let i = 0; i < stageSegments.length; i += 1) {
      const kind = segmentKind(i);
      const d = smoothPath(stageSegments[i]);
      const gold = stage.querySelector(`[data-seg="${i}"]`);
      const core = stage.querySelector(`[data-core="${i}"]`);
      const track = stage.querySelector(`[data-track="${i}"]`);
      if (!gold) continue;
      gold.setAttribute("d", d);
      if (core) core.setAttribute("d", d);
      if (track) track.setAttribute("d", d);
      const length = gold.getTotalLength();
      gold.setAttribute("stroke-dasharray", length);
      gold.setAttribute("stroke-dashoffset", length);
      if (core) {
        core.setAttribute("stroke-dasharray", length);
        core.setAttribute("stroke-dashoffset", length);
      }
      segments.push({
        index: i,
        kind,
        gold,
        core,
        track,
        pathEl: gold,
        length,
        start: total,
      });
      total += length;
    }
    if (!segments.length || !total) return;

    segments.forEach((s) => {
      s.startFrac = s.start / total;
      s.endFrac = (s.start + s.length) / total;
      s.gold.setAttribute("opacity", 0);
      if (s.core) s.core.setAttribute("opacity", 0);
      if (s.track) s.track.setAttribute("opacity", 0.08);
    });

    const fractions = iconPoints.map(
      (_, i) => (segments[i] ? segments[i].start / total : 0)
    );
    fractions.push(1);

    lineData.current = { segments, total, fractions };
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

  /* Liquid fill and helix line draw share one duration and ease */
  const startSendAnimation = useCallback(() => {
    const data = lineData.current;
    const stage = stageRef.current;
    if (!data || !stage) return Promise.resolve();

    if (sendTlRef.current) {
      sendTlRef.current.kill();
      sendTlRef.current = null;
    }

    const { segments, total, fractions } = data;
    const icons = [...stage.querySelectorAll("[data-tech-icon]")];
    const frontHead = stage.querySelector("[data-head-front]");
    const backHead = stage.querySelector("[data-head-back]");
    const golds = segments.map((s) => s.gold);
    const cores = segments.map((s) => s.core).filter(Boolean);
    const tracks = segments.map((s) => s.track).filter(Boolean);
    const pulsed = new Set();
    const progress = { v: 0 };
    const duration = 1.75;

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
    gsap.set([frontHead, backHead].filter(Boolean), { autoAlpha: 0 });
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
        duration,
        ease: "power2.inOut",
        onUpdate() {
          const v = progress.v;
          const travelled = v * total;

          segments.forEach((s) => {
            const local = Math.min(
              s.length,
              Math.max(0, travelled - s.start)
            );
            const offset = s.length - local;
            s.gold.setAttribute("stroke-dashoffset", offset);
            if (s.core) s.core.setAttribute("stroke-dashoffset", offset);
          });

          let active = segments[segments.length - 1];
          for (let i = 0; i < segments.length; i += 1) {
            if (travelled <= segments[i].start + segments[i].length) {
              active = segments[i];
              break;
            }
          }
          const local = Math.min(
            active.length,
            Math.max(0, travelled - active.start)
          );
          const point = active.pathEl.getPointAtLength(local);
          const head = active.kind === "front" ? frontHead : backHead;
          const other = active.kind === "front" ? backHead : frontHead;
          if (head) {
            gsap.set(head, { x: point.x, y: point.y, autoAlpha: 1 });
          }
          if (other) gsap.set(other, { autoAlpha: 0 });

          icons.forEach((icon, k) => {
            if (pulsed.has(k) || v < (fractions[k] ?? 0)) return;
            pulsed.add(k);
            const inner = icon.querySelector("[data-tech-inner]");
            if (inner) {
              gsap.fromTo(
                inner,
                { scale: 1 },
                {
                  scale: 1.18,
                  duration: 0.18,
                  yoyo: true,
                  repeat: 1,
                  ease: "power2.out",
                  overwrite: true,
                }
              );
            }
            gsap.fromTo(
              icon,
              { opacity: 0.64 },
              { opacity: 1, duration: 0.32, ease: "power2.out", overwrite: true }
            );
          });

          gsap.set(fillRef.current, { scaleY: v });
          if (waveRef.current) {
            const height = btnRef.current ? btnRef.current.clientHeight : 0;
            waveRef.current.style.transform = `translateY(${(1 - v) * height - 8}px)`;
            waveRef.current.style.opacity = v > 0.02 ? "0.58" : "0";
          }
        },
      },
      0
    );

    tl.call(
      () => {
        if (pendingRef.current) startShimmer();
        resolveArrive();
      },
      [],
      duration
    );

    tl.to([...golds, ...cores], { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, duration + 0.12);
    tl.to([frontHead, backHead].filter(Boolean), { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, duration + 0.1);
    tl.to(tracks, { attr: { opacity: 0.08 }, duration: 0.5, ease: "power1.out" }, duration + 0.1);
    tl.to(waveRef.current, { opacity: 0, duration: 0.3, ease: "power1.out" }, duration);

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
        { scale: 0.2, opacity: 0.9 },
        { scale: 2.8, opacity: 0, duration: 0.85, ease: "power2.out" }
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

  const showSuccess = useCallback(() => {
    if (!mountedRef.current) return;
    pendingRef.current = false;
    stopShimmer();
    clearStatusTimer();

    const reduced = prefersReduced();
    if (!reduced) playExplosion();
    if (btnRef.current) {
      gsap.to(btnRef.current, {
        autoAlpha: 0,
        scale: 0.9,
        duration: reduced ? 0 : 0.16,
        ease: "power2.in",
      });
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

    setStatus("success");
    setSending(false);
    sendingRef.current = false;

    statusTimerRef.current = gsap.delayedCall(3, () => {
      if (!mountedRef.current) return;
      statusTimerRef.current = null;
      if (successRef.current) {
        gsap.to(successRef.current, { autoAlpha: 0, y: -4, duration: 0.3 });
      }
      if (btnRef.current) {
        gsap.to(btnRef.current, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.35,
          delay: 0.08,
          ease: "back.out(1.6)",
        });
      }
      formRef.current?.reset();
      setErrors({});
      setStatus("idle");
      resetFill();
      setFloatPaused(false);
    });
  }, [clearStatusTimer, playExplosion, resetFill, setFloatPaused, stopShimmer]);

  const failSend = useCallback(() => {
    pendingRef.current = false;
    stopShimmer();
    clearStatusTimer();
    if (sendTlRef.current) {
      sendTlRef.current.kill();
      sendTlRef.current = null;
    }

    const stage = stageRef.current;
    if (stage) {
      gsap.to(
        stage.querySelectorAll(
          "[data-seg], [data-core], [data-head-front], [data-head-back]"
        ),
        { autoAlpha: 0, duration: 0.3, ease: "power2.out" }
      );
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
      gsap.to(btnRef.current, {
        autoAlpha: 0,
        scale: 0.94,
        duration: 0.2,
        ease: "power2.in",
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
      if (btnRef.current) {
        gsap.to(btnRef.current, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.35,
          delay: 0.08,
          ease: "back.out(1.6)",
        });
      }
      setStatus("idle");
      resetFill();
      setFloatPaused(false);
    });
  }, [clearStatusTimer, resetFill, setFloatPaused, stopShimmer]);

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
    gsap.set(btnRef.current, { autoAlpha: 1, scale: 1 });
    setStatus("sending");
    setSending(true);
    sendingRef.current = true;
    pendingRef.current = true;

    const reduced = prefersReduced();
    let lineDone = Promise.resolve();
    if (!reduced) {
      setFloatPaused(true);
      if (cardRef.current) {
        gsap.set(cardRef.current, { rotationX: 0, rotationY: 0 });
      }
      drawLine();
      lineDone = startSendAnimation();
    } else {
      gsap.set(fillRef.current, { scaleY: 0, opacity: 1 });
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
    if (!reduced) await lineDone;
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
      gsap.set(all("[data-orbit]"), { autoAlpha: 0, scale: 0.4 });
      gsap.set(el.querySelector("[data-form-card]"), {
        autoAlpha: 0,
        y: 14,
        scale: 0.99,
      });
      gsap.set(successRef.current, { autoAlpha: 0 });
      gsap.set(sendErrorRef.current, { autoAlpha: 0 });
      gsap.set(fillRef.current, { scaleY: 0 });
      gsap.set(shimmerRef.current, { opacity: 0, xPercent: -120 });
      gsap.set(
        all("[data-seg], [data-core], [data-head-front], [data-head-back]"),
        { autoAlpha: 0 }
      );
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
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      stop();
      stopTilt();
      clearOverlays(el);
      if (ctx) ctx.revert();
    };
  }, [enabled, drawLine]);

  const liveText =
    status === "sending"
      ? "Sending your message."
      : status === "success"
        ? "Your message is sent to me."
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
            {/* Back light line SVG: behind glass layer */}
            <svg
              ref={backSvgRef}
              data-line-back
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            >
              {[1, 3, 5, 7].map((index) => (
                <g key={index}>
                  <path
                    data-track={index}
                    fill="none"
                    stroke="#ffd24a"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.08"
                  />
                  <path
                    data-seg={index}
                    data-kind="back"
                    fill="none"
                    stroke="#ffd24a"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.45"
                    opacity="0"
                    style={{ filter: "drop-shadow(0 0 4px rgba(255,210,74,0.4))" }}
                  />
                  <path
                    data-core={index}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.4"
                    opacity="0"
                  />
                </g>
              ))}
              <g data-head-back opacity="0">
                <circle r="5" fill="#ffd24a" fillOpacity="0.16" />
                <circle r="2.2" fill="#ffd24a" fillOpacity="0.45" />
                <circle r="1.1" fill="#ffffff" fillOpacity="0.4" />
              </g>
            </svg>

            {/* Cylinder container */}
            <div className="contact-shell flex items-center justify-center">
              <div ref={cardRef} data-form-card className="contact-card">
                <div className="contact-float absolute inset-0">
                  {/* Glass tint layer with 2px blur */}
                  <div
                    className="contact-glass"
                    style={{
                      clipPath: "url(#contact-cylinder)",
                      WebkitClipPath: "url(#contact-cylinder)",
                    }}
                  />
                  {/* Subtle left sheen strip */}
                  <div
                    className="contact-sheen"
                    style={{
                      clipPath: "url(#contact-cylinder)",
                      WebkitClipPath: "url(#contact-cylinder)",
                    }}
                  />
                  {/* Darkened right wall for 3D depth */}
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
                          className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
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
                          <p id="contact-name-error" className="mt-1 text-[11px] leading-tight text-red">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div data-field>
                        <label
                          htmlFor="contact-email"
                          className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
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
                          <p id="contact-email-error" className="mt-1 text-[11px] leading-tight text-red">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div data-field>
                        <label
                          htmlFor="contact-message"
                          className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
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
                          <p id="contact-message-error" className="mt-1 text-[11px] leading-tight text-red">
                            {errors.message}
                          </p>
                        )}
                      </div>

                      {/* Fixed-height button slot */}
                      <div
                        data-submit
                        className="relative mt-1 flex h-[56px] w-full items-center justify-center"
                      >
                        <div className="relative h-[46px] w-[clamp(170px,15vw,200px)] shrink-0">
                          {/* Liquid fill container */}
                          <div
                            className="pointer-events-none absolute inset-0 overflow-hidden rounded-full border border-white/15 bg-white/[0.04]"
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
                            className="contact-send absolute inset-0 z-10 rounded-full border border-white/25 bg-white/[0.035] text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ink backdrop-blur-sm"
                          >
                            Send message
                          </button>

                          <span
                            ref={successRef}
                            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-medium tracking-wide text-ink"
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
                            Your message is sent to me.
                          </span>

                          <span
                            ref={sendErrorRef}
                            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center whitespace-nowrap text-[11px] font-semibold tracking-wide text-red"
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

                  {/* Rim outline stroke & subtle red edge glow */}
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-[6] h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 7 C25 1 75 1 100 7 L100 93 C75 99 25 99 0 93 Z"
                      fill="none"
                      stroke="#d61a29"
                      strokeWidth="2.2"
                      opacity="0.45"
                      vectorEffect="non-scaling-stroke"
                      style={{ filter: "blur(2px)" }}
                    />
                    <path
                      d="M0 7 C25 1 75 1 100 7 L100 93 C75 99 25 99 0 93 Z"
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>

              {/* 10 Path Icons + 4 Decorative Icons */}
              <div className="contact-icons pointer-events-none z-10">
                {ORBIT_ICONS.map((item, index) => (
                  <Orb key={item.name} item={item} index={index} />
                ))}
                {DECOR_ICONS.map((item, index) => (
                  <Orb key={item.name} item={item} decorative index={index + 10} />
                ))}
              </div>

              {/* Front light line SVG: on layer above cylinder & form */}
              <svg
                ref={frontSvgRef}
                data-line-front
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
              >
                {[0, 2, 4, 6, 8, 9].map((index) => (
                  <g key={index}>
                    <path
                      data-track={index}
                      fill="none"
                      stroke="#ffd24a"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.08"
                    />
                    <path
                      data-seg={index}
                      data-kind="front"
                      fill="none"
                      stroke="#ffd24a"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0"
                      style={{
                        filter:
                          "drop-shadow(0 0 4px rgba(255,210,74,0.85)) drop-shadow(0 0 10px rgba(255,210,74,0.32))",
                      }}
                    />
                    <path
                      data-core={index}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0"
                    />
                  </g>
                ))}
                <g data-head-front opacity="0">
                  <circle r="5.6" fill="#ffd24a" opacity="0.38" />
                  <circle r="2.4" fill="#ffd24a" />
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
                  className="absolute left-0 top-0 -ml-6 -mt-6 block size-12 rounded-full border-2 border-[#ffd24a]"
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
