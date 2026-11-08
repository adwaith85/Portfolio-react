import gsap from "gsap";
import { swarm } from "../components/cursors/swarmApi";

/* Text appears left to right like typing.
   - steps: letter-by-letter feel (default). smooth: true gives a soft wipe instead.
   - caret: element that follows the typing edge
   - agent: index of a cursor that follows the typing edge */
export function typeReveal(
  el,
  { duration = 0.7, smooth = false, caret = null, agent = null } = {}
) {
  const tl = gsap.timeline();
  if (!el) return tl;
  const n = Math.max(4, (el.textContent || "").length);

  tl.set(el, { autoAlpha: 1 });
  tl.fromTo(
    el,
    { clipPath: "inset(-20% 100% -20% -5%)" },
    {
      clipPath: "inset(-20% -5% -20% -5%)",
      duration,
      ease: smooth ? "power2.out" : `steps(${n})`,
      onStart() {
        if (caret) gsap.set(caret, { autoAlpha: 1 });
      },
      onUpdate() {
        const r = this.ratio;
        if (caret) caret.style.left = `${r * 100}%`;
        if (agent !== null) swarm.placeAt(agent, el, r, 0.8, 4, 0);
      },
      onComplete() {
        if (caret) gsap.set(caret, { autoAlpha: 0 });
        gsap.set(el, { clearProps: "clipPath" });
      },
    }
  );
  return tl;
}

/* Design-tool style: an agent drags a dashed selection box around an element.
   wrap must be position: relative and contain a [data-sel] box with
   [data-handle] corners and a [data-tag] label. */
export function dragSelect(wrap, sel, { agent, duration = 0.5, pad = 12 } = {}) {
  const tl = gsap.timeline();
  if (!wrap || !sel) return tl;
  const handles = sel.querySelectorAll("[data-handle]");
  const tag = sel.querySelector("[data-tag]");

  tl.add(
    swarm.moveTo(agent, wrap, {
      duration: 0.4,
      offset: { x: 0, y: 0 },
      dx: -pad,
      dy: -pad,
    })
  );
  tl.set(sel, { autoAlpha: 1, width: 0, height: 0 });
  tl.add("drag");
  tl.add(
    swarm.moveTo(agent, wrap, {
      duration,
      offset: { x: 1, y: 1 },
      dx: pad,
      dy: pad,
      ease: "power2.out",
    }),
    "drag"
  );
  tl.to(
    sel,
    {
      width: () => wrap.offsetWidth + pad * 2,
      height: () => wrap.offsetHeight + pad * 2,
      duration,
      ease: "power2.out",
    },
    "drag"
  );
  tl.fromTo(
    handles,
    { scale: 0 },
    { scale: 1, duration: 0.25, stagger: 0.03, ease: "back.out(3)" }
  );
  tl.fromTo(
    tag,
    { autoAlpha: 0, y: 4 },
    { autoAlpha: 1, y: 0, duration: 0.2 },
    "<"
  );
  return tl;
}
