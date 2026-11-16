import { useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
  typeWords,
  popIn,
} from "../../engine/swarmBuild";

/* ─── cursor agent leases ─── */
const AG = {
  head:     [0, 1],
  photo:    [2, 3],
  intro:    [4, 5],
  focus:    [6, 7],
  qualities:[8, 9],
};

const photoSrc = (p) => (!p ? "/photo.png" : /^(https?:)?\//.test(p) ? p : `/${p}`);

/* ─── cursor builders ─── */
function buildHeading(rootEl) {
  const $ = (s) => rootEl.querySelector(s);
  const [a, b] = AG.head;
  const tl = gsap.timeline();
  cursorIntro(tl, AG.head, 0);
  const tl0 = typeWords(tl, $("[data-label]"), b, 0.03, 0.02);
  let t = typeWords(tl, $("[data-h1]"), a, 0.03, 0.03);
  t = typeWords(tl, $("[data-h2]"), a, t, 0.03);
  const t2 = typeWords(tl, $("[data-sub]"), b, Math.max(tl0, 0.25), 0.015);
  cursorOutro(tl, AG.head, { at: Math.max(t, t2) + 0.25 });
  return tl;
}

function buildPhoto(block, host) {
  const [A, B] = AG.photo;
  const q = (s) => block.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.photo, 0);

  const fig = q("[data-photo]");
  let t = dragBox(tl, ov, A, fig, host, 0.08, { tag: "figure.photo", dur: 0.3, pad: 0 });
  const img = q("[data-pimg]");
  if (img) {
    tl.fromTo(
      img,
      { clipPath: "inset(100% 0% 0% 0%)", autoAlpha: 1 },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.65, ease: "power3.out",
        onComplete() { gsap.set(img, { clearProps: "clipPath" }); }
      },
      t - 0.05
    );
  }
  t += 0.6;
  t = typeWords(tl, q("[data-name]"), A, Math.max(t, 0.5), 0.03);
  [...block.querySelectorAll("[data-drow]")].forEach((row, k) => {
    const ag = k % 2 ? B : A;
    const key = row.querySelector("[data-dk]");
    const val = row.querySelector("[data-dv]");
    const rule = row.querySelector("[data-drule]");
    if (rule) { tl.to(rule, { scaleX: 1, duration: 0.3, ease: "power3.out" }, t); t += 0.18; }
    const tk = typeWords(tl, key, ag, t, 0.025);
    t = typeWords(tl, val, ag, tk - 0.08, 0.018) + 0.04;
  });

  cursorOutro(tl, AG.photo, { at: t + 0.25 });
  return tl;
}

function buildIntro(block, host) {
  const B = AG.intro[1];
  const q = (s) => block.querySelector(s);
  const ov = makeOverlay(host);
  const tl = gsap.timeline();
  cursorIntro(tl, AG.intro, 0);

  let tb = dragBox(tl, ov, B, q("[data-bio]"), host, 0.05, { tag: "p.bio", dur: 0.28 });
  tb = typeWords(tl, q("[data-bio]"), B, tb, 0.015);
  cursorOutro(tl, AG.intro, { at: tb + 0.25 });
  return tl;
}

function buildFocus(block, host) {
  const [A, B] = AG.focus;
  const q = (s) => block.querySelector(s);
  const ov = { [A]: makeOverlay(host), [B]: makeOverlay(host) };
  const tl = gsap.timeline();
  cursorIntro(tl, AG.focus, 0);

  let t = dragBox(tl, ov[A], A, q("[data-kicker]"), host, 0.05, { tag: "p.kicker", dur: 0.2 });
  t = typeWords(tl, q("[data-kicker]"), A, t, 0.03);
  let end = t;
  [...block.querySelectorAll("[data-fitem]")].forEach((item, k) => {
    const ag = k % 2 ? B : A;
    const at = Math.max(t, 0.2) + k * 0.2;
    let te = dragBox(tl, ov[ag], ag, item, host, at, { tag: "li.focus", dur: 0.14, pad: 2 });
    const dot = item.querySelector("[data-fdot]");
    if (dot) te = popIn(tl, ag, dot, te, { travel: 0.14, from: { autoAlpha: 0, scale: 0 } });
    const tt = typeWords(tl, item.querySelector("[data-ftext]"), ag, te, 0.015);
    end = Math.max(end, tt);
  });
  [...block.querySelectorAll("[data-badge]")].forEach((b, k) => {
    const ag = k % 2 ? B : A;
    const at = Math.max(t, 0.25) + k * 0.14;
    end = Math.max(end, popIn(tl, ag, b, at, { travel: 0.14, from: { autoAlpha: 0, scale: 0.3 } }));
  });
  cursorOutro(tl, AG.focus, { at: end + 0.25 });
  return tl;
}

function buildQualities(block) {
  const [A, B] = AG.qualities;
  const tl = gsap.timeline();
  cursorIntro(tl, AG.qualities, 0);

  let t = 0.05;
  // Bottom detail rows (Background, Languages, Interests)
  [...block.querySelectorAll("[data-drow]")].forEach((row, k) => {
    const ag = k % 2 ? B : A;
    const rule = row.querySelector("[data-drule]");
    if (rule) { tl.to(rule, { scaleX: 1, duration: 0.28, ease: "power3.out" }, t); t += 0.14; }
    const tk = typeWords(tl, row.querySelector("[data-dk]"), ag, t, 0.025);
    t = typeWords(tl, row.querySelector("[data-dv]"), ag, tk - 0.06, 0.018) + 0.04;
  });

  cursorOutro(tl, AG.qualities, { at: t + 0.35 });
  return tl;
}

/* ─── cursor-reveal image component ─── */
function RevealImage({ src, name }) {
  const containerRef = useRef(null);
  const radiusRef = useRef(0);
  const rafRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const colorLayerRef = useRef(null);
  const [imgOk, setImgOk] = useState(true);

  /* update the radial mask on the color layer */
  const applyMask = useCallback((x, y, r) => {
    const el = colorLayerRef.current;
    if (!el) return;
    el.style.maskImage = `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 87%, transparent 100%)`;
    el.style.webkitMaskImage = `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 87%, transparent 100%)`;
  }, []);

  const startReveal = useCallback((x, y) => {
    posRef.current = { x, y };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const target = window.innerWidth < 768 ? 70 : 100;
    const startR = radiusRef.current;
    const startT = performance.now();
    const dur = 250;
    const tick = (now) => {
      const prog = Math.min(1, (now - startT) / dur);
      const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;
      radiusRef.current = startR + (target - startR) * ease;
      applyMask(posRef.current.x, posRef.current.y, radiusRef.current);
      if (prog < 1) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyMask]);

  const hideReveal = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startR = radiusRef.current;
    const startT = performance.now();
    const dur = 250;
    const tick = (now) => {
      const prog = Math.min(1, (now - startT) / dur);
      const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;
      radiusRef.current = startR * (1 - ease);
      applyMask(posRef.current.x, posRef.current.y, radiusRef.current);
      if (prog < 1) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyMask]);

  const onMouseMove = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    posRef.current = { x, y };
    applyMask(x, y, radiusRef.current);
  }, [applyMask]);

  const onMouseEnter = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    startReveal(e.clientX - r.left, e.clientY - r.top);
  }, [startReveal]);

  const onTouchStart = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const touch = e.touches[0];
    startReveal(touch.clientX - r.left, touch.clientY - r.top);
  }, [startReveal]);

  const onTouchMove = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const touch = e.touches[0];
    const x = touch.clientX - r.left;
    const y = touch.clientY - r.top;
    posRef.current = { x, y };
    applyMask(x, y, radiusRef.current);
  }, [applyMask]);

  /* initialize mask hidden */
  const initMask = useCallback(() => {
    applyMask(0, 0, 0);
  }, [applyMask]);

  if (!imgOk) {
    return (
      <div className="relative flex h-full w-full items-center justify-center border border-dashed border-white/15 text-[0.72rem] text-muted/50">
        public/photo.png
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="about-img-container relative h-full w-full cursor-crosshair overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={hideReveal}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={hideReveal}
    >
      {/* silhouette layer: always visible, bottom */}
      <img
        data-pimg
        src={src}
        alt=""
        loading="lazy"
        draggable="false"
        onError={() => setImgOk(false)}
        className="about-photo-base absolute inset-0 h-full w-full object-cover object-top"
        style={{
          filter: "brightness(0.04) contrast(1.3)",
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.08) 0%, rgba(214,26,41,0.12) 55%, transparent 80%)",
        }}
        aria-hidden="true"
      />
      {/* colored photo layer: revealed by mask */}
      <img
        ref={colorLayerRef}
        src={src}
        alt={name}
        loading="lazy"
        draggable="false"
        onLoad={initMask}
        className="about-photo-color absolute inset-0 h-full w-full object-cover object-top"
        style={{ maskImage: "none", WebkitMaskImage: "none" }}
      />
      {/* soft backlight glow behind silhouette */}
      <i
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.055) 0%, rgba(214,26,41,0.14) 48%, transparent 72%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

/* ─── main component ─── */
export default function About() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { about } = content;
  const { num, label } = content.sections.find((s) => s.id === "about");
  const name = content.hero.name;

  // Heading lives here so the About copy stays exactly as requested.
  const headline = ["I'M THE PERSON.", "BEHIND THE CODE."];

  const captionRows = [
    { k: "Role", v: about.role },
    { k: "Location", v: about.location },
  ];

  const detailRows = [
    { k: "Background", v: about.background },
    { k: "Languages", v: about.languages.join(", ") },
    { k: "Interests", v: about.interests.join(", ") },
  ];

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (s) => [...el.querySelectorAll(s)];

    if (reduced) {
      all("[data-sel]").forEach((n) => (n.style.display = "none"));
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(
        all("[data-w],[data-badge],[data-pin],[data-fdot],[data-carrow],[data-slink]"),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-pimg]"), { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(all("[data-drule]"), { scaleX: 0 });
    }, root);

    const headingEl = el.querySelector("header");
    const block = (n) => el.querySelector(`[data-block="${n}"]`);

    const groups = [
      headingEl && { element: headingEl, agents: AG.head, build: () => buildHeading(el) },
      block("photo") && { element: block("photo"), agents: AG.photo, build: (n) => buildPhoto(n, el) },
      block("intro") && { element: block("intro"), agents: AG.intro, build: (n) => buildIntro(n, el) },
      block("focus") && { element: block("focus"), agents: AG.focus, build: (n) => buildFocus(n, el) },
      block("qualities") && { element: block("qualities"), agents: AG.qualities, build: (n) => buildQualities(n) },
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

    return () => {
      stop();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled]);

  return (
    <section
      id="about"
      data-env="about"
      ref={root}
      className="relative flex min-h-svh flex-col justify-between gap-[2svh] overflow-x-clip border-t border-line px-gutter py-[3.5svh]"
    >
      <style>{ABOUT_STYLE}</style>

      {/* ── heading ── */}
      <header className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <p
            data-label
            data-cursor-hover
            className="label mb-[0.8svh] block w-fit cursor-hover transition-colors duration-200 hover:text-ink"
          >
            {/* <span className="text-red"><Words text={num} /></span>{" "} */}
            <Words text={` ${label}`} />
          </p>
          <h2 className="about-heading display flex flex-wrap gap-x-[0.28em] text-[min(4.8vw,8.5svh)] max-lg:text-[clamp(1.9rem,8.6vw,3rem)]">
            <span
              data-h1
              data-cursor-hover
              className="about-head-line about-head-line--light cursor-hover block w-fit"
            >
              <Words text={headline[0]} />
            </span>
            <span
              data-h2
              data-cursor-hover
              className="about-head-line about-head-line--red cursor-hover block w-fit text-red"
            >
              <Words text={headline[1]} />
            </span>
          </h2>
        </div>
        <p
          data-sub
          data-cursor-hover
          className="about-sub block max-w-[26rem] text-[min(0.9rem,1.9svh)] leading-relaxed text-ink/65"
        >
          <Words text={about.tagline} />
        </p>
      </header>

      {/* ── two-column body ── */}
      <div className="about-body grid flex-1 min-h-0 items-center gap-[2.5svh] lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-[4.5vw]">

        {/* ════ LEFT: text content ════ */}
        <div className="flex min-w-0 flex-col gap-[1.8svh]">

          {/* INTRO BIO */}
          <div data-block="intro" className="about-text-block">
            <p
              data-bio
              data-cursor-hover
              className="about-bio about-reveal-host block max-w-[42rem] leading-relaxed"
              tabIndex={0}
              aria-label={about.bio}
            >
              {about.bio.split(" ").map((w, i) => (
                <span key={i} className="about-reveal-word" style={{ transitionDelay: `${i * 16}ms` }} aria-hidden="true">
                  {i > 0 && " "}
                  <span data-w className="inline-block">{w}</span>
                </span>
              ))}
            </p>
          </div>

          {/* WHAT I FOCUS ON + professional qualities */}
          <div data-block="focus" className="about-text-block">
            <p
              data-kicker
              data-cursor-hover
              className="about-kicker label mb-[0.9svh] block w-fit cursor-hover"
            >
              <Words text="What I focus on" />
            </p>

            <div className="about-focus-grid">
              <ul className="about-focus-list grid gap-[0.55rem]">
                {about.focus.map((item) => (
                  <li
                    key={item}
                    data-fitem
                    data-cursor-hover
                    className="about-focus-item cursor-hover relative flex items-start gap-2.5 rounded-[4px] py-0.5 pr-2"
                    tabIndex={0}
                    aria-label={item}
                  >
                    <i
                      data-fdot
                      className="about-focus-dot mt-[0.4rem] size-1.5 shrink-0 rounded-full bg-red"
                    />
                    <span
                      data-ftext
                      className="about-focus-text block leading-snug"
                      aria-hidden="true"
                    >
                      {item.split(" ").map((w, i) => (
                        <span
                          key={i}
                          className="about-reveal-word"
                          style={{ transitionDelay: `${i * 16}ms` }}
                        >
                          {i > 0 && " "}
                          <span data-w className="inline-block">{w}</span>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>

              <ul className="about-chip-list flex flex-wrap content-start gap-2">
                {about.softSkills.map((s) => (
                  <li
                    key={s}
                    data-badge
                    data-cursor-hover
                    className="about-chip cursor-hover flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-3 pr-3.5 text-[0.75rem] font-medium tracking-wide text-ink/80"
                  >
                    <i className="size-1.5 rounded-full bg-red" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* BOTTOM DETAILS: background / languages / interests */}
          <div data-block="qualities" className="about-text-block">
            <dl className="about-meta-dl about-detail-dl">
              {detailRows.map((r) => (
                <div
                  key={r.k}
                  data-drow
                  data-cursor-hover
                  className="about-row cursor-hover relative py-[0.4svh]"
                >
                  <i data-drule className="about-rule-thin absolute left-0 top-0 h-px w-full origin-left" aria-hidden="true" />
                  <div className="flex items-baseline gap-3">
                    <dt data-dk className="label w-[6.2rem] shrink-0 self-start sm:w-[7rem]">
                      <Words text={r.k} />
                    </dt>
                    <dd data-dv className="about-row-value text-[min(0.86rem,1.85svh)] text-ink/85">
                      <Words text={r.v} />
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* ════ RIGHT: image + caption ════ */}
        <div
          data-block="photo"
          className="about-photo-col relative flex min-w-0 flex-col items-center gap-[1.2svh] lg:items-end lg:justify-center"
        >
          <div className="about-photo-card mx-auto flex w-full flex-col lg:mx-0">
            {/* image container: rounded border, transparent fill */}
            <div
              data-photo
              data-cursor-hover
              className="about-img-wrap cursor-hover group/imgcard relative overflow-hidden rounded-2xl border border-white/[0.1]"
              style={{ aspectRatio: "4/5" }}
            >
              <RevealImage src={photoSrc(about.photo)} name={name} />
            </div>

            {/* caption block below image */}
            <div className="mt-[1svh] w-full pl-[2px]">
              <h3
                data-name
                data-cursor-hover
                className="about-name display block w-fit cursor-hover text-[clamp(1.3rem,4.5vw,1.8rem)]"
              >
                <Words text={name} />
                <span className="text-red">.</span>
              </h3>

              <dl className="about-meta-dl mt-[0.6svh]">
                {captionRows.map((r) => (
                  <div
                    key={r.k}
                    data-drow
                    data-cursor-hover
                    className="about-row cursor-hover relative py-[0.4svh]"
                  >
                    <div className="flex items-baseline gap-3">
                      <dt data-dk className="label w-[6rem] shrink-0 self-start">
                        <Words text={r.k} />
                      </dt>
                      <dd data-dv className="about-row-value text-[min(0.82rem,1.75svh)] text-ink/80">
                        <Words text={r.v} />
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── scoped styles ─── */
const ABOUT_STYLE = `
/* ── text reveal: dim → bright on hover/focus ── */
.about-reveal-word {
  display: inline;
  color: rgba(242, 239, 235, 0.35);
  transition: color 200ms ease-out;
}
.about-reveal-host:focus-within .about-reveal-word,
.about-reveal-host:focus .about-reveal-word {
  color: rgba(242, 239, 235, 0.94);
}
@media (hover: hover) { .about-reveal-host:hover .about-reveal-word { color: rgba(242, 239, 235, 0.94); } }

/* ── intro paragraph: slightly larger + brighter ── */
.about-bio {
  font-size: clamp(1.02rem, 0.4vw + 0.78rem, 1.13rem);
  color: rgba(242, 239, 235, 0.86);
}
.about-bio .about-reveal-word {
  color: rgba(242, 239, 235, 0.62);
}
.about-bio:focus-within .about-reveal-word {
  color: rgba(242, 239, 235, 0.98);
}
.about-bio .about-reveal-word:focus-visible { color: #ff6f79; }
@media (hover: hover) {
  .about-bio:hover .about-reveal-word { color: rgba(242, 239, 235, 0.98); }
  .about-bio .about-reveal-word:hover { color: #ff6f79; }
}

/* ── tagline ── */
.about-sub {
  transition: color 200ms ease-out, text-shadow 200ms ease-out;
}
.about-sub:focus-visible {
  color: rgba(242, 239, 235, 0.96);
  text-shadow: 0 0 18px rgba(242, 239, 235, 0.12);
}
@media (hover: hover) { .about-sub:hover { color: rgba(242,239,235,.96); text-shadow: 0 0 18px rgba(242,239,235,.12); } }

/* ── heading words ── */
.about-head-line {
  transition: color 220ms ease-out, text-shadow 220ms ease-out;
}
.about-head-line--light:focus-visible {
  color: #ffffff;
  text-shadow: 0 0 28px rgba(242, 239, 235, 0.22);
}
.about-head-line--red:focus-visible {
  color: #ff3145;
  text-shadow: 0 0 30px rgba(214, 26, 41, 0.42);
}
@media (hover: hover) {
  .about-head-line--light:hover { color:#fff; text-shadow:0 0 28px rgba(242,239,235,.22); }
  .about-head-line--red:hover { color:#ff3145; text-shadow:0 0 30px rgba(214,26,41,.42); }
}
.about-heading span[data-cursor-hover] {
  cursor: default;
}

/* ── section label ── */
.about-kicker,
#about header [data-label] {
  transition: color 220ms ease-out, letter-spacing 220ms ease-out;
}
.about-kicker:focus-visible,
#about header [data-label]:focus-visible {
  color: var(--color-red, #d61a29);
  letter-spacing: 0.13em;
}
@media (hover: hover) {
  .about-kicker:hover, #about header [data-label]:hover { color:var(--color-red,#d61a29); letter-spacing:.13em; }
}

/* ── focus list + chips: side by side on desktop ── */
.about-focus-grid {
  display: grid;
  gap: 1rem 2rem;
  align-items: start;
}
@media (min-width: 1024px) {
  .about-focus-grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 0.5rem 2.2rem;
  }
}

.about-focus-item {
  transition: transform 220ms ease-out, background-color 220ms ease-out;
}
.about-focus-item:focus-visible {
  transform: translateX(6px);
  background-color: rgba(255, 255, 255, 0.035);
}
@media (hover: hover) { .about-focus-item:hover { transform:translateX(6px); background-color:rgba(255,255,255,.035); } }
.about-focus-dot {
  transition: box-shadow 220ms ease-out, background-color 220ms ease-out,
    filter 220ms ease-out;
}
.about-focus-item:focus-visible .about-focus-dot {
  background-color: #ff3145;
  box-shadow: 0 0 0 3px rgba(214, 26, 41, 0.16),
    0 0 10px 3px rgba(214, 26, 41, 0.55);
  filter: brightness(1.35);
}
@media (hover: hover) { .about-focus-item:hover .about-focus-dot { background-color:#ff3145; box-shadow:0 0 0 3px rgba(214,26,41,.16),0 0 10px 3px rgba(214,26,41,.55); filter:brightness(1.35); } }
.about-focus-text {
  font-size: clamp(0.8rem, 0.3vw + 0.69rem, 0.9rem);
}
.about-focus-item:focus-visible .about-reveal-word {
  color: rgba(242, 239, 235, 0.97);
}
@media (hover: hover) { .about-focus-item:hover .about-reveal-word { color:rgba(242,239,235,.97); } }

.about-chip {
  position: relative;
  top: 0;
  transition: top 220ms ease-out, border-color 220ms ease-out,
    background-color 220ms ease-out, box-shadow 220ms ease-out, color 220ms ease-out;
}
.about-chip:focus-visible {
  top: -3px;
  border-color: rgba(214, 26, 41, 0.68);
  background-color: rgba(214, 26, 41, 0.09);
  box-shadow: 0 8px 20px -6px rgba(214, 26, 41, 0.45),
    0 0 0 1px rgba(214, 26, 41, 0.2) inset;
  color: rgba(242, 239, 235, 0.98);
}
@media (hover: hover) { .about-chip:hover { top:-3px; border-color:rgba(214,26,41,.68); background-color:rgba(214,26,41,.09); box-shadow:0 8px 20px -6px rgba(214,26,41,.45),0 0 0 1px rgba(214,26,41,.2) inset; color:rgba(242,239,235,.98); } }
.about-chip i {
  transition: transform 220ms ease-out, box-shadow 220ms ease-out;
}
.about-chip:focus-visible i {
  transform: scale(1.8);
  box-shadow: 0 0 8px rgba(214, 26, 41, 0.9);
}
@media (hover: hover) { .about-chip:hover i { transform:scale(1.8); box-shadow:0 0 8px rgba(214,26,41,.9); } }

/* ── thin hairline dividers ── */
.about-rule-thin {
  background: rgba(255, 255, 255, 0.09);
  transition: background-color 220ms ease-out;
}
.about-row:focus-visible .about-rule-thin {
  background: rgba(214, 26, 41, 0.42);
}
@media (hover: hover) { .about-row:hover .about-rule-thin { background:rgba(214,26,41,.42); } }

/* ── meta dl: label / value rows ── */
.about-meta-dl {
  position: relative;
}
.about-detail-dl {
  display: grid;
  gap: 0.1rem;
}
.about-row {
  transition: background-color 220ms ease-out;
}
.about-row:focus-visible {
  background-color: rgba(255, 255, 255, 0.03);
}
@media (hover: hover) { .about-row:hover { background-color:rgba(255,255,255,.03); } }
.about-row [data-dk] {
  transition: color 220ms ease-out;
}
.about-row:focus-visible [data-dk] {
  color: var(--color-red, #d61a29);
}
@media (hover: hover) { .about-row:hover [data-dk] { color:var(--color-red,#d61a29); } }
.about-row-value {
  font-size: clamp(0.8rem, 0.25vw + 0.72rem, 0.88rem);
  transition: transform 220ms ease-out, color 220ms ease-out;
}
.about-row:focus-visible .about-row-value {
  transform: translateX(3px);
  color: rgba(242, 239, 235, 1);
}
@media (hover: hover) { .about-row:hover .about-row-value { transform:translateX(3px); color:rgba(242,239,235,1); } }

/* ── image layers ── */
.about-img-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.about-photo-base,
.about-photo-color {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
.about-photo-color {
  /* mask is set dynamically by JS */
}

/* ── photo card: ~9% larger, nudge right on desktop ── */
.about-photo-card {
  width: 100%;
  max-width: 304px;
  min-width: 0;
}
@media (min-width: 640px) {
  .about-photo-card { max-width: 327px; }
}
@media (min-width: 1024px) {
  .about-photo-card { max-width: 295px; }
  .about-photo-col { transform: translateX(20px); }
}
@media (min-width: 1280px) {
  .about-photo-card { max-width: 318px; }
}

.about-img-wrap {
  width: 100%;
  transform-origin: center;
  transition: transform 220ms ease-out, border-color 220ms ease-out,
    box-shadow 220ms ease-out;
}
.about-img-wrap:focus-within {
  transform: translateY(-4px) scale(1.012);
  border-color: rgba(214, 26, 41, 0.55);
  box-shadow: 0 20px 48px -20px rgba(214, 26, 41, 0.55),
    0 12px 30px -12px rgba(0, 0, 0, 0.55);
}
@media (hover: hover) { .about-img-wrap:hover { transform:translateY(-4px) scale(1.012); border-color:rgba(214,26,41,.55); box-shadow:0 20px 48px -20px rgba(214,26,41,.55),0 12px 30px -12px rgba(0,0,0,.55); } }
.about-img-wrap img {
  transition: transform 240ms ease-out;
  transform-origin: top center;
}
.about-img-wrap:focus-within img {
  transform: scale(1.035);
}
@media (hover: hover) { .about-img-wrap:hover img { transform:scale(1.035); } }

/* ── name ── */
.about-name {
  transition: color 220ms ease-out, text-shadow 220ms ease-out,
    letter-spacing 220ms ease-out;
}
.about-name:focus-visible {
  color: #ff3145;
  text-shadow: 0 0 20px rgba(214, 26, 41, 0.35);
  letter-spacing: 0.01em;
}
@media (hover: hover) { .about-name:hover { color:#ff3145; text-shadow:0 0 20px rgba(214,26,41,.35); letter-spacing:.01em; } }

/* ── body layout ── */
.about-body {
  min-height: 0;
  min-width: 0;
}

/* ── text blocks: free, no card ── */
.about-text-block {
  position: relative;
  min-width: 0;
}

/* ── responsive: tablet/mobile stack, centered photo, no offset ── */
@media (max-width: 1023px) {
  .about-photo-col {
    transform: none;
  }
  .about-photo-card {
    margin-left: auto;
    margin-right: auto;
  }
  .about-photo-base {
    display: none !important;
  }
  .about-photo-color {
    mask-image: none !important;
    -webkit-mask-image: none !important;
    opacity: 1 !important;
  }
}

@media (max-width: 479px) {
  .about-focus-grid {
    gap: 0.85rem;
  }
  .about-row [data-dk] {
    width: 5.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-focus-item,
  .about-focus-dot,
  .about-chip,
  .about-img-wrap,
  .about-img-wrap img {
    transition: none;
  }
  .about-focus-item:hover,
  .about-chip:hover,
  .about-img-wrap:hover {
    transform: none;
  }
  .about-chip:hover {
    top: 0;
  }
}
`;
