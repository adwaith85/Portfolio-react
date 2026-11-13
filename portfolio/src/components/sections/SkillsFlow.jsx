import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
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
import Logo from "../ui/Logo";

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
  "shadcn/ui": { name: "shadcn/ui", abbr: "SC" },
  SASS: { name: "SASS", slug: "sass" },
  Dio: { name: "Dio", abbr: "DI" },
  Provider: { name: "Provider", abbr: "PV" },
  Riverpod: { name: "Riverpod", abbr: "RP" },
  Bloc: { name: "Bloc", abbr: "BL" },
  GraphQL: { name: "GraphQL", slug: "graphql" },
  "Fetch API": { name: "Fetch API", abbr: "FE" },
  CORS: { name: "CORS", abbr: "CO" },
  OAuth: { name: "OAuth", abbr: "OA" },
  Swagger: { name: "Swagger", slug: "swagger" },
  WebSockets: { name: "WebSockets", abbr: "WS" },
  "React Query": { name: "React Query", abbr: "RQ" },
  Dotenv: { name: "Dotenv", abbr: "EN" },
  Multer: { name: "Multer", abbr: "MU" },
  bcrypt: { name: "bcrypt", abbr: "BC" },
  "Cookie Parser": { name: "Cookie Parser", abbr: "CP" },
  Helmet: { name: "Helmet", abbr: "HL" },
  "Joi / Zod": { name: "Joi / Zod", abbr: "JZ" },
  Nodemailer: { name: "Nodemailer", abbr: "NM" },
  Passport: { name: "Passport", abbr: "PP" },
  Redis: { name: "Redis", slug: "redis" },
  Supabase: { name: "Supabase", slug: "supabase" },
  "MongoDB Atlas": { name: "MongoDB Atlas", slug: "mongodb" },
  Prisma: { name: "Prisma", slug: "prisma" },
  SQLite: { name: "SQLite", slug: "sqlite" },
  Hive: { name: "Hive", abbr: "HV" },
  SharedPreferences: { name: "SharedPreferences", abbr: "SP" },
  Render: { name: "Render", abbr: "RN" },
  Heroku: { name: "Heroku", slug: "heroku" },
  Cloudinary: { name: "Cloudinary", slug: "cloudinary" },
  "Firebase Hosting": { name: "Firebase Hosting", slug: "firebase" },
  "Play Store": { name: "Play Store", abbr: "PL" },
  "App Store": { name: "App Store", abbr: "AP" },
  Linux: { name: "Linux", slug: "linux" },
  "CI/CD": { name: "CI/CD", abbr: "CI" },
};

export const techItem = (name) =>
  byName[name] ||
  extraItems[name] || { name, abbr: extraAbbr[name] || name.slice(0, 2) };

/* cursor writes the words of an element, with a fast 0.12s travel */
export function typeFast(tl, el, ag, at, perLetter = 0.009) {
  if (!el) return at;
  const words = [...el.querySelectorAll("[data-w]")];
  if (!words.length) {
    tl.set(el, { autoAlpha: 1 }, at);
    return at + 0.04;
  }

  tl.add(
    swarm.moveTo(ag, words[0], {
      duration: 0.12,
      offset: { x: 0, y: 0.55 },
    }),
    at
  );
  tl.add(() => swarm.click(ag), at + 0.12);

  let t = at + 0.14;
  words.forEach((w) => {
    const len = Math.max(2, (w.textContent || "").length);
    const d = len * perLetter;
    tl.add(typeReveal(w, { duration: d, agent: ag }), t);
    t += d + 0.02;
  });
  tl.set([el, ...words], { autoAlpha: 1, clearProps: "clipPath" }, t);
  return t;
}

/* one cursor writes a whole element (used by the skills stop timeline) */
function typeEl(tl, el, ag, at, perLetter = 0.009) {
  if (!el) return at;
  const len = Math.max(4, (el.textContent || "").length);
  const duration = Math.min(0.55, Math.max(0.12, len * perLetter));

  tl.add(
    swarm.moveTo(ag, el, { duration: 0.12, offset: { x: 0, y: 0.55 } }),
    at
  );
  tl.add(() => swarm.click(ag), at + 0.12);
  tl.add(typeReveal(el, { duration, agent: ag }), at + 0.14);
  tl.set(el, { autoAlpha: 1, clearProps: "clipPath" }, at + 0.14 + duration);
  return at + 0.14 + duration;
}

/* Skills stop lease: disjoint from the heading lease [17, 18] in Experience. */
const SKILL_STOP_AGENTS = [19];
const SKILL_SPEED = 3.3;

const MEANING = {
  user: {
    h1: "Opens the app",
    desc: "A person lands on the URL and the request begins.",
    why: "Every product starts with a person trying to do something.",
    where: "A browser or a phone.",
    when: "The moment someone opens the app or clicks.",
  },
  client: {
    h1: "Frontend",
    desc: "The screens people see and use.",
    why: "Turns data into screens people can actually use.",
    where: "In the browser or on the mobile device.",
    when: "On every page load, tap and interaction.",
  },
  api: {
    h1: "API Layer",
    desc: "Requests travel out and responses travel back.",
    why: "Lets frontend and backend talk safely in a shared format.",
    where: "Between client and server over HTTP or sockets.",
    when: "Every time the client asks for or sends data.",
  },
  server: {
    h1: "Backend",
    desc: "Logic, validation and authentication live here.",
    why: "Holds business logic, validation and authentication.",
    where: "A Node.js server running Express.",
    when: "After a request arrives, before data is read or written.",
  },
  data: {
    h1: "Database",
    desc: "Everything the app remembers, stored and queried.",
    why: "Stores information permanently so it survives restarts.",
    where: "MongoDB or MySQL, queried by the server.",
    when: "Whenever the server needs to save or fetch records.",
  },
  cloud: {
    h1: "Deployment",
    desc: "Built, shipped and served from the cloud.",
    why: "Puts the app online so real users can reach it.",
    where: "Hosting platforms and containers.",
    when: "After the code is built, tested and shipped.",
  },
  live: {
    h1: "Live URL",
    desc: "The code is live and reachable by anyone with the link.",
    why: "The finish line, where work becomes a real product.",
    where: "A public URL anyone can open.",
    when: "After deployment, and the loop restarts with the next user.",
  },
};

const SKILLS_STYLE = `
.sk-wrap {
  position: relative;
  width: 100%;
  height: calc(100vh + var(--sk-stops, 7) * 112vh);
  height: calc(100svh + var(--sk-stops, 7) * 120svh);
}

.sk-stage {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
}

.sk-inner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(8px, 1.5svh, 18px);
  width: 100%;
  max-width: 1100px;
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  padding: clamp(12px, 2svh, 26px) clamp(14px, 3vw, 32px);
}

.sk-head-slot {
  flex: 0 0 auto;
  min-width: 0;
}

.sk-head-slot > header { margin: 0; }

.sk-card {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  max-height: min(70vh, 700px);
  max-height: min(70svh, 700px);
  margin: 0 auto;
  padding: clamp(16px, 2vw, 28px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: clamp(12px, 1.2vw, 18px);
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(214, 26, 41, 0.09), transparent 55%),
    linear-gradient(155deg, rgba(19, 18, 20, 0.97), rgba(9, 9, 10, 0.99));
  box-shadow:
    0 40px 90px -50px rgba(0, 0, 0, 0.95),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transform-origin: 50% 58%;
  will-change: transform, opacity;
}

.sk-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sk-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(0.52rem, 0.72vw, 0.62rem);
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.sk-eyebrow::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--color-red);
  box-shadow: 0 0 8px rgba(214, 26, 41, 0.9);
}

.sk-counter {
  font-family: var(--font-display);
  font-size: clamp(0.66rem, 0.9vw, 0.8rem);
  letter-spacing: 0.14em;
  color: var(--color-ink);
  white-space: nowrap;
}
.sk-counter span { color: var(--color-muted); }

.sk-progress {
  position: relative;
  height: 1px;
  margin-top: clamp(6px, 1svh, 10px);
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}
.sk-progress-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--color-red-dark), var(--color-red));
  transform-origin: 0% 50%;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 0 10px rgba(214, 26, 41, 0.7);
}

.sk-viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  margin-top: clamp(8px, 1.6svh, 14px);
}

.sk-slide {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: clamp(16px, 2.6vw, 38px);
  visibility: hidden;
  opacity: 0;
}
.sk-slide:first-child {
  visibility: visible;
  opacity: 1;
}

.sk-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.sk-mask {
  display: block;
  overflow: hidden;
  padding-top: 0.04em;
  padding-bottom: 0.06em;
}
.sk-line {
  display: block;
  will-change: transform, opacity;
}
.sk-type { display: block; }
[data-sk-item] {
  will-change: transform, opacity;
}

.sk-stop-row { margin-bottom: clamp(4px, 0.8svh, 8px); }
.sk-stop-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(0.54rem, 0.8vw, 0.66rem);
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-red);
}
.sk-stop-label i {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--color-red);
  box-shadow: 0 0 10px rgba(214, 26, 41, 0.8);
}

.sk-h1 {
  font-size: clamp(1.9rem, 3.3vw, 3.2rem);
  line-height: 0.98;
  letter-spacing: -0.015em;
  color: var(--color-ink);
}

.sk-desc-row { margin-top: clamp(6px, 1.1svh, 12px); }
.sk-desc {
  max-width: 38ch;
  font-size: clamp(0.74rem, 0.9vw, 0.9rem);
  line-height: 1.55;
  color: var(--color-muted);
}

.sk-facts {
  display: grid;
  gap: clamp(3px, 0.65svh, 7px);
  margin-top: clamp(8px, 1.4svh, 14px);
}
.sk-fact {
  display: grid;
  grid-template-columns: 3.1rem minmax(0, 1fr);
  gap: 0.55rem;
  align-items: baseline;
}
.sk-fact dt {
  font-size: clamp(0.48rem, 0.6vw, 0.56rem);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-red);
}
.sk-fact dd {
  font-size: clamp(0.64rem, 0.76vw, 0.74rem);
  line-height: 1.45;
  color: var(--color-muted);
}

.sk-right {
  min-width: 0;
  display: flex;
  align-items: center;
  max-height: 100%;
}

.sk-skills {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(4px, 0.6svh, 7px) clamp(5px, 0.55vw, 8px);
  width: 100%;
  align-content: center;
}

.sk-item {
  display: flex;
  align-items: center;
  gap: clamp(5px, 0.55vw, 8px);
  min-width: 0;
  padding: clamp(5px, 0.75svh, 8px) clamp(6px, 0.6vw, 9px);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color 0.24s ease,
    background-color 0.24s ease,
    box-shadow 0.24s ease;
}
.sk-item:hover {
  border-color: rgba(214, 26, 41, 0.55);
  background: rgba(214, 26, 41, 0.08);
  box-shadow: 0 0 22px -8px rgba(214, 26, 41, 0.65);
}
.sk-logo {
  width: clamp(13px, 1.05vw, 17px);
  height: clamp(13px, 1.05vw, 17px);
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}
.sk-item:hover .sk-logo { transform: translateY(-2px); }
.sk-item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(0.49rem, 0.64vw, 0.59rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
  transition: color 0.24s ease;
}
.sk-item:hover .sk-item-name { color: var(--color-ink); }

.sk-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 1.4svh, 14px);
  width: 100%;
}
.sk-user-glyph {
  display: grid;
  place-items: center;
  width: clamp(58px, 7vw, 92px);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid rgba(214, 26, 41, 0.35);
  background: radial-gradient(circle, rgba(214, 26, 41, 0.16), transparent 70%);
  color: var(--color-red);
  box-shadow: 0 0 50px -18px rgba(214, 26, 41, 0.65);
}
.sk-user-glyph svg {
  width: 46%;
  height: 46%;
}
.sk-user-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(7px, 1.1svh, 11px);
  width: 100%;
  min-width: 0;
}
.sk-user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(4px, 0.7vw, 8px);
  justify-content: center;
}
.sk-user-tag {
  padding: 0.3rem 0.62rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  font-size: clamp(0.48rem, 0.68vw, 0.57rem);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}
.sk-skills--user {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
}

.sk-live {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(8px, 1.4svh, 14px);
  width: 100%;
  padding: clamp(16px, 3vw, 32px);
  border: 1px solid rgba(214, 26, 41, 0.35);
  border-radius: clamp(12px, 1.2vw, 18px);
  background: radial-gradient(
    120% 100% at 50% 0%,
    rgba(214, 26, 41, 0.16),
    rgba(9, 9, 10, 0) 70%
  );
}
.sk-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: clamp(0.54rem, 0.78vw, 0.64rem);
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-red);
}
.sk-live-pulse {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-red);
  box-shadow:
    0 0 0 4px rgba(214, 26, 41, 0.16),
    0 0 16px rgba(214, 26, 41, 0.8);
  animation: skLivePulse 2.4s ease-in-out infinite;
}
@keyframes skLivePulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
.sk-live-note {
  max-width: 32ch;
  font-size: clamp(0.8rem, 1vw, 0.96rem);
  line-height: 1.55;
  color: var(--color-ink);
}
.sk-live-note span { color: var(--color-red); }

@media (max-width: 1023px) {
  .sk-card {
    max-height: none;
    padding: clamp(14px, 3vw, 22px);
    border-radius: 14px;
  }
  .sk-viewport { margin-top: clamp(7px, 1.4svh, 12px); }
  .sk-slide {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    align-items: start;
    gap: clamp(8px, 1.6svh, 14px);
  }
  .sk-left { padding-top: 0; }
  .sk-h1 { font-size: clamp(1.5rem, 5.2vw, 2.2rem); }
  .sk-desc-row { margin-top: clamp(4px, 0.9svh, 8px); }
  .sk-desc {
    max-width: none;
    font-size: clamp(0.7rem, 2vw, 0.86rem);
    line-height: 1.45;
  }
  .sk-facts {
    gap: 4px;
    margin-top: 7px;
  }
  .sk-fact {
    grid-template-columns: 2.8rem minmax(0, 1fr);
    gap: 0.45rem;
  }
  .sk-fact dt { font-size: clamp(0.46rem, 1.4vw, 0.54rem); }
  .sk-fact dd {
    font-size: clamp(0.6rem, 1.9vw, 0.72rem);
    line-height: 1.38;
  }
  .sk-right {
    align-items: flex-start;
    align-self: stretch;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .sk-right::-webkit-scrollbar { display: none; }
  .sk-skills {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
  }
  .sk-item { padding: 5px 6px; }
  .sk-logo { width: 14px; height: 14px; }
  .sk-item-name { font-size: clamp(0.48rem, 1.5vw, 0.58rem); }
  .sk-user {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 7px;
  }
  .sk-user-glyph {
    width: clamp(48px, 9vw, 64px);
    flex-shrink: 0;
  }
  .sk-user-body { align-items: center; }
  .sk-user-tags { justify-content: center; }
  .sk-live { padding: clamp(14px, 4vw, 26px); }
}

@media (min-width: 560px) and (max-width: 1023px) {
  .sk-skills { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sk-skills--user { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 1023px) and (max-height: 560px) {
  .sk-stop-row { margin-bottom: 3px; }
  .sk-h1 { font-size: clamp(1.2rem, 4vw, 1.6rem); }
  .sk-desc-row { margin-top: 3px; }
  .sk-desc { font-size: 0.64rem; line-height: 1.35; }
  .sk-facts { gap: 2px; margin-top: 4px; }
  .sk-fact {
    grid-template-columns: 2.4rem minmax(0, 1fr);
    gap: 0.35rem;
  }
  .sk-fact dt { font-size: 0.42rem; }
  .sk-fact dd { font-size: 0.54rem; line-height: 1.3; }
  .sk-slide { gap: 6px; }
  .sk-item { padding: 4px 5px; }
  .sk-logo { width: 12px; height: 12px; }
  .sk-item-name { font-size: 0.44rem; }
}

@media (max-height: 700px) and (min-width: 1024px) {
  .sk-inner { gap: 8px; padding: 12px clamp(14px, 3vw, 32px); }
  .sk-h1 { font-size: clamp(1.5rem, 2.8vw, 2.2rem); }
  .sk-desc { font-size: clamp(0.68rem, 0.82vw, 0.8rem); }
  .sk-fact dd { font-size: clamp(0.6rem, 0.7vw, 0.68rem); line-height: 1.35; }
  .sk-facts { gap: 3px; margin-top: 6px; }
  .sk-item { padding: 4px 6px; }
}

@media (prefers-reduced-motion: reduce) {
  .sk-item,
  .sk-logo,
  .sk-progress-fill { transition: none; }
  .sk-live-pulse { animation: none; }
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
          <li key={name} data-sk-item className="sk-item group/chip">
            <Logo
              item={item}
              className="sk-logo"
              badgeClass="text-[0.38rem]"
            />
            <span className="sk-item-name">{name}</span>
          </li>
        );
      })}
    </ul>
  );
}

function StopSlide({ stop, index, active, slideRef }) {
  const facts = [
    ["Why", stop.why],
    ["Where", stop.where],
    ["When", stop.when],
  ];

  return (
    <div
      ref={slideRef}
      className="sk-slide"
      aria-hidden={active !== index}
    >
      <div className="sk-left">
        <MaskLine wrapClassName="sk-stop-row">
          <span className="sk-stop-label">
            <i aria-hidden="true" />
            {stop.title}
          </span>
        </MaskLine>
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

        <dl className="sk-facts">
          {facts.map(([label, text]) => (
            <div key={label} data-sk-item className="sk-fact">
              <dt>{label}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="sk-right">
        {stop.kind === "user" && (
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
                      <li key={name} data-sk-item className="sk-item group/chip">
                        <Logo
                          item={item}
                          className="sk-logo"
                          badgeClass="text-[0.38rem]"
                        />
                        <span className="sk-item-name">{name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {stop.kind === "live" && (
          <div className="sk-live" data-sk-item>
            <p className="sk-live-badge">
              <span className="sk-live-pulse" aria-hidden="true" />
              {stop.label}
            </p>
            <p className="sk-live-note">
              The build is <span>live</span> and serving traffic right now.
            </p>
          </div>
        )}

        {stop.kind === "skills" && <SkillGrid names={stop.icons} />}
      </div>
    </div>
  );
}

export default function SkillsFlow({
  flow = [],
  returnLabel = "LIVE URL",
  children,
}) {
  const stops = [
    ...flow.map((node) => ({
      key: node.key,
      kind: node.key === "user" ? "user" : "skills",
      title: node.title,
      icons: node.icons || [],
      h1: MEANING[node.key]?.h1 || node.caption || node.title,
      desc: MEANING[node.key]?.desc || node.caption || "",
      why: MEANING[node.key]?.why || "",
      where: MEANING[node.key]?.where || "",
      when: MEANING[node.key]?.when || "",
    })),
    {
      key: "live",
      kind: "live",
      title: "LIVE",
      icons: [],
      label: returnLabel,
      h1: MEANING.live.h1,
      desc: MEANING.live.desc,
      why: MEANING.live.why,
      where: MEANING.live.where,
      when: MEANING.live.when,
    },
  ];
  const total = stops.length;

  const wrapRef = useRef(null);
  const cardRef = useRef(null);
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

  useEffect(() => {
    enabledRef.current = agentsEnabled;
  }, [agentsEnabled]);

  /* stop the current stop timeline, finalize shown text, hide its cursors */
  const killSkillAct = useCallback((unmount = false) => {
    const tl = actRef.current;
    actRef.current = null;
    if (tl) tl.kill();

    const card = cardRef.current;
    if (card) clearOverlays(card);

    slidesRef.current.forEach((slide, i) => {
      if (!slide) return;
      const spans = slide.querySelectorAll("[data-sk-type]");
      if (!spans.length) return;
      if (!enabledRef.current || (!unmount && i === activeRef.current)) {
        gsap.set(spans, { autoAlpha: 1, clearProps: "clipPath" });
      } else {
        gsap.set(spans, {
          autoAlpha: 0,
          clipPath: "inset(-20% 100% -20% -5%)",
        });
      }
    });

    const els = swarm.els(SKILL_STOP_AGENTS);
    if (els.length) {
      gsap.killTweensOf(els);
      gsap.set(els, { opacity: 0, visibility: "hidden" });
    }
  }, []);

  /* if the cursor swarm turns off, reveal everything and hide the cursor */
  useEffect(() => {
    if (!agentsEnabled) killSkillAct(true);
  }, [agentsEnabled, killSkillAct]);

  /* one fast cursor act per active stop; it always ends hidden */
  const playSkillAct = useCallback((index) => {
    if (!enabledRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current;
    const slide = slidesRef.current[index];
    if (!card || !slide) return;

    const previous = actRef.current;
    actRef.current = null;
    if (previous) previous.kill();
    clearOverlays(card);

    const overlays = [];
    const mk = () => {
      const overlay = makeOverlay(card);
      overlays.push(overlay);
      return overlay;
    };
    const agents = SKILL_STOP_AGENTS;
    const A = agents[0];
    const label = slide.querySelector(".sk-stop-label");
    const h1 = slide.querySelector(".sk-h1 [data-sk-type]");
    const desc = slide.querySelector(".sk-desc [data-sk-type]");
    const items = [...slide.querySelectorAll("[data-sk-item]")].slice(0, 3);

    const tl = gsap.timeline();
    actRef.current = tl;
    tl.timeScale(SKILL_SPEED);

    cursorIntro(tl, agents, 0);

    const spans = [h1, desc].filter(Boolean);
    if (spans.length) {
      tl.set(spans, { autoAlpha: 0, clipPath: "inset(-20% 100% -20% -5%)" }, 0);
    }

    const t = dragBox(tl, mk(), A, label, card, 0.02, {
      tag: "span.label",
      dur: 0.1,
      pad: 2,
    });

    let th = dragBox(tl, mk(), A, h1, card, t + 0.01, {
      tag: "h2.headline",
      dur: 0.11,
      pad: 3,
    });
    th = typeEl(tl, h1, A, th + 0.01, 0.009);

    let td = dragBox(tl, mk(), A, desc, card, th + 0.01, {
      tag: "p.desc",
      dur: 0.1,
      pad: 2,
    });
    td = typeEl(tl, desc, A, td + 0.01, 0.009);

    let end = Math.max(th, td);
    const itemAt = Math.max(0.2, td - 0.08);
    items.forEach((item, k) => {
      const at = itemAt + k * 0.03;
      tl.add(
        swarm.moveTo(A, item, {
          duration: 0.12,
          offset: { x: 0.5, y: 0.5 },
        }),
        at
      );
      tl.add(() => swarm.click(A), at + 0.12);
      end = Math.max(end, at + 0.13);
    });

    if (spans.length) {
      tl.set(spans, { autoAlpha: 1, clearProps: "clipPath" }, end + 0.01);
    }

    const els = swarm.els(agents);
    if (els.length) {
      tl.to(els, { opacity: 0, duration: 0.16, ease: "power2.out" }, end + 0.06);
      tl.add(() => {
        agents.forEach((i) => swarm.hide(i));
        overlays.forEach(({ o }) => o.remove());
        if (actRef.current === tl) actRef.current = null;
      }, end + 0.23);
    } else {
      tl.add(() => {
        overlays.forEach(({ o }) => o.remove());
        if (actRef.current === tl) actRef.current = null;
      }, end + 0.06);
    }
    return tl;
  }, []);

  const goTo = useCallback(function transition(target) {
    const slides = slidesRef.current;
    if (
      !slides.length ||
      target < 0 ||
      target >= slides.length ||
      target === activeRef.current
    ) {
      return;
    }
    if (animatingRef.current) {
      pendingRef.current = target;
      return;
    }

    /* kill the previous stop's cursor act before the next one starts */
    killSkillAct();
    initialActRef.current = true;

    const from = slides[activeRef.current];
    const to = slides[target];
    if (!from || !to) return;

    const dir = target > activeRef.current ? 1 : -1;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const outLines = from.querySelectorAll(".sk-line");
    const outItems = from.querySelectorAll("[data-sk-item]");
    const inLines = to.querySelectorAll(".sk-line");
    const inItems = to.querySelectorAll("[data-sk-item]");

    gsap.killTweensOf([
      ...outLines,
      ...outItems,
      ...inLines,
      ...inItems,
      from,
      to,
    ]);
    gsap.set(from, { zIndex: 2 });
    gsap.set(to, { zIndex: 3, autoAlpha: 1 });

    animatingRef.current = true;
    activeRef.current = target;
    setActive(target);

    const finish = () => {
      gsap.set(from, { autoAlpha: 0, zIndex: 1 });
      animatingRef.current = false;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending != null && pending !== activeRef.current) {
        transition(pending);
      }
    };

    if (reduced) {
      gsap.set(to.querySelectorAll("[data-sk-type]"), {
        autoAlpha: 1,
        clearProps: "clipPath",
      });
      gsap.set(inLines, { yPercent: 0, autoAlpha: 1 });
      gsap.set(inItems, { y: 0, autoAlpha: 1 });
      gsap
        .timeline({ onComplete: finish })
        .to(from, { autoAlpha: 0, duration: 0.22, ease: "power1.out" }, 0)
        .fromTo(
          to,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.26, ease: "power1.out" },
          0.16
        );
      return;
    }

    const outY = dir > 0 ? -110 : 110;
    const inY = dir > 0 ? 110 : -110;
    const outItemY = dir > 0 ? -16 : 16;
    const inItemY = dir > 0 ? 20 : -20;

    if (enabledRef.current) {
      gsap.set(to.querySelectorAll("[data-sk-type]"), {
        autoAlpha: 0,
        clipPath: "inset(-20% 100% -20% -5%)",
      });
    }

    gsap.set(inLines, { yPercent: inY, autoAlpha: 0 });
    gsap.set(inItems, { y: inItemY, autoAlpha: 0 });

    gsap
      .timeline({
        defaults: { ease: "power3.out" },
        onComplete: finish,
      })
      .to(
        outLines,
        { yPercent: outY, autoAlpha: 0, duration: 0.38, stagger: 0.035 },
        0
      )
      .to(
        outItems,
        { y: outItemY, autoAlpha: 0, duration: 0.3, stagger: 0.012 },
        0.02
      )
      .to(
        inLines,
        { yPercent: 0, autoAlpha: 1, duration: 0.55, stagger: 0.05 },
        0.18
      )
      .to(
        inItems,
        { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.01 },
        0.24
      )
      .set(from, { autoAlpha: 0 }, 0.9);

    /* the stop's cursor act is driven by the active stop change */
    if (inViewRef.current) playSkillAct(target);
  }, [killSkillAct, playSkillAct]);

  /* initial stacked state: only the first stop is visible */
  useLayoutEffect(() => {
    const slides = slidesRef.current.filter(Boolean);
    slides.forEach((slide, i) => {
      gsap.set(slide.querySelectorAll(".sk-line"), {
        yPercent: 0,
        autoAlpha: 1,
      });
      gsap.set(slide.querySelectorAll("[data-sk-item]"), {
        y: 0,
        autoAlpha: 1,
      });
      gsap.set(slide, { autoAlpha: i === 0 ? 1 : 0, zIndex: i === 0 ? 2 : 1 });
    });

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (enabledRef.current && !reduced) {
      slides.forEach((slide) => {
        gsap.set(slide.querySelectorAll("[data-sk-type]"), {
          autoAlpha: 0,
          clipPath: "inset(-20% 100% -20% -5%)",
        });
      });
    }
  }, []);

  /* unmount: kill the stop timeline, clear overlays, hide its cursor */
  useEffect(
    () => () => {
      const tl = actRef.current;
      actRef.current = null;
      if (tl) tl.kill();
      const card = cardRef.current;
      if (card) clearOverlays(card);
      const els = swarm.els(SKILL_STOP_AGENTS);
      if (els.length) {
        gsap.killTweensOf(els);
        gsap.set(els, { opacity: 0, visibility: "hidden" });
      }
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
    Keep one continuously interpolated progress value for the whole stage.
    The raw scroll position is the target; the loop eases toward it, so the
    card growth and stop changes stay smooth instead of jumping per event.
  */
  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return undefined;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const clamp = (value) => Math.min(1, Math.max(0, value));
    let raf = 0;
    let progress = 0;
    let open = 0;

    const loop = () => {
      const vh = window.innerHeight || 1;
      const rect = wrap.getBoundingClientRect();
      const travel = Math.max(1, wrap.offsetHeight - vh);
      const targetProgress = clamp(-rect.top / travel);
      const targetOpen = reduced ? 1 : clamp((vh - rect.top) / (vh * 0.56));

      progress += (targetProgress - progress) * 0.08;
      open += (targetOpen - open) * 0.12;
      if (Math.abs(targetProgress - progress) < 0.0004) {
        progress = targetProgress;
      }
      if (Math.abs(targetOpen - open) < 0.0004) open = targetOpen;

      /* the pinned stage drives the cursor act: play on entry, hide on exit */
      const inView = rect.bottom > 0 && rect.top < vh;
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
        if (open > 0.5 && !initialActRef.current && !actRef.current) {
          initialActRef.current = true;
          playSkillAct(activeRef.current);
        }
      }

      const next = Math.min(
        total - 1,
        Math.floor(progress * total + 0.0001)
      );
      if (next === activeRef.current) pendingRef.current = null;
      else goTo(next);

      const eased = open * open * (3 - 2 * open);
      card.style.opacity = String(eased);
      card.style.transform = `scale(${(0.9 + eased * 0.1).toFixed(4)})`;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [goTo, killSkillAct, playSkillAct, total]);

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

          <article
            ref={cardRef}
            className="sk-card"
            aria-label="Skills path"
            style={{ opacity: 0, transform: "scale(0.9)" }}
          >
            <div className="sk-top">
              <p className="sk-eyebrow">Request path</p>
              <p className="sk-counter" aria-live="polite">
                {String(active + 1).padStart(2, "0")}{" "}
                <span>/ {String(total).padStart(2, "0")}</span>
              </p>
            </div>

            <div className="sk-progress" aria-hidden="true">
              <span
                className="sk-progress-fill"
                style={{ transform: `scaleX(${(active + 1) / total})` }}
              />
            </div>

            <div className="sk-viewport">
              {stops.map((stop, i) => (
                <StopSlide
                  key={stop.key}
                  stop={stop}
                  index={i}
                  active={active}
                  slideRef={(node) => {
                    slidesRef.current[i] = node;
                  }}
                />
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
