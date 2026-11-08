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
import Logo from "../ui/Logo";

/* Cursor leases, all 20 agents: heading 2, "right now" card 2,
   four capability cards 3 each, four counters 1 each. */
const AG = {
  head: [0, 1],
  now: [2, 3],
  caps: [
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
    [13, 14, 15],
  ],
  stats: [[16], [17], [18], [19]],
};

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
        className="absolute inset-0 rounded-[3px] border transition-colors duration-300 group-hover/card:border-red/50!"
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

/* a chip: cursor draws its box, the pill wipes open, the logo pops, the name types */
function buildChip(tl, chip, ag, ov, host, at) {
  const te = dragBox(tl, ov, ag, chip, host, at, {
    tag: "span.chip",
    dur: 0.16,
    pad: 2,
  });
  tl.fromTo(
    chip,
    { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" },
    {
      clipPath: "inset(0 0% 0 0)",
      duration: 0.22,
      ease: "power2.out",
      onComplete() {
        gsap.set(chip, { clearProps: "clipPath" });
      },
    },
    te - 0.02
  );
  const logo = chip.querySelector("[data-logo]");
  const name = chip.querySelector("[data-chip-name]");
  if (logo) {
    tl.fromTo(
      logo,
      { autoAlpha: 0, scale: 0 },
      { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(3)" },
      te + 0.05
    );
  }
  if (name) tl.add(typeReveal(name, { duration: 0.22, agent: ag }), te + 0.15);
  return te + 0.35;
}

function buildHeading(rootEl) {
  const $ = (s) => rootEl.querySelector(s);
  const [a, b] = AG.head;
  const tl = gsap.timeline();
  cursorIntro(tl, AG.head, 0);

  let t = typeWords(tl, $("[data-h1]"), a, 0.05, 0.05);
  t = typeWords(tl, $("[data-h2]"), a, t, 0.05);
  const t2 = typeWords(tl, $("[data-sub2]"), b, 0.2, 0.02);

  cursorOutro(tl, AG.head, { at: Math.max(t, t2) + 0.4 });
  return tl;
}

function buildNow(card, host) {
  const [a, b] = AG.now;
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.now, 0);

  // a drags the card frame out
  const base = drawFrame(tl, card, a, 0.1);

  // b selects the live status line, pops the dot and writes the label
  const head = card.querySelector("[data-now-head]");
  const dot = card.querySelector("[data-now-dot]");
  const headText = card.querySelector("[data-now-text]");
  let t = dragBox(tl, ov, b, head, host, 0.2, { tag: "p.status", dur: 0.25 });
  if (dot) t = popIn(tl, b, dot, t, { travel: 0.2, from: { scale: 0 } });
  t = typeWords(tl, headText, b, t, 0.04);

  // each row is selected, then both cursors write its label and value
  const rows = [...card.querySelectorAll("[data-now-row]")];
  rows.forEach((row, i) => {
    const at = Math.max(base, t) + 0.1 + i * 0.6;
    const te = dragBox(tl, ov, b, row, host, at, {
      tag: "div.row",
      dur: 0.2,
      pad: 2,
    });
    tl.to(row, { borderTopColor: "rgba(255,255,255,0.1)", duration: 0.3 }, te - 0.05);
    typeWords(tl, row.querySelector("[data-now-k]"), b, te, 0.03);
    t = typeWords(tl, row.querySelector("[data-now-v]"), a, te + 0.1, 0.025);
  });

  cursorOutro(tl, AG.now, { at: t + 0.4 });
  return tl;
}

function buildCapability(card, i, host) {
  const [A, B, C] = AG.caps[i];
  const ov = { [A]: makeOverlay(host), [B]: makeOverlay(host), [C]: makeOverlay(host) };
  const tl = gsap.timeline();
  cursorIntro(tl, AG.caps[i], 0);

  // A drags the card frame out
  const base = drawFrame(tl, card, A, 0.05);

  const title = card.querySelector("[data-title]");
  const desc = card.querySelector("[data-ltext]");
  const proof = card.querySelector("[data-proof]");
  const proofDot = card.querySelector("[data-proof-dot]");
  const proofText = card.querySelector("[data-proof-text]");

  // B draws the title box and writes the title
  let tb = dragBox(tl, ov[B], B, title, host, Math.max(0.3, base - 0.3), {
    tag: "h3.title",
    dur: 0.28,
  });
  tb = typeWords(tl, title, B, tb, 0.04);

  // C draws the sentence box and writes it word by word
  let tc = dragBox(tl, ov[C], C, desc, host, Math.max(0.5, base - 0.15), {
    tag: "p.line",
    dur: 0.3,
  });
  tc = typeWords(tl, desc, C, tc, 0.022);

  // A and B build the tool chips, two at a time
  let chipsEnd = base;
  [...card.querySelectorAll("[data-chip]")].forEach((chip, k) => {
    const ag = k % 2 ? B : A;
    const start = k % 2 ? Math.max(tb, base) : base + 0.1;
    chipsEnd = Math.max(
      chipsEnd,
      buildChip(tl, chip, ag, ov[ag], host, start + Math.floor(k / 2) * 0.7)
    );
  });

  // C draws the proof line box, pops its dot and writes it
  let tp = tc;
  if (proof) {
    tp = dragBox(tl, ov[C], C, proof, host, tc + 0.1, { tag: "p.proof", dur: 0.25, pad: 2 });
    if (proofDot) tp = popIn(tl, C, proofDot, tp, { travel: 0.2, from: { scale: 0 } });
    tp = typeWords(tl, proofText, C, tp, 0.025);
  }

  cursorOutro(tl, AG.caps[i], { at: Math.max(tp, chipsEnd, tb) + 0.4 });
  return tl;
}

function buildStat(card, i, host) {
  const [a] = AG.stats[i];
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.stats[i], 0);

  const num = card.querySelector("[data-num]");
  const lab = card.querySelector("[data-elabel2]");
  const o = { v: 0 };
  const to = num ? Number(num.dataset.to) || 0 : 0;

  // the cursor draws the counter box, the box opens with a pop
  const te = dragBox(tl, ov, a, card, host, 0, { tag: "li.counter", dur: 0.3 });
  tl.fromTo(
    card,
    { autoAlpha: 0, scale: 0.4, filter: "blur(8px)" },
    {
      autoAlpha: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.5,
      ease: "back.out(2)",
      clearProps: "filter",
    },
    te - 0.05
  );

  // then it clicks the number while it counts up, and writes the label
  let t = te + 0.3;
  if (num) {
    tl.add(swarm.moveTo(a, num, { duration: 0.25 }), te + 0.1);
    tl.add(() => swarm.click(a), te + 0.35);
    tl.to(
      o,
      {
        v: to,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: () => {
          num.textContent = Math.round(o.v);
        },
      },
      te + 0.35
    );
    t = te + 0.7;
  }
  t = typeWords(tl, lab, a, t, 0.03);

  cursorOutro(tl, AG.stats[i], { at: t + 0.4 });
  return tl;
}

export default function WhatIDo() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { headline } = content.sections.find((s) => s.id === "what-i-do");
  const { now, capabilities } = whatIDo;

  // order: live demos, projects, MERN training, internship
  const stats = [1, 0, 2, 3].map((i) => content.hero.stats[i]).filter(Boolean);
  const projects = content.hero.stats[0] && content.hero.stats[0].value;
  const demos = content.hero.stats[1] && content.hero.stats[1].value;
  const sub = `A junior full-stack developer with ${projects} projects built and ${demos} live. Here is what I do and where I stand right now.`;

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
      gsap.set(
        all(
          "[data-w],[data-chip],[data-chip-name],[data-logo],[data-eff],[data-sel],[data-tag]"
        ),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-now-dot],[data-proof-dot]"), { scale: 0 });
      gsap.set(all("[data-now-row]"), { borderTopColor: "rgba(255,255,255,0.02)" });
      gsap.set(all("[data-handle]"), { scale: 0 });
      gsap.set(all("[data-bar]"), { scaleX: 0 });
      gsap.set(all("[data-bg]"), {
        clipPath: "inset(0 100% 100% 0)",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.12)",
      });
      gsap.set(all("[data-sel]"), { width: "0%", height: "0%" });
      all("[data-num]").forEach((n) => (n.textContent = "0"));
    }, root);

    const headingEl = el.querySelector("header");
    const nowEl = el.querySelector("[data-now]");

    const groups = [
      headingEl && {
        element: headingEl,
        agents: AG.head,
        build: () => buildHeading(el),
      },
      nowEl && {
        element: nowEl,
        agents: AG.now,
        build: (card) => buildNow(card, el),
      },
      ...all("[data-cap]").map((card, i) => ({
        element: card,
        agents: AG.caps[i],
        build: (node) => buildCapability(node, i, el),
      })),
      ...all("[data-eff]").map((card, i) => ({
        element: card,
        agents: AG.stats[i],
        build: (node) => buildStat(node, i, el),
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
    const stopTilt = tiltTiles(el, "[data-tile]");

    return () => {
      stopTilt();
      stop();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled]);

  return (
    <section
      id="what-i-do"
      ref={root}
      className="relative flex min-h-svh flex-col gap-[2.4svh] border-t border-line px-gutter py-[4.5svh]"
    >
      {/* heading + "right now" card */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <header className="min-w-0">
          <h2 className="display flex flex-wrap gap-x-[0.28em] text-[min(5.2vw,9.5svh)] max-lg:text-[clamp(2.4rem,11vw,3.6rem)]">
            <span data-h1 className="block w-fit">
              <Words text={headline[0]} />
            </span>
            <span data-h2 className="block w-fit text-red">
              <Words text={headline[1]} />
            </span>
          </h2>
          <p
            data-sub2
            className="mt-[1.2svh] block max-w-[34rem] text-[min(0.95rem,2.1svh)] leading-relaxed text-ink/65"
          >
            <Words text={sub} />
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
              <i data-now-dot className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red opacity-60" />
                <span className="relative size-2 rounded-full bg-red" />
              </i>
              <span data-now-text>
                <Words text={now.kicker} />
              </span>
            </p>
            <dl className="mt-[1svh]">
              {nowRows.map((r) => (
                <div
                  key={r.k}
                  data-now-row
                  className="group/row grid grid-cols-[5.4rem_1fr] gap-3 border-t border-white/10 py-[0.8svh] transition-colors duration-200 hover:bg-white/[0.04]"
                >
                  <dt
                    data-now-k
                    className="label block w-fit self-center transition-colors duration-200 group-hover/row:text-red"
                  >
                    <Words text={r.k} />
                  </dt>
                  <dd
                    data-now-v
                    className="block w-fit text-[0.88rem] text-ink transition-[translate] duration-200 group-hover/row:translate-x-1"
                  >
                    <Words text={r.v} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Shell>
      </div>

      {/* capability cards */}
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[1.1vw]">
        {capabilities.map((c) => (
          <div
            key={c.slug}
            data-tile
            className="group/card relative flex rounded-[3px] transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_-14px_rgba(214,26,41,0.45)]"
          >
            <Shell
              data-cap=""
              tag={`div.${c.slug}`}
              colors={c.hot ? HOT : NORMAL}
              className="min-h-[13rem] w-full flex-1"
            >
              <div className="relative flex h-full flex-col p-4 lg:p-[min(1.3rem,2.4svh)]">
                <h3
                  data-title
                  className="display relative block w-fit text-[min(2.1vw,4.2svh)] max-lg:text-[clamp(1.7rem,7vw,2.2rem)]"
                >
                  <Words text={c.title} />
                  <i
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-[3px] w-full origin-left scale-x-0 bg-red transition-transform duration-[400ms] group-hover/card:scale-x-100"
                  />
                </h3>
                <p
                  data-ltext
                  className="mt-[0.9svh] block text-[min(0.88rem,1.9svh)] leading-snug text-ink/65 transition-colors duration-300 group-hover/card:text-ink/90"
                >
                  <Words text={c.line} />
                </p>

                <ul className="mt-[1.5svh] flex flex-wrap gap-1.5">
                  {c.tools.map((t) => (
                    <li
                      key={t}
                      data-chip
                      className="group/chip flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-2.5 transition-[translate,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-red/60 hover:bg-red/10"
                    >
                      <span data-logo className="inline-flex">
                        <Logo item={toolItem(t)} className="size-4" badgeClass="text-[0.5rem]" />
                      </span>
                      <span
                        data-chip-name
                        className="inline-block text-[0.64rem] font-medium tracking-wide text-muted transition-colors group-hover/chip:text-ink"
                      >
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>

                <p
                  data-proof
                  className="mt-auto flex items-center gap-2 border-t border-white/10 pt-[1.2svh] text-[0.74rem] text-ink/60 transition-colors duration-300 group-hover/card:text-ink/90"
                >
                  <i
                    data-proof-dot
                    className="size-1.5 shrink-0 rounded-full bg-red transition-[scale] duration-300 group-hover/card:scale-[1.8]"
                  />
                  <span data-proof-text>
                    <Words text={c.proof} />
                  </span>
                </p>
              </div>
            </Shell>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] rounded-[3px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
              style={SPOTLIGHT_STYLE}
            />
          </div>
        ))}
      </div>

      {/* effort counters */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-[1.1vw]">
        {stats.map((s) => (
          <li
            key={s.label}
            data-eff
            className="group relative overflow-hidden border border-line bg-panel px-4 py-[1.4svh] transition-[translate,border-color] duration-300 hover:-translate-y-1 hover:border-red/40"
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(214,26,41,0.12),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <i className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-red transition-transform duration-300 group-hover:scale-x-100" />
            <span className="relative block">
              <span className="display block origin-left text-[2.4rem] leading-none text-red transition-[scale] duration-300 group-hover:scale-110 lg:text-[min(3.2vw,5.8svh)]">
                <span data-num data-to={s.value} className="tabular-nums">
                  {s.value}
                </span>
                <span className="ml-0.5 text-[0.55em] text-red/60">+</span>
              </span>
              <span data-elabel2 className="label mt-2 block text-ink/70">
                <Words text={s.label} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
