import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content } from "../../data/content";
import { stack } from "../../data/stack";
import { swarm } from "../cursors/swarmApi";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import { Words, typeWords } from "../../engine/swarmBuild";
import { themeColor, useTheme } from "../../theme/theme";
import {
  lockScroll,
  safeRefresh,
  scrollToId,
  unlockScroll,
} from "../../hooks/useSmoothScroll";
import Logo from "../ui/Logo";

gsap.registerPlugin(ScrollTrigger);

/* Cursor leases: two agents type the heading, one teaches the click in the hold,
   two more write the closing block. */
const AG = { head: [0, 1], auto: 2, close: [3, 4] };

const withAlpha = (value, amount) => {
  const h = value.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${rgb.join(",")},${amount})`;
};

/* Progress at which the flight ends and the finished table takes over. */
const HOLD_AT = 0.85;
const PERSPECTIVE = 1000;
const TABLE_GAP = 0.22;
/* Desktop final grid: 22.5% larger than the card's laid-out size. */
const CARD_BOOST = 1.225;
/* The big background words dim to this while the cards fly, never to zero. */
const BOARD_DIM = 0.3;

const byName = Object.fromEntries(stack.map((s) => [s.name, s]));
const toolItem = (n) => byName[n] || { name: n, abbr: n.slice(0, 2) };

const imageSrc = (img) =>
  !img ? "" : /^(https?:)?\//.test(img) ? img : `/projects/${img}`;

const linksOf = (p) =>
  [
    p.demo && { label: "Demo", href: p.demo },
    p.github && { label: "GitHub", href: p.github },
  ].filter(Boolean);

/*
  The popup image keeps its natural proportions, so the clone must land on the
  image frame, not on the old full-panel box. The frame is laid out from the
  image's naturalWidth/naturalHeight (width/height auto + max constraints);
  fall back to those numbers if the frame has not been measured yet.
*/
function imageFrameRect(frame, fallback, sourceImg) {
  const rect = frame?.getBoundingClientRect();
  if (rect && rect.width > 0 && rect.height > 0) return rect;

  /* The popup <img> may still be decoding; the table card shows the same file. */
  const img = frame?.querySelector("img");
  const natW = img?.naturalWidth || sourceImg?.naturalWidth;
  const natH = img?.naturalHeight || sourceImg?.naturalHeight;
  if (natW && natH) {
    const lg = window.matchMedia("(min-width: 1024px)").matches;
    const maxW = window.innerWidth * (lg ? 0.52 : 0.82);
    const maxH = window.innerHeight * (lg ? 0.78 : 0.32);
    const scale = Math.min(maxW / natW, maxH / natH, 1);
    const width = natW * scale + 2; /* 1px border on each side */
    const height = natH * scale + 2;
    return {
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
      width,
      height,
    };
  }

  return fallback?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* Catmull-Rom through a list of numbers. u is 0..1 across the whole list. */
function catmullRom(points, u) {
  const n = points.length;
  if (!n) return 0;
  if (n === 1) return points[0];

  const t = clamp(u, 0, 1) * (n - 1);
  const i = Math.min(n - 2, Math.floor(t));
  const f = t - i;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(n - 1, i + 2)];
  const f2 = f * f;
  const f3 = f2 * f;

  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * f +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * f2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * f3)
  );
}

/* Screen waypoint -> 3D, so the perspective produces exactly that size. */
const to3d = (screenX, screenY, scale) => ({
  x: screenX / scale,
  y: screenY / scale,
  z: PERSPECTIVE * (1 - 1 / scale),
  scale,
});

function CardFace({ project: p, n }) {
  const src = imageSrc(p.image);
  const num = String(n).padStart(2, "0");

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-media)] border border-line bg-deep/20 transition-colors duration-300 group-hover/card:border-gold">
      {src ? (
        <img
          src={src}
          alt={`${p.title} screenshot`}
          loading="lazy"
          draggable="false"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : (
        <span data-card-fallback className="absolute inset-0 grid place-items-center bg-deep/30 text-[0.65rem] uppercase tracking-[0.16em] text-muted">
          Screenshot soon
        </span>
      )}
      <div data-card-caption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-[clamp(0.4rem,0.9vw,0.75rem)] pb-[clamp(0.3rem,0.7vw,0.6rem)] pt-[clamp(1.4rem,3vw,2.4rem)]">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span data-card-num className="shrink-0 text-[clamp(0.48rem,0.65vw,0.6rem)] font-semibold uppercase tracking-[0.14em] text-gold">
            {num}
          </span>
          <span data-card-title className="display min-w-0 truncate text-[clamp(0.6rem,0.9vw,0.82rem)] leading-none text-ink">
            {p.title}
          </span>
        </div>
      </div>
    </div>
  );
}

function FlightCard({ project, n, interactive, onOpen, cardRef }) {
  const onKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      ref={cardRef}
      data-project-card
      data-card
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-label={`Open ${project.title}`}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className="group/card invisible absolute left-1/2 top-1/2 aspect-[16/10] w-[min(39.6vw,35.2svh)] cursor-pointer opacity-0 outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-[clamp(187px,16.5vw,275px)]"
    >
      <div
        data-lift
        className="h-full w-full transition-transform duration-300 ease-out group-hover/card:-translate-y-[10px]"
      >
        <div data-flip className="h-full w-full">
          <CardFace project={project} n={n} />
        </div>
      </div>
    </article>
  );
}

function GridCard({ project, n, onOpen, cardRef }) {
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      ref={cardRef}
      data-project-card
      data-mcard
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className="group/card aspect-[16/10] w-full cursor-pointer outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-gold"
    >
      <CardFace project={project} n={n} />
    </article>
  );
}

function ProjectPopup({
  active,
  onClose,
  popupRef,
  imageRef,
  cloneRef,
  backdropRef,
  closeBtnRef,
}) {
  useTheme();
  const p = active.project;
  const num = String(active.index + 1).padStart(2, "0");
  const links = linksOf(p);
  const src = imageSrc(p.image);

  const chips = (
    <ul className="flex flex-wrap gap-[clamp(0.2rem,0.5vw,0.45rem)]">
      {p.tech.map((t) => (
        <li
          key={t}
          className="group/chip flex items-center gap-1 rounded-full border border-[rgb(var(--cursor-rgb)_/_0.1)] bg-[rgb(var(--cursor-rgb)_/_0.03)] py-0.5 pl-1 pr-[clamp(0.3rem,0.6vw,0.6rem)] transition-[translate,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-red/60 hover:bg-red/10"
        >
          <span className="inline-flex">
            <Logo
              item={toolItem(t)}
              className="size-[clamp(0.6rem,1.1vw,0.95rem)]"
              badgeClass="text-[0.45rem]"
            />
          </span>
          <span className="inline-block text-[clamp(0.5rem,0.75vw,0.68rem)] font-medium tracking-wide text-muted transition-colors group-hover/chip:text-ink">
            {t}
          </span>
        </li>
      ))}
    </ul>
  );

  const buttons = (
    <div className="flex flex-wrap gap-[clamp(0.3rem,0.7vw,0.6rem)]">
      {links.map((l) => (
        <a
          data-pop-link
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="group/btn relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-gold px-[clamp(0.6rem,1.6vw,1.4rem)] py-[clamp(0.25rem,0.6vw,0.5rem)] text-[clamp(0.55rem,0.8vw,0.72rem)] font-semibold uppercase tracking-[0.12em] text-ink transition-colors duration-300"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-left scale-x-0 bg-red transition-transform duration-300 group-hover/btn:scale-x-100"
          />
          <span className="relative inline-block">{l.label}</span>
          <span
            aria-hidden="true"
            className="relative inline-block transition-transform duration-300 group-hover/btn:-translate-y-[3px] group-hover/btn:translate-x-[3px]"
          >
            ↗
          </span>
        </a>
      ))}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <div
        ref={backdropRef}
        data-backdrop
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 backdrop-blur-md"
        style={{
          backgroundColor: withAlpha(themeColor("bg"), 0.75),
        }}
      />

      {active.clone && (
        <div
          className="pointer-events-none fixed inset-0 z-[10003]"
          style={{ perspective: "1200px" }}
        >
          <div
            ref={cloneRef}
            className="absolute overflow-hidden rounded-[var(--radius-media)] border border-line bg-deep/30"
          >
            <CardFace project={p} n={active.index + 1} />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[10002]">
        <div
          ref={popupRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-dialog-title"
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-4 py-5 text-ink lg:px-[1vw]"
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(0.45rem,1.5svh,0.85rem)] lg:flex-row lg:gap-[3vw]">
            {/* Left on desktop, below the image on phone: number, name, desc. */}
            <div
              data-pop-side="left"
              className="pointer-events-auto order-2 flex w-[86vw] min-w-0 flex-col items-start text-left lg:order-1 lg:w-[20vw] lg:items-end lg:text-right"
            >
              <div
                data-pop-block
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 lg:flex-col lg:items-end lg:gap-y-1"
              >
                <span className="shrink-0 text-[clamp(0.6rem,1.4vw,0.78rem)] font-medium uppercase tracking-[0.1em] text-red">
                  {num}
                </span>
                <h3
                  id="project-dialog-title"
                  className="display text-[clamp(1.05rem,4.6vw,1.5rem)] leading-[0.95] text-ink lg:text-[clamp(1.5rem,2.4vw,2.6rem)]"
                >
                  {p.title}
                </h3>
              </div>
              <p
                data-pop-block
                className="mt-[clamp(0.3rem,0.8svh,0.6rem)] line-clamp-6 text-[clamp(0.66rem,2.8vw,0.8rem)] leading-relaxed text-ink/70 lg:mt-[clamp(0.5rem,1vw,1rem)] lg:text-[clamp(0.72rem,0.95vw,0.95rem)]"
              >
                {p.desc}
              </p>
            </div>

            {/* The screenshot: natural proportions, its own frame, no crop. */}
            <div
              ref={imageRef}
              className="pointer-events-auto order-1 shrink-0 overflow-hidden rounded-[var(--radius-media)] border border-line shadow-[0_18px_50px_rgb(var(--shadow-rgb) / 0.55)] lg:order-2"
            >
              {src ? (
                <img
                  src={src}
                  alt={`${p.title} screenshot`}
                  draggable="false"
                  className="block h-auto w-auto max-h-[32svh] max-w-[82vw] [@media(max-height:560px)]:max-h-[26svh] lg:max-h-[78svh] lg:max-w-[52vw]"
                />
              ) : (
                <span className="grid h-[32svh] w-[82vw] place-items-center text-[0.65rem] uppercase tracking-[0.16em] text-muted lg:h-[40svh] lg:w-[40vw]">
                  Screenshot soon
                </span>
              )}
            </div>

            {/* Right on desktop, below the text on phone: tools and links. */}
            <div
              data-pop-side="right"
              className="pointer-events-auto order-3 flex w-[86vw] min-w-0 flex-col items-start text-left lg:w-[20vw]"
            >
              <div data-pop-block>
                <p className="label text-muted">TOOLS USED</p>
                <div className="mt-[clamp(0.3rem,0.8svh,0.55rem)]">{chips}</div>
              </div>

              {links.length > 0 && (
                <div
                  data-pop-block
                  className="mt-[clamp(0.6rem,1.6svh,1rem)] lg:mt-[clamp(0.9rem,2.2svh,1.6rem)]"
                >
                  <p className="label text-muted">LINKS</p>
                  <div className="mt-[clamp(0.3rem,0.8svh,0.55rem)]">
                    {buttons}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close project"
            className="pointer-events-auto absolute right-2 top-2 z-30 grid size-8 place-items-center rounded-full border border-line bg-[rgb(var(--shadow-rgb)_/_0.5)] text-sm leading-none text-muted backdrop-blur-sm transition-colors hover:border-gold hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* Fade the leased cursors out, then park them for good: no tween, no roam,
   no cursor left on screen after this section's text has been written. The
   cursor nodes themselves are shared with other sections, so they are hidden
   instead of being removed from the global swarm. */
function parkCursors(tl, rootEl, agents, at) {
  tl.add(() => {
    rootEl?.querySelectorAll("[data-ov]").forEach((n) => n.remove());
    agents.forEach((i) => {
      swarm.claim(i);
      const els = swarm.els([i]);
      gsap.killTweensOf(els);
      els.forEach((el) => {
        gsap.killTweensOf([...el.querySelectorAll("*")]);
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        el.style.pointerEvents = "none";
      });
    });
  }, at);
}

function buildHeading(rootEl) {
  const $ = (s) => rootEl.querySelector(s);
  const [a, b] = AG.head;
  const [c, d] = AG.close;
  const e = AG.auto;
  const agents = [...AG.head, AG.auto, ...AG.close];
  const tl = gsap.timeline();
  cursorIntro(tl, agents, 0);

  /* The new section heading and the faded display type. */
  let th = typeWords(tl, $("[data-ph1]"), c, 0.04, 0.024);
  th = typeWords(tl, $("[data-ph2]"), c, th, 0.024);
  let t = typeWords(tl, $("[data-h1]"), a, 0.05, 0.04);
  t = typeWords(tl, $("[data-h2]"), a, t, 0.04);
  const t2 = typeWords(tl, $("[data-sub]"), b, 0.12, 0.016);
  const t3 = typeWords(tl, $("[data-hint]"), b, t2 + 0.015, 0.016);

  /* The closing block: label, line, then the line with both links. */
  const tc = typeWords(tl, $("[data-clabel]"), c, th + 0.015, 0.016);
  let td = typeWords(tl, $("[data-ctext]"), d, 0.05, 0.0064);
  td = typeWords(tl, $("[data-csub]"), e, td + 0.015, 0.0048);

  const end = Math.max(t, t2, t3, th, tc, td) + 0.1;
  cursorOutro(tl, agents, { at: end, duration: 0.18 });
  parkCursors(tl, rootEl, agents, end + 0.19);

  /* If anything interrupts the sequence, the text still ends fully visible. */
  const revealAll = () => {
    const words = rootEl.querySelectorAll("[data-w]");
    gsap.set(words, { autoAlpha: 1 });
    gsap.set(words, { clearProps: "clipPath" });
  };
  tl.eventCallback("onComplete", revealAll);
  return tl;
}

export default function Projects() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const enabledRef = useRef(enabled);
  const { headline } = content.sections.find((s) => s.id === "projects");
  const { projects } = content;
  const liveDemos = content.hero.stats[1] && content.hero.stats[1].value;
  const sub = `${projects.length} projects, ${liveDemos} of them live. Open the demo or read the code behind each one.`;

  const getMode = () => {
    if (typeof window === "undefined") return "desktop";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
    return "desktop";
  };

  const [mode, setMode] = useState(getMode);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const cardRefs = useRef([]);

  const [active, setActive] = useState(null);
  const activeRef = useRef(false);
  const popupRef = useRef(null);
  const imageRef = useRef(null);
  const cloneRef = useRef(null);
  const backdropRef = useRef(null);
  const closeBtnRef = useRef(null);
  const lastFocusRef = useRef(null);
  const closingRef = useRef(false);

  const applyRef = useRef(null);
  const lastProgressRef = useRef(0);
  const spinResetRef = useRef(null);
  const openTlRef = useRef(null);
  const autoTlRef = useRef(null);
  const autoDoneRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  /* Keep the layout mode in sync with the motion preference. */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMode(getMode());
    reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);

  /* The cursors type the headline and the sub line when the section enters. */
  useLayoutEffect(() => {
    if (mode === "reduced") return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.set(el.querySelectorAll("[data-w]"), { autoAlpha: 0 });
    }, el);

    const headingEl = el.querySelector("[data-heading]");
    const groups = headingEl
      ? [
          {
            element: headingEl,
            agents: [...AG.head, AG.auto, ...AG.close],
            build: () => buildHeading(el),
          },
        ]
      : [];

    const stop = createViewportReveal({
      root: el,
      sectionId: "projects",
      enabled,
      reduced: false,
      start: "top 95%",
      speed: 2.0,
      back: 2.2,
      groups,
    });

    return () => {
      stop();
      ctx.revert();
    };
  }, [enabled, mode]);

  /* Desktop: one scrubbed progress value drives the whole flight. */
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    readyRef.current = false;
    setReady(false);
    autoDoneRef.current = false;

    if (mode === "reduced") return;

    let st = null;
    /* Progress to restore after a width-changing resize/rotation. */
    let keepProgress = -1;

    const ctx = gsap.context(() => {
      const cards = [...el.querySelectorAll("[data-card]")];
      if (!cards.length) return;

      const headingWrap = el.querySelector("[data-heading]");
      const headEl = el.querySelector("[data-projhead]");
      const closeEl = el.querySelector("[data-close]");

      const buildPaths = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseW =
          cards[0].offsetWidth ||
          (vw < 640
            ? Math.min(vw * 0.396, vh * 0.352)
            : clamp(vw * 0.165, 187, 275));
        /* Desktop keeps the 3x2 table; tablet and phone use two columns. */
        const cols = vw < 1024 ? 2 : 3;
        const rows = Math.ceil(cards.length / cols);
        const desktop = vw >= 1024;
        /* Only the finished desktop table grows; tablet and phone keep size. */
        const wantW = baseW * (desktop ? CARD_BOOST : 1);
        /* On short screens shrink the finished table so it clears the heading
           and the closing block instead of overlapping them. */
        const headTop = headEl
          ? parseFloat(getComputedStyle(headEl).top) || 0
          : 0;
        const closeBottom = closeEl
          ? parseFloat(getComputedStyle(closeEl).bottom) || 0
          : 0;
        const chrome = Math.max(
          (headEl?.offsetHeight || 0) + headTop,
          (closeEl?.offsetHeight || 0) + closeBottom
        );
        const gridRoom = Math.max(vh * 0.2, vh - chrome * 2 - 16);
        const W = Math.min(
          wantW,
          gridRoom / (rows * (10 / 16) + (rows - 1) * TABLE_GAP)
        );
        const H = W * (10 / 16);
        const gap = W * TABLE_GAP;
        const fit = W / baseW;

        return cards.map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const slotX = (col - (cols - 1) / 2) * (W + gap);
          const slotY = (row - (rows - 1) / 2) * (H + gap);

          const waypoints = [
            [0, 0, 0.2, 0],
            [-0.3 * vw, 0.1 * vh, 1.7, 30],
            [0, 0.02 * vh, 0.9, 0],
            [0.3 * vw, -0.26 * vh, 0.35, -30],
            [0.08 * vw, -0.1 * vh, 0.55, -10],
            [slotX, slotY, fit, 0],
          ];

          const converted = waypoints.map(([sx, sy, sc, ry]) => ({
            ...to3d(sx, sy, sc),
            ry,
          }));

          return {
            x: converted.map((w) => w.x),
            y: converted.map((w) => w.y),
            scale: converted.map((w) => w.scale),
            ry: converted.map((w) => w.ry),
          };
        });
      };

      let paths = buildPaths();

      const playAutoCursor = () => {
        autoDoneRef.current = true;
        const target = cards[cards.length - 1] || cards[0];
        const tl = gsap.timeline();
        tl.add(() => {
          swarm.show(AG.auto);
          gsap.set(swarm.els([AG.auto]), { opacity: 1, visibility: "visible" });
        }, 0);
        tl.add(
          swarm.moveTo(AG.auto, target, {
            duration: 0.6,
            offset: { x: 0.5, y: 0.5 },
          }),
          0.05
        );
        tl.add(() => swarm.click(AG.auto), 0.7);
        cursorOutro(tl, [AG.auto], { at: 0.8, duration: 0.4 });
        /* Once the section's cursor act is over, clear every cursor. */
        tl.add(swarm.fadeOut(0.5), 1.2);
        parkCursors(tl, el, [AG.auto], 1.75);
        autoTlRef.current = tl;
      };

      const resetAutoCursor = () => {
        autoDoneRef.current = false;
        if (autoTlRef.current) {
          autoTlRef.current.kill();
          autoTlRef.current = null;
        }
      };

      const apply = (P) => {
        if (activeRef.current) return;
        lastProgressRef.current = P;

        const pf = clamp(P / HOLD_AT, 0, 1);

        cards.forEach((card, i) => {
          const path = paths[i];
          const u = clamp((pf - i * 0.08) / 0.6, 0, 1);

          if (u <= 0) {
            card.style.visibility = "hidden";
            card.style.opacity = "0";
            card.style.pointerEvents = "none";
            card.style.zIndex = String(i);
            return;
          }

          const x = catmullRom(path.x, u);
          const y = catmullRom(path.y, u);
          const scale = clamp(catmullRom(path.scale, u), 0.15, 1.7);
          const ry = catmullRom(path.ry, u);
          const z = PERSPECTIVE * (1 - 1 / scale);
          const rx = 6 * (1 - u);
          const opacity = clamp(u / 0.05, 0, 1);

          card.style.visibility = "visible";
          card.style.opacity = opacity.toFixed(3);
          card.style.pointerEvents = readyRef.current ? "auto" : "none";
          card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(
            2
          )}px, ${y.toFixed(2)}px, ${z.toFixed(
            2
          )}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
          card.style.zIndex = String(Math.round(scale * 1000) + i);
        });

        if (headingWrap) {
          headingWrap.style.opacity = pf > 0.001 ? String(BOARD_DIM) : "1";
        }

        const done = pf >= 1;
        if (done !== readyRef.current) {
          readyRef.current = done;
          setReady(done);
          cards.forEach((card) => {
            card.style.pointerEvents = done ? "auto" : "none";
          });
        }

        if (done) {
          if (enabledRef.current && !autoDoneRef.current) playAutoCursor();
        } else if (autoDoneRef.current) {
          resetAutoCursor();
        }
      };

      applyRef.current = apply;

      const state = { p: 0 };
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=500%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 3,
          onRefresh: (self) => {
            paths = buildPaths();
            const keep = keepProgress;
            keepProgress = -1;
            if (keep >= 0) {
              /* Re-apply the same point of the flight in the new layout. */
              const target = self.start + keep * (self.end - self.start);
              apply(keep);
              requestAnimationFrame(() => {
                window.scrollTo({ top: target, behavior: "instant" });
                apply(keep);
              });
            } else {
              apply(self.progress);
            }
          },
        },
      });
      tl.to(state, {
        p: 1,
        duration: 1,
        ease: "none",
        onUpdate: () => apply(state.p),
      });

      st = tl.scrollTrigger;
      apply(0);
    }, el);

    const refresh = (keep = false) => {
      if (keep && keepProgress < 0 && st && st.isActive) {
        keepProgress = lastProgressRef.current;
      }
      safeRefresh(100);
    };
    let lastWidth = window.innerWidth;
    const onViewport = () => {
      const width = window.innerWidth;
      const widthChanged = width !== lastWidth;
      lastWidth = width;
      refresh(widthChanged);
    };
    const imgs = [...el.querySelectorAll("img")];
    const onImg = () => refresh();
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", onImg);
      img.addEventListener("error", onImg);
    });
    const raf = requestAnimationFrame(() => safeRefresh());
    const onWinLoad = () => safeRefresh();
    window.addEventListener("load", onWinLoad);
    window.addEventListener("resize", onViewport);
    window.addEventListener("orientationchange", onViewport);

    return () => {
      cancelAnimationFrame(raf);
      imgs.forEach((img) => {
        img.removeEventListener("load", onImg);
        img.removeEventListener("error", onImg);
      });
      window.removeEventListener("load", onWinLoad);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("orientationchange", onViewport);
      if (autoTlRef.current) {
        autoTlRef.current.kill();
        autoTlRef.current = null;
      }
      autoDoneRef.current = false;
      applyRef.current = null;
      if (st) st.kill();
      ctx.revert();
    };
  }, [mode]);

  useEffect(() => {
    const cards = cardRefs.current.slice(0, projects.length).filter(Boolean);
    const wrappers = cards.map((card) => card.querySelector("[data-flip]"));
    if (!wrappers.length || wrappers.some((wrapper) => !wrapper)) {
      spinResetRef.current = null;
      return;
    }

    gsap.set(wrappers, {
      transformPerspective: 900,
      backfaceVisibility: "visible",
      transformOrigin: "50% 50%",
      transformStyle: "preserve-3d",
      rotationY: 0,
    });

    let disposed = false;
    let paused = false;
    let pendingResume = false;
    let spinning = -1;
    let last = -1;
    let current = null;
    const hovered = new Set();
    const tweens = wrappers.map(() => null);
    const snaps = wrappers.map(() => null);

    const reset = () => {
      disposed = true;
      paused = false;
      pendingResume = false;
      spinning = -1;
      last = -1;
      current = null;
      tweens.forEach((tween, i) => {
        if (tween) tweens[i] = null;
        if (snaps[i]) snaps[i] = null;
        gsap.killTweensOf(wrappers[i]);
        gsap.set(wrappers[i], { rotationY: 0 });
      });
      hovered.clear();
    };

    reset();
    disposed = false;
    spinResetRef.current = reset;

    const begin = () => {
      if (disposed || paused || current || spinning >= 0) return;
      const choices = [];
      wrappers.forEach((_, i) => {
        if (i !== last && !hovered.has(i)) choices.push(i);
      });
      if (!choices.length) return;
      const i = choices[Math.floor(Math.random() * choices.length)];
      last = i;
      spinning = i;
      const value = Number(gsap.getProperty(wrappers[i], "rotationY")) || 0;
      const base = Math.round(value / 360) * 360;
      gsap.set(wrappers[i], { rotationY: base });
      const tween = gsap.to(wrappers[i], {
        rotationY: base + 360,
        duration: 0.9,
        ease: "power2.inOut",
        onComplete: () => {
          if (tweens[i] === tween) tweens[i] = null;
          if (current === tween) current = null;
          spinning = -1;
          gsap.set(wrappers[i], { rotationY: 0 });
          if (!disposed && !paused) begin();
        },
      });
      tweens[i] = tween;
      current = tween;
    };

    const resume = () => {
      if (disposed || !paused) return;
      if (snaps.some(Boolean) || hovered.size) {
        pendingResume = true;
        return;
      }
      paused = false;
      pendingResume = false;
      begin();
    };

    const snapFront = (i) => {
      const wrapper = wrappers[i];
      const tween = tweens[i];
      if (tween) {
        tween.kill();
        tweens[i] = null;
      }
      if (current === tween) current = null;
      if (snaps[i]) {
        snaps[i].kill();
        snaps[i] = null;
      }
      gsap.killTweensOf(wrapper);
      if (spinning === i) spinning = -1;
      const value = Number(gsap.getProperty(wrapper, "rotationY")) || 0;
      const front = Math.round(value / 360) * 360;
      snaps[i] = gsap.to(wrapper, {
        rotationY: front,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          snaps[i] = null;
          if (pendingResume && !snaps.some(Boolean) && !hovered.size) resume();
        },
      });
    };

    const pauseFor = (i) => {
      paused = true;
      if (current) current.kill();
      current = null;
      if (spinning >= 0) {
        const j = spinning;
        if (tweens[j]) tweens[j] = null;
        spinning = -1;
        if (j !== i) snapFront(j);
      }
      snapFront(i);
    };

    if (mode === "reduced" || !ready || active) {
      return () => {
        if (spinResetRef.current === reset) spinResetRef.current = null;
      };
    }

    const listeners = cards.map((card, i) => {
      const enter = () => {
        hovered.add(i);
        pauseFor(i);
      };
      const leave = () => {
        hovered.delete(i);
        resume();
      };
      const down = () => pauseFor(i);
      card.addEventListener("pointerenter", enter);
      card.addEventListener("pointerleave", leave);
      card.addEventListener("pointerdown", down);
      return () => {
        card.removeEventListener("pointerenter", enter);
        card.removeEventListener("pointerleave", leave);
        card.removeEventListener("pointerdown", down);
      };
    });

    begin();

    return () => {
      listeners.forEach((remove) => remove());
      if (spinResetRef.current === reset) spinResetRef.current = null;
      reset();
    };
  }, [ready, active, mode, projects.length]);

  const openProject = useCallback(
    (index) => {
      if (mode === "desktop" && !readyRef.current) return;
      if (activeRef.current) return;
      spinResetRef.current?.();
      const el = cardRefs.current[index];
      if (!el) return;
      lastFocusRef.current = el;
      activeRef.current = true;
      setActive({
        index,
        project: projects[index],
        rect: el.getBoundingClientRect(),
        clone:
          mode === "desktop" &&
          window.matchMedia("(min-width: 1024px)").matches,
      });
    },
    [mode, projects]
  );

  const finishClose = useCallback(() => {
    closingRef.current = false;
    cardRefs.current.filter(Boolean).forEach((c) => {
      c.style.opacity = "";
      c.style.visibility = "";
    });
    activeRef.current = false;
    setActive(null);
    if (mode === "desktop") {
      requestAnimationFrame(() => applyRef.current?.(lastProgressRef.current));
    }
    requestAnimationFrame(() => lastFocusRef.current?.focus());
  }, [mode]);

  const closePopup = useCallback(() => {
    if (!active || closingRef.current) return;
    closingRef.current = true;

    const popup = popupRef.current;
    const backdrop = backdropRef.current;
    const clone = cloneRef.current;
    const card = cardRefs.current[active.index];

    if (openTlRef.current) {
      openTlRef.current.kill();
      openTlRef.current = null;
    }

    if (active.clone && clone && popup && card) {
      const imageRect = imageFrameRect(
        imageRef.current,
        popup,
        card.querySelector("img")
      );
      const cardRect = card.getBoundingClientRect();
      const blocks = popup.querySelectorAll("[data-pop-block]");
      const sides = popup.querySelectorAll("[data-pop-side]");

      gsap.killTweensOf([clone, popup, backdrop, ...blocks, ...sides]);
      gsap.set(clone, {
        visibility: "visible",
        opacity: 0,
        left: imageRect.left,
        top: imageRect.top,
        width: imageRect.width,
        height: imageRect.height,
        rotationY: 360,
        transformOrigin: "50% 50%",
      });

      const tl = gsap.timeline({ onComplete: finishClose });
      /* Floating blocks leave first, then the image card spins back to its slot. */
      tl.to(blocks, { opacity: 0, duration: 0.12, ease: "power2.in" }, 0);
      tl.to(sides, { opacity: 0, duration: 0.12, ease: "power2.in" }, 0);
      tl.to(clone, { opacity: 1, duration: 0.18, ease: "power2.out" }, 0.06);
      tl.to(popup, { opacity: 0, duration: 0.16, ease: "power2.in" }, 0.1);
      tl.to(
        clone,
        {
          left: cardRect.left,
          top: cardRect.top,
          width: cardRect.width,
          height: cardRect.height,
          rotationY: 0,
          duration: 0.7,
          ease: "power3.inOut",
        },
        0.18
      );
      tl.to(backdrop, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0.55);
      return;
    }

    gsap.killTweensOf([popup, backdrop].filter(Boolean));
    const tl = gsap.timeline({ onComplete: finishClose });
    tl.to(popup, { opacity: 0, scale: 0.96, duration: 0.25, ease: "power2.in" }, 0);
    tl.to(backdrop, { opacity: 0, duration: 0.25, ease: "power2.out" }, 0);
  }, [active, finishClose]);

  /* Open: clone grows, spins once, then crossfades into the details. */
  useLayoutEffect(() => {
    if (!active) return;
    const popup = popupRef.current;
    const backdrop = backdropRef.current;
    const clone = cloneRef.current;
    if (!popup || !backdrop) return;

    cardRefs.current.filter(Boolean).forEach((c, i) => {
      if (i !== active.index) c.style.opacity = "0.3";
    });

    let tl = null;

    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const blocks = popup.querySelectorAll("[data-pop-block]");
    const sides = popup.querySelectorAll("[data-pop-side]");
    const leftSide = popup.querySelector('[data-pop-side="left"]');
    const rightSide = popup.querySelector('[data-pop-side="right"]');

    /* Desktop: side columns wait off their own edge. Phone: each block waits below. */
    if (desktop) {
      gsap.set(blocks, { opacity: 1, x: 0, y: 0 });
      if (leftSide) gsap.set(leftSide, { opacity: 0, x: -24 });
      if (rightSide) gsap.set(rightSide, { opacity: 0, x: 24 });
    } else {
      gsap.set(sides, { opacity: 1, x: 0, y: 0 });
      gsap.set(blocks, { opacity: 0, y: 16 });
    }

    const revealSides = (at) => {
      if (leftSide) {
        tl.to(
          leftSide,
          { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" },
          at
        );
      }
      if (rightSide) {
        tl.to(
          rightSide,
          { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" },
          at + 0.08
        );
      }
    };

    const revealBlocks = (at) => {
      tl.to(
        blocks,
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" },
        at
      );
    };

    if (active.clone && clone) {
      const r = active.rect;
      const card = cardRefs.current[active.index];
      if (card) card.style.visibility = "hidden";

      gsap.set(backdrop, { opacity: 0 });
      gsap.set(popup, { opacity: 0 });
      gsap.set(clone, {
        visibility: "visible",
        opacity: 1,
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        rotationY: 0,
        transformOrigin: "50% 50%",
      });

      const target = imageFrameRect(
        imageRef.current,
        popup,
        card?.querySelector("img")
      );

      tl = gsap.timeline();
      tl.to(backdrop, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
      tl.to(
        clone,
        {
          left: target.left,
          top: target.top,
          width: target.width,
          height: target.height,
          rotationY: 360,
          duration: 0.9,
          ease: "power3.inOut",
        },
        0
      );
      tl.to(clone, { opacity: 0, duration: 0.27, ease: "power2.in" }, 0.63);
      tl.to(popup, { opacity: 1, duration: 0.27, ease: "power2.out" }, 0.63);
      tl.set(clone, { visibility: "hidden" }, 0.91);
      if (desktop) revealSides(0.92);
      else revealBlocks(0.63);
    } else {
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(popup, { opacity: 0, scale: 0.96 });
      tl = gsap.timeline();
      tl.to(backdrop, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0);
      tl.to(popup, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }, 0);
      if (desktop) revealSides(0.35);
      else revealBlocks(0.18);
    }

    openTlRef.current = tl;
    requestAnimationFrame(() => closeBtnRef.current?.focus());

    const onTab = (e) => {
      if (e.key !== "Tab") return;
      const items = [
        ...popup.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);

    return () => {
      document.removeEventListener("keydown", onTab);
      if (tl) tl.kill();
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    lockScroll("projects-modal");
    return () => unlockScroll("projects-modal");
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePopup();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, closePopup]);

  return (
    <section
      id="projects"
      ref={root}
      className={`relative border-t border-line ${
        mode === "desktop" ? "h-svh overflow-hidden" : ""
      }`}
    >
      {mode !== "reduced" ? (
        <>
          <div
            data-projhead
            className="pointer-events-none absolute left-gutter right-gutter top-[clamp(0.5rem,1.6svh,1.75rem)] z-20 flex flex-col items-start gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-8"
          >
            <div className="min-w-0">
              <h2 className="section-heading display flex flex-wrap gap-x-[0.28em] leading-[0.9]">
                <span data-ph1 className="block w-fit text-ink">
                  <Words text="PROJECTS" />
                </span>
                <span data-ph2 className="block w-fit text-red">
                  <Words text="IN LIVE" />
                </span>
              </h2>
              <p
                data-sub
                className="mt-[clamp(0.35rem,1.1svh,0.9rem)] max-w-[30rem] text-[min(0.9rem,2.1svh)] leading-relaxed text-ink"
              >
                <Words text={sub} />
              </p>
            </div>
            <p
              data-hint
              className="label shrink-0 whitespace-nowrap text-muted lg:mt-1 lg:text-right"
            >
              <Words text="TAP A PROJECT" />
            </p>
          </div>

          <div
            data-heading
            className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center px-gutter transition-opacity duration-[350ms] ease-out"
          >
            <h2 className="display text-center text-[clamp(4rem,12vw,13rem)] leading-[0.8] tracking-[-0.035em] max-sm:text-[clamp(2.4rem,11vw,3.4rem)]">
              <span data-h1 className="block whitespace-nowrap text-ink">
                <Words text={headline[0]} />
              </span>
              <span data-h2 className="block whitespace-nowrap text-red">
                <Words text={headline[1]} />
              </span>
            </h2>
          </div>

          <div
            data-stage
            className="absolute inset-0 z-10"
            style={{
              perspective: "1000px",
              perspectiveOrigin: "50% 50%",
              transformStyle: "preserve-3d",
            }}
          >
            {projects.map((p, i) => (
              <FlightCard
                key={p.title}
                project={p}
                n={i + 1}
                interactive={ready}
                onOpen={() => openProject(i)}
                cardRef={(node) => (cardRefs.current[i] = node)}
              />
            ))}
          </div>

          <div
            data-close
            className="pointer-events-none absolute left-gutter right-gutter bottom-[clamp(1.2rem,4svh,3rem)] z-20 flex justify-start text-left"
          >
            <div className="max-w-[38rem]">
              <p
                data-clabel
                className="label text-[0.7rem] tracking-[0.18em] text-muted"
              >
                <Words text="WHAT'S NEXT" />
              </p>
              <p
                data-ctext
                className="mt-[0.5svh] text-[min(1.12rem,2.3svh)] font-medium leading-snug text-ink"
              >
                <Words text="Every project here started as an idea and shipped as a working product." />
              </p>
              <p
                data-csub
                className="mt-[0.6svh] text-[min(0.94rem,2.1svh)] leading-relaxed text-muted"
              >
                <Words text="Want to see more? Browse the code on" />{" "}
                <a
                  data-plink
                  href={content.social.github}
                  target="_blank"
                  rel="noreferrer"
                  className="group/plink pointer-events-auto inline-flex items-center gap-1 font-medium text-ink transition-colors hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  <span data-w className="inline-block">GitHub</span>{" "}
                  <span
                    data-w
                    className="inline-block transition-transform duration-200 group-hover/plink:-translate-y-0.5 group-hover/plink:translate-x-0.5"
                  >
                    ↗
                  </span>
                </a>{" "}
                <Words text="or get in touch via" />{" "}
                <a
                  data-plink
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("contact");
                  }}
                  className="group/plink pointer-events-auto inline-flex items-center gap-1 font-medium text-ink transition-colors hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  <span data-w className="inline-block">Contact</span>{" "}
                  <span
                    data-w
                    className="inline-block transition-transform duration-200 group-hover/plink:-translate-y-0.5 group-hover/plink:translate-x-0.5"
                  >
                    ↗
                  </span>
                </a>
                <span data-w className="inline-block">.</span>
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="px-gutter py-[5svh]">
          <header className="flex flex-col items-start gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0">
              <h2 className="display flex flex-wrap gap-x-[0.28em] text-[clamp(1.8rem,6vw,3.2rem)] leading-[0.9]">
                <span className="block w-fit text-ink">
                  <Words text="PROJECTS" />
                </span>
                <span className="block w-fit text-red">
                  <Words text="IN LIVE" />
                </span>
              </h2>
              <p data-sub className="mt-2 max-w-[30rem] text-sm leading-relaxed text-ink">
                <Words text={sub} />
              </p>
            </div>
            <p className="label shrink-0 whitespace-nowrap text-muted lg:mt-1 lg:text-right">
              TAP A PROJECT
            </p>
          </header>

          <header data-heading className="mt-7 flex flex-col gap-4">
            <h2 className="display text-[clamp(2.4rem,11vw,4rem)] leading-[0.9]">
              <span data-h1 className="block w-fit text-ink">
                <Words text={headline[0]} />
              </span>
              <span data-h2 className="block w-fit text-red">
                <Words text={headline[1]} />
              </span>
            </h2>
          </header>

          <ul className="mx-auto mt-8 grid max-w-[900px] grid-cols-2 gap-[clamp(0.5rem,1.2vw,1rem)] lg:grid-cols-3">
            {projects.map((p, i) => (
              <li key={p.title}>
                <GridCard
                  project={p}
                  n={i + 1}
                  onOpen={() => openProject(i)}
                  cardRef={(node) => (cardRefs.current[i] = node)}
                />
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-start gap-3 text-left">
            <div className="max-w-[38rem]">
              <p data-clabel className="label text-[0.7rem] tracking-[0.18em] text-muted">
                <Words text="WHAT'S NEXT" />
              </p>
              <p data-ctext className="mt-1 text-[min(1.12rem,2.3svh)] font-medium leading-snug text-ink">
                <Words text="Every project here started as an idea and shipped as a working product." />
              </p>
              <p data-csub className="mt-1 text-[min(0.94rem,2.1svh)] leading-relaxed text-muted">
                <Words text="Want to see more? Browse the code on" />{" "}
                <a
                  data-plink
                  href={content.social.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-ink transition-colors hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  GitHub <span aria-hidden="true">↗</span>
                </a>{" "}
                <Words text="or get in touch via" />{" "}
                <a
                  data-plink
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("contact");
                  }}
                  className="inline-flex items-center gap-1 font-medium text-ink transition-colors hover:text-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  Contact <span aria-hidden="true">↗</span>
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {active && (
        <ProjectPopup
          active={active}
          onClose={closePopup}
          popupRef={popupRef}
          imageRef={imageRef}
          cloneRef={cloneRef}
          backdropRef={backdropRef}
          closeBtnRef={closeBtnRef}
        />
      )}
    </section>
  );
}
