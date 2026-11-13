import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content } from "../../data/content";
import { lockScroll, unlockScroll } from "../../hooks/useSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const STOP_POSITIONS = [
  "top-[8%] sm:top-[12%] lg:top-[10%]",
  "top-[30%] sm:top-[33%] lg:top-[27%]",
  "top-[57%] sm:top-[60%] lg:top-[51%]",
  "top-[82%] sm:top-[84%] lg:top-[80%]",
];

const EDU_STYLE = `
.edu-fan-stage {
  position: relative;
  width: 100%;
  height: clamp(12.5rem, 27svh, 17.5rem);
}
.edu-fan {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.edu-fan-item {
  position: absolute;
  left: calc(50% + var(--fan-x, 0%) * var(--fan-spread, 1));
  bottom: clamp(0.5rem, 2svh, 1.25rem);
  width: clamp(9.5rem, 22%, 15rem);
  z-index: var(--fan-z, 10);
  transform-origin: 50% 118%;
  transform: translateX(-50%) rotate(var(--fan-rot, 0deg));
  transition:
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease,
    filter 300ms ease;
  will-change: transform;
}
@media (hover: hover) and (pointer: fine) {
  .edu-fan-item:hover,
  .edu-fan-item:focus-within {
    z-index: 60;
    transform: translateX(-50%) translateY(-1.1rem) rotate(0deg) scale(1.06);
  }
  .edu-fan:hover .edu-fan-item:not(:hover),
  .edu-fan:focus-within .edu-fan-item:not(:focus-within) {
    opacity: 0.42;
    filter: brightness(0.72) saturate(0.75);
  }
}
@media (max-width: 1024px) {
  .edu-fan-item {
    width: clamp(8.5rem, 25%, 12.5rem);
    --fan-spread: 0.76;
  }
}
@media (max-width: 767px) {
  .edu-fan-stage { height: auto; }
  .edu-fan {
    position: relative;
    inset: auto;
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1.35rem 14% 1.9rem;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 14%;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .edu-fan::-webkit-scrollbar { display: none; }
  .edu-fan-item {
    position: relative;
    left: auto;
    bottom: auto;
    flex: 0 0 auto;
    width: min(68vw, 17rem);
    margin-left: -2.2rem;
    transform-origin: 50% 100%;
    transform: rotate(var(--fan-rot-m, 0deg));
    scroll-snap-align: center;
  }
  .edu-fan-item:first-child { margin-left: 0; }
}

/* Mobile education timeline: normal document flow so taller cards never overlap. */
@media (max-width: 1023px) {
  #education {
    height: auto;
    min-height: 100svh;
    overflow: visible;
  }
  #education > header {
    position: relative;
    inset: auto;
    margin-inline: auto;
  }
  #education [data-edu-route] {
    position: relative;
    inset: auto;
    width: 100%;
    max-width: none;
    margin: 0 auto;
    padding: 1.75rem 0 3.5rem;
  }
  #education [data-edu-stop] {
    position: relative;
    inset: auto;
    top: auto;
    translate: none;
    transform: none;
    margin: 0 0 2.75rem;
  }
  #education [data-edu-stop]:last-child {
    margin-bottom: 0;
  }
}
@media (max-height: 520px) {
  .edu-head-sub { display: none; }
  .edu-card { padding: 0.45rem 0.55rem; }
  .edu-card-title { font-size: clamp(0.82rem, 3.2svh, 1.05rem); }
  .edu-card-place {
    font-size: 0.58rem;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .edu-card-level, .edu-card-status, .edu-card-meta { display: none; }
}
@keyframes eduModalIn {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.edu-modal-panel { animation: eduModalIn 240ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .edu-fan-item { transition: none; }
  .edu-modal-panel { animation: none; }
}
@media (min-width: 1024px) {
  [data-edu-svg] [data-edu-path-base] { stroke-width: 1.8; }
  [data-edu-svg] [data-edu-path-progress] { stroke-width: 3; }
}
`;

const imageSrc = (item) =>
  item?.image
    ? /^https?:\/\//i.test(item.image)
      ? item.image
      : `/${item.image}`
    : "";

function CertificateArt({ large = false }) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 text-center"
      style={{
        background:
          "radial-gradient(circle at 50% 35%, rgba(214,26,41,0.16), transparent 58%), linear-gradient(145deg, #151515, #0b0b0b)",
      }}
    >
      <span className="absolute inset-3 rounded-[2px] border border-dashed border-white/10" />
      <svg
        viewBox="0 0 24 24"
        className={large ? "size-12 text-red" : "size-7 text-red"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M5 4.5h14v11H5z" />
        <path d="M8 8h8M8 11h5" />
        <path d="M9 15.5v5l3-1.4 3 1.4v-5" />
      </svg>
      <span
        className={`label mt-2 block ${
          large ? "text-[0.65rem]" : "text-[0.5rem]"
        } text-muted`}
      >
        CERTIFICATE
      </span>
      {large && (
        <span className="absolute bottom-5 left-1/2 h-px w-16 -translate-x-1/2 bg-red/40" />
      )}
    </div>
  );
}

function AnchorDot({ side }) {
  return (
    <span
      data-edu-anchor
      data-edu-dot
      aria-hidden="true"
      className={`size-2 shrink-0 rounded-full bg-red shadow-[0_0_0_4px_rgba(214,26,41,0.1),0_0_12px_3px_rgba(214,26,41,0.35)] lg:size-2.5 ${
        side === "right" ? "-mr-px" : "-ml-px"
      }`}
    />
  );
}

function CertificateFanCard({ item, index, onOpen }) {
  const src = imageSrc(item);

  return (
    <button
      type="button"
      onClick={(event) => onOpen(item, event)}
      aria-label={`Open ${item.title} certificate`}
      className="edu-fan-card group relative block w-full overflow-hidden rounded-[5px] border border-line bg-panel text-left shadow-[0_24px_50px_-24px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.02)] outline-none transition-[border-color,box-shadow] duration-300 hover:border-red/50 focus-visible:border-red/60 focus-visible:ring-2 focus-visible:ring-red/30"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-black/40">
        {src ? (
          <img
            src={src}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <CertificateArt />
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] bg-red/80"
        />
        <span className="absolute inset-x-0 bottom-0 block p-2.5">
          <span className="label block text-[0.46rem] leading-none text-red">
            CERTIFICATE {String(index + 1).padStart(2, "0")}
          </span>
          <span className="display mt-1 block text-[clamp(0.72rem,1.05vw,0.94rem)] leading-tight text-ink">
            {item.title}
          </span>
        </span>
      </span>
    </button>
  );
}

function CertificateModal({ item, onClose }) {
  const closeRef = useRef(null);
  const src = imageSrc(item);

  useEffect(() => {
    lockScroll();
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${item.title} certificate`}
        onClick={(event) => event.stopPropagation()}
        className="edu-modal-panel relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-[5px] border border-white/15 bg-[#0d0d0e] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close certificate"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-white/15 bg-black/70 text-ink/75 outline-none transition-colors duration-200 hover:border-red/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-red/40"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="min-h-0 overflow-auto p-3 sm:p-4">
          {src ? (
            <img
              src={src}
              alt={item.title}
              className="mx-auto max-h-[66svh] w-auto max-w-full rounded-[2px] object-contain"
            />
          ) : (
            <div className="min-h-[45svh] overflow-hidden rounded-[2px] border border-white/10">
              <CertificateArt large />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 py-3">
          <h3 className="display text-[clamp(1.15rem,2.6vw,1.7rem)] leading-tight text-ink">
            {item.title}
          </h3>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-ink/60">
            {item.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Education() {
  const root = useRef(null);
  const [active, setActive] = useState(null);
  const lastFocus = useRef(null);
  const { education, achievements } = content;

  const openCertificate = useCallback((item, event) => {
    lastFocus.current = event?.currentTarget ?? null;
    setActive(item);
  }, []);

  const closeCertificate = useCallback(() => {
    setActive(null);
    requestAnimationFrame(() => lastFocus.current?.focus?.());
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const route = el.querySelector("[data-edu-route]");
    const basePath = el.querySelector("[data-edu-path-base]");
    const progressPath = el.querySelector("[data-edu-path-progress]");
    const tip = el.querySelector("[data-edu-tip]");
    const start = el.querySelector("[data-edu-start]");
    const stops = [...el.querySelectorAll("[data-edu-stop]")];
    const anchors = stops.map((stop) => stop.querySelector("[data-edu-anchor]"));
    const cards = stops.map((stop) => stop.querySelector("[data-edu-card]"));
    const years = stops.map((stop) => [
      ...stop.querySelectorAll("[data-edu-year]"),
    ]);
    const dots = stops.map((stop) => stop.querySelector("[data-edu-dot]"));

    if (
      !route ||
      !basePath ||
      !progressPath ||
      anchors.some((anchor) => !anchor)
    ) {
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const visibleCards = cards.filter(Boolean);
    const visibleYears = years.flat();
    const visibleDots = dots.filter(Boolean);
    let total = 0;
    let fractions = [];
    let alive = true;
    let ctx = null;
    let mm = null;
    let refreshTimer = 0;
    let resizeTimer = 0;
    let raf = 0;

    const buildPath = () => {
      if (!alive) return;
      const routeRect = route.getBoundingClientRect();
      if (!routeRect.width || !routeRect.height) return;

      const points = anchors.map((anchor) => {
        const rect = anchor.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - routeRect.left,
          y: rect.top + rect.height / 2 - routeRect.top,
        };
      });

      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
      for (let i = 1; i < points.length; i += 1) {
        const from = points[i - 1];
        const to = points[i];
        const dx = to.x - from.x;
        d += ` C ${(from.x + dx * 0.5).toFixed(2)} ${from.y.toFixed(
          2
        )}, ${(to.x - dx * 0.5).toFixed(2)} ${to.y.toFixed(2)}, ${to.x.toFixed(
          2
        )} ${to.y.toFixed(2)}`;
      }

      basePath.setAttribute("d", d);
      progressPath.setAttribute("d", d);
      total = progressPath.getTotalLength() || 0;

      fractions = points.map((point) => {
        let best = 0;
        let bestDistance = Infinity;
        const steps = 480;
        for (let step = 0; step <= steps; step += 1) {
          const length = (step / steps) * total;
          const sample = progressPath.getPointAtLength(length);
          const distance =
            (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2;
          if (distance < bestDistance) {
            bestDistance = distance;
            best = length;
          }
        }
        return total ? best / total : 0;
      });
    };

    const placeTip = (progress) => {
      if (!tip || total <= 0) return;
      const point = progressPath.getPointAtLength(progress * total);
      tip.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
      tip.style.opacity =
        progress > 0.004 && progress < 0.995 ? "1" : "0";
    };

    const refresh = () => {
      if (!alive) return;
      buildPath();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      requestAnimationFrame(() => buildPath());
    };

    const buildTimeline = ({ pin }) => {
      buildPath();

      gsap.set(progressPath, { strokeDashoffset: 1 });
      gsap.set(tip, { opacity: 0 });
      // The start node carries the first route anchor, so keep it still and
      // fade it only; moving it would detach the path from its dot.
      gsap.set(start, { opacity: 0.55 });
      gsap.set([...visibleCards, ...visibleYears], { opacity: 0, y: 18 });
      gsap.set(visibleDots, { opacity: 0 });

      const draw = { p: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: pin
          ? {
              trigger: el,
              start: "top top",
              end: "+=120%",
              pin: true,
              pinSpacing: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefresh: () => buildPath(),
            }
          : {
              trigger: el,
              start: "top 78%",
              end: "bottom 55%",
              scrub: 0.6,
              invalidateOnRefresh: true,
              onRefresh: () => buildPath(),
            },
      });

      tl.fromTo(
        start,
        { opacity: 0.55 },
        {
          opacity: 1,
          duration: 0.06,
          ease: "power2.out",
          immediateRender: false,
        },
        0
      );

      tl.fromTo(
        draw,
        { p: 0 },
        {
          p: 1,
          duration: 0.94,
          ease: "none",
          immediateRender: false,
          onUpdate: () => {
            progressPath.style.strokeDashoffset = String(1 - draw.p);
            placeTip(draw.p);
          },
        },
        0.06
      );

      stops.slice(1).forEach((_, index) => {
        const stopIndex = index + 1;
        const card = cards[stopIndex];
        const stopYears = years[stopIndex] ?? [];
        const dot = dots[stopIndex];
        const at = pin
          ? Math.min(
              0.96,
              Math.max(0.07, 0.06 + (fractions[stopIndex] ?? 1) * 0.94 - 0.035)
            )
          : Math.min(0.68, 0.1 + index * 0.14);

        if (card) {
          tl.fromTo(
            card,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.14,
              ease: "power2.out",
              immediateRender: false,
            },
            at
          );
        }
        if (stopYears.length) {
          tl.fromTo(
            stopYears,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.18,
              ease: "power2.out",
              immediateRender: false,
            },
            at
          );
        }
        if (dot) {
          tl.fromTo(
            dot,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.12,
              immediateRender: false,
            },
            at
          );
        }
      });
    };

    if (reduced) {
      ctx = gsap.context(() => {
        buildPath();
        gsap.set(progressPath, { strokeDashoffset: 0 });
        gsap.set(tip, { opacity: 0 });
        gsap.set([...visibleCards, ...visibleYears, ...visibleDots], {
          opacity: 1,
          y: 0,
        });
        gsap.set(start, { opacity: 1, y: 0 });
      }, el);
    } else {
      mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => buildTimeline({ pin: true }));
      mm.add("(max-width: 1023px)", () => buildTimeline({ pin: false }));
    }

    raf = requestAnimationFrame(() => {
      if (!alive) return;
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
    refreshTimer = window.setTimeout(refresh, 360);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) refresh();
      });
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(refresh, 180);
    };
    const onLoad = () => refresh();

    window.addEventListener("load", onLoad);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      alive = false;
      window.clearTimeout(refreshTimer);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      ctx?.revert();
      mm?.revert();
    };
  }, []);

  const fanCenter = (achievements.items.length - 1) / 2;
  const fanStep = 9;
  const fanRotation =
    12 / Math.max(1, (achievements.items.length - 1) / 2);

  return (
    <>
      <section
        id="education"
        data-env="education"
        ref={root}
        className="relative h-svh w-full overflow-hidden border-t border-line bg-bg"
      >
        <h2 className="sr-only">Education</h2>
        <style>{EDU_STYLE}</style>

        <header className="pointer-events-none absolute inset-x-0 top-0 z-[4] px-gutter pt-[4svh] lg:mx-auto lg:max-w-[72rem] lg:pt-[5svh]">
          <h3 className="display flex flex-wrap items-baseline gap-x-4 text-[clamp(2rem,7svh,5.5rem)] leading-none">
            <span className="block w-fit text-ink">EDUCATION</span>
            <span className="edu-head-sub block w-fit text-[0.34em] font-sans font-medium uppercase tracking-[0.2em] text-red">
              THE ROUTE SO FAR
            </span>
          </h3>
        </header>

        <div
          data-edu-route
          className="absolute inset-x-0 bottom-[3svh] top-[16svh] lg:mx-auto lg:max-w-[72rem]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            <span
              className="absolute -right-[12%] top-[8%] size-[34rem] rounded-full opacity-[0.13]"
              style={{
                background:
                  "radial-gradient(circle, rgba(214,26,41,0.8), transparent 66%)",
              }}
            />
            <span
              className="absolute -left-[14%] top-[48%] size-[30rem] rounded-full opacity-[0.1]"
              style={{
                background:
                  "radial-gradient(circle, rgba(76,141,255,0.75), transparent 66%)",
              }}
            />
          </div>

          <svg
            data-edu-svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
          >
            <path
              data-edu-path-base
              fill="none"
              stroke="rgba(242,239,235,0.22)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              data-edu-path-progress
              fill="none"
              stroke="#d61a29"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{ filter: "drop-shadow(0 0 5px rgba(214,26,41,0.55))" }}
            />
          </svg>

          <span
            data-edu-tip
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-[2] size-2 rounded-full bg-red opacity-0 shadow-[0_0_0_4px_rgba(214,26,41,0.14),0_0_14px_4px_rgba(214,26,41,0.45)] lg:size-2.5"
          />

          {education.map((entry, index) => {
            const side = index % 2 === 1 ? "right" : "left";
            const when = [entry.period, entry.duration]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={entry.stage}
                data-edu-stop
                className={`absolute inset-x-0 z-[3] -translate-y-1/2 ${
                  STOP_POSITIONS[index] ?? ""
                }`}
              >
                {index > 0 && (
                  <div
                    aria-hidden="true"
                    className={`mb-2 flex lg:hidden ${
                      side === "right"
                        ? "justify-end pr-[4vw] sm:pr-[5vw]"
                        : "justify-start pl-[4vw] sm:pl-[5vw]"
                    }`}
                  >
                    <div
                      data-edu-year
                      className="flex w-[min(70vw,22rem)] flex-wrap items-baseline gap-x-2 gap-y-1 sm:w-[min(36vw,22rem)]"
                    >
                      <span className="display block text-[clamp(1rem,4.4vw,1.35rem)] leading-none text-ink/75">
                        {entry.yearLabel ?? entry.year}
                      </span>
                      {entry.yearTag && (
                        <span className="label rounded-[2px] border border-red/35 bg-red/[0.06] px-1.5 py-0.5 font-sans text-[0.48rem] tracking-[0.12em] text-red">
                          {entry.yearTag}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {index === 0 ? (
                  <div
                    data-edu-start
                    className="flex justify-start pl-[5vw] sm:pl-[6vw] lg:pl-[clamp(2rem,3.5vw,4rem)]"
                  >
                    <div className="relative flex flex-col items-start">
                      <div className="mb-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                        <span className="display text-[clamp(1rem,2.6svh,1.5rem)] leading-none text-ink lg:text-[clamp(1.15rem,2.9svh,1.72rem)]">
                          {entry.title}
                        </span>
                        <span className="label text-[0.58rem] text-red lg:text-[0.66rem]">
                          {entry.year}
                        </span>
                      </div>
                      <span
                        data-edu-anchor
                        aria-hidden="true"
                        className="size-2.5 rounded-full bg-red shadow-[0_0_0_5px_rgba(214,26,41,0.12),0_0_16px_4px_rgba(214,26,41,0.4)] lg:size-3"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center ${
                      side === "right"
                        ? "justify-end pr-[4vw] sm:pr-[5vw] lg:pr-[clamp(2rem,3.5vw,4rem)]"
                        : "justify-start pl-[4vw] sm:pl-[5vw] lg:pl-[clamp(2rem,3.5vw,4rem)]"
                    }`}
                  >
                    {side === "right" && <AnchorDot side={side} />}
                    <div className="relative">
                      <span
                        data-edu-year
                        aria-hidden="true"
                        className="edu-card-year pointer-events-none absolute bottom-full left-0 mb-2.5 hidden items-center gap-2.5 whitespace-nowrap lg:flex"
                      >
                        <span className="display block text-[clamp(1.5rem,3.2svh,2.4rem)] leading-none text-ink/10 [-webkit-text-stroke:0.5px_rgba(242,239,235,0.16)]">
                          {entry.yearLabel ?? entry.year}
                        </span>
                        {entry.yearTag && (
                          <span className="label rounded-[2px] border border-red/40 bg-red/[0.06] px-1.5 py-0.5 font-sans text-[0.51rem] tracking-[0.14em] text-red">
                            {entry.yearTag}
                          </span>
                        )}
                      </span>
                      <div
                        data-edu-card
                        className="edu-card relative w-[min(70vw,22rem)] rounded-[4px] border border-white/10 bg-[#121212]/95 p-[clamp(0.55rem,1.4svh,0.9rem)] shadow-[0_24px_50px_-24px_rgba(0,0,0,0.85)] transition-colors duration-300 hover:border-red/30 sm:w-[min(36vw,22rem)] lg:w-[min(38vw,29rem)] lg:p-[clamp(0.72rem,1.65svh,1.1rem)]"
                      >
                        <i
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 h-[2px] bg-red"
                        />
                        <div className="flex items-start justify-between gap-2">
                          <p className="edu-card-level label block w-fit text-[0.55rem] text-gold lg:text-[0.64rem]">
                            LEVEL {entry.stage}
                          </p>
                          <span
                            className={`edu-card-status label inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[0.5rem] tracking-[0.08em] lg:px-2 lg:py-1 lg:text-[0.58rem] ${
                              index === 3
                                ? "border-red bg-red text-white"
                                : "border-red/50 text-red"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <h4 className="edu-card-title display mt-1 block text-[clamp(0.92rem,2.4svh,1.45rem)] leading-tight text-ink lg:text-[clamp(1.06rem,2.75svh,1.68rem)]">
                          {entry.title}
                        </h4>
                        <p className="edu-card-place mt-1 block text-[clamp(0.62rem,1.45svh,0.82rem)] leading-snug text-ink/65 lg:text-[clamp(0.71rem,1.6svh,0.94rem)]">
                          {entry.place}
                        </p>
                        <p className="edu-card-meta label mt-1.5 block text-[0.54rem] text-ink/35 lg:text-[0.63rem]">
                          {when}
                        </p>

                        {entry.roles?.length > 0 && (
                          <div className="edu-card-extra mt-2 border-t border-white/10 pt-1.5 lg:mt-2 lg:pt-2">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <p className="label shrink-0 text-[0.46rem] leading-none text-red/75 lg:text-[0.54rem]">
                                READY FOR ROLES
                              </p>
                              {entry.note && (
                                <p className="text-[0.55rem] leading-tight text-ink/55 lg:text-[0.7rem] lg:leading-snug">
                                  {entry.note}
                                </p>
                              )}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1 lg:mt-1.5 lg:gap-1">
                              {entry.roles.map((role) => (
                                <span
                                  key={role}
                                  className="rounded-full border border-red/25 bg-red/[0.06] px-1.5 py-[0.12rem] text-[0.45rem] leading-none text-ink/70 lg:px-1.5 lg:py-[0.12rem] lg:text-[0.55rem]"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {side === "left" && <AnchorDot side={side} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="achievements"
        data-achievements
        className="relative border-t border-line bg-bg px-gutter pb-[5svh] pt-[3svh]"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <h3 className="display text-[clamp(1.8rem,4.6vw,3.1rem)] leading-none text-ink">
              {achievements.title}
              <span className="text-red">.</span>
            </h3>
            <p className="mt-2.5 max-w-[32rem] text-[clamp(0.8rem,1.3vw,0.9rem)] leading-relaxed text-ink/60">
              {achievements.tagline}
            </p>
          </div>

          <div className="edu-fan-stage mt-[clamp(0.75rem,2svh,1.5rem)]">
            <ul className="edu-fan">
              {achievements.items.map((item, index) => {
                const offset = index - fanCenter;
                const rotation = offset * fanRotation;
                const rotationMobile = offset * 2.5;

                return (
                  <li
                    key={item.title}
                    className="edu-fan-item"
                    style={{
                      "--fan-x": `${offset * fanStep}%`,
                      "--fan-rot": `${rotation}deg`,
                      "--fan-rot-m": `${rotationMobile}deg`,
                      "--fan-z": String(20 - Math.abs(offset)),
                    }}
                  >
                    <CertificateFanCard
                      item={item}
                      index={index}
                      onOpen={openCertificate}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {active && (
        <CertificateModal item={active} onClose={closeCertificate} />
      )}
    </>
  );
}
