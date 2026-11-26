import { useRef } from "react";
import { setTheme, useTheme } from "../../theme/theme";

const EASE = "cubic-bezier(.2,.7,.2,1)";

export default function ThemeToggle() {
  const buttonRef = useRef(null);
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  const onClick = () => {
    const button = buttonRef.current;
    const apply = () => setTheme(next, button);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!button || !document.startViewTransition || reduced) {
      apply();
      return;
    }

    const rect = button.getBoundingClientRect();
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

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      data-cursor-hover
      aria-label={`Switch to ${next} mode`}
      className="fixed left-1/2 z-[10001] grid size-9 place-items-center rounded-full border border-line bg-panel text-ink"
      style={{
        top: "max(12px, env(safe-area-inset-top))",
        transform: "translateX(-50%)",
      }}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="var(--t-accent)" />
          <g stroke="var(--t-detail)" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
          <path
            d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z"
            fill="var(--t-detail)"
            stroke="var(--t-accent)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
