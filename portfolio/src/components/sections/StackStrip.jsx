import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stack } from "../../data/stack";
import { typeReveal } from "../../engine/buildKit";
import Logo from "../ui/Logo";

gsap.registerPlugin(ScrollTrigger);

const BASE_SPEED = 55; // pixels per second, moving left. Raise it to go faster.

function Chip({ item, dup = false }) {
  return (
    <li
      {...(dup ? { "aria-hidden": "true", "data-dup": "" } : {})}
      className="group/chip mr-8 flex shrink-0 items-center gap-2.5 sm:mr-12 sm:gap-3 lg:mr-14"
    >
      <Logo item={item} />
      <span className="whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted transition-colors group-hover/chip:text-ink sm:text-[0.72rem]">
        {item.name}
      </span>
    </li>
  );
}

export default function StackStrip() {
  const root = useRef(null);
  const view = useRef(null);
  const track = useRef(null);

  /* builds itself when it enters the screen, plays backward when you scroll back up */
  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const $ = (s) => el.querySelector(s);
      const line = $("[data-line]");
      const kicker = $("[data-kicker]");
      const head = $("[data-head]");
      const v = $("[data-view]");
      const handle = $("[data-handle]");

      if (line) gsap.set(line, { scaleX: 0, transformOrigin: "0% 50%" });
      const kickerAndHead = [kicker, head].filter(Boolean);
      if (kickerAndHead.length) gsap.set(kickerAndHead, { autoAlpha: 0 });
      if (v) gsap.set(v, { clipPath: "inset(0 100% 0 0)" });
      if (handle) gsap.set(handle, { autoAlpha: 0 });

      const p = { v: 0 };
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      if (line) tl.to(line, { scaleX: 1, duration: 0.7, ease: "power3.out" }, 0);
      if (kicker) tl.add(typeReveal(kicker, { duration: 0.35 }), 0.15);
      if (head) tl.add(typeReveal(head, { duration: 0.55 }), 0.35);
      if (handle) tl.set(handle, { autoAlpha: 1 }, 0.3);
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
            },
          },
          0.3
        );
      }
      if (handle) tl.set(handle, { autoAlpha: 0 }, 1.4);
    }, root);

    return () => ctx.revert();
  }, []);

  /* the marquee: moves by itself, and can be dragged / swiped / scrolled sideways */
  useEffect(() => {
    const v = view.current;
    const t = track.current;
    if (!v || !t) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = reduced ? 0 : BASE_SPEED;

    let half = 0; // width of one full set of logos
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
        x += (-auto + vel) * dt;
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
    <section id="stack" ref={root} aria-label="Tech stack" className="relative">
      <i data-line className="absolute inset-x-0 top-0 h-px bg-line" />

      {/* heading: top-left, above the moving row */}
      <div className="px-gutter pt-5 lg:pt-6">
        <p
          data-kicker
          className="block w-fit text-[0.78rem] font-light uppercase tracking-[0.08em] text-muted"
        >
          Built with
        </p>
        <p
          data-head
          className="mt-1 block w-fit text-[0.95rem] font-semibold uppercase leading-tight tracking-tight text-ink"
        >
          The full stack<span className="text-red">.</span>
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
            {stack.map((item, i) => (
              <Chip key={`a-${i}`} item={item} />
            ))}
            {stack.map((item, i) => (
              <Chip key={`b-${i}`} item={item} dup />
            ))}
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