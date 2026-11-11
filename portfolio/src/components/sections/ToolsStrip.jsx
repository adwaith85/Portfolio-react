import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { toolGroups } from "../../data/tools";
import { swarm } from "../cursors/swarmApi";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
  cursorMove,
  cursorClick,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
  typeWords,
} from "../../engine/swarmBuild";
import Logo from "../ui/Logo";

// pixels per second, moving left -> right. Raise it to go faster.
const BASE_SPEED = 60;

// 3 cursors write the heading, 2 open the marquee, 15 point at the tools:
// 20 agents in this section, all distinct.
const AG = {
  head: [0, 1, 2],
  wipe: [3, 4],
  logos: Array.from({ length: 15 }, (_, i) => i + 5),
};

function Divider({ label, dup = false }) {
  return (
    <li
      {...(dup ? { "aria-hidden": "true", "data-dup": "" } : {})}
      className="mr-8 flex shrink-0 items-center sm:mr-12 lg:mr-14"
    >
      <span className="whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-[0.52rem] font-semibold uppercase leading-none tracking-[0.2em] text-red/90 sm:text-[0.56rem]">
        {label}
      </span>
    </li>
  );
}

function Chip({ item, dup = false }) {
  return (
    <li
      data-tool-chip
      {...(dup ? { "aria-hidden": "true", "data-dup": "" } : {})}
      className="group/chip mr-8 flex shrink-0 items-center gap-2.5 outline-offset-[6px] transition-[translate,scale] duration-200 hover:-translate-y-1 hover:scale-110 hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#4c8dff]/70 sm:mr-12 sm:gap-3 lg:mr-14"
    >
      <Logo item={item} />
      <span className="whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted transition-colors group-hover/chip:text-ink sm:text-[0.72rem]">
        {item.name}
      </span>
    </li>
  );
}

export default function ToolsStrip() {
  const root = useRef(null);
  const view = useRef(null);
  const track = useRef(null);
  const enabled = useAgentsEnabled();

  /* heading + marquee wipe, each with its own viewport trigger */
  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const line = el.querySelector("[data-line]");
      const v = el.querySelector("[data-view]");
      const handle = el.querySelector("[data-handle]");

      if (line) gsap.set(line, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(el.querySelectorAll("[data-w],[data-period]"), { autoAlpha: 0 });
      if (v) gsap.set(v, { clipPath: "inset(0 100% 0 0)" });
      if (handle) gsap.set(handle, { autoAlpha: 0 });
    }, root);

    const stop = createViewportReveal({
      root: el,
      sectionId: "tools",
      enabled,
      reduced,
      start: "top 95%",
      speed: 1.35,
      back: 2.2,
      groups: [
        {
          element: el.querySelector("[data-tools-heading]"),
          agents: AG.head,
          build: () => {
            const $ = (s) => el.querySelector(s);
            const line = $("[data-line]");
            const kicker = $("[data-kicker]");
            const head = $("[data-head]");
            const period = $("[data-period]");
            const [a, b, c] = AG.head;
            const ovb = makeOverlay(el);
            const ovc = makeOverlay(el);

            const tl = gsap.timeline();
            cursorIntro(tl, AG.head, 0);

            // a drags the top rule open
            if (line) {
              cursorMove(tl, a, line, {
                at: 0,
                duration: 0.35,
                offset: { x: 0, y: 0.5 },
              });
              cursorClick(tl, a, 0.35);
              cursorMove(tl, a, line, {
                at: 0.35,
                duration: 0.55,
                offset: { x: 1, y: 0.5 },
              });
              tl.to(
                line,
                { scaleX: 1, duration: 0.55, ease: "power3.out" },
                0.35
              );
            }
            // b and c each draw a box, then write the two heading lines word by word
            const tk = dragBox(tl, ovb, b, kicker, el, 0.05, {
              tag: "p.kicker",
              dur: 0.25,
            });
            const tkEnd = typeWords(tl, kicker, b, tk, 0.03);
            const th = dragBox(tl, ovc, c, head, el, 0.35, {
              tag: "p.heading",
              dur: 0.25,
            });
            const thEnd = typeWords(tl, head, c, th, 0.04);
            if (period) {
              tl.fromTo(period, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, thEnd);
            }

            cursorOutro(tl, AG.head, { at: Math.max(tkEnd, thEnd) + 0.5 });
            return tl;
          },
        },
        {
          element: el.querySelector("[data-view]"),
          agents: [...AG.wipe, ...AG.logos],
          once: true,
          build: () => {
            const $ = (s) => el.querySelector(s);
            const v = $("[data-view]");
            const handle = $("[data-handle]");
            const p = { v: 0 };
            const [wa, wb] = AG.wipe;

            const tl = gsap.timeline();
            cursorIntro(tl, [...AG.wipe, ...AG.logos], 0);

            // wa follows the wipe edge; wb grabs and releases the blue handle
            if (v) {
              cursorMove(tl, wa, v, {
                at: 0,
                duration: 0.45,
                offset: { x: 0, y: 0.5 },
              });
              cursorClick(tl, wa, 0.45);
            }
            if (handle) tl.set(handle, { autoAlpha: 1 }, 0.45);
            if (handle) {
              cursorMove(tl, wb, handle, {
                at: 0.15,
                duration: 0.3,
                offset: { x: 0.5, y: 0.5 },
              });
              cursorClick(tl, wb, 0.45);
            }

            if (v && handle) {
              tl.to(
                p,
                {
                  v: 1,
                  duration: 1.1,
                  ease: "power2.inOut",
                  onUpdate: () => {
                    v.style.clipPath = `inset(0 ${(1 - p.v) * 100}% 0 0)`;
                    handle.style.left = `${p.v * 100}%`;
                    if (enabled) swarm.placeAt(wa, v, p.v, 0.5);
                  },
                },
                0.55
              );
            }

            // the 15 tool cursors arrive across the strip and click each tool
            // into place. Targets are measured when the tween starts, so they
            // follow the moving marquee instead of using stale positions.
            if (v) {
              const vr = v.getBoundingClientRect();
              const chips = [...el.querySelectorAll("[data-tool-chip]")];
              const onscreen = chips.filter((chip) => {
                const r = chip.getBoundingClientRect();
                return r.right > vr.left && r.left < vr.right;
              });
              const targets = onscreen.length ? onscreen : chips.slice(0, 8);
              AG.logos.forEach((ag, k) => {
                const target = targets[k % targets.length];
                if (!target) return;
                // each tool cursor draws a small box over its logo and clicks it
                dragBox(tl, makeOverlay(el), ag, target, el, 0.95 + k * 0.045, {
                  tag: "li.tool",
                  dur: 0.18,
                  pad: 2,
                });
              });
            }

            if (handle) tl.set(handle, { autoAlpha: 0 }, 1.7);
            cursorOutro(tl, [...AG.wipe, ...AG.logos], { at: 2.0 });
            return tl;
          },
        },
      ],
    });

    return () => {
      stop();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled]);

  /* Tools reveal one by one as the moving row brings them into view.
     Each chip is unobserved after its first reveal, so a tool looping round
     again never re-triggers an animation. */
  useEffect(() => {
    const v = view.current;
    if (!v) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const chips = [...v.querySelectorAll("[data-tool-chip]")];
    if (!chips.length) return;

    chips.forEach((c) => delete c.dataset.revealed);

    const tweens = [];
    const ctx = gsap.context(() => {
      gsap.set(chips, { opacity: 0, y: 8, scale: 0.9 });
    }, v);

    const reveal = (el) => {
      if (el.dataset.revealed === "1") return;
      el.dataset.revealed = "1";
      tweens.push(
        gsap.to(el, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: "power2.out",
          delay: Math.random() * 0.07,
        })
      );
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          reveal(entry.target);
        });
      },
      { root: v, rootMargin: "0px 6% 0px 6%", threshold: 0.2 }
    );

    chips.forEach((c) => io.observe(c));

    // Safety net for browsers that do not report transformed marquee children:
    // reveal only the chips that are genuinely on screen, never the offscreen ones.
    const fallback = setTimeout(() => {
      const vr = v.getBoundingClientRect();
      chips.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.right > vr.left && r.left < vr.right) reveal(c);
      });
    }, 700);

    return () => {
      clearTimeout(fallback);
      io.disconnect();
      tweens.forEach((t) => t.kill());
      ctx.revert();
    };
  }, []);

  /* the marquee: moves right by itself, and can be dragged / swiped / scrolled sideways */
  useEffect(() => {
    const v = view.current;
    const t = track.current;
    if (!v || !t) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = reduced ? 0 : BASE_SPEED;

    let half = 0; // width of one full set of tools
    let x = 0; // current offset
    let auto = base; // current automatic speed (eases to 0 on hover)
    let vel = 0; // momentum after a drag, px per second
    let dragging = false;
    let hover = false;
    let lastX = 0;
    let lastT = 0;

    const measure = () => {
      half = t.scrollWidth / 2;
    };
    const wrapX = () => {
      if (!half) return;
      x %= half;
      if (x > 0) x -= half;
    };

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(t);

    const tick = (_time, dtMs) => {
      const dt = Math.min(dtMs, 50) / 1000;
      if (!dragging) {
        const target = hover ? 0 : base;
        auto += (target - auto) * Math.min(1, dt * 4);
        x += (auto + vel) * dt;
        vel *= Math.pow(0.06, dt);
        if (Math.abs(vel) < 4) vel = 0;
      }
      wrapX();
      t.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(tick);

    const down = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      vel = 0;
      lastX = e.clientX;
      lastT = performance.now();
      if (v.setPointerCapture) v.setPointerCapture(e.pointerId);
      v.dataset.drag = "1";
    };
    const move = (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = Math.max(1, now - lastT) / 1000;
      x += dx;
      vel = vel * 0.6 + (dx / dt) * 0.4;
      lastX = e.clientX;
      lastT = now;
    };
    const up = (e) => {
      if (!dragging) return;
      dragging = false;
      delete v.dataset.drag;
      if (performance.now() - lastT > 80) vel = 0; // held still before letting go
      vel = Math.max(-2500, Math.min(2500, vel));
      if (v.releasePointerCapture) v.releasePointerCapture(e.pointerId);
    };
    const enter = (e) => {
      if (e.pointerType === "mouse") hover = true;
    };
    const leave = () => {
      hover = false;
    };
    const wheel = (e) => {
      // sideways trackpad scroll moves the strip; normal up/down scroll is left alone
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) x -= e.deltaX;
    };

    v.addEventListener("pointerdown", down);
    v.addEventListener("pointermove", move);
    v.addEventListener("pointerup", up);
    v.addEventListener("pointercancel", up);
    v.addEventListener("pointerenter", enter);
    v.addEventListener("pointerleave", leave);
    v.addEventListener("wheel", wheel, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      v.removeEventListener("pointerdown", down);
      v.removeEventListener("pointermove", move);
      v.removeEventListener("pointerup", up);
      v.removeEventListener("pointercancel", up);
      v.removeEventListener("pointerenter", enter);
      v.removeEventListener("pointerleave", leave);
      v.removeEventListener("wheel", wheel);
    };
  }, []);

  return (
    <section
      id="tools"
      ref={root}
      aria-label="Tools I work with"
      className="relative overflow-x-clip"
    >
      <i data-line className="absolute inset-x-0 top-0 h-px bg-line" />

      {/* heading: top-left, above the moving row */}
      <div data-tools-heading className="px-gutter pt-5 lg:pt-6">
        <p
          data-kicker
          className="block w-fit text-[0.78rem] font-light uppercase tracking-[0.08em] text-muted transition-colors duration-200 hover:text-ink"
        >
          <Words text="Tools I work with" />
        </p>
        <p
          data-head
          className="mt-1 block w-fit text-[0.95rem] font-semibold uppercase leading-tight tracking-tight text-ink transition-colors duration-200 hover:text-red"
        >
          <Words text="From editor to production" />
          <span data-period className="text-red">
            .
          </span>
        </p>
      </div>

      {/* marquee: full width, edge to edge */}
      <div className="relative mt-4 pb-5 lg:mt-5 lg:pb-6">
        <div
          ref={view}
          data-view
          className="marquee-view cursor-grab select-none overflow-hidden data-[drag]:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
        >
          <ul ref={track} className="flex w-max items-center will-change-transform">
            {[0, 1].map((set) => {
              const dup = set === 1;
              return (
                <Fragment key={`set-${set}`}>
                  {toolGroups.map((group, gi) => (
                    <Fragment key={`${set}-${gi}`}>
                      <Divider label={group.label} dup={dup} />
                      {group.items.map((item, i) => (
                        <Chip
                          key={`${set}-${gi}-${i}`}
                          item={item}
                          dup={dup}
                        />
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              );
            })}
          </ul>
        </div>

        {/* the blue drag handle that leads the reveal wipe */}
        <span
          data-handle
          className="pointer-events-none absolute bottom-5 left-0 top-0 z-[2] w-px -translate-x-1/2 bg-[#4c8dff] lg:bottom-6"
        >
          <i className="absolute -left-[3px] -top-[3px] size-[7px] border border-[#4c8dff] bg-white" />
          <i className="absolute -bottom-[3px] -left-[3px] size-[7px] border border-[#4c8dff] bg-white" />
        </span>
      </div>
    </section>
  );
}
