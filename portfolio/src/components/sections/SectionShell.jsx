import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
  cursorType,
  cursorOpen,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";

// heading uses three cursors; the body box uses one more
const AG = { head: [0, 1, 2], body: [3] };

export default function SectionShell({ id, num, label, headline, note, children }) {
  const root = useRef(null);
  const enabled = useAgentsEnabled();

  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const text = el.querySelectorAll(
        "[data-sec-label],[data-sec-h1],[data-sec-h2],[data-note]"
      );
      if (text.length) gsap.set(text, { autoAlpha: 0 });
      const box = el.querySelector("[data-box]");
      if (box) gsap.set(box, { autoAlpha: 1, clipPath: "inset(0% 0% 100% 0%)" });
    }, el);

    const head = el.querySelector("[data-sec-head]");
    const box = el.querySelector("[data-box]");

    const groups = [
      head && {
        element: head,
        agents: AG.head,
        build: () => {
          const $ = (s) => el.querySelector(s);
          const lab = $("[data-sec-label]");
          const h1 = $("[data-sec-h1]");
          const h2 = $("[data-sec-h2]");
          const [a, b, c] = AG.head;

          const tl = gsap.timeline();
          cursorIntro(tl, AG.head, 0);

          let t = 0;
          if (lab) t = cursorType(tl, lab, a, { at: 0, duration: 0.3 });
          if (h1) cursorType(tl, h1, b, { at: 0.35, duration: 0.4 });
          if (h2) cursorType(tl, h2, c, { at: 0.7, duration: 0.4 });

          cursorOutro(tl, AG.head, { at: Math.max(t, 1.5) + 0.35 });
          return tl;
        },
      },
      box && {
        element: box,
        agents: AG.body,
        build: (node) => {
          const ag = AG.body[0];
          const n = el.querySelector("[data-note]");
          const tl = gsap.timeline();
          cursorIntro(tl, AG.body, 0);

          const opened = cursorOpen(tl, ag, node, {
            at: 0,
            duration: 0.5,
            travel: 0.35,
          });
          if (n) {
            cursorType(tl, n, ag, {
              at: opened - 0.15,
              duration: 0.7,
              smooth: true,
              travel: 0.2,
            });
          }

          cursorOutro(tl, AG.body, { at: ">+=0.35" });
          return tl;
        },
      },
    ].filter(Boolean);

    const stop = createViewportReveal({
      root: el,
      sectionId: id,
      enabled,
      reduced,
      start: "top 95%",
      speed: 1.35,
      back: 2.2,
      groups,
    });

    return () => {
      stop();
      ctx.revert();
    };
  }, [enabled, id]);

  return (
    <section
      id={id}
      ref={root}
      className="flex h-svh flex-col overflow-hidden border-t border-line px-gutter py-[5svh]"
    >
      <div data-sec-head className="mb-[3svh] shrink-0">
        <p className="label">
          <span data-sec-label className="inline-block">
            <span className="text-red">{num}</span> / {label}
          </span>
        </p>
        <h2 className="display mt-3 text-[min(7.5vw,13svh)] max-sm:text-[clamp(2.2rem,11vw,3.4rem)]">
          <span data-sec-h1 className="block w-fit">
            {headline[0]}
          </span>
          <span data-sec-h2 className="block w-fit text-red">
            {headline[1]}
          </span>
        </h2>
      </div>

      <div className="min-h-0 flex-1">
        {children ?? (
          <div
            data-box
            className="flex h-full items-center justify-center rounded border border-dashed border-line px-6 text-center text-muted"
          >
            <span data-note className="inline-block">
              {note}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
