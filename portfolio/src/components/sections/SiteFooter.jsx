import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
  cursorType,
  cursorMove,
  cursorClick,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";

const AG = [0, 1, 2];

export default function SiteFooter() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();

  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.set(
        el.querySelectorAll("[data-f-brand],[data-f-copy],[data-f-link]"),
        { autoAlpha: 0 }
      );
    }, el);

    const brand = el.querySelector("[data-f-brand]");
    const copy = el.querySelector("[data-f-copy]");
    const links = el.querySelector("[data-f-links]");
    const linkEls = [...el.querySelectorAll("[data-f-link]")];

    const groups = [
      brand && {
        element: brand,
        agents: [AG[0]],
        build: () => {
          const tl = gsap.timeline();
          cursorIntro(tl, [AG[0]], 0);
          cursorType(tl, brand, AG[0], { at: 0, duration: 0.45 });
          cursorOutro(tl, [AG[0]], { at: ">+=0.3" });
          return tl;
        },
      },
      copy && {
        element: copy,
        agents: [AG[1]],
        build: () => {
          const tl = gsap.timeline();
          cursorIntro(tl, [AG[1]], 0);
          cursorType(tl, copy, AG[1], { at: 0, duration: 0.5, smooth: true });
          cursorOutro(tl, [AG[1]], { at: ">+=0.3" });
          return tl;
        },
      },
      links && {
        element: links,
        agents: [AG[2]],
        once: true,
        build: () => {
          const tl = gsap.timeline();
          cursorIntro(tl, [AG[2]], 0);
          linkEls.forEach((link, i) => {
            const at = 0.1 + i * 0.3;
            cursorMove(tl, AG[2], link, {
              at,
              duration: 0.25,
              offset: { x: 0.3, y: 0.5 },
            });
            cursorClick(tl, AG[2], at + 0.25);
            tl.fromTo(
              link,
              { autoAlpha: 0, y: 5 },
              { autoAlpha: 1, y: 0, duration: 0.3 },
              at + 0.2
            );
          });
          cursorOutro(tl, [AG[2]], { at: ">+=0.3" });
          return tl;
        },
      },
    ].filter(Boolean);

    const stop = createViewportReveal({
      root: el,
      sectionId: "footer",
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
  }, [enabled]);

  return (
    <footer
      ref={root}
      className="flex flex-wrap items-center justify-between gap-5 border-t border-line px-gutter py-10 max-sm:flex-col max-sm:items-start"
    >
      <span data-f-brand className="display inline-block text-[2rem]">
        {content.brand}
        <span className="text-red">.</span>
      </span>

      <span data-f-copy className="label inline-block">
        © {new Date().getFullYear()} Adwaith A Kumar. Built live, line by line.
      </span>

      <span data-f-links className="label flex gap-6">
        <a
          data-f-link
          href={content.social.github}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          GitHub ↗
        </a>
        <a
          data-f-link
          href={content.social.linkedin}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          LinkedIn ↗
        </a>
      </span>
    </footer>
  );
}
