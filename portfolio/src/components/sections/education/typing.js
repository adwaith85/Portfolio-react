import gsap from "gsap";
import {
  cursorIntro,
  cursorOutro,
  cursorType,
  cursorMove,
  cursorClick,
} from "../../../engine/viewport";
import { typeReveal } from "../../../engine/buildKit";

// All 20 build agents (the hover pointer is registered separately).
export const ALL_AGENTS = Array.from({ length: 20 }, (_, i) => i);

/*
  PAUSED timeline that types every [data-ty] line inside `root`.

  Desktop: a swarm cursor flies to each line, clicks and follows the wipe.
  Touch / narrow / reduced motion: the same lines wipe in without cursors.
  Typing is time based; scroll only decides when it starts.
*/
export function buildCardTyping(root, withCursors) {
  const lines = [...root.querySelectorAll("[data-ty]")];
  const tl = gsap.timeline({ paused: true });
  if (withCursors) cursorIntro(tl, ALL_AGENTS, 0);
  let end = 0;

  lines.forEach((el, k) => {
    const len = (el.textContent || "").length;
    const dur = Math.min(0.35, Math.max(0.12, len * 0.006));
    const at = k * 0.025;
    if (withCursors) {
      end = Math.max(
        end,
        cursorType(tl, el, ALL_AGENTS[k % 20], {
          at,
          duration: dur,
          travel: 0.18,
          smooth: len > 70,
        })
      );
    } else {
      tl.add(typeReveal(el, { duration: dur, smooth: len > 70 }), at);
      end = Math.max(end, at + dur);
    }
  });

  if (withCursors) {
    // Agents without a line still get a quick click somewhere on the card.
    for (let a = lines.length; a < 20; a++) {
      const at = a * 0.04;
      cursorMove(tl, a, root, {
        at,
        duration: 0.3,
        offset: { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8 },
      });
      cursorClick(tl, a, at + 0.3);
    }
    cursorOutro(tl, ALL_AGENTS, { at: end + 0.1 });
  }
  tl.timeScale(Math.max(1, tl.duration() / 1.0));
  return tl;
}

export const showLines = (root) => {
  const l = root.querySelectorAll("[data-ty]");
  gsap.set(l, { autoAlpha: 1 });
  l.forEach((n) => (n.style.clipPath = ""));
};

export const hideLines = (root) => {
  const l = root.querySelectorAll("[data-ty]");
  gsap.set(l, { autoAlpha: 0 });
  l.forEach((n) => (n.style.clipPath = ""));
};
