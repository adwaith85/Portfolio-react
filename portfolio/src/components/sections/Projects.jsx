import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { stack } from "../../data/stack";
import { swarm } from "../cursors/swarmApi";
import { typeReveal } from "../../engine/buildKit";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import Logo from "../ui/Logo";

/* which cursor does which job (all leases are disjoint inside this section) */
const AG = { head: 0, feat: 1, cards: [2, 3, 4, 5] };

const BLUE = "#4c8dff";
const NORMAL = { fill: "#121212", edge: "rgba(255,255,255,0.1)" };

const byName = Object.fromEntries(stack.map((s) => [s.name, s]));
const toolItem = (n) => byName[n] || { name: n, abbr: n.slice(0, 2) };

/* "shop.png" -> /projects/shop.png. Full URLs and /paths are used as they are. */
const imageSrc = (img) =>
  !img ? "" : /^(https?:)?\//.test(img) ? img : `/projects/${img}`;

/* the link labels for one project */
const linksOf = (p) => {
  const out = [];
  if (p.demo) out.push({ label: p.demo2 ? "User app" : "Demo", href: p.demo });
  if (p.demo2) out.push({ label: "Driver app", href: p.demo2 });
  if (p.github) out.push({ label: "GitHub", href: p.github });
  return out;
};

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

/* a frame: the colored box (drawn by a cursor), a red top bar, and its content */
function Shell({ tag, colors = NORMAL, className = "", children, ...rest }) {
  return (
    <div data-frame {...rest} className={`relative ${className}`}>
      <span
        data-bg
        data-fill={colors.fill}
        data-edge={colors.edge}
        className="absolute inset-0 rounded-[3px] border"
        style={{ backgroundColor: colors.fill, borderColor: colors.edge }}
      />
      <i data-bar className="absolute left-0 top-0 h-[2px] w-full origin-left bg-red" />
      <SelBox tag={tag} />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/* a cursor drags a frame out corner to corner, recolors it, nudges it, draws its bar.
   returns the time at which the frame's content can start typing */
function drawFrame(tl, frame, ag, t0 = 0) {
  if (!frame) return t0;
  const sel = frame.querySelector("[data-sel]");
  const handles = sel ? sel.querySelectorAll("[data-handle]") : [];
  const tag = sel ? sel.querySelector("[data-tag]") : null;
  const bg = frame.querySelector("[data-bg]");
  const bar = frame.querySelector("[data-bar]");
  const p = { v: 0 };

  tl.add(swarm.moveTo(ag, frame, { duration: 0.5, offset: { x: 0, y: 0 } }), t0);
  if (sel) tl.set(sel, { autoAlpha: 1 }, t0 + 0.5);
  tl.add(() => swarm.click(ag), t0 + 0.5);

  tl.to(
    p,
    {
      v: 1,
      duration: 0.55,
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
    t0 + 0.55
  );
  if (handles.length) {
    tl.fromTo(
      handles,
      { scale: 0 },
      { scale: 1, duration: 0.25, stagger: 0.03, ease: "back.out(3)" },
      t0 + 1.05
    );
  }
  if (tag) {
    tl.fromTo(
      tag,
      { autoAlpha: 0, y: 4 },
      { autoAlpha: 1, y: 0, duration: 0.2 },
      t0 + 1.05
    );
  }

  tl.add(
    swarm.moveTo(ag, frame, { duration: 0.35, offset: { x: 0.5, y: 0.5 } }),
    t0 + 1.15
  );
  tl.add(() => swarm.click(ag), t0 + 1.5);
  if (bg) {
    tl.to(
      bg,
      { backgroundColor: bg.dataset.fill, borderColor: bg.dataset.edge, duration: 0.4 },
      t0 + 1.5
    );
  }
  tl.fromTo(
    frame,
    { scale: 1 },
    { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.inOut" },
    t0 + 1.55
  );
  if (bar) tl.to(bar, { scaleX: 1, duration: 0.45, ease: "power3.out" }, t0 + 1.65);
  if (sel) tl.to(sel, { autoAlpha: 0, duration: 0.25 }, t0 + 1.75);

  return t0 + 1.65;
}

/* ---------- one builder per viewport group ---------- */

function buildHeading(rootEl) {
  const $ = (s) => rootEl.querySelector(s);
  const label = $("[data-label]");
  const h1 = $("[data-h1]");
  const h2 = $("[data-h2]");
  const sub2 = $("[data-sub2]");

  const tl = gsap.timeline();
  cursorIntro(tl, [AG.head], 0);

  if (label) {
    tl.add(
      swarm.moveTo(AG.head, label, { duration: 0.45, offset: { x: 0, y: 0.5 } }),
      0
    );
    tl.add(() => swarm.click(AG.head), 0.45);
    tl.add(typeReveal(label, { duration: 0.35, agent: AG.head }), 0.5);
  }
  if (h1) tl.add(typeReveal(h1, { duration: 0.45, agent: AG.head }), 0.9);
  if (h2) tl.add(typeReveal(h2, { duration: 0.4, agent: AG.head }), 1.35);
  if (sub2) {
    tl.add(
      typeReveal(sub2, { duration: 0.55, smooth: true, agent: AG.head }),
      1.75
    );
  }

  cursorOutro(tl, [AG.head], { at: ">+=0.45" });
  return tl;
}

function buildCard(card, agents) {
  const ag = agents[0];
  const tl = gsap.timeline();
  cursorIntro(tl, agents, 0);

  const base = drawFrame(tl, card, ag, 0.05);

  const num = card.querySelector("[data-pnum]");
  const img = card.querySelector("[data-pimg]");
  const title = card.querySelector("[data-title]");
  const text = card.querySelector("[data-ltext]");
  const chips = [...card.querySelectorAll("[data-chip]")];
  const links = [...card.querySelectorAll("[data-link]")];
  const arrow = card.querySelector("[data-arrow]");

  if (img) tl.fromTo(img, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, base - 0.1);
  if (num) {
    tl.fromTo(
      num,
      { autoAlpha: 0, scale: 0.5 },
      { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" },
      base
    );
  }
  if (title) tl.add(typeReveal(title, { duration: 0.4 }), base + 0.1);
  if (text) tl.add(typeReveal(text, { duration: 0.55, smooth: true }), base + 0.35);
  if (chips.length) {
    tl.fromTo(
      chips,
      { autoAlpha: 0, scale: 0.4 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.35,
        stagger: 0.07,
        ease: "back.out(2.5)",
      },
      base + 0.8
    );
  }
  if (links.length) {
    tl.fromTo(
      links,
      { autoAlpha: 0, y: 6 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.1,
        ease: "power2.out",
      },
      base + 1.2
    );
  }
  if (arrow) tl.to(arrow, { autoAlpha: 1, duration: 0.3 }, base + 1.3);

  cursorOutro(tl, agents, { at: ">+=0.4" });
  return tl;
}

/* one project card */
function Card({ project: p, n, featured }) {
  const links = linksOf(p);
  const src = imageSrc(p.image);
  const num = String(n).padStart(2, "0");

  return (
    <li
      className={`group/card flex rounded-[3px] transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_-14px_rgba(214,26,41,0.45)] ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <Shell
        data-card=""
        data-featured={featured ? "" : undefined}
        tag={`article.project-${num}`}
        className={`w-full flex-1 ${featured ? "lg:min-h-[13rem]" : "lg:min-h-[10.5rem]"}`}
      >
        <div className="flex h-full flex-col lg:flex-row">
          {/* screenshot (or placeholder) with the big project number */}
          <div
            data-pimg
            className={`relative m-2 aspect-video shrink-0 overflow-hidden rounded-[2px] border border-white/10 bg-[#0b0b0b] lg:aspect-auto ${
              featured ? "lg:w-[44%]" : "lg:w-[36%]"
            }`}
          >
            {src ? (
              <img
                src={src}
                alt={`${p.title} screenshot`}
                loading="lazy"
                draggable="false"
                className="absolute inset-0 size-full object-cover object-top"
              />
            ) : (
              <>
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_100%,rgba(214,26,41,0.18),transparent_65%)]" />
                <span className="label absolute inset-0 grid place-items-center text-muted/50">
                  Screenshot soon
                </span>
              </>
            )}
            <span
              data-pnum
              className={`display absolute bottom-2 left-3 origin-bottom-left leading-none text-red [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] ${
                featured
                  ? "text-[clamp(2.4rem,9vw,3.4rem)] lg:text-[min(4.6vw,9svh)]"
                  : "text-[clamp(2.2rem,8vw,3rem)] lg:text-[min(3.4vw,6.5svh)]"
              }`}
            >
              {num}
            </span>
          </div>

          {/* text side */}
          <div className="relative flex min-w-0 flex-1 flex-col p-4 lg:p-[min(1.2rem,2.2svh)] lg:pl-[min(1rem,2svh)]">
            <span
              data-arrow
              aria-hidden="true"
              className="absolute right-3 top-3 text-lg leading-none text-muted transition-colors group-hover/card:text-red lg:right-4 lg:top-4"
            >
              ↗
            </span>

            <h3
              data-title
              className={`display block w-fit pr-8 ${
                featured
                  ? "text-[clamp(1.7rem,7vw,2.2rem)] lg:text-[min(2.6vw,5svh)]"
                  : "text-[clamp(1.5rem,6.5vw,2rem)] lg:text-[min(1.9vw,3.6svh)]"
              }`}
            >
              {p.title}
            </h3>

            <p
              data-ltext
              className="mt-[0.9svh] block max-w-[34rem] text-[min(0.88rem,1.9svh)] leading-snug text-ink/65"
            >
              {p.desc}
            </p>

            <ul className="mt-[1.4svh] flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <li
                  key={t}
                  data-chip
                  className="group/chip flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-2.5"
                >
                  <Logo item={toolItem(t)} className="size-4" badgeClass="text-[0.5rem]" />
                  <span className="text-[0.64rem] font-medium tracking-wide text-muted transition-colors group-hover/chip:text-ink">
                    {t}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-[1.2svh] max-lg:mt-4 max-lg:pt-3">
              {links.map((l) => (
                <a
                  key={l.label}
                  data-link
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/80 transition-colors hover:text-red"
                >
                  {l.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    </li>
  );
}

export default function Projects() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { num, label, headline } = content.sections.find((s) => s.id === "projects");
  const { projects } = content;

  const liveDemos = content.hero.stats[1] && content.hero.stats[1].value;

  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (s) => [...el.querySelectorAll(s)];

    if (reduced) {
      all("[data-sel]").forEach((n) => (n.style.display = "none"));
      return;
    }

    // hidden starting state, so nothing flashes before its group is reached
    const ctx = gsap.context(() => {
      const revealEls = all(
        "[data-label],[data-h1],[data-h2],[data-sub2],[data-pnum],[data-pimg],[data-title],[data-ltext],[data-chip],[data-link],[data-arrow],[data-sel],[data-tag]"
      );
      if (revealEls.length) gsap.set(revealEls, { autoAlpha: 0 });
      const handles = all("[data-handle]");
      if (handles.length) gsap.set(handles, { scale: 0 });
      const bars = all("[data-bar]");
      if (bars.length) gsap.set(bars, { scaleX: 0 });
      const bgs = all("[data-bg]");
      if (bgs.length) {
        gsap.set(bgs, {
          clipPath: "inset(0 100% 100% 0)",
          backgroundColor: "rgba(255,255,255,0.05)",
          borderColor: "rgba(255,255,255,0.12)",
        });
      }
      const sels = all("[data-sel]");
      if (sels.length) gsap.set(sels, { width: "0%", height: "0%" });
    }, root);

    const headingEl = el.querySelector("header");
    const cardEls = all("[data-card]");

    const groups = [
      headingEl && {
        element: headingEl,
        agents: [AG.head],
        build: () => buildHeading(el),
      },
      ...cardEls.map((card, k) => {
        const featured = card.hasAttribute("data-featured");
        const agents = featured ? [AG.feat] : [AG.cards[(k - 1) % AG.cards.length]];
        return {
          element: card,
          agents,
          build: (node) => buildCard(node, agents),
        };
      }),
    ].filter(Boolean);

    const stop = createViewportReveal({
      root: el,
      sectionId: "projects",
      enabled,
      reduced,
      start: "top 95%",
      speed: 1.35,
      back: 2.2,
      groups,
    });

    return () => {
      stop();
      ctx.revert();
    };
  }, [enabled]);

  return (
    <section
      id="projects"
      ref={root}
      className="relative flex min-h-svh flex-col gap-[2.4svh] border-t border-line px-gutter py-[4.5svh]"
    >
      {/* ── heading ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <p className="label">
            <span data-label className="inline-block">
              <span className="text-red">{num}</span> / {label}
            </span>
          </p>
          <h2 className="display mt-[1.2svh] flex flex-wrap gap-x-[0.28em] text-[min(5.2vw,9.5svh)] max-lg:text-[clamp(2.4rem,11vw,3.6rem)]">
            <span data-h1 className="block w-fit">{headline[0]}</span>
            <span data-h2 className="block w-fit text-red">{headline[1]}</span>
          </h2>
        </div>
        <p
          data-sub2
          className="block max-w-[26rem] text-[min(0.95rem,2.1svh)] leading-relaxed text-ink/65"
        >
          {projects.length} projects, {liveDemos} of them live. Open the demo or read the code
          behind each one.
        </p>
      </header>

      {/* ── cards: one featured on top, then two per row ── */}
      <ul className="grid flex-1 gap-3 lg:grid-cols-2 lg:grid-rows-[1.25fr_1fr_1fr] lg:gap-[1.1vw]">
        {projects.map((p, i) => (
          <Card key={p.title} project={p} n={i + 1} featured={Boolean(p.featured)} />
        ))}
      </ul>
    </section>
  );
}
