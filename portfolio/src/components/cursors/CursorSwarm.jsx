import { useEffect, useRef } from "react";
import gsap from "gsap";
import { AGENTS } from "./agents";
import { swarm } from "./swarmApi";
import { agentStore, useAgents } from "../../engine/agentStore";
import useAgentsEnabled from "../../engine/useAgentsEnabled";

const rand = (a, b) => a + Math.random() * (b - a);

function Agent({ name, color, label, hoverOnly = false, innerRef }) {
  return (
    <div
      ref={innerRef}
      data-agent
      data-hover-cursor={hoverOnly ? "" : undefined}
      className="fixed left-0 top-0 opacity-0 will-change-transform"
    >
      <span
        data-ripple
        className="absolute -left-4 -top-4 size-8 rounded-full border-2 opacity-0"
        style={{ borderColor: color }}
      />
      <svg
        data-arrow
        width="18"
        height="22"
        viewBox="0 0 18 22"
        className="block drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]"
        style={{ transformOrigin: "2px 2px" }}
      >
        <path
          d="M2 2 L2 17.5 L6.3 13.4 L9.1 19.6 L11.7 18.4 L8.9 12.3 L14.6 12.1 Z"
          fill={color}
          stroke="#090909"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      {label && (
        <span
          className="absolute left-4 top-4 whitespace-nowrap rounded-sm px-1.5 py-[3px] text-[10px] font-semibold leading-none text-bg"
          style={{ background: color }}
        >
          {name}
        </span>
      )}
    </div>
  );
}

function Swarm() {
  const root = useRef(null);
  const hoverCursor = useRef(null);

  useEffect(() => {
    const nodes = [
      ...root.current.querySelectorAll("[data-agent]:not([data-hover-cursor])"),
    ];
    const list = nodes.map((wrap) => ({
      wrap,
      ripple: wrap.querySelector("[data-ripple]"),
      arrow: wrap.querySelector("[data-arrow]"),
      tween: null,
      claimed: false,
    }));

    // A dedicated cursor for pointer hover. It is not part of the 20 build
    // agents, so a running scroll reveal can never steal or hide it.
    const hoverNode = hoverCursor.current;
    const hoverEntry = hoverNode
      ? {
          wrap: hoverNode,
          ripple: hoverNode.querySelector("[data-ripple]"),
          arrow: hoverNode.querySelector("[data-arrow]"),
          tween: null,
          claimed: true,
          hoverOnly: true,
        }
      : null;

    const ctx = gsap.context(() => {
      list.forEach(({ wrap }, i) => {
        // everyone starts as a cluster in the middle, then spreads out
        gsap.set(wrap, {
          x: window.innerWidth / 2 + rand(-60, 60),
          y: window.innerHeight / 2 + rand(-40, 40),
        });
        gsap.to(wrap, { opacity: 1, duration: 0.3, delay: i * 0.06 });
      });

      agentStore.set({ agents: list.length, status: "Scanning page..." });
      gsap.delayedCall(0.4, () => swarm.roamAll());
    }, root);

    // registering last: this is what lets a waiting build start
    swarm.register(hoverEntry ? [...list, hoverEntry] : list);

    const onVisibility = () => {
      if (document.hidden) {
        swarm.pauseIdle();
        swarm.hoverEnd();
        swarm.setVisible(false);
      } else {
        swarm.setVisible(true);
        swarm.resumeIdle();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (document.hidden) onVisibility();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      swarm.hoverEnd();
      swarm.stopAll();
      swarm.register([]);
      ctx.revert();
    };
  }, []);

  /* pointer hover: when the pointer is over [data-cursor-hover], a free agent
     chases it quickly and grows, so the swarm reacts to headings, text, chips,
     photo cards and every other marked element. */
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = root.current;
    if (!el) return;

    let active = null;
    const onMove = (e) => {
      const hit =
        e.target instanceof Element
          ? e.target.closest(
              '[data-cursor-hover], a[href], button:not(:disabled), [role="button"], input, select, textarea, summary'
            )
          : null;
      if (hit !== active) {
        active = hit;
        el.classList.toggle("swarm-hover", Boolean(hit));
      }
      if (hit) swarm.hoverAt(e.clientX, e.clientY);
      else swarm.hoverEnd();
    };

    const onLeave = () => {
      active = null;
      el.classList.remove("swarm-hover");
      swarm.hoverEnd();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      swarm.hoverEnd();
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9990]"
    >
      {AGENTS.map((a) => (
        <Agent key={a.name} {...a} />
      ))}
      {/* pointer-follow cursor: hidden until the pointer is over a marked element */}
      <Agent name="Pointer" color="#ffffff" hoverOnly innerRef={hoverCursor} />
    </div>
  );
}

export default function CursorSwarm() {
  const enabled = useAgentsEnabled();
  const { ui } = useAgents();
  const touchDevice =
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  if (!enabled || ui === "closed" || touchDevice) return null;
  return <Swarm />;
}
