/* eslint-disable react-refresh/only-export-components -- public helpers are imported by Experience. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stack } from "../../data/stack";
import { toolGroups } from "../../data/tools";
import { swarm } from "../cursors/swarmApi";
import { typeReveal } from "../../engine/buildKit";
import { cursorIntro } from "../../engine/viewport";
import {
  makeOverlay,
  dragBox,
  clearOverlays,
} from "../../engine/swarmBuild";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import { scrollToId } from "../../hooks/useSmoothScroll";
import Logo from "../ui/Logo";

gsap.registerPlugin(ScrollTrigger);

const byName = Object.fromEntries(
  [...stack, ...toolGroups.flatMap((g) => g.items)].map((item) => [
    item.name,
    item,
  ])
);

/* Names without a devicon entry still use the same Logo letter badge. */
const extraAbbr = {
  "REST APIs": "API",
  Authentication: "AU",
  SQL: "SQL",
  "Tailwind CSS": "TW",
  "Express.js": "EX",
};

/* Extra skill names that are not in the shared stack/tools lists. */
const extraItems = {
  Chrome: { name: "Chrome", slug: "chrome" },
  Android: { name: "Android", slug: "android" },
  iOS: { name: "iOS", slug: "apple" },
  "Responsive devices": { name: "Responsive devices", abbr: "RS" },
  "Redux Toolkit": { name: "Redux Toolkit", slug: "redux" },
  "Context API": { name: "Context API", abbr: "CX" },
  Zustand: { name: "Zustand", abbr: "ZU" },
  "Framer Motion": { name: "Framer Motion", abbr: "FM" },
  "Material UI": { name: "Material UI", abbr: "MI" },
  // SASS: { name: "SASS", slug: "sass" },
  "Fetch API": { name: "Fetch API", abbr: "FE" },
  CORS: { name: "CORS", abbr: "CO" },
  OAuth: { name: "OAuth", abbr: "OA" },
  WebSockets: { name: "WebSockets", abbr: "WS" },
  "React Query": { name: "React Query", abbr: "RQ" },
  Dotenv: { name: "Dotenv", abbr: "EN" },
  Multer: { name: "Multer", abbr: "MU" },
  bcrypt: { name: "bcrypt", abbr: "BC" },
  "Cookie Parser": { name: "Cookie Parser", abbr: "CP" },
  Nodemailer: { name: "Nodemailer", abbr: "NM" },
  Redis: { name: "Redis", slug: "redis" },
  "MongoDB Atlas": { name: "MongoDB Atlas", slug: "mongodb" },
  SQLite: { name: "SQLite", slug: "sqlite" },
  Hive: { name: "Hive", abbr: "HV" },
  SharedPreferences: { name: "SharedPreferences", abbr: "SP" },
  Render: { name: "Render", abbr: "RN" },
  Cloudinary: { name: "Cloudinary", slug: "cloudinary" },
  "Firebase Hosting": { name: "Firebase Hosting", slug: "firebase" },
  "Play Store": { name: "Play Store", abbr: "PL" },
  "App Store": { name: "App Store", abbr: "AP" },
  Linux: { name: "Linux", slug: "linux" },
};

export const techItem = (name) =>
  byName[name] ||
  extraItems[name] || { name, abbr: extraAbbr[name] || name.slice(0, 2) };

/* cursor writes the words of an element, with a fast 0.08s travel */
export function typeFast(tl, el, ag, at, perLetter = 0.006) {
  if (!el) return at;
  const words = [...el.querySelectorAll("[data-w]")];
  if (!words.length) {
    tl.set(el, { autoAlpha: 1 }, at);
    return at + 0.03;
  }

  tl.add(
    swarm.moveTo(ag, words[0], {
      duration: 0.08,
      offset: { x: 0, y: 0.55 },
    }),
    at
  );
  tl.add(() => swarm.click(ag), at + 0.08);

  let t = at + 0.1;
  words.forEach((w) => {
    const len = Math.max(2, (w.textContent || "").length);
    const d = len * perLetter;
    tl.add(typeReveal(w, { duration: d, agent: ag }), t);
    t += d + 0.018;
  });
  tl.set([el, ...words], { autoAlpha: 1, clearProps: "clipPath" }, t);
  return t;
}

/* one cursor writes a whole element (used by the skills stop timeline) */
function typeEl(tl, el, ag, at, perLetter = 0.006) {
  if (!el) return at;
  const len = Math.max(4, (el.textContent || "").length);
  const duration = Math.min(0.45, Math.max(0.1, len * perLetter));

  tl.add(
    swarm.moveTo(ag, el, { duration: 0.08, offset: { x: 0, y: 0.55 } }),
    at
  );
  tl.add(() => swarm.click(ag), at + 0.08);
  tl.add(typeReveal(el, { duration, agent: ag }), at + 0.1);
  tl.set(el, { autoAlpha: 1, clearProps: "clipPath" }, at + 0.1 + duration);
  return at + 0.1 + duration;
}

/* Skills stop lease: disjoint from the heading lease [17, 18] in Experience. */
const SKILL_STOP_AGENTS = [19];
const SKILL_SPEED = 5.2;

/*
  The whole pinned story is one 0..1 progress value.
  - the fixed user set owns the top slot for the entire timeline
  - the lower slot changes through client -> api -> server -> data -> cloud -> live
  - liveLift moves the live set up over the user set
  - restart reveals the "Explore the creation" set below it
*/
const LOWER_START = 0.06;
const LOWER_SPAN = 0.56;
const LIFT_START = 0.66;
const LIFT_SPAN = 0.15;
const RESTART_START = 0.83;
const RESTART_SPAN = 0.14;

const MEANING = {
  user: {
    h1: "Opens the app",
    desc: "A person opens the app and starts the journey. They tap, scroll or type and expect an answer right away. Everything here exists to make that first moment feel clear and effortless.",
  },
  client: {
    h1: "Frontend",
    desc: "The frontend is everything a person sees and touches. I turn raw data into fast, responsive screens in the browser and on mobile. Every page load, tap and interaction is handled so the product feels instant and simple.",
  },
  api: {
    h1: "API Layer",
    desc: "The API carries requests and responses between the screen and the server. I shape predictable endpoints, secure authentication and real-time connections. Both sides exchange data safely, so features stay reliable as the app grows.",
  },
  server: {
    h1: "Backend",
    desc: "The backend applies the product's rules. It validates requests, checks identities and runs the Node.js services behind every action. The code stays clean, secure and easy to extend as new features arrive.",
  },
  data: {
    h1: "Database",
    desc: "Databases keep accounts, orders and messages available after a restart. I design schemas and queries with MongoDB and MySQL. Information stays consistent, searchable and fast, even when the product grows.",
  },
  cloud: {
    h1: "Deployment",
    desc: "Code needs a reliable home after it works locally. I build and ship apps to hosting platforms and servers, with domains, environment settings and updates in place. The product stays online while I keep improving it.",
  },
  live: {
    h1: "Live URL",
    desc: "The finished product is online and open to everyone. Visitors can follow the link, explore every screen and use each feature for real. The journey is complete, and the next idea is already waiting.",
  },
  explore: {
    h1: "Explore the creation",
    desc: "Open the live product and move through every screen. See the work running beyond a screenshot, with real data and real interactions. If an idea sparks, let's build something together.",
  },
};

const SKILLS_STYLE = `
.sk-wrap {
  position: relative;
  width: 100%;
  height: calc(100vh + var(--sk-stops, 8) * 100vh);
  height: calc(100svh + var(--sk-stops, 8) * 100svh);
}
.sk-stage {
  position: sticky;
  top: 0;
  display: flex;
  height: 100vh;
  height: 100svh;
  height: 100dvh;
  overflow: clip;
}
.sk-inner {
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1svh, 14px);
  width: 100%;
  max-width: 1320px;
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  padding: clamp(10px, 1.6svh, 20px) clamp(14px, 3.2vw, 42px);
}
.sk-head-slot { flex: 0 0 auto; min-width: 0; }
.sk-head-slot > header { margin: 0; }
.sk-scene {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  contain: layout paint;
}

/* top slot: the user set never moves during the lower cycle */
.sk-fixed {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: clamp(150px, 24svh, 240px);
  will-change: transform, opacity;
}
.sk-fixed-slide,
.sk-slide {
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(18px, 3vw, 48px);
  width: 100%;
  min-width: 0;
}

/* connector between the fixed top set and the changing lower set */
.sk-arrow {
  position: relative;
  z-index: 4;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  height: clamp(22px, 2.8svh, 34px);
  color: var(--color-red);
  will-change: opacity;
}
.sk-arrow svg {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 9px rgba(214, 26, 41, .55));
  animation: skArrowBounce 1.7s cubic-bezier(.33,.66,.66,1) infinite;
}
@keyframes skArrowBounce {
  0%, 100% { transform: translateY(-2px); opacity: .55; }
  50% { transform: translateY(4px); opacity: 1; }
}

/* lower slot: client -> api -> server -> data -> cloud -> live */
.sk-lower {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  min-height: 0;
}
.sk-slide {
  position: absolute;
  inset: 0;
  visibility: hidden;
  opacity: 0;
  align-content: center;
  padding-block: clamp(2px, 1svh, 10px);
  will-change: transform, opacity;
}
.sk-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.sk-mask {
  display: block;
  overflow: hidden;
  padding: .04em 0 .06em;
}
.sk-line { display: block; }
.sk-type { display: block; }

.sk-h1 {
  font-size: clamp(2.4rem, 5.5vw, 5rem);
  line-height: .94;
  letter-spacing: -.02em;
  color: var(--color-ink);
  overflow-wrap: anywhere;
}
.sk-desc-row { margin-top: clamp(10px, 1.4svh, 18px); }
.sk-desc {
  max-width: 44ch;
  font-size: clamp(1rem, 1.35vw, 1.3rem);
  line-height: 1.6;
  color: var(--color-muted);
  overflow-wrap: anywhere;
}
.sk-right {
  display: flex;
  align-items: center;
  min-width: 0;
  max-height: 100%;
}
.sk-skills {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 142px), 1fr));
  gap: clamp(5px, .6svh, 7px) clamp(7px, .8vw, 11px);
  width: 100%;
  align-content: center;
}

/* chips */
.sk-item {
  display: flex;
  align-items: center;
  gap: clamp(8px, .8vw, 12px);
  min-width: 0;
  padding: clamp(4px, .6svh, 7px) clamp(12px, 1.1vw, 17px);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 10px;
  background: rgba(255,255,255,.028);
  transition: transform .26s cubic-bezier(.2,.7,.2,1), border-color .26s cubic-bezier(.2,.7,.2,1), background-color .26s cubic-bezier(.2,.7,.2,1), box-shadow .26s cubic-bezier(.2,.7,.2,1);
}
.sk-item:focus-visible,
.sk-explore-link:focus-visible {
  outline: 2px solid var(--color-red);
  outline-offset: 3px;
}
.sk-logo {
  flex: 0 0 auto;
  width: clamp(22px, 1.8vw, 27px);
  height: clamp(22px, 1.8vw, 27px);
  transition: transform .26s cubic-bezier(.2,.7,.2,1);
}
.sk-badge { font-size: .85rem; }
.sk-item-name {
  min-width: 0;
  font-size: clamp(.85rem, 1.05vw, .95rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: .025em;
  text-transform: uppercase;
  color: var(--color-muted);
  overflow-wrap: anywhere;
  transition: color .24s cubic-bezier(.2,.7,.2,1);
}

/* user set */
.sk-user {
  display: flex;
  align-items: center;
  gap: clamp(16px, 1.8vw, 28px);
  width: 100%;
  min-width: 0;
}
.sk-user-glyph {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: clamp(96px, 9.5vw, 140px);
  aspect-ratio: 1;
  border: 1px solid rgba(214,26,41,.4);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(214,26,41,.18), transparent 70%);
  color: var(--color-red);
  box-shadow: 0 0 60px -18px rgba(214,26,41,.7);
}
.sk-user-glyph svg { width: 52%; height: 52%; }
.sk-user-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(9px, 1.1svh, 15px);
  min-width: 0;
}
.sk-user-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.sk-user-tag {
  padding: .55rem 1rem;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 999px;
  font-size: .9rem;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.sk-skills--user {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
}

/* live set content */
.sk-live {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(12px, 1.6svh, 20px);
  width: 100%;
}
.sk-live-badge {
  display: inline-flex;
  align-items: center;
  gap: .65rem;
  font-size: clamp(.95rem, 1.15vw, 1.1rem);
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--color-red);
}
.sk-live-pulse {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--color-red);
  box-shadow: 0 0 0 4px rgba(214,26,41,.16), 0 0 16px rgba(214,26,41,.8);
  animation: skLivePulse 2.4s ease-in-out infinite;
}
@keyframes skLivePulse {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
.sk-live-note {
  max-width: 38ch;
  font-size: clamp(1.05rem, 1.35vw, 1.25rem);
  line-height: 1.6;
  color: var(--color-ink);
}
.sk-live-note span { color: var(--color-red); }

/* the live set rides from the lower slot into the top slot */
.sk-live-top {
  position: absolute;
  inset: 0 0 auto;
  z-index: 5;
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--sk-top-h, clamp(150px, 24svh, 240px));
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
}
.sk-live-top .sk-fixed-slide { width: 100%; }

/* explore / restart set */
.sk-explore {
  position: absolute;
  inset: 0;
  z-index: 4;
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}
.sk-explore-links {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.4svh, 16px);
  width: 100%;
}
.sk-explore-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(13px, 1.7svh, 19px) clamp(15px, 1.5vw, 21px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px;
  background: rgba(255,255,255,.03);
  font-size: clamp(.95rem, 1.1vw, 1.1rem);
  font-weight: 600;
  color: var(--color-ink);
  transition: transform .26s cubic-bezier(.2,.7,.2,1), border-color .26s cubic-bezier(.2,.7,.2,1), background-color .26s cubic-bezier(.2,.7,.2,1), box-shadow .26s cubic-bezier(.2,.7,.2,1);
}
.sk-explore-link span {
  flex-shrink: 0;
  color: var(--color-red);
  transition: transform .26s cubic-bezier(.2,.7,.2,1);
}

@media (hover:hover) and (pointer:fine) {
  .sk-item:hover {
    transform: translateY(-4px);
    border-color: rgba(214,26,41,.7);
    background: rgba(214,26,41,.1);
    box-shadow: 0 14px 32px -16px rgba(214,26,41,.7), inset 0 0 0 1px rgba(214,26,41,.18);
  }
  .sk-item:hover .sk-logo { transform: scale(1.12); }
  .sk-item:hover .sk-item-name { color: var(--color-ink); }
  .sk-explore-link:hover {
    transform: translateY(-3px);
    border-color: rgba(214,26,41,.7);
    background: rgba(214,26,41,.1);
    box-shadow: 0 14px 32px -16px rgba(214,26,41,.7);
  }
  .sk-explore-link:hover span { transform: translate(2px,-2px); }
}
.sk-item:focus-visible {
  transform: translateY(-4px);
  border-color: rgba(214,26,41,.7);
  box-shadow: 0 14px 32px -16px rgba(214,26,41,.7);
}
.sk-item:focus-visible .sk-logo { transform: scale(1.12); }
.sk-item:focus-visible .sk-item-name { color: var(--color-ink); }
.sk-explore-link:focus-visible {
  transform: translateY(-3px);
  border-color: rgba(214,26,41,.7);
}

/* ---------- tablet + mobile: one column, centered to fill the stage ---------- */
@media (max-width: 1023px) {
  /* shorter pinned runway on touch screens: same story, less empty scrolling */
  .sk-wrap {
    height: calc(100svh + var(--sk-stops, 8) * 82svh);
  }
  .sk-inner {
    gap: clamp(4px, 1svh, 10px);
    padding: clamp(8px, 1.5svh, 16px) clamp(12px, 4vw, 28px);
  }
  .sk-fixed { min-height: 0; padding-block: 0; }
  .sk-fixed-slide {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
  }
  .sk-fixed .sk-left { display: block; }
  .sk-fixed .sk-desc-row { display: none; }
  .sk-fixed .sk-h1 {
    font-size: clamp(1.4rem, 5.6vw, 1.9rem);
    line-height: 1;
    white-space: nowrap;
  }
  .sk-fixed .sk-user { gap: 8px; }
  .sk-fixed .sk-user-glyph { width: clamp(34px, 8.5vw, 44px); }
  .sk-fixed .sk-user-body {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .sk-fixed .sk-user-tags { gap: 4px; }
  .sk-fixed .sk-user-tag {
    padding: .28rem .5rem;
    font-size: .85rem;
    letter-spacing: .04em;
  }
  .sk-fixed .sk-skills--user { display: none; }

  .sk-arrow { height: 18px; }
  .sk-arrow svg { width: 18px; height: 18px; }

  .sk-slide {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-content: center;
    align-items: center;
    gap: clamp(8px, 1.5svh, 14px);
  }
  .sk-left { justify-content: flex-start; }
  .sk-h1 {
    font-size: clamp(2rem, 8.2vw, 2.7rem);
    line-height: .98;
  }
  .sk-desc-row { margin-top: 6px; }
  .sk-desc {
    max-width: none;
    font-size: clamp(.9rem, 3.6vw, 1.02rem);
    line-height: 1.5;
  }
  .sk-right { align-items: center; width: 100%; }
  .sk-skills {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
    align-content: center;
  }
  .sk-skills--user { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sk-item {
    padding: 6px 7px;
    gap: 6px;
    min-height: 34px;
  }
  .sk-item-name {
    font-size: .85rem;
    line-height: 1.15;
    letter-spacing: .015em;
  }
  .sk-logo { width: 22px; height: 22px; }

  .sk-live { gap: 10px; }
  .sk-live-badge { font-size: .9rem; }
  .sk-live-note { font-size: 1rem; line-height: 1.5; }
  .sk-live-top { height: var(--sk-top-h, 40px); }

  /* the live set compacts into the top slot exactly like the user set does */
  .sk-live-top .sk-fixed-slide {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
  }
  .sk-live-top .sk-left { display: block; }
  .sk-live-top .sk-desc-row { display: none; }
  .sk-live-top .sk-h1 {
    font-size: clamp(1.4rem, 5.6vw, 1.9rem);
    line-height: 1;
    white-space: nowrap;
  }
  .sk-live-top .sk-live {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  .sk-live-top .sk-live-note { display: none; }
  .sk-live-top .sk-live-badge { font-size: .85rem; }
  .sk-live-top .sk-live-pulse { width: 9px; height: 9px; }

  .sk-explore-links { gap: 8px; }
  .sk-explore-link { padding: 11px 13px; font-size: .95rem; }
}

@media (max-width: 420px) {
  .sk-inner { padding-inline: 12px; }
  .sk-h1 { font-size: clamp(1.9rem, 9vw, 2.4rem); }
  .sk-item { padding: 5px 6px; gap: 5px; }
  .sk-item-name { font-size: .85rem; letter-spacing: 0; }
  .sk-logo { width: 21px; height: 21px; }
  .sk-user-tag { padding: .26rem .46rem; }
}

/* short phones: compact the fixed user set first, never the body text */
@media (max-width: 1023px) and (max-height: 740px) {
  .sk-inner { gap: 4px; padding-block: 8px; }
  .sk-fixed .sk-h1 { font-size: clamp(1.25rem, 5.4vw, 1.6rem); }
  .sk-fixed .sk-user-glyph { width: clamp(30px, 7.5vw, 36px); }
  .sk-fixed .sk-user-tag { padding: .22rem .42rem; }
  .sk-arrow { height: 16px; }
  .sk-arrow svg { width: 16px; height: 16px; }
  .sk-h1 { font-size: clamp(1.75rem, 7.2vw, 2.2rem); }
  .sk-desc-row { margin-top: 5px; }
  .sk-desc { font-size: .9rem; line-height: 1.45; }
  .sk-skills { gap: 4px 5px; }
  .sk-item { padding: 4px 5px; gap: 5px; min-height: 30px; }
  .sk-logo { width: 20px; height: 20px; }
}

@media (max-width: 1023px) and (max-height: 700px) {
  .sk-fixed .sk-right { display: none; }
  .sk-fixed .sk-h1 { font-size: clamp(1.15rem, 4.8vw, 1.4rem); }
  .sk-live-top .sk-right { display: none; }
  .sk-live-top .sk-h1 { font-size: clamp(1.15rem, 4.8vw, 1.4rem); }
  .sk-slide { gap: 6px; }
  .sk-h1 { font-size: clamp(1.6rem, 6.6vw, 2rem); }
  .sk-desc { font-size: .88rem; line-height: 1.4; }
  .sk-skills { gap: 3px 4px; }
  .sk-item { padding: 3px 4px; gap: 4px; min-height: 28px; }
  .sk-item-name { font-size: .85rem; line-height: 1.1; letter-spacing: 0; }
  .sk-logo { width: 18px; height: 18px; }
}

/* very short phones: the intro and the paragraph give the sets room */
@media (max-width: 1023px) and (max-height: 650px) {
  .sk-head-slot [data-flow-intro] { display: none; }
}
@media (max-width: 1023px) and (max-height: 600px) and (orientation: portrait) {
  .sk-slide .sk-desc-row { display: none; }
  .sk-arrow { height: 14px; }
  .sk-arrow svg { width: 15px; height: 15px; }
}

/* landscape phones: text and chips side by side, five compact chip columns */
@media (max-width: 1023px) and (orientation: landscape) and (max-height: 600px) {
  .sk-inner { gap: 4px; padding-block: 6px; }
  .sk-fixed { min-height: 0; }
  .sk-fixed .sk-right { display: none; }
  .sk-fixed .sk-h1 { font-size: clamp(1.1rem, 4.6vh, 1.5rem); }
  .sk-live-top .sk-right { display: none; }
  .sk-live-top .sk-h1 { font-size: clamp(1.1rem, 4.6vh, 1.5rem); }
  .sk-arrow { height: 14px; }
  .sk-arrow svg { width: 15px; height: 15px; }
  .sk-slide {
    grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr);
    grid-template-rows: 1fr;
    align-content: center;
    align-items: center;
    gap: 14px;
  }
  .sk-h1 { font-size: clamp(1.5rem, 5.4vh, 2.1rem); }
  .sk-desc { font-size: .9rem; line-height: 1.4; }
  .sk-skills {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 3px;
    align-content: center;
  }
  .sk-item { padding: 2px 3px; gap: 2px; min-height: 0; }
  .sk-item-name { font-size: .85rem; line-height: 1.1; letter-spacing: 0; }
  .sk-logo { width: 16px; height: 16px; }
  .sk-explore-links { flex-direction: row; }
}

/* short desktop windows */
@media (min-width: 1024px) and (max-height: 800px) {
  .sk-inner { gap: 6px; padding-block: 10px; }
  .sk-fixed { min-height: clamp(120px, 20svh, 160px); }
  .sk-h1 { font-size: clamp(2.2rem, 4.6vw, 3.6rem); }
  .sk-desc { font-size: clamp(.95rem, 1.1vw, 1.1rem); line-height: 1.5; }
  .sk-skills { gap: 5px; }
  .sk-item { padding: 5px 9px; }
}

@media (prefers-reduced-motion: reduce) {
  .sk-item, .sk-item-name, .sk-logo, .sk-explore-link, .sk-explore-link span { transition: none; }
  .sk-arrow svg, .sk-live-pulse { animation: none; }
}
`;
function UserGlyph({ className = "size-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="2.4" />
      <path d="M4.8 17c.4-2.6 2.1-4.1 4.2-4.1s3.8 1.5 4.2 4.1" />
      <rect x="13.4" y="5.4" width="6.2" height="9.2" rx="1.1" />
      <path d="M15.6 17h1.8M13.4 14.6h6.2" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v15" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

function MaskLine({
  as: Tag = "span",
  className = "",
  wrapClassName = "",
  children,
}) {
  return (
    <div className={`sk-mask ${wrapClassName}`}>
      <Tag className={`sk-line ${className}`}>{children}</Tag>
    </div>
  );
}

function SkillGrid({ names }) {
  return (
    <ul className="sk-skills">
      {names.map((name) => {
        const item = techItem(name);
        return (
          <li
            key={name}
            data-sk-item
            data-cursor-hover
            title={name}
            className="sk-item group/chip"
          >
            <Logo item={item} className="sk-logo" badgeClass="sk-badge" />
            <span className="sk-item-name">{name}</span>
          </li>
        );
      })}
    </ul>
  );
}

function UserContent({ stop }) {
  return (
    <div className="sk-user">
      <span className="sk-user-glyph" data-sk-item>
        <UserGlyph />
      </span>
      <div className="sk-user-body">
        <ul className="sk-user-tags">
          {["Browser", "Device", "Person"].map((tag) => (
            <li key={tag} data-sk-item className="sk-user-tag">
              {tag}
            </li>
          ))}
        </ul>
        {stop.icons.length > 0 && (
          <ul className="sk-skills sk-skills--user">
            {stop.icons.map((name) => {
              const item = techItem(name);
              return (
                <li
                  key={name}
                  data-sk-item
                  data-cursor-hover
                  title={name}
                  className="sk-item group/chip"
                >
                  <Logo
                    item={item}
                    className="sk-logo"
                    badgeClass="sk-badge"
                  />
                  <span className="sk-item-name">{name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function LiveContent({ stop }) {
  return (
    <div className="sk-live" data-sk-item>
      <p className="sk-live-badge">
        <span className="sk-live-pulse" aria-hidden="true" />
        {stop.label}
      </p>
      <p className="sk-live-note">
        The build is <span>live</span> and serving traffic right now.
      </p>
    </div>
  );
}

function StopSlide({ stop, index, active, slideRef, fixed = false }) {
  return (
    <div
      ref={slideRef}
      className={fixed ? "sk-fixed-slide" : "sk-slide"}
      aria-hidden={fixed ? undefined : active !== index}
    >
      <div className="sk-left">
        <MaskLine as="h2" className="sk-h1 display">
          <span data-sk-type className="sk-type">
            {stop.h1}
          </span>
        </MaskLine>
        <MaskLine as="p" className="sk-desc" wrapClassName="sk-desc-row">
          <span data-sk-type className="sk-type">
            {stop.desc}
          </span>
        </MaskLine>
      </div>

      <div className="sk-right">
        {stop.kind === "user" && <UserContent stop={stop} />}
        {stop.kind === "live" && <LiveContent stop={stop} />}
        {stop.kind === "skills" && <SkillGrid names={stop.icons} />}
      </div>
    </div>
  );
}

/*
  The live set is rendered twice: once inside the lower slot (where it enters
  with the normal stop transition) and once in this top layer. The top layer
  starts exactly at the lower slot and rides up into the fixed slot, while the
  lower copy fades away. That is the "live covers the user set" beat.
*/
function LiveTop({ stop, index, topLiveRef }) {
  return (
    <div ref={topLiveRef} className="sk-live-top" aria-hidden="true">
      <StopSlide stop={stop} index={index} active={index} fixed />
    </div>
  );
}

function ExploreSlide({ stop, exploreRef }) {
  const jump = (event, id) => {
    event.preventDefault();
    scrollToId(id);
  };

  return (
    <div ref={exploreRef} className="sk-explore sk-slide" aria-hidden="true">
      <div className="sk-left">
        <h2 className="sk-h1 display">{stop.h1}</h2>
        <p className="sk-desc">{stop.desc}</p>
      </div>
      <div className="sk-right">
        <div className="sk-explore-links">
          <a
            href="#projects"
            data-cursor-hover
            className="sk-explore-link"
            onClick={(event) => jump(event, "projects")}
          >
            View the work <span aria-hidden="true">↗</span>
          </a>
          <a
            href="#contact"
            data-cursor-hover
            className="sk-explore-link"
            onClick={(event) => jump(event, "contact")}
          >
            Start a conversation <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SkillsFlow({
  flow = [],
  returnLabel = "LIVE URL",
  children,
}) {
  const baseStops = flow.length
    ? flow.map((node) => {
        const meaning = MEANING[node.key] || {};
        return {
          key: node.key,
          kind: node.key === "user" ? "user" : "skills",
          title: node.title,
          icons: node.icons || [],
          h1: meaning.h1 || node.caption || node.title,
          desc: meaning.desc || node.caption || "",
        };
      })
    : [
        {
          key: "user",
          kind: "user",
          title: "USER",
          icons: [],
          h1: MEANING.user.h1,
          desc: MEANING.user.desc,
        },
      ];

  const stops = [
    ...baseStops,
    {
      key: "live",
      kind: "live",
      title: "LIVE",
      icons: [],
      label: returnLabel,
      h1: MEANING.live.h1,
      desc: MEANING.live.desc,
    },
    {
      key: "explore",
      kind: "explore",
      title: "EXPLORE",
      icons: [],
      label: returnLabel,
      h1: MEANING.explore.h1,
      desc: MEANING.explore.desc,
    },
  ];

  const total = stops.length;
  const fixedStop = stops[0];
  const exploreStop = stops[stops.length - 1];
  const lowerStops = stops.slice(1, stops.length - 1);
  const lowerCount = Math.max(1, lowerStops.length);
  const liveGlobalIndex = stops.findIndex((stop) => stop.key === "live");

  const wrapRef = useRef(null);
  const sceneRef = useRef(null);
  const userRef = useRef(null);
  const arrowRef = useRef(null);
  const topLiveRef = useRef(null);
  const exploreRef = useRef(null);
  const liveSlideRef = useRef(null);
  const slidesRef = useRef([]);
  const activeRef = useRef(0);
  const animatingRef = useRef(false);
  const pendingRef = useRef(null);
  const [active, setActive] = useState(0);

  const agentsEnabled = useAgentsEnabled();
  const enabledRef = useRef(agentsEnabled);
  const actRef = useRef(null);
  const initialActRef = useRef(false);
  const inViewRef = useRef(false);
  const exploreVisibleRef = useRef(false);
  const metricsRef = useRef({
    vh: 0,
    wrapTop: 0,
    height: 0,
    travel: 1,
    liftOffset: 0,
  });
  const settersRef = useRef(null);

  useEffect(() => {
    enabledRef.current = agentsEnabled;
  }, [agentsEnabled]);

  /* stop the current stop timeline, finalize shown text, hide its cursors */
  const killSkillAct = useCallback((unmount = false) => {
    const tl = actRef.current;
    actRef.current = null;
    if (tl) tl.kill();

    const scene = sceneRef.current;
    if (scene) clearOverlays(scene);

    slidesRef.current.forEach((slide, i) => {
      if (!slide) return;
      const spans = slide.querySelectorAll("[data-sk-type]");
      if (!spans.length) return;
      if (!enabledRef.current || unmount || i === activeRef.current) {
        gsap.set(spans, { autoAlpha: 1, clearProps: "clipPath" });
      } else {
        gsap.set(spans, {
          autoAlpha: 0,
          clipPath: "inset(-20% 100% -20% -5%)",
        });
      }
    });

    const user = userRef.current;
    if (user) {
      gsap.set(user.querySelectorAll("[data-sk-type]"), {
        autoAlpha: 1,
        clearProps: "clipPath",
      });
    }

    const els = swarm.els(SKILL_STOP_AGENTS);
    if (els.length) {
      gsap.killTweensOf(els);
      gsap.set(els, { opacity: 0, visibility: "hidden" });
    }
    if (swarm.park) swarm.park(SKILL_STOP_AGENTS);
  }, []);

  /* if the cursor swarm turns off, reveal everything and hide the cursor */
  useEffect(() => {
    if (!agentsEnabled) killSkillAct(true);
  }, [agentsEnabled, killSkillAct]);

  /* one fast cursor act per active stop; it always ends hidden */
  const playSkillAct = useCallback(
    (index) => {
      if (!enabledRef.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const scene = sceneRef.current;
      const slide =
        index === 0 ? userRef.current : slidesRef.current[index];
      if (!scene || !slide) return;

      const previous = actRef.current;
      actRef.current = null;
      if (previous) previous.kill();
      clearOverlays(scene);

      const overlays = [];
      const mk = () => {
        const overlay = makeOverlay(scene);
        overlays.push(overlay);
        return overlay;
      };
      const agents = SKILL_STOP_AGENTS;
      const A = agents[0];
      const visible = (el) => el && el.getClientRects().length > 0;
      const h1 = slide.querySelector(".sk-h1 [data-sk-type]");
      const desc = slide.querySelector(".sk-desc [data-sk-type]");
      const h1Box = h1 && h1.closest(".sk-h1");
      const descBox = desc && desc.closest(".sk-desc");
      const items = [...slide.querySelectorAll("[data-sk-item]")].slice(0, 3);

      const tl = gsap.timeline();
      actRef.current = tl;
      tl.timeScale(SKILL_SPEED);

      cursorIntro(tl, agents, 0);

      const spans = [h1, desc].filter(Boolean);
      if (spans.length) {
        tl.set(
          spans,
          { autoAlpha: 0, clipPath: "inset(-20% 100% -20% -5%)" },
          0
        );
      }

      let th = 0.02;
      if (visible(h1Box)) {
        th = dragBox(tl, mk(), A, h1Box, scene, 0.02, {
          tag: "h2.headline",
          dur: 0.09,
          pad: 3,
        });
        th = typeEl(tl, h1, A, th + 0.005, 0.006);
      }

      let td = th;
      if (visible(descBox)) {
        td = dragBox(tl, mk(), A, descBox, scene, th + 0.01, {
          tag: "p.desc",
          dur: 0.08,
          pad: 2,
        });
        td = typeEl(tl, desc, A, td + 0.01, 0.006);
      }

      let end = Math.max(th, td);
      const itemAt = Math.max(0.18, td - 0.06);
      items.forEach((item, k) => {
        const at = itemAt + k * 0.026;
        tl.add(
          swarm.moveTo(A, item, {
            duration: 0.08,
            offset: { x: 0.5, y: 0.5 },
          }),
          at
        );
        tl.add(() => swarm.click(A), at + 0.08);
        end = Math.max(end, at + 0.09);
      });

      if (spans.length) {
        tl.set(spans, { autoAlpha: 1, clearProps: "clipPath" }, end + 0.01);
      }

      const els = swarm.els(agents);
      if (els.length) {
        tl.to(
          els,
          { opacity: 0, duration: 0.14, ease: "power2.out" },
          end + 0.04
        );
        tl.add(() => {
          agents.forEach((i) => swarm.hide(i));
          overlays.forEach(({ o }) => o.remove());
          if (actRef.current === tl) actRef.current = null;
        }, end + 0.2);
      } else {
        tl.add(() => {
          overlays.forEach(({ o }) => o.remove());
          if (actRef.current === tl) actRef.current = null;
        }, end + 0.05);
      }
      return tl;
    },
    []
  );

  const goTo = useCallback(
    function transition(target) {
      const slides = slidesRef.current;
      if (target < 0 || target > lowerCount || target === activeRef.current) {
        return;
      }
      if (animatingRef.current) {
        pendingRef.current = target;
        return;
      }

      killSkillAct();
      initialActRef.current = true;

      const fromIndex = activeRef.current;
      const from = fromIndex > 0 ? slides[fromIndex] : null;
      const to = target > 0 ? slides[target] : null;
      if (target > 0 && !to) return;

      /* A large programmatic jump can skip several transitions. Make every
         slide that is neither leaving nor entering invisible so a stale set
         can never stay stacked under the active one. */
      slides.forEach((slide, i) => {
        if (!slide || i === fromIndex || i === target) return;
        gsap.set(slide, { autoAlpha: 0, zIndex: 1 });
      });

      const dir = target > fromIndex ? 1 : -1;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const outLines = from ? from.querySelectorAll(".sk-line") : [];
      const outItems = from ? from.querySelectorAll("[data-sk-item]") : [];
      const inLines = to ? to.querySelectorAll(".sk-line") : [];
      const inItems = to ? to.querySelectorAll("[data-sk-item]") : [];

      gsap.killTweensOf([
        ...outLines,
        ...outItems,
        ...inLines,
        ...inItems,
        from,
        to,
      ].filter(Boolean));

      if (from) gsap.set(from, { zIndex: 2 });
      if (to) gsap.set(to, { zIndex: 3, autoAlpha: 1 });

      animatingRef.current = true;
      activeRef.current = target;
      setActive(target);

      const finish = () => {
        if (from) gsap.set(from, { autoAlpha: 0, zIndex: 1 });
        animatingRef.current = false;
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending != null && pending !== activeRef.current) {
          transition(pending);
        }
      };

      if (reduced) {
        if (to) {
          gsap.set(to.querySelectorAll("[data-sk-type]"), {
            autoAlpha: 1,
            clearProps: "clipPath",
          });
          gsap.set(inLines, { yPercent: 0, autoAlpha: 1 });
          gsap.set(inItems, { y: 0, autoAlpha: 1 });
        }
        const tl = gsap.timeline({ onComplete: finish });
        if (from) tl.to(from, { autoAlpha: 0, duration: 0.2 }, 0);
        if (to) {
          tl.fromTo(
            to,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.24, ease: "power1.out" },
            0.12
          );
        }
        return;
      }

      const outY = dir > 0 ? -110 : 110;
      const inY = dir > 0 ? 110 : -110;
      const outItemY = dir > 0 ? -16 : 16;
      const inItemY = dir > 0 ? 20 : -20;

      if (to && enabledRef.current) {
        gsap.set(to.querySelectorAll("[data-sk-type]"), {
          autoAlpha: 0,
          clipPath: "inset(-20% 100% -20% -5%)",
        });
      }
      if (to) {
        gsap.set(inLines, { yPercent: inY, autoAlpha: 0 });
        gsap.set(inItems, { y: inItemY, autoAlpha: 0 });
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: finish,
      });
      if (from) {
        tl.to(
          outLines,
          { yPercent: outY, autoAlpha: 0, duration: 0.32, stagger: 0.03 },
          0
        ).to(
          outItems,
          { y: outItemY, autoAlpha: 0, duration: 0.26, stagger: 0.01 },
          0.02
        );
      }
      if (to) {
        tl.to(
          inLines,
          { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.045 },
          0.14
        ).to(
          inItems,
          { y: 0, autoAlpha: 1, duration: 0.36, stagger: 0.01 },
          0.2
        );
        if (from) tl.set(from, { autoAlpha: 0 }, 0.82);
      }

      if (inViewRef.current) playSkillAct(target);
    },
    [killSkillAct, playSkillAct, lowerCount]
  );

  /* initial stacked state: fixed user visible, lower slides hidden */
  useLayoutEffect(() => {
    const user = userRef.current;
    if (user) {
      gsap.set(user, { autoAlpha: 1 });
      gsap.set(user.querySelectorAll(".sk-line"), {
        yPercent: 0,
        autoAlpha: 1,
      });
      gsap.set(user.querySelectorAll("[data-sk-item]"), {
        y: 0,
        autoAlpha: 1,
      });
    }

    slidesRef.current.forEach((slide) => {
      if (!slide) return;
      gsap.set(slide.querySelectorAll(".sk-line"), {
        yPercent: 0,
        autoAlpha: 1,
      });
      gsap.set(slide.querySelectorAll("[data-sk-item]"), {
        y: 0,
        autoAlpha: 1,
      });
      gsap.set(slide, { autoAlpha: 0, zIndex: 1 });
    });

    if (topLiveRef.current) {
      gsap.set(topLiveRef.current, { opacity: 0, y: 30 });
    }
    if (exploreRef.current) {
      gsap.set(exploreRef.current, {
        opacity: 0,
        y: 26,
        visibility: "hidden",
      });
      exploreRef.current.setAttribute("aria-hidden", "true");
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (enabledRef.current && !reduced) {
      const all = [user, ...slidesRef.current].filter(Boolean);
      all.forEach((slide) => {
        gsap.set(slide.querySelectorAll("[data-sk-type]"), {
          autoAlpha: 0,
          clipPath: "inset(-20% 100% -20% -5%)",
        });
      });
    }
  }, []);

  /* quick setters: all scroll-linked motion is transform/opacity only */
  useLayoutEffect(() => {
    const user = userRef.current;
    const arrow = arrowRef.current;
    const topLive = topLiveRef.current;
    const explore = exploreRef.current;
    const live = liveSlideRef.current;
    if (!user || !topLive || !explore || !live) return;

    /* promote the layers that change every frame, nothing else */
    gsap.set([user, topLive, explore, live, arrow].filter(Boolean), {
      force3D: true,
    });

    settersRef.current = {
      userOpacity: gsap.quickSetter(user, "opacity"),
      userY: gsap.quickSetter(user, "y", "px"),
      liveTopOpacity: gsap.quickSetter(topLive, "opacity"),
      liveTopY: gsap.quickSetter(topLive, "y", "px"),
      liveLowerOpacity: gsap.quickSetter(live, "opacity"),
      exploreOpacity: gsap.quickSetter(explore, "opacity"),
      exploreY: gsap.quickSetter(explore, "y", "px"),
      arrowOpacity: arrow ? gsap.quickSetter(arrow, "opacity") : null,
    };

    return () => {
      settersRef.current = null;
    };
  }, [liveGlobalIndex, total]);

  /* unmount: kill the stop timeline, clear overlays, release its cursor */
  useEffect(
    () => () => {
      const tl = actRef.current;
      actRef.current = null;
      if (tl) tl.kill();
      const scene = sceneRef.current;
      if (scene) clearOverlays(scene);
      const els = swarm.els(SKILL_STOP_AGENTS);
      if (els.length) {
        gsap.killTweensOf(els);
        gsap.set(els, { opacity: 0, visibility: "hidden" });
      }
      if (swarm.park) swarm.park(SKILL_STOP_AGENTS);
    },
    []
  );

  /*
    The global body sets overflow-x: hidden, which makes body a scroll
    container and can stop this sticky stage from pinning. clip keeps the
    same horizontal clipping without creating a scroll container.
  */
  useEffect(() => {
    const body = document.body;
    const previous = body.style.overflowX;
    if (window.getComputedStyle(body).overflowX === "hidden") {
      body.style.overflowX = "clip";
    }
    return () => {
      body.style.overflowX = previous;
    };
  }, []);

  /*
    Measure once, then cache. The scroll loop never reads layout, so it never
    forces a reflow while the user is scrolling.
  */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const scene = sceneRef.current;
      const fixed = userRef.current?.parentElement;
      const lower = scene?.querySelector(".sk-lower");
      const fixedRect = fixed ? fixed.getBoundingClientRect() : null;
      const lowerRect = lower ? lower.getBoundingClientRect() : null;
      const liftOffset =
        fixedRect && lowerRect ? lowerRect.top - fixedRect.top : 0;

      /* the top live layer has to match the real height of the user slot */
      if (scene && fixedRect) {
        scene.style.setProperty("--sk-top-h", `${fixedRect.height}px`);
      }

      metricsRef.current = {
        vh,
        wrapTop: rect.top + (window.scrollY || window.pageYOffset || 0),
        height: rect.height,
        travel: Math.max(1, rect.height - vh),
        liftOffset,
      };
    };

    measure();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (ro) {
      ro.observe(wrap);
      [sceneRef.current, userRef.current?.parentElement, sceneRef.current?.querySelector(".sk-lower")]
        .filter(Boolean)
        .forEach((node) => ro.observe(node));
    }

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) measure();
            },
            { rootMargin: "25% 0px" }
          )
        : null;
    if (io) io.observe(wrap);

    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    ScrollTrigger.addEventListener("refresh", measure);

    let alive = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {
          if (alive) measure();
        })
        .catch(() => {});
    }

    return () => {
      alive = false;
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      ScrollTrigger.removeEventListener("refresh", measure);
    };
  }, [total]);

  /*
    One continuously interpolated progress value drives the whole story.
    activeIndex changes the lower slot, liveLift stacks live over the user set
    and restart reveals "Explore the creation" below it. Everything is
    reversible because it is derived from the same lerped value.
  */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const clamp01 = (value) => Math.min(1, Math.max(0, value));
    const smooth = (value) => {
      const t = clamp01(value);
      return t * t * (3 - 2 * t);
    };

    let progress = 0;

    /*
      Runs on the same ticker as Lenis and ScrollTrigger, so the section never
      lags a frame behind the smoothed scroll. It only reads window.scrollY
      (no layout reads) and only talks to GSAP through quickSetters.
    */
    const tick = () => {
      if (document.hidden) return;
      const m = metricsRef.current;
      if (!m.vh) return;
      const vh = m.vh;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const targetProgress = clamp01((scrollY - m.wrapTop) / m.travel);
      const entry = clamp01((scrollY - (m.wrapTop - vh)) / (vh * 0.6));

      progress += (targetProgress - progress) * 0.12;
      if (Math.abs(targetProgress - progress) < 0.0004) {
        progress = targetProgress;
      }

      const lift = smooth((progress - LIFT_START) / LIFT_SPAN);
      const restart = smooth((progress - RESTART_START) / RESTART_SPAN);
      const inView =
        scrollY + vh > m.wrapTop && scrollY < m.wrapTop + m.height;

      /* play the first stop act on entry, clean it up on exit */
      if (!inView) {
        if (inViewRef.current) {
          inViewRef.current = false;
          initialActRef.current = false;
          killSkillAct();
        }
      } else {
        if (!inViewRef.current) {
          inViewRef.current = true;
          initialActRef.current = false;
        }
        if (entry > 0.55 && !initialActRef.current && !actRef.current) {
          initialActRef.current = true;
          playSkillAct(activeRef.current);
        }
        if (lift > 0.02 && actRef.current) killSkillAct();
      }

      let next = 0;
      /* Pick the stop from the target scroll position, not the lerped value,
         so a fast jump goes straight to its destination instead of playing
         every intermediate set one after another. */
      if (targetProgress > LOWER_START) {
        const t = clamp01((targetProgress - LOWER_START) / LOWER_SPAN);
        next = Math.min(lowerCount, 1 + Math.floor(t * lowerCount));
      }
      if (next === activeRef.current) pendingRef.current = null;
      else goTo(next);

      const s = settersRef.current;
      if (s) {
        /* the user set fades completely away as the live set takes the top */
        s.userOpacity(1 - clamp01(lift * 1.08));
        s.userY(-lift * 8);

        s.liveTopOpacity(clamp01(lift * 1.55));
        s.liveTopY((1 - lift) * m.liftOffset);

        /* the lower live copy fades early, the rising copy takes over */
        s.liveLowerOpacity(clamp01(1 - lift * 3.2));

        s.exploreOpacity(restart);
        s.exploreY((1 - restart) * 24);

        /* arrow leaves with the lift and returns as explore appears */
        if (s.arrowOpacity) {
          s.arrowOpacity(clamp01(1 - lift + restart));
        }
      }

      const exploreVisible = restart > 0.015;
      if (exploreVisible !== exploreVisibleRef.current) {
        exploreVisibleRef.current = exploreVisible;
        const explore = exploreRef.current;
        if (explore) {
          explore.style.visibility = exploreVisible ? "visible" : "hidden";
          explore.style.pointerEvents = exploreVisible ? "auto" : "none";
          if (exploreVisible) explore.removeAttribute("aria-hidden");
          else explore.setAttribute("aria-hidden", "true");
        }
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [goTo, killSkillAct, playSkillAct, lowerCount]);

  return (
    <div
      ref={wrapRef}
      className="sk-wrap"
      style={{ "--sk-stops": total }}
    >
      <style>{SKILLS_STYLE}</style>

      <div className="sk-stage">
        <div className="sk-inner">
          {children && <div className="sk-head-slot">{children}</div>}

          <div className="sk-scene" ref={sceneRef}>
            <div className="sk-fixed">
              <StopSlide
                stop={fixedStop}
                index={0}
                active={active}
                fixed
                slideRef={(node) => {
                  userRef.current = node;
                }}
              />
            </div>

            <div className="sk-arrow" aria-hidden="true" ref={arrowRef}>
              <DownArrow />
            </div>

            <div className="sk-lower">
              {lowerStops.map((stop, i) => {
                const globalIndex = i + 1;
                return (
                  <StopSlide
                    key={stop.key}
                    stop={stop}
                    index={globalIndex}
                    active={active}
                    slideRef={(node) => {
                      slidesRef.current[globalIndex] = node;
                      if (globalIndex === liveGlobalIndex) {
                        liveSlideRef.current = node;
                      }
                    }}
                  />
                );
              })}

              <ExploreSlide stop={exploreStop} exploreRef={exploreRef} />
            </div>

            <LiveTop
              stop={stops[liveGlobalIndex]}
              index={liveGlobalIndex}
              topLiveRef={topLiveRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
