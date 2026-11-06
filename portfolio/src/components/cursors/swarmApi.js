import gsap from "gsap";
import { agentStore } from "../../engine/agentStore";

const agents = []; // { wrap, ripple, arrow, tween, claimed }
const waiting = new Set();
let ready = false;
const PAD = 48;

const rand = (a, b) => a + Math.random() * (b - a);

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
      if (!a || a === self || !a.wrap) continue;
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

export const swarm = {
  register(list) {
    agents.length = 0;
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

  stopAll() {
    agents.forEach((a) => a.tween && a.tween.kill());
  },

  // a build takes an agent (it stops roaming)
  claim(i) {
    const a = agents[i];
    if (!a) return;
    a.claimed = true;
    if (a.tween) a.tween.kill();
    a.tween = null;
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
    agentStore.addActions(1);
    return gsap
      .timeline()
      .to(a.arrow, { scale: 0.8, duration: 0.08, ease: "power2.out" })
      .to(a.arrow, { scale: 1, duration: 0.18, ease: "back.out(3)" })
      .fromTo(
        a.ripple,
        { scale: 0.2, opacity: 0.8 },
        { scale: 1.6, opacity: 0, duration: 0.5, ease: "power2.out" },
        0
      );
  },

  // Fly agent i to an element. The target is measured when this plays,
  // so it works even if the element moves or resizes before then.
  moveTo(
    i,
    target,
    {
      duration = 0.9,
      click = false,
      ease = "power3.inOut",
      offset = { x: 0.5, y: 0.5 },
      dx = 0,
      dy = 0,
    } = {}
  ) {
    const a = agents[i];
    const tl = gsap.timeline();
    if (!a) return tl;

    const pos = (axis) => () => {
      const p = pointOf(target, offset);
      return (p ? p[axis] : gsap.getProperty(a.wrap, axis)) + (axis === "x" ? dx : dy);
    };

    tl.add(() => {
      swarm.claim(i);
    });
    tl.to(a.wrap, { x: pos("x"), y: pos("y"), duration, ease });
    if (click) {
      tl.add(() => {
        swarm.click(i);
      });
    }
    return tl;
  },

  // instantly place agent i at a fraction of an element (used while typing)
  placeAt(i, target, fx, fy, dx = 0, dy = 0) {
    const a = agents[i];
    const p = pointOf(target, { x: fx, y: fy });
    if (a && p) gsap.set(a.wrap, { x: p.x + dx, y: p.y + dy });
  },

  // wander forever: fast moves, random pauses, random clicks
  roam(i) {
    const a = agents[i];
    if (!a || a.claimed) return;
    const step = () => {
      const p = randomPoint(a);
      const tl = gsap.timeline({ onComplete: step });
      tl.to(a.wrap, {
        x: p.x,
        y: p.y,
        duration: rand(0.7, 2.0),
        ease: "power3.inOut",
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
    const wraps = agents.map((a) => a.wrap);
    if (wraps.length) tl.to(wraps, { opacity: 0, duration, ease: "power2.out" });
    tl.add(() => {
      swarm.stopAll();
      agents.forEach((a) => (a.claimed = true));
    });
    return tl;
  },

  // bring the cursors back (for a later section's build)
  showAll() {
    agents.forEach((a, i) => {
      a.claimed = false;
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
    if (a) a.wrap.style.visibility = "visible";
  },

  hide(i) {
    const a = agents[i];
    if (a) a.wrap.style.visibility = "hidden";
  },

  // hide/show every cursor without touching its opacity (used for scroll-back)
  setVisible(v) {
    agents.forEach((a) => {
      a.wrap.style.visibility = v ? "visible" : "hidden";
    });
  },

  // a new section takes all cursors: stop roaming, make them invisible and idle
  takeOver() {
    agents.forEach((a) => {
      if (a.tween) a.tween.kill();
      a.tween = null;
      a.claimed = true;
      gsap.set(a.wrap, { opacity: 0 });
    });
  },
};