import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { stack } from "../../data/stack";
import { whatIDo } from "../../data/whatIDo";
import { swarm } from "../cursors/swarmApi";
import { typeReveal } from "../../engine/buildKit";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import Logo from "../ui/Logo";

// which cursor does which job. Groups inside this section are visible at the
// same time, so their agent leases never overlap.
const AG = {
  head: 0,
  now: 1,
  caps: [2, 3, 4, 5],
  stats: [6, 7, 8, 9],
  effort: 10,
};

const BLUE = "#4c8dff";
const NORMAL = { fill: "#121212", edge: "rgba(255,255,255,0.1)" };
const HOT = { fill: "#2a0a0f", edge: "rgba(214,26,41,0.45)" };

const byName = Object.fromEntries(stack.map((s) => [s.name, s]));
const toolItem = (n) => byName[n] || { name: n, abbr: n.slice(0, 2) };

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
function drawFrame(tl, f, ag, t0 = 0) {
  if (!f) return t0;
  const frame = f.hasAttribute?.("data-frame")
    ? f
    : f.closest?.("[data-frame]") || f;
  const sel = frame.querySelector?.("[data-sel]");
  const handles = sel ? sel.querySelectorAll("[data-handle]") : [];
  const tag = sel ? sel.querySelector("[data-tag]") : null;
  const bg = frame.querySelector?.("[data-bg]");
  const bar = frame.querySelector?.("[data-bar]");
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
      {
        backgroundColor: bg.dataset.fill,
        borderColor: bg.dataset.edge,
        duration: 0.4,
      },
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

function buildNow(card) {
  const tl = gsap.timeline();
  cursorIntro(tl, [AG.now], 0);

  const base = drawFrame(tl, card, AG.now, 0.1);
  const nowHead = card.querySelector("[data-now-head]");
  if (nowHead) tl.add(typeReveal(nowHead, { duration: 0.3 }), base);

  const ks = [...card.querySelectorAll("[data-now-k]")];
  const vs = [...card.querySelectorAll("[data-now-v]")];
  ks.forEach((k, i) => {
    tl.add(typeReveal(k, { duration: 0.25 }), base + 0.25 + i * 0.28);
    if (vs[i]) {
      tl.add(
        typeReveal(vs[i], { duration: 0.45, smooth: true }),
        base + 0.35 + i * 0.28
      );
    }
  });

  cursorOutro(tl, [AG.now], { at: ">+=0.5" });
  return tl;
}

function buildCapability(card, i) {
  const tl = gsap.timeline();
  cursorIntro(tl, [AG.caps[i]], 0);

  const base = drawFrame(tl, card, AG.caps[i], 0.05);
  const chips = [...card.querySelectorAll("[data-chip]")];
  const titleEl = card.querySelector("[data-title]");
  const ltextEl = card.querySelector("[data-ltext]");
  const proofEl = card.querySelector("[data-proof]");

  if (titleEl) tl.add(typeReveal(titleEl, { duration: 0.4 }), base);
  if (ltextEl) {
    tl.add(typeReveal(ltextEl, { duration: 0.55, smooth: true }), base + 0.3);
  }
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
      base + 0.7
    );
  }
  if (proofEl) tl.to(proofEl, { autoAlpha: 1, duration: 0.35 }, base + 1.15);

  cursorOutro(tl, [AG.caps[i]], { at: ">+=0.4" });
  return tl;
}

function buildEffortLabel(rootEl) {
  const label = rootEl.querySelector("[data-elabel]");
  const tl = gsap.timeline();
  cursorIntro(tl, [AG.effort], 0);

  if (label) {
    tl.add(
      swarm.moveTo(AG.effort, label, {
        duration: 0.45,
        offset: { x: 0, y: 0.5 },
      }),
      0
    );
    tl.add(() => swarm.click(AG.effort), 0.45);
    tl.add(typeReveal(label, { duration: 0.4, agent: AG.effort }), 0.5);
  }

  cursorOutro(tl, [AG.effort], { at: ">+=0.35" });
  return tl;
}

function buildStat(card, i) {
  const tl = gsap.timeline();
  cursorIntro(tl, [AG.stats[i]], 0);

  const num = card.querySelector("[data-num]");
  const lab = card.querySelector("[data-elabel2]");
  const o = { v: 0 };
  const to = num ? Number(num.dataset.to) || 0 : 0;

  tl.add(swarm.moveTo(AG.stats[i], card, { duration: 0.45 }), 0);
  tl.add(() => swarm.click(AG.stats[i]), 0.45);
  tl.fromTo(
    card,
    { autoAlpha: 0, scale: 0.4, filter: "blur(8px)" },
    {
      autoAlpha: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.55,
      ease: "back.out(2)",
      clearProps: "filter",
    },
    0.5
  );
  if (num) {
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
      0.8
    );
  }
  if (lab) tl.add(typeReveal(lab, { duration: 0.4 }), 0.9);

  cursorOutro(tl, [AG.stats[i]], { at: ">+=0.45" });
  return tl;
}

export default function WhatIDo() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { num, label, headline } = content.sections.find((s) => s.id === "what-i-do");
  const { now, capabilities, effort } = whatIDo;

  // order: live demos, projects, MERN training, internship
  const stats = [1, 0, 2, 3].map((i) => content.hero.stats[i]).filter(Boolean);
  const projects = content.hero.stats[0] && content.hero.stats[0].value;
  const demos = content.hero.stats[1] && content.hero.stats[1].value;

  const nowRows = [...now.rows, { k: now.basedLabel, v: content.about.location }];

  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (s) => [...el.querySelectorAll(s)];

    if (reduced) {
      all("[data-sel]").forEach((n) => (n.style.display = "none"));
      return;
    }

    const ctx = gsap.context(() => {
      const revealEls = all(
        "[data-label],[data-h1],[data-h2],[data-sub2],[data-now-head],[data-now-k],[data-now-v],[data-title],[data-ltext],[data-chip],[data-proof],[data-eff],[data-elabel],[data-elabel2],[data-sel],[data-tag]"
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
      all("[data-num]").forEach((n) => (n.textContent = "0"));
    }, root);

    const headingEl = el.querySelector("header");
    const nowEl = el.querySelector("[data-now]");
    const capEls = all("[data-cap]");
    const effortEl = el.querySelector("[data-elabel]");
    const statEls = all("[data-eff]");

    const groups = [
      headingEl && {
        element: headingEl,
        agents: [AG.head],
        build: () => buildHeading(el),
      },
      nowEl && {
        element: nowEl,
        agents: [AG.now],
        build: (card) => buildNow(card),
      },
      ...capEls.map((card, i) => ({
        element: card,
        agents: [AG.caps[i]],
        build: (node) => buildCapability(node, i),
      })),
      effortEl && {
        element: effortEl,
        agents: [AG.effort],
        build: () => buildEffortLabel(el),
      },
      ...statEls.map((card, i) => ({
        element: card,
        agents: [AG.stats[i]],
        build: (node) => buildStat(node, i),
      })),
    ].filter(Boolean);

    const stop = createViewportReveal({
      root: el,
      sectionId: "what-i-do",
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
      id="what-i-do"
      ref={root}
      className="relative flex min-h-svh flex-col gap-[2.4svh] border-t border-line px-gutter py-[4.5svh]"
    >
      {/* ── heading + "right now" card ── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <header className="min-w-0">
          <p className="label">
            <span data-label className="inline-block">
              <span className="text-red">{num}</span> / {label}
            </span>
          </p>
          <h2 className="display mt-[1.2svh] flex flex-wrap gap-x-[0.28em] text-[min(5.2vw,9.5svh)] max-lg:text-[clamp(2.4rem,11vw,3.6rem)]">
            <span data-h1 className="block w-fit">{headline[0]}</span>
            <span data-h2 className="block w-fit text-red">{headline[1]}</span>
          </h2>
          <p
            data-sub2
            className="mt-[1.2svh] block max-w-[34rem] text-[min(0.95rem,2.1svh)] leading-relaxed text-ink/65"
          >
            A junior full-stack developer with {projects} projects built and {demos} live.
            Here is what I do and where I stand right now.
          </p>
        </header>

        {/* "Right now" status card */}
        <Shell
          data-now=""
          tag="div.now"
          colors={HOT}
          className="w-full shrink-0 lg:w-[min(27rem,34vw)]"
        >
          <div className="relative p-4 lg:p-[min(1.2rem,2.2svh)]">
            <p data-now-head className="label flex w-fit items-center gap-2.5">
              <i className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red opacity-60" />
                <span className="relative size-2 rounded-full bg-red" />
              </i>
              {now.kicker}
            </p>
            <dl className="mt-[1svh]">
              {nowRows.map((r) => (
                <div
                  key={r.k}
                  className="grid grid-cols-[5.4rem_1fr] gap-3 border-t border-white/10 py-[0.8svh]"
                >
                  <dt data-now-k className="label block w-fit self-center">{r.k}</dt>
                  <dd data-now-v className="block w-fit text-[0.88rem] text-ink">{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Shell>
      </div>

      {/* ── capability cards ── */}
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[1.1vw]">
        {capabilities.map((c) => (
          <Shell
            key={c.slug}
            data-cap=""
            tag={`div.${c.slug}`}
            colors={c.hot ? HOT : NORMAL}
            className="min-h-[13rem]"
          >
            <div className="relative flex h-full flex-col p-4 lg:p-[min(1.3rem,2.4svh)]">
              <h3
                data-title
                className="display block w-fit text-[min(2.1vw,4.2svh)] max-lg:text-[clamp(1.7rem,7vw,2.2rem)]"
              >
                {c.title}
              </h3>
              <p
                data-ltext
                className="mt-[0.9svh] block text-[min(0.88rem,1.9svh)] leading-snug text-ink/65"
              >
                {c.line}
              </p>

              <ul className="mt-[1.5svh] flex flex-wrap gap-1.5">
                {c.tools.map((t) => (
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

              <p
                data-proof
                className="mt-auto flex items-center gap-2 border-t border-white/10 pt-[1.2svh] text-[0.74rem] text-ink/60"
              >
                <i className="size-1.5 shrink-0 rounded-full bg-red" />
                {c.proof}
              </p>
            </div>
          </Shell>
        ))}
      </div>

      {/* ── effort counters ── */}
      <div>
        <p className="label">
          <span data-elabel className="inline-block">
            <span className="text-red">/</span> {effort}
          </span>
        </p>
        <ul className="mt-[1.6svh] grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-[1.1vw]">
          {stats.map((s) => (
            <li
              key={s.label}
              data-eff
              className="group relative overflow-hidden border border-line bg-panel px-4 py-[1.4svh] transition-colors hover:border-red/30"
            >
              {/* subtle red glow on hover */}
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(214,26,41,0.07),transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative block">
                <span className="display block text-[2.4rem] leading-none text-red lg:text-[min(3.2vw,5.8svh)]">
                  <span data-num data-to={s.value} className="tabular-nums">{s.value}</span>
                  <span className="ml-0.5 text-[0.55em] text-red/60">+</span>
                </span>
                <span data-elabel2 className="label mt-2 block text-ink/70">{s.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
