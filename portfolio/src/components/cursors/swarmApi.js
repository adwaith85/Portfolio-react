import gsap from "gsap";
import { agentStore } from "../../engine/agentStore";

const agents = []; // { wrap, ripple, arrow, tween, claimed }
const waiting = new Set();
let ready = false;
let hoverIdx = -1;
let introDone = false; // the first-section build has finished (including disabled cases)
let building = false;
const PAD = 48;

const rand = (a, b) => a + Math.random() * (b - a);

const ARROW_FILTER = "drop-shadow(0 2px 3px rgba(0,0,0,0.6))";
const HOVER_FILTER = "drop-shadow(0 0 8px rgba(214,26,41,0.9))";

// While roaming, keep the cursors reasonably spread out. A pure random point
// lets 20 agents pile up in the same corner, which looks messy. Each agent
// picks a point, then nudges away from any cursor that is already close.
const randomPoint = (self = null) => {
  let x = rand(PAD, window.innerWidth - PAD);
  let y = rand(PAD, window.innerHeight - PAD);

  for (let attempt = 0; attempt < 5; attempt++) {
    let crowded = false;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (!a || a === self || !a.wrap || a.hoverOnly) continue;
      const ax = Number(gsap.getProperty(a.wrap, "x")) || 0;
      const ay = Number(gsap.getProperty(a.wrap, "y")) || 0;
      if (Math.abs(ax - x) < 52 && Math.abs(ay - y) < 42) {
        crowded = true;
        break;
      }
    }
    if (!crowded) break;
    x = rand(PAD, window.innerWidth - PAD);
    y = rand(PAD, window.innerHeight - PAD);
  }

  return { x, y };
};

// viewport position of an element (or selector). offset is 0..1 inside the element
function pointOf(target, offset = { x: 0.5, y: 0.5 }) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width * offset.x, y: r.top + r.height * offset.y };
}

// stop the pointer-follow state on whichever agent currently has it
function endHover({ roam = true, includeHover = false } = {}) {
  const i = hoverIdx;
  const a = agents[i];
  // section builds call this too; they must not hide the pointer cursor that
  // the user is actively hovering with.
  if (a && a.hoverOnly && !includeHover) return;
  hoverIdx = -1;
  if (!a || !a.wrap) return;
  a.hovering = false;
  gsap.to(a.arrow, {
    scale: 1,
    duration: 0.1,
    ease: "power2.out",
    overwrite: "auto",
  });
  gsap.to(a.wrap, {
    opacity: 0,
    duration: 0.1,
    ease: "power2.out",
    overwrite: "auto",
  });
  gsap.to(a.arrow, {
    filter: ARROW_FILTER,
    duration: 0.1,
    ease: "power2.out",
  });
  if (roam && !a.claimed && !a.hoverOnly) swarm.roam(i);
}

export const swarm = {
  register(list) {
    agents.forEach((a) => {
      if (!a) return;
      gsap.killTweensOf([a.wrap, a.arrow, a.ripple].filter(Boolean));
    });
    agents.length = 0;
    hoverIdx = -1;
    list.forEach((a) => (a.claimed = false));
    agents.push(...list);
    ready = agents.length > 0;
    if (ready) {
      const cbs = [...waiting];
      waiting.clear();
      cbs.forEach((cb) => cb());
    }
  },

  // run cb once the cursors exist (immediately if they already do)
  whenReady(cb) {
    if (ready) {
      cb();
      return () => {};
    }
    waiting.add(cb);
    return () => waiting.delete(cb);
  },

  // kill and fully hide every build agent. The dedicated hover cursor is left
  // alone so pointer feedback keeps working. Claimed agents stay claimed so a
  // remount or a visibilitychange cannot bring them back by roaming.
  hideAll() {
    agents.forEach((a) => {
      if (!a || a.hoverOnly) return;
      if (a.tween) {
        a.tween.kill();
        a.tween = null;
      }
      gsap.killTweensOf([a.wrap, a.arrow, a.ripple].filter(Boolean));
      gsap.set(a.wrap, { opacity: 0, visibility: "hidden" });
      a.claimed = true;
    });
  },

  // remembered across CursorSwarm remounts (e.g. resizing across 768px)
  setIntroDone(v) {
    introDone = Boolean(v);
  },

  isIntroDone() {
    return introDone;
  },

  stopAll() {
    agents.forEach((a) => a.tween && a.tween.kill());
  },

  pauseIdle() {
    agents.forEach((a) => {
      if (!a || a.hoverOnly || a.claimed) return;
      if (a.tween) a.tween.kill();
      a.tween = null;
      gsap.set(a.wrap, { opacity: 0 });
    });
  },

  park(list) {
    if (!Array.isArray(list)) return;
    list.forEach((i) => {
      const a = agents[i];
      if (!a || a.hoverOnly) return;
      if (a.tween) a.tween.kill();
      a.tween = null;
      a.claimed = true;
      gsap.killTweensOf(a.wrap);
      gsap.set(a.wrap, { opacity: 0, visibility: "hidden" });
    });
  },

  resumeIdle() {
    if (document.hidden) return;
    agents.forEach((a, i) => {
      if (!a || a.hoverOnly || a.claimed) return;
      gsap.set(a.wrap, { visibility: "visible" });
      gsap.to(a.wrap, { opacity: 1, duration: 0.18, overwrite: "auto" });
      swarm.roam(i);
    });
  },

  // a build takes an agent (it stops roaming)
  claim(i) {
    const a = agents[i];
    if (!a) return;
    if (hoverIdx === i) endHover({ roam: false });
    a.claimed = true;
    if (a.tween) a.tween.kill();
    a.tween = null;
    if (a.wrap) gsap.set(a.wrap, { visibility: "visible", opacity: 1 });
  },

  // pointer hover: the dedicated hover agent (not leased by any build) chases
  // the pointer quickly while it is over an interactive target. The chase is
  // intentionally fast (0.07s) so the cursor
  // feels attached to the pointer.
  hoverAt(x, y) {
    if (document.hidden) return;
    let a = agents[hoverIdx];
    if (!a || !a.hoverOnly) {
      hoverIdx = agents.findIndex((n) => n && n.hoverOnly);
      a = agents[hoverIdx];
    }
    if (!a || !a.wrap) return;

    if (!a.qx) {
      const opts = { duration: 0.07, ease: "power3.out", force3D: true };
      a.qx = gsap.quickTo(a.wrap, "x", opts);
      a.qy = gsap.quickTo(a.wrap, "y", opts);
    }

    // keep the cursor visible even if a running section build faded it out
    if (Number(gsap.getProperty(a.wrap, "opacity")) < 0.98) {
      gsap.to(a.wrap, {
        opacity: 1,
        duration: 0.07,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (!a.hovering) {
      a.hovering = true;
      gsap.to(a.arrow, {
        scale: 1.65,
        duration: 0.16,
        ease: "power2.out",
        overwrite: "auto",
      });
      if (a.ripple) {
        gsap.fromTo(
          a.ripple,
          { scale: 0.25, opacity: 0.8 },
          { scale: 1.7, opacity: 0, duration: 0.42, ease: "power2.out" }
        );
      }
      gsap.to(a.arrow, {
        filter: HOVER_FILTER,
        duration: 0.16,
        ease: "power2.out",
      });
    }

    a.qx(x);
    a.qy(y);
  },

  hoverEnd() {
    endHover({ includeHover: true });
  },

  // the build is done with the agent, back to roaming
  release(i) {
    const a = agents[i];
    if (!a) return;
    a.claimed = false;
    swarm.roam(i);
  },

  click(i) {
    const a = agents[i];
    if (!a) return gsap.timeline();
    if (!building) agentStore.addActions(1);
    return gsap
      .timeline()
      .to(a.arrow, { scale: 0.8, duration: 0.05, ease: "power2.out" })
      .to(a.arrow, { scale: 1, duration: 0.1, ease: "back.out(3)" })
      .fromTo(
        a.ripple,
        { scale: 0.2, opacity: 0.8 },
        { scale: 1.6, opacity: 0, duration: 0.3, ease: "power2.out" },
        0
      );
  },

  setBuilding(v) {
    building = Boolean(v);
  },

  // Fly agent i to an element. The target is measured when this plays,
  // so it works even if the element moves or resizes before then.
  // Pass `rect` ({left,top,width,height}) to avoid a layout read during the build.
  moveTo(
    i,
    target,
    {
      duration = 0.08,
      click = false,
      ease = "power3.out",
      offset = { x: 0.5, y: 0.5 },
      dx = 0,
      dy = 0,
      rect = null,
    } = {}
  ) {
    const a = agents[i];
    const tl = gsap.timeline();
    if (!a) return tl;

    const pos = (axis) => () => {
      let p = null;
      if (rect) {
        p = {
          x: rect.left + rect.width * offset.x,
          y: rect.top + rect.height * offset.y,
        };
      } else {
        p = pointOf(target, offset);
      }
      return (p ? p[axis] : gsap.getProperty(a.wrap, axis)) + (axis === "x" ? dx : dy);
    };

    tl.add(() => {
      swarm.claim(i);
    });
    tl.to(a.wrap, {
      x: pos("x"),
      y: pos("y"),
      duration,
      ease,
      force3D: true,
      overwrite: "auto",
    });
    if (click) {
      tl.add(() => {
        swarm.click(i);
      });
    }
    return tl;
  },

  // instantly place agent i at a fraction of an element (used by other sections)
  placeAt(i, target, fx, fy, dx = 0, dy = 0) {
    const a = agents[i];
    const p = pointOf(target, { x: fx, y: fy });
    if (a && p) gsap.set(a.wrap, { x: p.x + dx, y: p.y + dy, force3D: true });
  },

  // same, but from a viewport rect captured once when the step starts. No
  // layout read per frame. `rect` is a {left, top, width, height} object.
  placeAtRect(i, rect, fx, fy, dx = 0, dy = 0) {
    const a = agents[i];
    if (!a || !rect) return;
    gsap.set(a.wrap, {
      x: rect.left + rect.width * fx + dx,
      y: rect.top + rect.height * fy + dy,
      force3D: true,
    });
  },

  // wander forever: fast moves, random pauses, random clicks
  roam(i) {
    const a = agents[i];
    if (!a || a.claimed || a.hoverOnly) return;
    const step = () => {
      const p = randomPoint(a);
      const tl = gsap.timeline({ onComplete: step });
      tl.to(a.wrap, {
        x: p.x,
        y: p.y,
        duration: rand(0.45, 1.2),
        ease: "power3.inOut",
        force3D: true,
      });
      if (Math.random() < 0.32) {
        tl.add(() => {
          swarm.click(i);
        });
      }
      tl.to({}, { duration: rand(0.05, 0.5) });
      a.tween = tl;
    };
    step();
  },

  roamAll() {
    agents.forEach((_, i) => swarm.roam(i));
  },

  // fade every cursor out and stop them. Returns a timeline to add to a build.
  fadeOut(duration = 0.5) {
    const tl = gsap.timeline();
    const wraps = agents.filter((a) => !a.hoverOnly).map((a) => a.wrap);
    if (wraps.length) tl.to(wraps, { opacity: 0, duration, ease: "power2.out" });
    tl.add(() => {
      swarm.stopAll();
      agents.forEach((a) => {
        if (!a.hoverOnly) a.claimed = true;
      });
    });
    return tl;
  },

  // bring the cursors back (for a later section's build)
  showAll() {
    agents.forEach((a, i) => {
      if (a.hoverOnly) return;
      a.claimed = false;
      gsap.set(a.wrap, { visibility: "visible" });
      gsap.to(a.wrap, { opacity: 1, duration: 0.3 });
      swarm.roam(i);
    });
  },

  // the DOM elements of some agents, so a build can fade them with GSAP
  els(list) {
    if (!Array.isArray(list)) return [];
    return list.map((i) => agents[i] && agents[i].wrap).filter(Boolean);
  },

  // claim a whole lease at once (a viewport group owns a set of agents)
  claimMany(list) {
    if (!Array.isArray(list)) return;
    list.forEach((i) => swarm.claim(i));
  },

  // per-agent visibility, used by the viewport groups so one group leaving
  // never hides the cursors another visible group is still using
  show(i) {
    const a = agents[i];
    if (!a || !a.wrap) return;
    a.wrap.style.display = "";
    a.wrap.style.visibility = "visible";
  },

  hide(i) {
    const a = agents[i];
    if (!a || !a.wrap) return;
    a.wrap.style.visibility = "hidden";
  },

  dismiss(list) {
    if (!Array.isArray(list)) return;
    list.forEach((i) => {
      const a = agents[i];
      if (!a || !a.wrap) return;
      if (a.tween) a.tween.kill();
      a.tween = null;
      a.claimed = true;
      gsap.killTweensOf([a.wrap, a.arrow, a.ripple].filter(Boolean));
      gsap.set(a.wrap, { opacity: 0, x: 0, y: 0 });
      a.wrap.style.display = "none";
      a.wrap.style.visibility = "hidden";
    });
  },

  // hide/show every cursor without touching its opacity (used for scroll-back)
  setVisible(v) {
    agents.forEach((a) => {
      if (a.hoverOnly) return;
      // A claimed agent has finished its build (or belongs to another section).
      // Never let a tab switch or remount bring it back.
      if (v && a.claimed) return;
      a.wrap.style.visibility = v ? "visible" : "hidden";
    });
  },

  // a new section takes all cursors: stop roaming, make them invisible and idle
  takeOver() {
    endHover({ roam: false });
    agents.forEach((a) => {
      if (a.hoverOnly) return;
      if (a.tween) a.tween.kill();
      a.tween = null;
      a.claimed = true;
      gsap.set(a.wrap, { opacity: 0 });
    });
  },
};
