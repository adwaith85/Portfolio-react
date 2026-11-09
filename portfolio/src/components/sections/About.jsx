import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { swarm } from "../cursors/swarmApi";
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

/* Cursor leases: heading 2, photo card 2, intro 2, approach 2, focus 2,
   details 3, qualities 2, connection 2. */
const AG = {
  head: [0, 1],
  photo: [2, 3],
  intro: [4, 5],
  approach: [6, 7],
  focus: [8, 9],
  details: [10, 11, 12],
  qualities: [13, 14],
  contact: [15, 16],
};

const NORMAL = { fill: "#121212", edge: "rgba(255,255,255,0.1)" };
const HOT = { fill: "#2a0a0f", edge: "rgba(214,26,41,0.45)" };

/* same glow as the hero photo: red on the right edge, blue on the left */
const PHOTO_GLOW =
  "drop-shadow(18px 0 26px rgba(214,26,41,0.6)) drop-shadow(-16px 0 26px rgba(50,110,255,0.45))";

const photoSrc = (p) => (!p ? "/photo.png" : /^(https?:)?\//.test(p) ? p : `/${p}`);

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

/* ---------- cursor building blocks ---------- */

/* cursor drags the card frame out corner to corner, recolors it, nudges it, sweeps its red bar */
function drawFrame(tl, frame, ag, t0 = 0) {
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

  const tl0 = typeWords(tl, $("[data-label]"), b, 0.05, 0.03);
  let t = typeWords(tl, $("[data-h1]"), a, 0.05, 0.05);
  t = typeWords(tl, $("[data-h2]"), a, t, 0.05);
  const t2 = typeWords(tl, $("[data-sub]"), b, Math.max(tl0, 0.4), 0.02);

  cursorOutro(tl, AG.head, { at: Math.max(t, t2) + 0.4 });
  return tl;
}

/* left card: A drags it out, B clicks the photo area and it rises in with the blue + red glow,
   then the name, role and location are written */
function buildPhoto(card, host) {
  const [A, B] = AG.photo;
  const q = (s) => card.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.photo, 0);

  const base = drawFrame(tl, card, A, 0.05);

  const fig = q("[data-photo]");
  const img = q("[data-pimg]");
  const glow = q("[data-pglow]");
  let t = dragBox(tl, ov, B, fig, host, Math.max(0.2, base - 0.5), {
    tag: "figure.photo",
    dur: 0.4,
    pad: 0,
  });
  if (img) {
    tl.fromTo(
      img,
      { clipPath: "inset(100% 0% 0% 0%)", y: 40, autoAlpha: 1 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        onComplete() {
          gsap.set(img, { clearProps: "clipPath" });
        },
      },
      t - 0.05
    );
  }
  if (glow) tl.to(glow, { autoAlpha: 1, duration: 0.9 }, t + 0.1);
  t += 0.7;

  t = typeWords(tl, q("[data-name]"), A, Math.max(t, base), 0.045);
  t = typeWords(tl, q("[data-role]"), B, t - 0.05, 0.03);

  const pin = q("[data-pin]");
  if (pin) t = popIn(tl, B, pin, t, { travel: 0.25, from: { autoAlpha: 0, scale: 0 } });
  t = typeWords(tl, q("[data-loc]"), B, t - 0.1, 0.03);

  cursorOutro(tl, AG.photo, { at: t + 0.4 });
  return tl;
}

/* intro card: A drags it out, B selects the kicker and writes it,
   then selects the paragraph and writes it word by word */
function buildIntro(card, host) {
  const [A, B] = AG.intro;
  const q = (s) => card.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.intro, 0);

  const base = drawFrame(tl, card, A, 0.05);

  const kicker = q("[data-kicker]");
  let t = dragBox(tl, ov, B, kicker, host, Math.max(0.3, base - 0.35), {
    tag: "p.kicker",
    dur: 0.25,
  });
  t = typeWords(tl, kicker, B, t, 0.04);

  const bio = q("[data-bio]");
  let tb = dragBox(tl, ov, B, bio, host, Math.max(t, base - 0.1), {
    tag: "p.bio",
    dur: 0.35,
  });
  tb = typeWords(tl, bio, B, tb, 0.02);

  cursorOutro(tl, AG.intro, { at: Math.max(t, tb) + 0.4 });
  return tl;
}

/* approach card: A drags it out, B writes the kicker and the paragraph */
function buildApproach(card, host) {
  const [A, B] = AG.approach;
  const q = (s) => card.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.approach, 0);

  const base = drawFrame(tl, card, A, 0.05);

  const kicker = q("[data-kicker]");
  let t = dragBox(tl, ov, B, kicker, host, Math.max(0.3, base - 0.35), {
    tag: "p.kicker",
    dur: 0.25,
  });
  t = typeWords(tl, kicker, B, t, 0.04);

  const text = q("[data-approach]");
  let tb = dragBox(tl, ov, B, text, host, Math.max(t, base - 0.1), {
    tag: "p.approach",
    dur: 0.35,
  });
  tb = typeWords(tl, text, B, tb, 0.02);

  cursorOutro(tl, AG.approach, { at: Math.max(t, tb) + 0.4 });
  return tl;
}

/* focus card: the four points are selected one by one, their dots pop and the text is written */
function buildFocus(card, host) {
  const [A, B] = AG.focus;
  const q = (s) => card.querySelector(s);
  const ov = { [A]: makeOverlay(host), [B]: makeOverlay(host) };
  const tl = gsap.timeline();
  cursorIntro(tl, AG.focus, 0);

  const base = drawFrame(tl, card, A, 0.05);

  const kicker = q("[data-kicker]");
  let t = dragBox(tl, ov[B], B, kicker, host, Math.max(0.3, base - 0.35), {
    tag: "p.kicker",
    dur: 0.25,
  });
  t = typeWords(tl, kicker, B, t, 0.04);

  let end = t;
  [...card.querySelectorAll("[data-fitem]")].forEach((item, k) => {
    const ag = k % 2 ? B : A;
    const at = Math.max(t, base) + k * 0.3;
    let te = dragBox(tl, ov[ag], ag, item, host, at, {
      tag: "li.focus",
      dur: 0.18,
      pad: 2,
    });
    const dot = item.querySelector("[data-fdot]");
    if (dot) te = popIn(tl, ag, dot, te, { travel: 0.18, from: { autoAlpha: 0, scale: 0 } });
    const tt = typeWords(tl, item.querySelector("[data-ftext]"), ag, te, 0.02);
    end = Math.max(end, tt);
  });

  cursorOutro(tl, AG.focus, { at: end + 0.4 });
  return tl;
}

/* details card: rows type in one after another, a cursor follows each */
function buildDetails(card, host) {
  const ags = AG.details;
  const q = (s) => card.querySelector(s);
  const ov = {};
  ags.forEach((i) => (ov[i] = makeOverlay(host)));
  const tl = gsap.timeline();
  cursorIntro(tl, ags, 0);

  const base = drawFrame(tl, card, ags[0], 0.05);

  let t = Math.max(0.4, base - 0.3);
  [...card.querySelectorAll("[data-drow]")].forEach((row, k) => {
    const ag = ags[1 + (k % (ags.length - 1))];
    const key = row.querySelector("[data-dk]");
    const val = row.querySelector("[data-dv]");
    const rule = row.querySelector("[data-drule]");
    if (rule) {
      tl.add(swarm.moveTo(ag, rule, { duration: 0.25, offset: { x: 0, y: 0.5 } }), t);
      tl.add(() => swarm.click(ag), t + 0.25);
      tl.to(rule, { scaleX: 1, duration: 0.4, ease: "power3.out" }, t + 0.25);
      t += 0.3;
    }
    const tk = typeWords(tl, key, ag, t, 0.035);
    t = typeWords(tl, val, ag, tk - 0.1, 0.025) + 0.05;
  });

  cursorOutro(tl, ags, { at: t + 0.4 });
  return tl;
}

/* qualities: heading is written, then each badge zooms in one by one */
function buildQualities(block, host) {
  const [A, B] = AG.qualities;
  const q = (s) => block.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.qualities, 0);

  const head = q("[data-shead]");
  let t = dragBox(tl, ov, A, head, host, 0.05, { tag: "p.qualities", dur: 0.25 });
  t = typeWords(tl, head, A, t, 0.04);

  let end = t;
  [...block.querySelectorAll("[data-badge]")].forEach((b, k) => {
    const ag = k % 2 ? B : A;
    const at = Math.max(t, 0.35) + k * 0.22;
    end = Math.max(end, popIn(tl, ag, b, at, { travel: 0.2, from: { autoAlpha: 0, scale: 0.3 } }));
  });

  cursorOutro(tl, AG.qualities, { at: end + 0.6 });
  return tl;
}

/* connection: the kicker and CTA are written, then the links pop in */
function buildContact(block, host) {
  const [A, B] = AG.contact;
  const q = (s) => block.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.contact, 0);

  const head = q("[data-chead]");
  let t = dragBox(tl, ov, A, head, host, 0.05, { tag: "p.connection", dur: 0.25 });
  t = typeWords(tl, head, A, t, 0.04);

  const cta = q("[data-cta]");
  let tc = dragBox(tl, ov, B, cta, host, Math.max(t, 0.35), {
    tag: "a.email",
    dur: 0.22,
    pad: 2,
  });
  tc = typeWords(tl, cta, B, tc, 0.02);

  let end = Math.max(t, tc);
  const arrow = q("[data-carrow]");
  if (arrow) end = Math.max(end, popIn(tl, B, arrow, end, { travel: 0.2, from: { autoAlpha: 0, scale: 0 } }));

  [...block.querySelectorAll("[data-slink]")].forEach((link, k) => {
    const ag = k % 2 ? A : B;
    const at = end + 0.08 + k * 0.2;
    end = Math.max(end, popIn(tl, ag, link, at, { travel: 0.2, from: { autoAlpha: 0, scale: 0.4 } }));
  });

  cursorOutro(tl, AG.contact, { at: end + 0.4 });
  return tl;
}

/* ---------- the section ---------- */

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-red" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function About() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const [photoOk, setPhotoOk] = useState(true);
  const { about } = content;
  const { headline, num, label } = content.sections.find((s) => s.id === "about");
  const name = content.hero.name;

  const rows = [
    { k: "Location", v: about.location },
    { k: "Background", v: about.background },
    { k: "Specialization", v: about.specialization },
    { k: "Languages", v: about.languages.join(", ") },
    { k: "Interests", v: about.interests.join(", ") },
  ];

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
          "[data-w],[data-badge],[data-pin],[data-fdot],[data-carrow],[data-slink],[data-sel],[data-tag]"
        ),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-pimg]"), { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(all("[data-handle]"), { scale: 0 });
      gsap.set(all("[data-bar]"), { scaleX: 0 });
      gsap.set(all("[data-drule]"), { scaleX: 0 });
      gsap.set(all("[data-bg]"), {
        clipPath: "inset(0 100% 100% 0)",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.12)",
      });
      gsap.set(all("[data-sel]"), { width: "0%", height: "0%" });
    }, root);

    const headingEl = el.querySelector("header");
    const card = (n) => el.querySelector(`[data-card="${n}"]`);
    const groups = [
      headingEl && { element: headingEl, agents: AG.head, build: () => buildHeading(el) },
      card("photo") && {
        element: card("photo"),
        agents: AG.photo,
        build: (n) => buildPhoto(n, el),
      },
      card("intro") && {
        element: card("intro"),
        agents: AG.intro,
        build: (n) => buildIntro(n, el),
      },
      card("approach") && {
        element: card("approach"),
        agents: AG.approach,
        build: (n) => buildApproach(n, el),
      },
      card("focus") && {
        element: card("focus"),
        agents: AG.focus,
        build: (n) => buildFocus(n, el),
      },
      card("details") && {
        element: card("details"),
        agents: AG.details,
        build: (n) => buildDetails(n, el),
      },
      el.querySelector("[data-skills]") && {
        element: el.querySelector("[data-skills]"),
        agents: AG.qualities,
        build: (n) => buildQualities(n, el),
      },
      el.querySelector("[data-contact]") && {
        element: el.querySelector("[data-contact]"),
        agents: AG.contact,
        build: (n) => buildContact(n, el),
      },
    ].filter(Boolean);

    const stop = createViewportReveal({
      root: el,
      sectionId: "about",
      enabled,
      reduced,
      start: "top 95%",
      speed: 1.35,
      back: 2.2,
      groups,
    });
    const stopTilt = tiltTiles(el, "[data-tile]", { max: 5 });

    return () => {
      stopTilt();
      stop();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled]);

  const tile =
    "group/card relative rounded-[3px] transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_-14px_rgba(214,26,41,0.45)]";
  const spot = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] rounded-[3px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      style={SPOTLIGHT_STYLE}
    />
  );

  return (
    <section
      id="about"
      data-env="about"
      ref={root}
      className="relative flex min-h-svh flex-col gap-[3svh] border-t border-line px-gutter py-[5svh]"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <p data-label className="label mb-[1.2svh] block w-fit">
            <span className="text-red">
              <Words text={num} />
            </span>{" "}
            <Words text={`/ ${label}`} />
          </p>
          <h2 className="display flex flex-wrap gap-x-[0.28em] text-[min(5.2vw,9.5svh)] max-lg:text-[clamp(2.4rem,11vw,3.6rem)]">
            <span data-h1 className="block w-fit">
              <Words text={headline[0]} />
            </span>
            <span data-h2 className="block w-fit text-red">
              <Words text={headline[1]} />
            </span>
          </h2>
        </div>
        <p
          data-sub
          className="block max-w-[26rem] text-[min(0.95rem,2.1svh)] leading-relaxed text-ink/65 transition-colors duration-200 hover:text-ink"
        >
          <Words text={about.tagline} />
        </p>
      </header>

      <div className="grid flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] lg:gap-[1.4vw]">
        {/* LEFT: photo, name, role, location */}
        <div data-tile className={`${tile} h-full`}>
          <Shell data-card="photo" tag="article.photo" colors={HOT} className="h-full">
            <div className="flex h-full flex-col p-4 lg:p-[min(1.4rem,2.6svh)]">
              <figure
                data-photo
                className="group/photo relative flex h-[22rem] items-end justify-center overflow-hidden lg:h-auto lg:min-h-0 lg:flex-1"
              >
                <i
                  data-pglow
                  aria-hidden="true"
                  className="absolute -inset-[8%] bg-[radial-gradient(ellipse_at_66%_55%,rgba(214,26,41,0.28),transparent_58%),radial-gradient(ellipse_at_34%_55%,rgba(50,110,255,0.22),transparent_52%)] blur-2xl"
                />
                {photoOk ? (
                  <img
                    data-pimg
                    src={photoSrc(about.photo)}
                    alt={name}
                    loading="lazy"
                    draggable="false"
                    onError={() => setPhotoOk(false)}
                    className="relative block h-full w-auto max-w-full object-contain object-bottom transition-transform duration-700 group-hover/photo:scale-[1.03]"
                    style={{ filter: PHOTO_GLOW }}
                  />
                ) : (
                  <span
                    data-pimg
                    className="label relative grid size-full place-items-center border border-dashed border-white/15 text-muted/60"
                  >
                    public/photo.png
                  </span>
                )}
              </figure>

              <div className="mt-[2svh] w-full border-t border-white/10 pt-[1.6svh]">
                <h3
                  data-name
                  className="display block w-fit text-[clamp(1.8rem,7vw,2.4rem)] transition-colors duration-300 hover:text-red lg:text-[min(2.6vw,5.2svh)]"
                >
                  <Words text={name} />
                  <span className="text-red">.</span>
                </h3>
                <p
                  data-role
                  className="mt-[0.7svh] flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-gold transition-colors duration-200 hover:text-ink"
                >
                  <Words text={about.role} />
                </p>
                <p className="group/loc mt-[0.9svh] flex items-center gap-2 text-[0.9rem] text-ink/75 transition-colors duration-200 hover:text-ink">
                  <span data-pin className="inline-flex">
                    <PinIcon />
                  </span>
                  <span data-loc>
                    <Words text={about.location} />
                  </span>
                </p>
              </div>
            </div>
          </Shell>
          {spot}
        </div>

        {/* RIGHT: intro, approach, focus, details */}
        <div className="flex min-w-0 flex-col gap-4 lg:gap-[1.4svh]">
          <div data-tile className={tile}>
            <Shell data-card="intro" tag="article.intro" className="w-full">
              <div className="relative p-5 lg:p-[min(1.4rem,2.6svh)]">
                <p
                  data-kicker
                  className="label block w-fit transition-colors duration-200 hover:text-ink"
                >
                  <Words text="Who I am" />
                </p>
                <p
                  data-bio
                  className="mt-[1.2svh] block max-w-[44rem] text-[min(1.02rem,2.3svh)] leading-relaxed text-ink/85 transition-colors duration-200 hover:text-ink"
                >
                  <Words text={about.bio} />
                </p>
              </div>
            </Shell>
            {spot}
          </div>

          <div data-tile className={tile}>
            <Shell data-card="approach" tag="article.approach" className="w-full">
              <div className="relative p-5 lg:p-[min(1.4rem,2.6svh)]">
                <p
                  data-kicker
                  className="label block w-fit transition-colors duration-200 hover:text-ink"
                >
                  <Words text="My approach" />
                </p>
                <p
                  data-approach
                  className="mt-[1.2svh] block max-w-[44rem] text-[min(0.95rem,2.1svh)] leading-relaxed text-ink/70 transition-colors duration-200 hover:text-ink"
                >
                  <Words text={about.approach} />
                </p>
              </div>
            </Shell>
            {spot}
          </div>

          <div data-tile className={tile}>
            <Shell data-card="focus" tag="article.focus" className="w-full">
              <div className="relative p-4 lg:p-[min(1.2rem,2.2svh)]">
                <p
                  data-kicker
                  className="label block w-fit transition-colors duration-200 hover:text-ink"
                >
                  <Words text="What I focus on" />
                </p>
                <ul className="mt-[1svh] grid gap-1.5 sm:grid-cols-2">
                  {about.focus.map((item) => (
                    <li
                      key={item}
                      data-fitem
                      className="group/focus relative flex items-start gap-2 rounded-[3px] px-2 py-1.5 transition-[background-color,translate] duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05]"
                    >
                      <i
                        data-fdot
                        className="mt-[0.42rem] size-1.5 shrink-0 rounded-full bg-red transition-[scale] duration-300 group-hover/focus:scale-150"
                      />
                      <span
                        data-ftext
                        className="block text-[min(0.84rem,1.85svh)] leading-snug text-ink/70 transition-[color,translate] duration-200 group-hover/focus:translate-x-0.5 group-hover/focus:text-ink"
                      >
                        <Words text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Shell>
            {spot}
          </div>

          <div data-tile className={tile}>
            <Shell data-card="details" tag="dl.details" className="w-full">
              <div className="relative p-4 lg:p-[min(1.2rem,2.2svh)]">
                <p
                  data-kicker
                  className="label block w-fit transition-colors duration-200 hover:text-ink"
                >
                  <Words text="Personal details" />
                </p>
                <dl className="mt-[0.4svh]">
                  {rows.map((r) => (
                    <div
                      key={r.k}
                      data-drow
                      className="group/row relative grid grid-cols-[6.8rem_1fr] gap-3 py-[0.9svh] transition-colors duration-200 hover:bg-white/[0.04]"
                    >
                      <i
                        data-drule
                        className="absolute left-0 top-0 h-px w-full origin-left bg-white/10"
                      />
                      <dt
                        data-dk
                        className="label block w-fit self-center transition-colors duration-200 group-hover/row:text-red"
                      >
                        <Words text={r.k} />
                      </dt>
                      <dd
                        data-dv
                        className="block w-fit text-[min(0.9rem,1.95svh)] text-ink transition-[translate] duration-200 group-hover/row:translate-x-1"
                      >
                        <Words text={r.v} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Shell>
            {spot}
          </div>
        </div>
      </div>

      {/* BOTTOM STRIP: qualities and connection CTA */}
      <div className="grid gap-4 border-t border-line pt-[2svh] lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] lg:items-end lg:gap-[1.4vw]">
        <div data-skills className="min-w-0">
          <p
            data-shead
            className="label mb-2.5 block w-fit transition-colors duration-200 hover:text-ink"
          >
            <Words text="Professional qualities" />
          </p>
          <ul className="flex flex-wrap gap-2">
            {about.softSkills.map((s) => (
              <li
                key={s}
                data-badge
                className="group/chip flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-3 pr-4 text-[0.78rem] font-medium tracking-wide text-ink/80 transition-[translate,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-red/60 hover:bg-red/10 hover:text-ink"
              >
                <i className="size-1.5 rounded-full bg-red transition-[scale] duration-300 group-hover/chip:scale-[1.8]" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div
          data-contact
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="min-w-0">
            <p
              data-chead
              className="label mb-1 block w-fit transition-colors duration-200 hover:text-ink"
            >
              <Words text="Connection" />
            </p>
            <a
              data-cta
              href={`mailto:${content.email}`}
              className="group/cta inline-flex max-w-full items-center gap-2 text-[min(1.05rem,2.3svh)] font-semibold text-ink transition-colors duration-200 hover:text-red"
            >
              <span className="truncate">
                <Words text="Let's build something." />
              </span>
              <span
                data-carrow
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
              >
                ↗
              </span>
            </a>
            <p className="mt-1 block truncate text-[0.78rem] text-muted">
              <a
                href={`mailto:${content.email}`}
                className="transition-colors duration-200 hover:text-red"
              >
                {content.email}
              </a>
            </p>
          </div>
          <div className="flex shrink-0 gap-4">
            <a
              data-slink
              href={content.social.github}
              target="_blank"
              rel="noreferrer"
              className="group/slink inline-flex items-center gap-1 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/75 transition-colors duration-200 hover:text-red"
            >
              GitHub
              <span className="inline-block transition-transform duration-300 group-hover/slink:-translate-y-0.5 group-hover/slink:translate-x-0.5">
                ↗
              </span>
            </a>
            <a
              data-slink
              href={content.social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="group/slink inline-flex items-center gap-1 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink/75 transition-colors duration-200 hover:text-red"
            >
              LinkedIn
              <span className="inline-block transition-transform duration-300 group-hover/slink:-translate-y-0.5 group-hover/slink:translate-x-0.5">
                ↗
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
