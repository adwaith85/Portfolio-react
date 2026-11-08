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
import {
  BLUE,
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
  typeWords,
} from "../../engine/swarmBuild";
import Logo from "../ui/Logo";

/* Cursor leases: heading 2 cursors, project rows alternate between two sets of 6. */
const AG = {
  head: [0, 1],
  rows: [
    [2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13],
  ],
};

const NORMAL = { fill: "#121212", edge: "rgba(255,255,255,0.1)" };

const byName = Object.fromEntries(stack.map((s) => [s.name, s]));
const toolItem = (n) => byName[n] || { name: n, abbr: n.slice(0, 2) };

const imageSrc = (img) =>
  !img ? "" : /^(https?:)?\//.test(img) ? img : `/projects/${img}`;

const linksOf = (p) => {
  const out = [];
  if (p.demo) out.push({ label: p.demo2 ? "User app" : "Demo", href: p.demo });
  if (p.demo2) out.push({ label: "Driver app", href: p.demo2 });
  if (p.github) out.push({ label: "GitHub", href: p.github });
  return out;
};

/* design-tool selection box that a cursor drags out over the row frame */
function SelBox({ tag, mirror }) {
  const corners = [
    "-left-1 -top-1",
    "-right-1 -top-1",
    "-bottom-1 -left-1",
    "-bottom-1 -right-1",
  ];
  return (
    <span
      data-sel
      className={`pointer-events-none absolute top-0 z-[3] border border-dashed ${
        mirror ? "right-0" : "left-0"
      }`}
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
        className={`absolute -top-6 whitespace-nowrap rounded-sm px-1.5 py-[3px] text-[10px] font-semibold leading-none text-white ${
          mirror ? "right-0" : "left-0"
        }`}
        style={{ background: BLUE }}
      >
        {tag}
      </b>
    </span>
  );
}

function Shell({ tag, mirror, className = "", children, ...rest }) {
  return (
    <div data-frame {...rest} className={`relative ${className}`}>
      <span
        data-bg
        data-fill={NORMAL.fill}
        data-edge={NORMAL.edge}
        className="absolute inset-0 rounded-[3px] border transition-colors duration-300 group-hover/card:border-red/50!"
        style={{ backgroundColor: NORMAL.fill, borderColor: NORMAL.edge }}
      />
      <i data-bar className="absolute left-0 top-0 h-[2px] w-full origin-left bg-red" />
      <SelBox tag={tag} mirror={mirror} />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/* ---------- cursor building blocks ---------- */

/* cursor drags the row frame out corner to corner (mirrored on even rows) */
function drawFrame(tl, frame, ag, t0, mirror) {
  const sel = frame.querySelector("[data-sel]");
  const handles = sel ? sel.querySelectorAll("[data-handle]") : [];
  const tag = sel ? sel.querySelector("[data-tag]") : null;
  const bg = frame.querySelector("[data-bg]");
  const bar = frame.querySelector("[data-bar]");
  const p = { v: 0 };
  const fx = (v) => (mirror ? 1 - v : v);

  tl.add(
    swarm.moveTo(ag, frame, { duration: 0.5, offset: { x: mirror ? 1 : 0, y: 0 } }),
    t0
  );
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
        if (bg) {
          bg.style.clipPath = mirror
            ? `inset(0 0 ${r}% ${r}%)`
            : `inset(0 ${r}% ${r}% 0)`;
        }
        swarm.placeAt(ag, frame, fx(p.v), p.v);
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
    tl.fromTo(tag, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.2 }, t0 + 1.05);
  }
  tl.add(swarm.moveTo(ag, frame, { duration: 0.35, offset: { x: 0.5, y: 0.5 } }), t0 + 1.15);
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

/* ---------- group builders ---------- */

function buildHeading(rootEl) {
  const $ = (s) => rootEl.querySelector(s);
  const [a, b] = AG.head;
  const tl = gsap.timeline();
  cursorIntro(tl, AG.head, 0);

  let t = typeWords(tl, $("[data-h1]"), a, 0.05, 0.05);
  t = typeWords(tl, $("[data-h2]"), a, t, 0.05);
  const t2 = typeWords(tl, $("[data-sub]"), b, 0.2, 0.02);

  cursorOutro(tl, AG.head, { at: Math.max(t, t2) + 0.4 });
  return tl;
}

function buildRow(card, agents) {
  const [A, B, C, D, E, F] = agents;
  const row = card.closest("[data-row]");
  const mirror = row.dataset.mirror === "1";
  const q = (s) => card.querySelector(s);
  const qa = (s) => [...card.querySelectorAll(s)];

  const ov = {};
  [B, C, D, E, F].forEach((i) => {
    ov[i] = makeOverlay(row);
  });

  const tl = gsap.timeline();
  cursorIntro(tl, agents, 0);

  // A drags the row frame out
  const base = drawFrame(tl, card, A, 0.05, mirror);

  // B opens the screenshot, then pops the project number
  const img = q("[data-pimg]");
  const from = mirror ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
  const ti = dragBox(tl, ov[B], B, img, row, 0.1, {
    tag: "figure.screenshot",
    dur: 0.4,
    pad: 0,
  });
  if (img) {
    tl.fromTo(
      img,
      { clipPath: from },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.55,
        ease: "power2.inOut",
        onComplete() {
          gsap.set(img, { clearProps: "clipPath" });
        },
      },
      ti - 0.05
    );
  }
  const num = q("[data-pnum]");
  if (num) {
    const final = num.dataset.n;
    const target = parseInt(final, 10);
    const o = { v: 0 };
    tl.add(swarm.moveTo(B, num, { duration: 0.3 }), ti + 0.5);
    tl.add(() => swarm.click(B), ti + 0.8);
    tl.fromTo(
      num,
      { autoAlpha: 0, scale: 0.5 },
      { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" },
      ti + 0.8
    );
    tl.fromTo(
      o,
      { v: 0 },
      {
        v: target,
        duration: 0.5,
        ease: "none",
        onUpdate() {
          num.textContent = String(Math.round(o.v)).padStart(2, "0");
        },
        onComplete() {
          num.textContent = final;
        },
      },
      ti + 0.8
    );
  }

  // C draws the title box and writes the title
  const title = q("[data-title]");
  let tc = dragBox(tl, ov[C], C, title, row, Math.max(0.3, base - 0.35), {
    tag: "h3.title",
    dur: 0.3,
  });
  tc = typeWords(tl, title, C, tc, 0.04);

  // D draws the description box and writes it word by word
  const desc = q("[data-desc]");
  let td = dragBox(tl, ov[D], D, desc, row, Math.max(0.5, base - 0.2), {
    tag: "p.description",
    dur: 0.35,
  });
  td = typeWords(tl, desc, D, td, 0.022);

  // E and F build the tech chips, two at a time
  let chipsEnd = base;
  qa("[data-chip]").forEach((chip, k) => {
    const ag = k % 2 ? F : E;
    const at = base + 0.3 + Math.floor(k / 2) * 0.6;
    const te = dragBox(tl, ov[ag], ag, chip, row, at, {
      tag: "span.chip",
      dur: 0.18,
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
    chipsEnd = Math.max(chipsEnd, te + 0.4);
  });

  // C draws the divider, builds each link, then the corner arrow
  let tk = Math.max(tc, chipsEnd) + 0.1;
  const rule = q("[data-rule]");
  if (rule) {
    tl.add(swarm.moveTo(C, rule, { duration: 0.3, offset: { x: 0, y: 0.5 } }), tk);
    tl.add(() => swarm.click(C), tk + 0.3);
    tl.to(rule, { scaleX: 1, duration: 0.45, ease: "power3.out" }, tk + 0.3);
    tk += 0.55;
  }
  qa("[data-link]").forEach((link) => {
    const text = link.querySelector("[data-link-text]");
    const arrow = link.querySelector("[data-link-arrow]");
    const te = dragBox(tl, ov[C], C, link, row, tk, {
      tag: "a.link",
      dur: 0.2,
      pad: 2,
    });
    tl.fromTo(
      link,
      { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 0.25,
        ease: "power2.out",
        onComplete() {
          gsap.set(link, { clearProps: "clipPath" });
        },
      },
      te - 0.02
    );
    if (text) tl.add(typeReveal(text, { duration: 0.25, agent: C }), te + 0.1);
    if (arrow) {
      tl.fromTo(
        arrow,
        { autoAlpha: 0, x: -8 },
        { autoAlpha: 1, x: 0, duration: 0.25, ease: "power2.out" },
        te + 0.3
      );
    }
    tk = te + 0.45;
  });
  const corner = q("[data-arrow]");
  if (corner) {
    tl.add(swarm.moveTo(C, corner, { duration: 0.25 }), tk);
    tl.add(() => swarm.click(C), tk + 0.25);
    tl.to(corner, { autoAlpha: 1, duration: 0.25 }, tk + 0.25);
    tk += 0.5;
  }

  cursorOutro(tl, agents, { at: Math.max(tk, td, chipsEnd) + 0.4 });
  return tl;
}

/* ---------- hover effects (mouse devices only) ---------- */

function setupHover(root) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return () => {};
  }
  const offs = [];
  const on = (el, type, fn) => {
    el.addEventListener(type, fn);
    offs.push(() => el.removeEventListener(type, fn));
  };

  const ctx = gsap.context(() => {
    root.querySelectorAll("[data-row]").forEach((row) => {
      // 3D tilt + red spotlight that follows the mouse
      gsap.set(row, { transformPerspective: 900 });
      const rx = gsap.quickTo(row, "rotationX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(row, "rotationY", { duration: 0.5, ease: "power3.out" });
      let raf = 0;
      on(row, "pointermove", (e) => {
        const r = row.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 7);
        rx((0.5 - py) * 7);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          row.style.setProperty("--mx", `${e.clientX - r.left}px`);
          row.style.setProperty("--my", `${e.clientY - r.top}px`);
        });
      });
      on(row, "pointerleave", () => {
        ry(0);
        rx(0);
      });

      // round OPEN bubble that follows the mouse over the screenshot
      const media = row.querySelector("[data-pimg]");
      const bubble = row.querySelector("[data-bubble]");
      if (media && bubble) {
        gsap.set(bubble, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
        const bx = gsap.quickTo(bubble, "x", { duration: 0.35, ease: "power3.out" });
        const by = gsap.quickTo(bubble, "y", { duration: 0.35, ease: "power3.out" });
        on(media, "pointerenter", () =>
          gsap.to(bubble, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(2)" })
        );
        on(media, "pointermove", (e) => {
          const r = media.getBoundingClientRect();
          bx(e.clientX - r.left);
          by(e.clientY - r.top);
        });
        on(media, "pointerleave", () =>
          gsap.to(bubble, { scale: 0, autoAlpha: 0, duration: 0.2 })
        );
      }

      // magnetic pull on the link buttons
      row.querySelectorAll("[data-link]").forEach((link) => {
        const qx = gsap.quickTo(link, "x", { duration: 0.3, ease: "power3.out" });
        const qy = gsap.quickTo(link, "y", { duration: 0.3, ease: "power3.out" });
        const clamp = (v) => Math.max(-5, Math.min(5, v));
        on(link, "pointermove", (e) => {
          const r = link.getBoundingClientRect();
          qx(clamp((e.clientX - (r.left + r.width / 2)) * 0.25));
          qy(clamp((e.clientY - (r.top + r.height / 2)) * 0.25));
        });
        on(link, "pointerleave", () => {
          qx(0);
          qy(0);
        });
      });
    });
  }, root);

  return () => {
    offs.forEach((off) => off());
    ctx.revert();
  };
}

/* ---------- one project row ---------- */

function Row({ project: p, n }) {
  const links = linksOf(p);
  const src = imageSrc(p.image);
  const num = String(n).padStart(2, "0");
  const mirror = n % 2 === 0;
  const primary = p.demo || p.github;
  const Media = primary ? "a" : "div";
  const mediaProps = primary
    ? { href: primary, target: "_blank", rel: "noreferrer", "aria-label": `Open ${p.title}` }
    : {};

  return (
    <li
      data-row
      data-mirror={mirror ? "1" : "0"}
      className="group/card relative rounded-[3px] transition-[translate,box-shadow,opacity] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_-14px_rgba(214,26,41,0.45)]"
    >
      <Shell data-card="" tag={`article.project-${num}`} mirror={mirror} className="w-full">
        <div className="grid lg:min-h-[clamp(20rem,56svh,34rem)] lg:grid-cols-12">
          {/* screenshot with the big project number */}
          <Media
            data-pimg
            {...mediaProps}
            className={`relative m-2 block aspect-video overflow-hidden rounded-[2px] border border-white/10 bg-[#0b0b0b] lg:col-span-7 lg:aspect-auto ${
              mirror ? "lg:order-2" : ""
            }`}
          >
            {src ? (
              <img
                src={src}
                alt={`${p.title} screenshot`}
                loading="lazy"
                draggable="false"
                className="absolute inset-0 size-full object-cover object-top transition-transform duration-700 group-hover/card:scale-[1.07]"
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
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[150%] -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent duration-0 group-hover/card:translate-x-[420%] group-hover/card:duration-1000"
            />
            <span
              data-pnum
              data-n={num}
              className={`display absolute bottom-3 leading-none text-red transition-[color,translate] duration-300 [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] group-hover/card:-translate-y-1.5 group-hover/card:text-transparent group-hover/card:[-webkit-text-stroke:1.5px_#d61a29] group-hover/card:[text-shadow:none] text-[clamp(2.6rem,10vw,4rem)] lg:text-[min(5.4vw,11svh)] ${
                mirror ? "right-4 origin-bottom-right" : "left-4 origin-bottom-left"
              }`}
            >
              {num}
            </span>
            {primary && (
              <span
                data-bubble
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-10 grid size-[72px] place-items-center rounded-full bg-red text-[0.62rem] font-bold tracking-widest text-white"
              >
                OPEN ↗
              </span>
            )}
          </Media>

          {/* text side */}
          <div className="relative flex min-w-0 flex-col p-5 lg:col-span-5 lg:p-[min(2rem,3.4svh)]">
            <span
              data-arrow
              aria-hidden="true"
              className="absolute right-4 top-4 text-lg leading-none text-muted transition-[color,translate,scale] duration-300 group-hover/card:-translate-y-[3px] group-hover/card:translate-x-[3px] group-hover/card:scale-[1.2] group-hover/card:text-red lg:right-6 lg:top-6"
            >
              ↗
            </span>

            <h3
              data-title
              className="display relative block w-fit pr-10 text-[clamp(1.8rem,7vw,2.4rem)] lg:text-[min(3.4vw,7svh)]"
            >
              <Words text={p.title} />
              <i
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-[3px] w-full origin-left scale-x-0 bg-red transition-transform duration-[400ms] group-hover/card:scale-x-100"
              />
            </h3>

            <p
              data-desc
              className="mt-[2svh] block max-w-[30rem] text-[min(1rem,2.1svh)] leading-relaxed text-ink/65 transition-colors duration-300 group-hover/card:text-ink/90"
            >
              <Words text={p.desc} />
            </p>

            <ul className="mt-[2.4svh] flex flex-wrap gap-2">
              {p.tech.map((t) => (
                <li
                  key={t}
                  data-chip
                  className="group/chip flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-3 transition-[translate,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-red/60 hover:bg-red/10"
                >
                  <span data-logo className="inline-flex">
                    <Logo item={toolItem(t)} className="size-4" badgeClass="text-[0.5rem]" />
                  </span>
                  <span
                    data-chip-name
                    className="inline-block text-[0.68rem] font-medium tracking-wide text-muted transition-colors group-hover/chip:text-ink"
                  >
                    {t}
                  </span>
                </li>
              ))}
            </ul>

            <div className="relative mt-6 flex flex-wrap gap-2.5 pt-[2.2svh] lg:mt-auto">
              <i
                data-rule
                className="absolute left-0 top-0 h-px w-full origin-left bg-white/10"
              />
              {links.map((l) => (
                <a
                  key={l.label}
                  data-link
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group/link relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-white/15 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/80 transition-colors duration-300 hover:border-red hover:text-white"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 origin-left scale-x-0 bg-red transition-transform duration-300 group-hover/link:scale-x-100"
                  />
                  <span data-link-text className="relative inline-block">
                    {l.label}
                  </span>
                  <span
                    data-link-arrow
                    aria-hidden="true"
                    className="relative inline-block transition-transform duration-300 group-hover/link:-translate-y-[3px] group-hover/link:translate-x-[3px]"
                  >
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </Shell>

      {/* red spotlight that follows the mouse */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] rounded-[3px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), rgba(214,26,41,0.14), transparent 60%)",
        }}
      />
    </li>
  );
}

export default function Projects() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { headline } = content.sections.find((s) => s.id === "projects");
  const { projects } = content;
  const liveDemos = content.hero.stats[1] && content.hero.stats[1].value;
  const sub = `${projects.length} projects, ${liveDemos} of them live. Open the demo or read the code behind each one.`;

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
      gsap.set(
        all(
          "[data-w],[data-pnum],[data-chip],[data-chip-name],[data-logo],[data-link],[data-link-text],[data-link-arrow],[data-arrow],[data-sel],[data-tag]"
        ),
        { autoAlpha: 0 }
      );
      all("[data-pimg]").forEach((n) => {
        const m = n.closest("[data-row]").dataset.mirror === "1";
        gsap.set(n, {
          autoAlpha: 1,
          clipPath: m ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
        });
      });
      gsap.set(all("[data-handle]"), { scale: 0 });
      gsap.set(all("[data-bar]"), { scaleX: 0 });
      gsap.set(all("[data-rule]"), { scaleX: 0 });
      gsap.set(all("[data-bg]"), {
        clipPath: "inset(0 100% 100% 0)",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.12)",
      });
      gsap.set(all("[data-sel]"), { width: "0%", height: "0%" });
    }, root);

    const headingEl = el.querySelector("header");
    const groups = [
      headingEl && {
        element: headingEl,
        agents: AG.head,
        build: () => buildHeading(el),
      },
      ...all("[data-card]").map((card, i) => {
        const agents = AG.rows[i % 2];
        return {
          element: card,
          agents,
          build: (node) => buildRow(node, agents),
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
    const stopHover = setupHover(el);

    return () => {
      stopHover();
      stop();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled]);

  return (
    <section
      id="projects"
      ref={root}
      className="relative flex min-h-svh flex-col gap-[3svh] border-t border-line px-gutter py-[5svh]"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <h2 className="display flex min-w-0 flex-wrap gap-x-[0.28em] text-[min(5.2vw,9.5svh)] max-lg:text-[clamp(2.4rem,11vw,3.6rem)]">
          <span data-h1 className="block w-fit">
            <Words text={headline[0]} />
          </span>
          <span data-h2 className="block w-fit text-red">
            <Words text={headline[1]} />
          </span>
        </h2>
        <p
          data-sub
          className="block max-w-[26rem] text-[min(0.95rem,2.1svh)] leading-relaxed text-ink/65"
        >
          <Words text={sub} />
        </p>
      </header>

      <ul className="flex flex-1 flex-col gap-4 lg:gap-[2.4svh] [&:has(li:hover)>li:not(:hover)]:opacity-50">
        {projects.map((p, i) => (
          <Row key={p.title} project={p} n={i + 1} />
        ))}
      </ul>
    </section>
  );
}
