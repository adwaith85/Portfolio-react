import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { swarm } from "../components/cursors/swarmApi";
import { typeReveal } from "./buildKit";
import { handoff } from "./handoff";

gsap.registerPlugin(ScrollTrigger);

/*
  Progressive viewport animation engine.

  A section no longer owns one giant timeline. It registers a list of logical
  groups (a heading, one card, one timeline row, one counter...). Every group
  gets its own ScrollTrigger, so it only starts when that group itself reaches
  the viewport. Offscreen groups stay in their initial state.

  The callbacks also handle fast scrolling:
  - a group that has started keeps playing to completion, even if the user
    scrolls past it or the next section enters. Nothing is snapped to its end
    state while its animation is still running.
  - groups below the viewport are not touched until they enter
  - scrolling back up reverses a group naturally; when another section owns the
    cursors the group is reset instantly so it can never steal cursor agents

  Cursor leases:
  Every group can name a small, disjoint set of agent indices. Within one
  section those groups can therefore animate together without two cursors
  fighting over the same element. `handoff` still serialises ownership between
  different sections.
*/

let refreshTimer = 0;
const scheduleRefresh = () => {
  if (typeof window === "undefined") return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 90);
};

export function isInViewport(el, margin = 0) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > -margin && r.top < window.innerHeight + margin;
}

/* Sets up a group's cursor agents and drops them in from below the screen. */
export function cursorIntro(tl, agents, at = 0) {
  const list = Array.isArray(agents) ? agents : [];
  const els = swarm.els(list);
  if (!els.length) return tl;

  tl.add(() => {
    list.forEach((i) => swarm.show(i));
    swarm.claimMany(list);
  }, at);

  tl.set(
    els,
    {
      opacity: 1,
      x: () => gsap.utils.random(40, Math.max(41, window.innerWidth - 40)),
      y: () => window.innerHeight + 30,
    },
    at
  );

  return tl;
}

/* Fades only this group's agents out when its reveal is finished. */
export function cursorOutro(tl, agents, { at = ">", duration = 0.45 } = {}) {
  const els = swarm.els(agents);
  if (!els.length) return tl;
  tl.to(els, { opacity: 0, duration, ease: "power2.out" }, at);
  return tl;
}

/*
  Small cursor actions used by the group builders.

  They return the time at which the action ends, so a builder can chain one
  element after another while other agents do their own actions in parallel.
*/

/* Fly an agent to an element. */
export function cursorMove(
  tl,
  i,
  target,
  { at = 0, duration = 0.4, offset, dx, dy, ease } = {}
) {
  if (target) {
    tl.add(swarm.moveTo(i, target, { duration, offset, dx, dy, ease }), at);
  }
  return at + duration;
}

/* Make an agent click where it is. */
export function cursorClick(tl, i, at = 0) {
  tl.add(() => swarm.click(i), at);
  return at;
}

/*
  Cursor flies to the start of a line, clicks, then types it. The same agent
  follows the writing edge through typeReveal.
*/
export function cursorType(
  tl,
  el,
  i,
  {
    at = 0,
    duration = 0.4,
    smooth = false,
    click = true,
    travel = 0.35,
    offset = { x: 0, y: 0.55 },
  } = {}
) {
  if (!el) return at;
  tl.add(swarm.moveTo(i, el, { duration: travel, offset }), at);
  if (click) tl.add(() => swarm.click(i), at + travel);
  tl.add(typeReveal(el, { duration, smooth, agent: i }), at + travel + 0.05);
  return at + travel + duration + 0.05;
}

/*
  Cursor clicks an image / box and opens it with a clip-path wipe.
  The caller sets the initial clipped state.
*/
export function cursorOpen(
  tl,
  i,
  el,
  { at = 0, duration = 0.5, travel = 0.35, from = "inset(0% 0% 100% 0%)" } = {}
) {
  if (!el) return at;
  tl.add(swarm.moveTo(i, el, { duration: travel, offset: { x: 0.5, y: 0.15 } }), at);
  tl.add(() => swarm.click(i), at + travel);
  tl.fromTo(
    el,
    { clipPath: from, autoAlpha: 1 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      duration,
      ease: "power2.inOut",
    },
    at + travel
  );
  return at + travel + duration;
}

/*
  config:
    root       - section element
    sectionId  - stable section key, e.g. "projects"
    enabled    - true when the cursor swarm is allowed on this device
    reduced    - prefers-reduced-motion
    groups     - [{ element, build, start, speed, back, agents, once }]
*/
export function createViewportReveal({
  root,
  sectionId,
  enabled = false,
  reduced = false,
  groups = [],
  start = "top 95%",
  speed = 1.25,
  back = 2.2,
}) {
  if (!root || reduced || typeof window === "undefined") return () => {};

  let alive = true;
  const triggers = [];
  const timelines = new Set();

  const specs = groups
    .map((group) => {
      if (!group) return null;
      const el =
        typeof group.element === "string"
          ? root.querySelector(group.element)
          : group.element;
      return el ? { ...group, element: el } : null;
    })
    .filter(Boolean);

  specs.forEach((spec) => {
    const el = spec.element;
    const agents = Array.isArray(spec.agents) ? spec.agents : [];
    const groupSpeed = spec.speed ?? speed;
    const groupBack = spec.back ?? back;

    let tl = null;
    let mode = "idle"; // idle | forward | back

    const ensure = () => {
      if (tl) return tl;
      tl = spec.build(el) || gsap.timeline();
      tl.pause();
      timelines.add(tl);
      if (enabled) {
        const previous = tl.eventCallback("onComplete");
        tl.eventCallback("onComplete", () => {
          if (previous) previous();
          handoff.end(sectionId, tl);
        });
      }
      return tl;
    };

    const play = () => {
      if (!alive || spec.once && mode === "forward") return;
      if (mode === "forward") return;

      // A fast scroll can cross this group after it has already passed above
      // the viewport. Start it anyway so it animates to completion instead of
      // jumping to its end state.
      const t = ensure();

      if (enabled && agents.length) {
        handoff.begin(sectionId, t);
        agents.forEach((i) => swarm.show(i));
      }

      mode = "forward";
      t.invalidate();
      t.timeScale(groupSpeed);

      if (t.progress() > 0 && t.progress() < 1) t.play();
      else t.restart();
    };

    const reverse = () => {
      if (!alive || !tl || mode === "idle" || spec.once) return;

      const owner = handoff.getSection();
      const canAnimateBack = !enabled || !agents.length || !owner || owner === sectionId;

      if (enabled && agents.length) {
        handoff.end(sectionId, tl);

        // Another section is now driving the swarm. Do not hide/reverse its
        // agents; just reset this offscreen group silently.
        if (!canAnimateBack) {
          tl.pause();
          tl.progress(0);
          mode = "idle";
          return;
        }
      }

      mode = "back";
      if (enabled && agents.length) agents.forEach((i) => swarm.hide(i));
      tl.timeScale(groupBack).reverse();
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: spec.start || start,
      onEnter: play,
      onEnterBack: () => {
        // Re-entering from the top: resume or restart, but a group that is
        // already playing is never interrupted.
        if (mode !== "forward") play();
      },
      onLeaveBack: reverse,
      onRefresh: () => {
        // A refresh can land while the page is resting on an unplayed group.
        // Play it normally instead of snapping to the end state.
        if (mode === "idle" && isInViewport(el, 80)) play();
      },
    });

    triggers.push(st);

    // A group that is already visible on first paint (for example when the
    // browser restores a scroll position) should not stay hidden.
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight * 0.95) {
      play();
    }
  });

  scheduleRefresh();

  return () => {
    alive = false;
    triggers.forEach((st) => st.kill());
    triggers.length = 0;
    timelines.forEach((tl) => {
      if (enabled) handoff.release(tl);
      tl.kill();
    });
    timelines.clear();
    specs.length = 0;
  };
}
