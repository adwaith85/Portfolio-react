import { useEffect, useRef } from "react";
import { setTheme, useTheme } from "../../theme/theme";

const EASE = "cubic-bezier(.2,.7,.2,1)";
const CORD_TOP = 9;
const FERRULE = 5;
const KNOB_H = 28;
const THRESHOLD = 36;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const restLength = () =>
  typeof window === "undefined" ? 160 : Math.min(220, Math.max(110, window.innerHeight * 0.2));

export default function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const rest = restLength();

  const swayRef = useRef(null);
  const cordRef = useRef(null);
  const ferruleRef = useRef(null);
  const tasselRef = useRef(null);
  const knobRef = useRef(null);
  const thumbRef = useRef(null);
  const switchRef = useRef(null);
  const dragRef = useRef({ active: false, id: -1, x: 0, y: 0, pull: 0, lean: 0 });
  const framesRef = useRef({ tug: 0, spring: 0 });
  const lastRef = useRef({ pull: 0, lean: 0 });

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const toggle = (handle, atRect = null) => {
    const origin = handle || knobRef.current || thumbRef.current || switchRef.current;
    const apply = () => setTheme(next, origin);

    if (!origin || !document.startViewTransition || reduced()) {
      apply();
      return;
    }

    const rect = atRect || origin.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 800,
          easing: EASE,
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const pauseSway = (paused) => swayRef.current?.classList.toggle("is-pulling", paused);

  const stopFrames = () => {
    cancelAnimationFrame(framesRef.current.tug);
    cancelAnimationFrame(framesRef.current.spring);
    framesRef.current.tug = 0;
    framesRef.current.spring = 0;
  };

  /* All cord updates are direct DOM writes: no React state changes per frame. */
  const draw = (pull, lean) => {
    const cord = cordRef.current;
    const ferrule = ferruleRef.current;
    const tassel = tasselRef.current;
    const knob = knobRef.current;
    if (!cord || !ferrule || !tassel || !knob) return;

    const end = CORD_TOP + rest + pull;
    const speed = pull - lastRef.current.pull;
    const lag = clamp(-speed * 0.22, -6, 6);
    const swing = clamp(-speed * 0.55 + lean * 0.4, -10, 10);
    const tilt = (Math.atan(lean / (rest + CORD_TOP)) * 180) / Math.PI;
    const knobTop = end + FERRULE;
    const tasselTop = knobTop + KNOB_H - 1;

    cord.setAttribute("height", String(rest + pull));
    cord.setAttribute("transform", `skewX(${tilt})`);
    ferrule.setAttribute("transform", `translate(${lean} ${end})`);
    knob.style.top = `${knobTop}px`;
    knob.style.left = `calc(50% + ${lean}px)`;
    tassel.setAttribute(
      "transform",
      `translate(${lean} ${tasselTop + lag}) rotate(${swing} 12 0)`
    );
    lastRef.current = { pull, lean };
  };

  const springBack = (fromPull, fromLean) => {
    stopFrames();
    pauseSway(true);
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / 600);
      const decay = Math.exp(-7 * t);
      const wave = Math.cos(t * Math.PI * 4.5);
      draw(Math.max(0, fromPull * decay * wave), fromLean * decay * wave);
      if (t < 1) {
        framesRef.current.spring = requestAnimationFrame(step);
      } else {
        framesRef.current.spring = 0;
        draw(0, 0);
        pauseSway(false);
      }
    };
    framesRef.current.spring = requestAnimationFrame(step);
  };

  const tugThen = (done) => {
    stopFrames();
    if (reduced()) {
      done();
      return;
    }
    pauseSway(true);
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / 140);
      draw(40 * (1 - (1 - t) ** 3), 0);
      if (t < 1) {
        framesRef.current.tug = requestAnimationFrame(step);
      } else {
        framesRef.current.tug = 0;
        done();
        springBack(40, 0);
      }
    };
    framesRef.current.tug = requestAnimationFrame(step);
  };

  const onKnobDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopFrames();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      pull: 0,
      lean: 0,
    };
    pauseSway(true);
  };

  const onKnobMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active || event.pointerId !== drag.id) return;
    const dy = Math.max(0, event.clientY - drag.y);
    const pull = Math.min(70, dy <= 45 ? dy : 45 + (dy - 45) * 0.45);
    const lean = clamp((event.clientX - drag.x) * 0.25, -8, 8);
    drag.pull = pull;
    drag.lean = lean;
    draw(pull, lean);
  };

  const endDrag = (event, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag.active || event.pointerId !== drag.id) return;
    drag.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const atRect = knobRef.current?.getBoundingClientRect() || null;
    if (drag.pull >= THRESHOLD) {
      springBack(drag.pull, drag.lean);
      if (!cancelled) toggle(knobRef.current, atRect);
    } else if (cancelled) {
      springBack(drag.pull, drag.lean);
    } else {
      tugThen(() => toggle(knobRef.current, atRect));
    }
  };

  const onKnobKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (event.repeat) return;
    const atRect = knobRef.current?.getBoundingClientRect() || null;
    tugThen(() => toggle(knobRef.current, atRect));
  };

  useEffect(
    () => () => {
      cancelAnimationFrame(framesRef.current.tug);
      cancelAnimationFrame(framesRef.current.spring);
    },
    []
  );

  const cordEnd = CORD_TOP + rest;
  const knobTop = cordEnd + FERRULE;
  const tasselTop = knobTop + KNOB_H - 1;

  return (
    <>
      {/* Desktop: old lamp pull cord hanging in the right gutter of the hero. */}
      <div className="pointer-events-none absolute right-[calc(var(--spacing-gutter)/2+18px)] top-0 z-[7] hidden w-8 translate-x-1/2 select-none lg:block">
        <div ref={swayRef} className="theme-rope-sway relative h-[360px] w-8">
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width="32"
            height="360"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="theme-rope-braid"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(42)"
              >
                <rect width="6" height="6" fill="var(--t-ink)" opacity="0.82" />
                <rect width="2.4" height="6" fill="var(--t-accent)" opacity="0.75" />
              </pattern>
            </defs>

            {/* flat ceiling canopy with its eyelet */}
            <rect x="5" y="0" width="22" height="3.5" rx="1.5" fill="var(--t-detail)" />
            <path d="M7 3.5h18" stroke="var(--t-ink)" strokeOpacity="0.45" strokeWidth="1" />
            <circle cx="16" cy="6.5" r="3" fill="none" stroke="var(--t-detail)" strokeWidth="1.2" />

            {/* braided cord */}
            <rect
              ref={cordRef}
              className="theme-rope-cord"
              x="14.5"
              y={CORD_TOP}
              width="3"
              height={rest}
              rx="1.5"
              fill="url(#theme-rope-braid)"
            />

            {/* ferrule */}
            <g ref={ferruleRef} transform={`translate(0 ${cordEnd})`}>
              <rect
                x="12.5"
                y="-2"
                width="7"
                height="6"
                rx="2.5"
                fill="var(--t-detail)"
                stroke="var(--t-ink)"
                strokeOpacity="0.4"
                strokeWidth="0.6"
              />
              <path d="M13.2 0h5.6" stroke="var(--t-accent)" strokeWidth="0.8" opacity="0.8" />
            </g>

            {/* short tassel */}
            <g
              ref={tasselRef}
              transform={`translate(0 ${tasselTop})`}
              fill="none"
              stroke="var(--t-ink)"
              strokeWidth="0.85"
              strokeLinecap="round"
              opacity="0.75"
            >
              <path d="M13 0q0 7 1.6 12" />
              <path d="M12 0q-0.3 7 -0.8 13" stroke="var(--t-accent)" />
              <path d="M11 0q-0.7 6 -2 10.5" />
              <path d="M14 0q0.8 6 2.2 10" stroke="var(--t-accent)" />
              <path d="M10 0q-0.8 5 -1.8 9" />
              <path d="M12.6 0q0.4 7 0.3 12.5" />
            </g>
          </svg>

          <button
            ref={knobRef}
            type="button"
            data-cursor-hover
            aria-label={`Switch to ${next} mode`}
            onPointerDown={onKnobDown}
            onPointerMove={onKnobMove}
            onPointerUp={(event) => endDrag(event)}
            onPointerCancel={(event) => endDrag(event, true)}
            onKeyDown={onKnobKeyDown}
            className="theme-rope-knob pointer-events-auto absolute -ml-3 size-6 border-0 bg-transparent p-0"
            style={{ top: knobTop, left: "50%" }}
          >
            <svg viewBox="0 0 24 28" className="pointer-events-none block size-full" aria-hidden="true">
              <path
                d="M12 1c3.4 0 5.4 2.5 5 5.8-.2 2.2 2.6 3.9 2.6 8.2 0 5-3.3 9.4-7.6 12-4.3-2.6-7.6-7-7.6-12 0-4.3 2.8-6 2.6-8.2C6.6 3.5 8.6 1 12 1Z"
                fill="var(--t-accent)"
                stroke="var(--t-accent-deep)"
                strokeWidth="0.8"
              />
              <path
                d="M9 6.5c-1 1.3-1.3 3-1 4.5"
                fill="none"
                stroke="var(--t-detail)"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.75"
              />
              <ellipse
                cx="9.4"
                cy="14"
                rx="1.6"
                ry="3"
                fill="var(--t-detail)"
                opacity="0.35"
                transform="rotate(12 9.4 14)"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile / tablet: real switch just under the right end of PORTFOLIO. */}
      <button
        ref={switchRef}
        type="button"
        role="switch"
        aria-checked={theme === "dark"}
        aria-label="Dark mode"
        data-cursor-hover
        onClick={() => toggle(thumbRef.current || switchRef.current)}
        className="theme-switch absolute z-[7] lg:hidden"
        style={{
          right: "var(--spacing-gutter)",
          top: "calc(6svh + min(24vw, 17svh) * 0.85 + 1svh)",
        }}
      >
        <svg viewBox="0 0 24 24" className="theme-switch-icon theme-switch-sun" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="var(--t-detail)" />
          <g stroke="var(--t-detail)" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </g>
        </svg>
        <svg viewBox="0 0 24 24" className="theme-switch-icon theme-switch-moon" aria-hidden="true">
          <path
            d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z"
            fill="var(--t-detail)"
            stroke="var(--t-accent)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span ref={thumbRef} className="theme-switch-thumb" aria-hidden="true" />
      </button>
    </>
  );
}
