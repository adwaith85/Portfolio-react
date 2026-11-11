import gsap from "gsap";
import { stack } from "../../data/stack";
import { toolGroups } from "../../data/tools";
import { swarm } from "../cursors/swarmApi";
import { typeReveal } from "../../engine/buildKit";
import { cursorIntro, cursorOutro } from "../../engine/viewport";
import {
  BLUE,
  Words,
  makeOverlay,
  dragBox,
} from "../../engine/swarmBuild";
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
  Authentication: "AUTH",
  SQL: "SQL",
  "Tailwind CSS": "TW",
  "Express.js": "EX",
};

export const techItem = (name) =>
  byName[name] || { name, abbr: extraAbbr[name] || name.slice(0, 2) };

const NORMAL = { fill: "#121212", edge: "rgba(255,255,255,0.12)" };
const HOT = { fill: "#2a0a0f", edge: "rgba(214,26,41,0.5)" };

const FLOW_STYLE = `
@keyframes expDashFlow {
  to { stroke-dashoffset: -1; }
}
@keyframes expDashPulse {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes expNodeGlow {
  0%, 100% { opacity: .3; }
  50% { opacity: .8; }
}
@keyframes expSpokeShimmer {
  0%, 100% { opacity: .28; }
  50% { opacity: .85; }
}

.exp-flow-list { position: relative; }
.exp-flow-node { position: relative; min-width: 0; }
.exp-node-card {
  box-shadow: 0 18px 36px -20px rgba(0,0,0,.9);
  transition: box-shadow 300ms cubic-bezier(0.22,1,0.36,1), border-color 300ms ease;
}
.exp-node-glow {
  position: absolute;
  inset: -10px;
  pointer-events: none;
  border-radius: 8px;
  opacity: .3;
  background: radial-gradient(circle, rgb(var(--env-rgb) / .32), transparent 70%);
}
.exp-fan-item { pointer-events: auto; }
.exp-fan-arc {
  fill: none;
  stroke: rgb(var(--env-gold-rgb) / .25);
  stroke-width: 1;
}
.exp-spoke {
  background: rgb(var(--env-gold-rgb) / .32);
  transition: background-color 220ms ease, opacity 220ms ease;
}
.exp-spoke-dot {
  background: var(--color-red);
  box-shadow: 0 0 7px rgb(var(--env-rgb) / .9);
}
.exp-fan-icon {
  transition: transform 240ms cubic-bezier(0.22,1,0.36,1), opacity 240ms ease, border-color 200ms ease;
}
.exp-fan-name {
  font-size: .52rem;
  line-height: 1;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--color-ink);
  opacity: .88;
  pointer-events: none;
  font-weight: 600;
  transition: color 200ms ease, opacity 200ms ease;
}
.exp-fan-item:hover .exp-spoke {
  background: var(--color-red);
  opacity: 1 !important;
  box-shadow: 0 0 8px rgb(var(--env-rgb));
}
.exp-fan-item:hover .exp-fan-name { color: #ffffff; opacity: 1; text-shadow: 0 0 8px rgba(255,255,255,0.4); }
.exp-seg-base,
.exp-return {
  fill: none;
  stroke: rgb(var(--env-gold-rgb) / .4);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.exp-seg-flow,
.exp-return-flow {
  fill: none;
  stroke: rgb(var(--env-rgb) / .65);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-dasharray: .018 .03;
  animation: expDashFlow 3.5s linear infinite;
}
.exp-seg-pulse,
.exp-return-pulse {
  fill: none;
  stroke: var(--color-red);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-dasharray: .05 .95;
  animation: expDashPulse 2.9s linear infinite;
  animation-delay: calc(var(--seg, 0) * .3s);
}
.exp-return-flow,
.exp-return-pulse {
  stroke: rgb(var(--env-gold-rgb) / .55);
  animation-name: expDashFlow;
}
.exp-return-pulse {
  stroke: var(--color-red);
  opacity: .5;
  animation-name: expDashPulse;
}
.exp-arrow-head { fill: rgb(var(--env-rgb)); }
.exp-junction {
  fill: var(--color-red);
  filter: drop-shadow(0 0 5px rgb(var(--env-rgb)));
}
.exp-return-label {
  fill: var(--color-gold);
  font-family: var(--font-body);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: .2em;
  text-anchor: middle;
}
.exp-flow-node[data-built] .exp-node-glow {
  animation: expNodeGlow 4.4s ease-in-out infinite;
}
.exp-flow-node[data-built] .exp-spoke {
  animation: expSpokeShimmer 3.6s ease-in-out infinite;
}

@media (max-width: 767px) {
  .exp-flow-node { padding-left: 2.2rem; }
  .exp-flow-list::before {
    content: "";
    position: absolute;
    left: .68rem;
    top: 1.4rem;
    bottom: 1.4rem;
    border-left: 1px dashed var(--color-line);
  }
  .exp-flow-node::after {
    content: "";
    position: absolute;
    left: .48rem;
    top: 1.35rem;
    width: .44rem;
    height: .44rem;
    border-radius: 999px;
    background: var(--color-red);
    box-shadow: 0 0 0 4px rgb(var(--env-rgb) / .14), 0 0 14px rgb(var(--env-rgb) / .55);
  }
}

@media (hover: hover) and (pointer: fine) {
  .exp-flow:has(.exp-flow-node:hover) .exp-flow-node { opacity: .4; }
  .exp-flow:has(.exp-flow-node:hover) .exp-flow-node:hover { opacity: 1; }
  .exp-flow:has(.exp-flow-node:hover) .exp-seg-base,
  .exp-flow:has(.exp-flow-node:hover) .exp-seg-flow,
  .exp-flow:has(.exp-flow-node:hover) .exp-seg-pulse,
  .exp-flow:has(.exp-flow-node:hover) .exp-return,
  .exp-flow:has(.exp-flow-node:hover) .exp-return-flow,
  .exp-flow:has(.exp-flow-node:hover) .exp-return-pulse { opacity: .15; }
  .exp-flow-node:hover .exp-node-card {
    box-shadow: 0 24px 50px -22px rgba(0,0,0,.95),
      0 0 36px -6px rgb(var(--env-rgb) / .55);
  }
  .exp-flow-node:hover .exp-spoke { opacity: 1; }
  .exp-flow-node:hover .exp-node-glow { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .exp-seg-flow,
  .exp-seg-pulse,
  .exp-return-flow,
  .exp-return-pulse,
  .exp-flow-node[data-built] .exp-node-glow,
  .exp-flow-node[data-built] .exp-spoke { animation: none !important; }
  .exp-node-card,
  .exp-spoke,
  .exp-fan-icon { transition: none; }
}
`;

/* Tiny corner points (small white squares with blue border like StackStrip) */
function CornerPoints() {
  const corners = [
    "-left-1 -top-1",
    "-right-1 -top-1",
    "-bottom-1 -left-1",
    "-bottom-1 -right-1",
  ];
  return (
    <>
      {corners.map((c) => (
        <i
          key={c}
          className={`pointer-events-none absolute size-1.5 border bg-white ${c} z-[4]`}
          style={{ borderColor: BLUE }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

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

function NodeShell({ tag, hot, className = "", children, ...rest }) {
  const colors = hot ? HOT : NORMAL;
  return (
    <div
      data-frame
      {...rest}
      className={`exp-node-card relative rounded-[3px] ${className}`}
    >
      <span
        data-bg
        data-fill={colors.fill}
        data-edge={colors.edge}
        className="absolute inset-0 rounded-[3px] border transition-colors duration-300 group-hover/node:border-red/60!"
        style={{ backgroundColor: colors.fill, borderColor: colors.edge }}
      />
      <i
        data-bar
        className="absolute left-0 top-0 z-[3] h-[2px] w-full origin-left bg-red"
      />
      <CornerPoints />
      <SelBox tag={tag} />
      <span data-node-glow className="exp-node-glow" aria-hidden="true" />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}

/* a cursor drags a frame out corner to corner, recolours it and sweeps its top bar */
export function drawFrameFast(tl, frame, ag, t0 = 0) {
  if (!frame) return t0;
  const sel = frame.querySelector("[data-sel]");
  const handles = sel ? sel.querySelectorAll("[data-handle]") : [];
  const tag = sel ? sel.querySelector("[data-tag]") : null;
  const bg = frame.querySelector("[data-bg]");
  const bar = frame.querySelector("[data-bar]");
  const p = { v: 0 };

  tl.add(
    swarm.moveTo(ag, frame, { duration: 0.18, offset: { x: 0, y: 0 } }),
    t0
  );
  if (sel) tl.set(sel, { autoAlpha: 1 }, t0 + 0.18);
  tl.add(() => swarm.click(ag), t0 + 0.18);

  tl.to(
    p,
    {
      v: 1,
      duration: 0.24,
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
    t0 + 0.18
  );
  if (handles.length) {
    tl.fromTo(
      handles,
      { scale: 0 },
      { scale: 1, duration: 0.12, stagger: 0.015, ease: "back.out(3)" },
      t0 + 0.42
    );
  }
  if (tag) {
    tl.fromTo(
      tag,
      { autoAlpha: 0, y: 3 },
      { autoAlpha: 1, y: 0, duration: 0.1 },
      t0 + 0.42
    );
  }
  tl.add(
    swarm.moveTo(ag, frame, { duration: 0.15, offset: { x: 0.5, y: 0.5 } }),
    t0 + 0.46
  );
  tl.add(() => swarm.click(ag), t0 + 0.61);
  if (bg) {
    tl.to(
      bg,
      {
        backgroundColor: bg.dataset.fill,
        borderColor: bg.dataset.edge,
        duration: 0.16,
      },
      t0 + 0.61
    );
  }
  tl.fromTo(
    frame,
    { scale: 1 },
    { scale: 1.015, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.inOut" },
    t0 + 0.63
  );
  if (bar) tl.to(bar, { scaleX: 1, duration: 0.2, ease: "power3.out" }, t0 + 0.69);
  if (sel) tl.to(sel, { autoAlpha: 0, duration: 0.1 }, t0 + 0.74);
  return t0 + 0.74;
}

/* cursor writes the words of an element, with a fast 0.16s travel */
export function typeFast(tl, el, ag, at, perLetter = 0.016) {
  if (!el) return at;
  const words = [...el.querySelectorAll("[data-w]")];
  if (!words.length) {
    tl.set(el, { autoAlpha: 1 }, at);
    return at + 0.05;
  }

  tl.add(
    swarm.moveTo(ag, words[0], {
      duration: 0.16,
      offset: { x: 0, y: 0.55 },
    }),
    at
  );
  tl.add(() => swarm.click(ag), at + 0.16);

  let t = at + 0.18;
  words.forEach((w) => {
    const len = Math.max(2, (w.textContent || "").length);
    const d = len * perLetter;
    tl.add(typeReveal(w, { duration: d, agent: ag }), t);
    t += d + 0.02;
  });
  tl.set([el, ...words], { autoAlpha: 1, clearProps: "clipPath" }, t);
  return t;
}

/* Expanded fan geometry so skill icons and labels are clearly visible and legible */
function fanGeometry(count, above) {
  const start = above ? 202 : 22;
  const end = above ? 338 : 158;
  const rings =
    count > 5
      ? [
          {
            radius: 104,
            items: Array.from({ length: count })
              .map((_, i) => i)
              .filter((i) => i % 2 === 0),
          },
          {
            radius: 154,
            items: Array.from({ length: count })
              .map((_, i) => i)
              .filter((i) => i % 2 === 1),
          },
        ]
      : [{ radius: 118, items: Array.from({ length: count }).map((_, i) => i) }];

  const points = [];
  rings.forEach((ring) => {
    const n = ring.items.length;
    ring.items.forEach((index, k) => {
      const span = end - start;
      const deg = start + (n <= 1 ? span / 2 : (k * span) / (n - 1));
      const rad = (deg * Math.PI) / 180;
      points.push({
        index,
        radius: ring.radius,
        deg,
        x: Math.cos(rad) * ring.radius,
        y: Math.sin(rad) * ring.radius,
      });
    });
  });
  return { points, rings };
}

function arcPath(radius, above) {
  const start = above ? 202 : 22;
  const end = above ? 338 : 158;
  const a = (start * Math.PI) / 180;
  const b = (end * Math.PI) / 180;
  const x0 = (Math.cos(a) * radius).toFixed(2);
  const y0 = (Math.sin(a) * radius).toFixed(2);
  const x1 = (Math.cos(b) * radius).toFixed(2);
  const y1 = (Math.sin(b) * radius).toFixed(2);
  return `M ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`;
}

function FlowFan({ icons, above }) {
  if (!icons.length) return null;
  const geometry = fanGeometry(icons.length, above);

  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      <svg
        className="absolute left-1/2 top-1/2 h-0 w-0 overflow-visible"
        viewBox="-170 -170 340 340"
        aria-hidden="true"
      >
        {geometry.rings.map((ring) => (
          <path
            key={ring.radius}
            data-fan-arc
            d={arcPath(ring.radius, above)}
            className="exp-fan-arc"
          />
        ))}
      </svg>

      {geometry.points.map((point) => {
        const item = techItem(icons[point.index]);
        const flip = point.deg > 90 && point.deg < 270;
        const labelRotate = flip ? 180 : 0;
        return (
          <span
            key={`${point.index}-${item.name}`}
            className="exp-fan-item group/chip absolute left-1/2 top-1/2 block h-0 origin-left"
            style={{ width: `${point.radius}px`, transform: `rotate(${point.deg}deg)` }}
          >
            <span
              data-spoke
              className="exp-spoke absolute left-0 top-0 block h-px w-full origin-left"
            />
            {/* small glowing dot where the spoke meets the node */}
            <span
              className="exp-spoke-dot absolute left-0 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              aria-hidden="true"
            />
            <span
              data-fan-icon
              className="exp-fan-icon absolute left-full top-0 block rounded-full border border-white/20 bg-[#161618] p-1.5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:scale-120 hover:border-red hover:shadow-[0_0_12px_rgba(214,26,41,0.5)] hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#4c8dff]/80"
              style={{
                transform: `translate(-50%, -50%) rotate(${-point.deg}deg)`,
                "--icon-rot": `${-point.deg}deg`,
              }}
            >
              <Logo
                item={item}
                className="size-[22px] md:size-[24px]"
                badgeClass="text-[0.48rem]"
              />
            </span>
            <span
              data-fan-name
              className="exp-fan-name absolute left-full top-0 block whitespace-nowrap"
              style={{
                transform: `translate(14px, -50%) rotate(${labelRotate}deg)`,
              }}
            >
              {item.name}
            </span>
          </span>
        );
      })}
    </div>
  );
}

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

/* measure every rail, arrow return and node junction from the live DOM */
export function drawFlow(root) {
  if (typeof window === "undefined" || !root) return;
  if (!window.matchMedia("(min-width: 768px)").matches) return;

  const flow = root.querySelector("[data-flow]");
  if (!flow) return;
  const svg = flow.querySelector("[data-flow-svg]");
  const cards = [...flow.querySelectorAll("[data-node-card]")];
  if (!svg || cards.length < 2) return;

  const fb = flow.getBoundingClientRect();
  if (!fb.width || !fb.height) return;
  svg.setAttribute("viewBox", `0 0 ${fb.width} ${fb.height}`);

  const boxes = cards.map((card) => {
    const r = card.getBoundingClientRect();
    return {
      left: r.left - fb.left,
      right: r.right - fb.left,
      cx: r.left + r.width / 2 - fb.left,
      top: r.top - fb.top,
      bottom: r.bottom - fb.top,
      cy: r.top + r.height / 2 - fb.top,
    };
  });

  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    const y = (a.cy + b.cy) / 2;
    const mid = (a.right + b.left) / 2;
    const d = `M ${a.right.toFixed(2)} ${a.cy.toFixed(2)} C ${(
      a.right +
      (mid - a.right) * 0.55
    ).toFixed(2)} ${a.cy.toFixed(2)}, ${(
      b.left -
      (b.left - mid) * 0.55
    ).toFixed(2)} ${b.cy.toFixed(2)}, ${b.left.toFixed(2)} ${b.cy.toFixed(2)}`;

    const base = flow.querySelector(`[data-seg="${i}"]`);
    const dash = flow.querySelector(`[data-seg-flow="${i}"]`);
    const pulse = flow.querySelector(`[data-seg-pulse="${i}"]`);
    [base, dash, pulse].forEach((p) => p && p.setAttribute("d", d));
    if (base && base.dataset.drawn !== "1") base.style.strokeDashoffset = "1";

    const j0 = flow.querySelector(`[data-junction="${i}-a"]`);
    const j1 = flow.querySelector(`[data-junction="${i}-b"]`);
    if (j0) {
      j0.setAttribute("cx", (a.right + 2).toFixed(2));
      j0.setAttribute("cy", y.toFixed(2));
    }
    if (j1) {
      j1.setAttribute("cx", (b.left - 2).toFixed(2));
      j1.setAttribute("cy", y.toFixed(2));
    }
  }

  const first = boxes[0];
  const last = boxes[boxes.length - 1];
  const railY = fb.height - 24;
  const returnD =
    `M ${last.cx.toFixed(2)} ${(last.bottom + 6).toFixed(2)} ` +
    `C ${last.cx.toFixed(2)} ${railY.toFixed(2)}, ${first.cx.toFixed(2)} ${railY.toFixed(
      2
    )}, ${first.cx.toFixed(2)} ${(first.bottom + 6).toFixed(2)}`;

  ["[data-return]", "[data-return-flow]", "[data-return-pulse]"].forEach((sel) => {
    const p = flow.querySelector(sel);
    if (p) p.setAttribute("d", returnD);
  });
  const ret = flow.querySelector("[data-return]");
  if (ret && ret.dataset.drawn !== "1") ret.style.strokeDashoffset = "1";

  const label = flow.querySelector("[data-return-label]");
  if (label) {
    label.setAttribute("x", ((first.cx + last.cx) / 2).toFixed(2));
    label.setAttribute("y", (fb.height - 6).toFixed(2));
  }
}

/* one node = one cursor lease of three agents [A, B, C] */
export function buildFlowNode(nodeEl, index, host, agents) {
  const [A, B, C] = agents;
  const flow = nodeEl.closest("[data-flow]");
  const card = nodeEl.querySelector("[data-node-card]");
  const kicker = nodeEl.querySelector("[data-node-kicker]");
  const title = nodeEl.querySelector("[data-node-title]");
  const caption = nodeEl.querySelector("[data-node-caption]");
  const ovA = makeOverlay(host);
  const ovB = makeOverlay(host);
  const ovC = makeOverlay(host);
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);
  const base = drawFrameFast(tl, card, A, 0.02);

  // Agent B selects and types the kicker index concurrently
  const tk = dragBox(tl, ovB, B, kicker, host, 0.06, {
    tag: "p.label",
    dur: 0.14,
    pad: 2,
  });
  const tkEnd = typeFast(tl, kicker, B, tk, 0.018);

  // Agent A finishes card drag, then selects and types the Anton title
  const tt = dragBox(tl, ovA, A, title, host, Math.max(base + 0.02, 0.78), {
    tag: `h4.${nodeEl.dataset.flowNode || "node"}`,
    dur: 0.16,
    pad: 2,
  });
  const ttEnd = typeFast(tl, title, A, tt + 0.02, 0.018);

  // Agent C selects and types the caption in parallel
  const tc = dragBox(tl, ovC, C, caption, host, Math.max(tkEnd + 0.02, 0.45), {
    tag: "p.caption",
    dur: 0.15,
    pad: 2,
  });
  const tcEnd = typeFast(tl, caption, C, tc + 0.02, 0.015);

  // icons, names, spokes and arcs pop in - NOT touched by cursors
  const icons = [...nodeEl.querySelectorAll("[data-fan-icon]")];
  const names = [...nodeEl.querySelectorAll("[data-fan-name]")];
  const spokes = [...nodeEl.querySelectorAll("[data-spoke]")];
  const arcs = [...nodeEl.querySelectorAll("[data-fan-arc]")];
  icons.forEach((icon, k) => {
    tl.fromTo(
      icon,
      { autoAlpha: 0, scale: 0.35 },
      { autoAlpha: 1, scale: 1, duration: 0.22, ease: "back.out(3)" },
      0.16 + k * 0.04
    );
  });
  names.forEach((name, k) => {
    tl.fromTo(
      name,
      { autoAlpha: 0, x: -3 },
      { autoAlpha: 1, x: 0, duration: 0.16 },
      0.22 + k * 0.04
    );
  });
  spokes.forEach((spoke, k) => {
    tl.fromTo(
      spoke,
      { scaleX: 0, autoAlpha: 0 },
      { scaleX: 1, autoAlpha: 1, duration: 0.24, ease: "power2.out" },
      0.08 + k * 0.035
    );
  });
  arcs.forEach((arc, k) => {
    tl.fromTo(
      arc,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.22 },
      0.1 + k * 0.05
    );
  });

  const mobiles = [...nodeEl.querySelectorAll("[data-mob-icon]")];
  mobiles.forEach((icon, k) => {
    tl.fromTo(
      icon,
      { autoAlpha: 0, scale: 0.55 },
      { autoAlpha: 1, scale: 1, duration: 0.18, ease: "back.out(2)" },
      0.16 + k * 0.035
    );
  });

  // the segment that arrives at this node draws in with stroke-dashoffset
  if (index > 0) {
    const seg = flow && flow.querySelector(`[data-seg="${index - 1}"]`);
    const segFlow = flow && flow.querySelector(`[data-seg-flow="${index - 1}"]`);
    const pulse = flow && flow.querySelector(`[data-seg-pulse="${index - 1}"]`);
    const junctions = flow
      ? [...flow.querySelectorAll(`[data-junction^="${index - 1}-"]`)]
      : [];
    if (seg) {
      tl.to(seg, { autoAlpha: 1, strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, 0.08);
      tl.add(() => {
        seg.dataset.drawn = "1";
      }, 0.55);
    }
    if (segFlow) tl.to(segFlow, { autoAlpha: 1, duration: 0.26 }, 0.4);
    if (pulse) tl.to(pulse, { autoAlpha: 1, duration: 0.26 }, 0.55);
    junctions.forEach((dot, k) => {
      tl.fromTo(
        dot,
        { autoAlpha: 0, scale: 0.2 },
        { autoAlpha: 1, scale: 1, duration: 0.22, ease: "back.out(3)" },
        0.4 + k * 0.05
      );
    });
  }

  // CLOUD closes the loop with the faint LIVE URL return line
  const total = flow ? flow.querySelectorAll("[data-node-card]").length : 0;
  if (index === total - 1) {
    const ret = flow.querySelector("[data-return]");
    const retFlow = flow.querySelector("[data-return-flow]");
    const retPulse = flow.querySelector("[data-return-pulse]");
    const retLabel = flow.querySelector("[data-return-label]");
    if (ret) {
      tl.to(ret, { autoAlpha: 1, strokeDashoffset: 0, duration: 0.65, ease: "power2.inOut" }, 0.35);
      tl.add(() => {
        ret.dataset.drawn = "1";
      }, 1.0);
    }
    if (retFlow) tl.to(retFlow, { autoAlpha: 0.7, duration: 0.35 }, 0.85);
    if (retPulse) tl.to(retPulse, { autoAlpha: 0.45, duration: 0.35 }, 0.98);
    if (retLabel) tl.to(retLabel, { autoAlpha: 1, duration: 0.25 }, 1.05);
  }

  const end = Math.max(
    base,
    tkEnd,
    ttEnd,
    tcEnd,
    0.22 + icons.length * 0.04 + 0.25
  );
  const finalEnd = index === total - 1 ? Math.max(end, 1.4) : end;

  tl.add(() => {
    nodeEl.dataset.built = "1";
  }, Math.max(0.5, finalEnd - 0.2));

  const out = finalEnd + 0.3;
  cursorOutro(tl, agents, { at: out, duration: 0.22 });
  tl.add(() => agents.forEach((i) => swarm.hide(i)), out + 0.24);
  return tl;
}

export default function SkillsFlow({ flow, returnLabel }) {
  return (
    <div data-flow className="exp-flow relative mt-[4svh]">
      <style>{FLOW_STYLE}</style>

      <svg
        data-flow-svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full overflow-visible md:block"
      >
        <defs>
          <marker
            id="exp-arrow"
            viewBox="0 0 8 8"
            refX="6.5"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 Z" className="exp-arrow-head" />
          </marker>
        </defs>

        {flow.slice(0, -1).map((node, i) => (
          <g key={node.key}>
            <path
              data-seg={i}
              className="exp-seg-base"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
              markerEnd="url(#exp-arrow)"
            />
            <path
              data-seg-flow={i}
              className="exp-seg-flow"
              pathLength="1"
              style={{ "--seg": i }}
            />
            <path
              data-seg-pulse={i}
              className="exp-seg-pulse"
              pathLength="1"
              style={{ "--seg": i }}
            />
            <circle data-junction={`${i}-a`} className="exp-junction" r="2.4" />
            <circle data-junction={`${i}-b`} className="exp-junction" r="2.4" />
          </g>
        ))}

        <path
          data-return
          className="exp-return"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          markerEnd="url(#exp-arrow)"
        />
        <path data-return-flow className="exp-return-flow" pathLength="1" />
        <path data-return-pulse className="exp-return-pulse" pathLength="1" />
        <text data-return-label className="exp-return-label">
          {returnLabel}
        </text>
      </svg>

      <ol
        data-flow-list
        className="exp-flow-list relative z-10 flex flex-col gap-4 md:grid md:h-[400px] lg:h-[430px] md:grid-cols-6 md:gap-0"
      >
        {flow.map((node, i) => (
          <li
            key={node.key}
            data-flow-node={node.key}
            className="exp-flow-node group/node"
          >
            <FlowFan icons={node.icons} above={i % 2 === 1} />

            <div className="md:absolute md:inset-0 md:flex md:items-center md:justify-center">
              <NodeShell
                data-node-card
                tag={`div.${node.key}`}
                hot={i === 2 || i === 3}
                className="w-full md:w-[8.8rem] lg:w-[9.8rem]"
              >
                <div className="flex flex-col items-center px-3 py-3.5 text-center">
                  <div className="flex items-center gap-1.5">
                    <i
                      className="size-1.5 rounded-full bg-red shadow-[0_0_8px_#d61a29]"
                      aria-hidden="true"
                    />
                    <p
                      data-node-kicker
                      className="label block w-fit text-[0.58rem] tracking-[0.2em] text-gold"
                    >
                      <Words text={`0${i + 1}`} />
                    </p>
                  </div>
                  {node.key === "user" && (
                    <UserGlyph className="my-1.5 size-6 text-red" />
                  )}
                  <h4
                    data-node-title
                    className="display mt-1 block w-fit text-[1.15rem] lg:text-[1.3rem] leading-none text-ink"
                  >
                    <Words text={node.title} />
                  </h4>
                  <p
                    data-node-caption
                    className="label mt-1.5 block text-[0.62rem] lg:text-[0.68rem] leading-tight tracking-[0.08em] text-muted"
                  >
                    <Words text={node.caption} />
                  </p>
                </div>
              </NodeShell>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2 md:hidden">
              {node.icons.map((name) => (
                <span
                  key={name}
                  data-mob-icon
                  className="group/chip inline-flex items-center gap-1.5 rounded-full border border-line bg-deep/20 px-2 py-1 outline-offset-[4px] transition-[translate,scale] duration-200 hover:-translate-y-1 hover:scale-110 hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#4c8dff]/70"
                >
                  <Logo
                    item={techItem(name)}
                    className="size-4"
                    badgeClass="text-[0.45rem]"
                  />
                  <span className="text-[0.62rem] uppercase tracking-[0.08em] text-ink/80 group-hover/chip:text-ink">
                    {name}
                  </span>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex items-center justify-end gap-2 md:hidden">
        <span className="label text-[0.6rem] tracking-[0.16em]">
          ← {returnLabel}
        </span>
      </div>
    </div>
  );
}
