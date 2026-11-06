import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { swarm } from "../components/cursors/swarmApi";
import { handoff } from "./handoff";

gsap.registerPlugin(ScrollTrigger);

/*
  Progressive viewport animation engine.

  A section no longer owns one giant timeline. It registers a list of logical
  groups (a heading, one card, one timeline row, one counter...). Every group
  gets its own ScrollTrigger, so it only starts when that group itself reaches
  the viewport. Offscreen groups stay in their initial state.

  The callbacks also handle fast scrolling:
  - groups that are crossed while already above the viewport are put straight
    into their finished state instead of playing offscreen
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

    const finishInstantly = () => {
      const t = ensure();
      mode = "forward";
      t.pause();
      t.progress(1);
    };

    const play = () => {
      if (!alive || spec.once && mode === "forward") return;
      if (mode === "forward") return;

      const rect = el.getBoundingClientRect();

      // Crossed during a fast jump but already above the viewport: show the
      // finished state instead of animating many offscreen groups.
      if (rect.bottom <= 0) {
        finishInstantly();
        return;
      }

      // Not actually visible yet (ScrollTrigger refresh edge case).
      if (!isInViewport(el, 80)) return;

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
        // Re-entering from the top: a finished group stays finished.
        if (mode === "idle") play();
      },
      onLeaveBack: reverse,
      onRefresh: () => {
        if (mode === "idle") {
          const r = el.getBoundingClientRect();
          if (r.bottom <= 0 && el.offsetParent !== null) finishInstantly();
        }
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
