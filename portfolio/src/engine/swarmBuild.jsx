/* eslint-disable react-refresh/only-export-components -- this module shares build helpers. */
import { Fragment } from "react";
import gsap from "gsap";
import { swarm } from "../components/cursors/swarmApi";
import { typeReveal } from "./buildKit";

export const BLUE = "#4c8dff";

/* every word is its own element so a cursor can write them one by one */
export function Words({ text }) {
  return String(text)
    .split(" ")
    .map((w, i) => (
      <Fragment key={i}>
        {i > 0 && " "}
        <span data-w className="inline-block">
          {w}
        </span>
      </Fragment>
    ));
}

/* one blue selection box per cursor, created inside `host` when a build starts.
   host must be position: relative */
export function makeOverlay(host) {
  const o = document.createElement("span");
  o.setAttribute("data-ov", "");
  o.className = "pointer-events-none absolute z-30 border border-dashed";
  o.style.cssText = `left:0;top:0;width:0;height:0;opacity:0;visibility:hidden;transform-origin:0 0;border-color:${BLUE};background:rgba(76,141,255,0.08)`;
  const tag = document.createElement("b");
  tag.className =
    "absolute -top-5 left-0 whitespace-nowrap rounded-sm px-1.5 py-[2px] text-[9px] font-semibold leading-none text-white";
  tag.style.background = BLUE;
  o.appendChild(tag);
  host.appendChild(o);
  return { o, tag };
}

export function clearOverlays(root) {
  if (root) root.querySelectorAll("[data-ov]").forEach((n) => n.remove());
}

/* cursor flies to an element, clicks, drags a selection box over it.
   returns the time at which the element can appear */
export function dragBox(
  tl,
  ov,
  ag,
  el,
  host,
  at,
  {
    tag = "",
    dur = 0.35,
    pad = 3,
    travel = 0.12,
    rect = null,
    hostRect = null,
    withCursor = true,
  } = {}
) {
  if (!el || !ov) return at;
  const p = { v: 0 };
  let trackedRect = null;

  if (withCursor) {
    tl.add(
      swarm.moveTo(ag, el, {
        duration: travel,
        offset: { x: 0, y: 0 },
        dx: -pad,
        dy: -pad,
        ease: "power3.out",
        rect: rect || undefined,
      }),
      at
    );
  }
  tl.add(() => {
    const r = rect || el.getBoundingClientRect();
    const b = hostRect || host.getBoundingClientRect();
    trackedRect = { left: r.left, top: r.top, width: r.width, height: r.height };

    // Position and size are written once; the drag only scales the overlay.
    ov.o.style.left = `${r.left - b.left - pad}px`;
    ov.o.style.top = `${r.top - b.top - pad}px`;
    ov.o.style.width = `${r.width + pad * 2}px`;
    ov.o.style.height = `${r.height + pad * 2}px`;
    ov.o.style.transformOrigin = "0 0";
    ov.tag.textContent = tag;
    gsap.set(ov.o, { autoAlpha: 1, scaleX: 0, scaleY: 0 });
    if (withCursor) swarm.click(ag);
  }, at + travel);
  tl.fromTo(
    p,
    { v: 0 },
    {
      v: 1,
      duration: dur,
      ease: "power3.out",
      autoRound: false,
      onUpdate() {
        gsap.set(ov.o, { scaleX: p.v, scaleY: p.v });
        if (withCursor && trackedRect) swarm.placeAtRect(ag, trackedRect, p.v, p.v, pad, pad);
      },
    },
    at + travel
  );
  tl.to(ov.o, { autoAlpha: 0, duration: 0.05 }, at + travel + dur + 0.01);
  return at + travel + dur + 0.06;
}

/* cursor writes the words of an element one by one and follows the writing edge */
export function typeWords(tl, el, ag, at, perLetter = 0.006) {
  if (!el) return at;
  const words = [...el.querySelectorAll("[data-w]")];
  if (!words.length) return at;

  tl.add(
    swarm.moveTo(ag, words[0], { duration: 0.08, offset: { x: 0, y: 0.55 } }),
    at
  );
  tl.add(() => swarm.click(ag), at + 0.08);

  let t = at + 0.1;
  words.forEach((w) => {
    const len = Math.max(2, (w.textContent || "").length);
    const d = len * perLetter;
    tl.add(typeReveal(w, { duration: d, agent: ag }), t);
    t += d + 0.03;
  });
  return t;
}

/* cursor flies to a small element, clicks, and the element pops in */
export function popIn(tl, ag, el, at, { travel = 0.08, from = { autoAlpha: 0, scale: 0.4 } } = {}) {
  if (!el) return at;
  tl.add(swarm.moveTo(ag, el, { duration: travel }), at);
  tl.add(() => swarm.click(ag), at + travel);
  tl.fromTo(
    el,
    from,
    { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(3)" },
    at + travel
  );
  return at + travel + 0.3;
}

/* mouse devices only: 3D tilt toward the mouse and a red spotlight inside each tile.
   Each tile needs the class group/card and position: relative. Returns a cleanup. */
export function tiltTiles(root, selector, { max = 6 } = {}) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return () => {};
  }
  const offs = [];
  const on = (el, type, fn) => {
    el.addEventListener(type, fn);
    offs.push(() => el.removeEventListener(type, fn));
  };

  const ctx = gsap.context(() => {
    root.querySelectorAll(selector).forEach((tile) => {
      gsap.set(tile, { transformPerspective: 900 });
      const rx = gsap.quickTo(tile, "rotationX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(tile, "rotationY", { duration: 0.5, ease: "power3.out" });
      let raf = 0;
      on(tile, "pointermove", (e) => {
        const r = tile.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * max);
        rx((0.5 - py) * max);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
          tile.style.setProperty("--my", `${e.clientY - r.top}px`);
        });
      });
      on(tile, "pointerleave", () => {
        ry(0);
        rx(0);
      });
    });
  }, root);

  return () => {
    offs.forEach((off) => off());
    ctx.revert();
  };
}

/* the red spotlight layer used inside tiles (style it with --mx / --my) */
export const SPOTLIGHT_STYLE = {
  background:
    "radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), rgba(214,26,41,0.14), transparent 60%)",
};
