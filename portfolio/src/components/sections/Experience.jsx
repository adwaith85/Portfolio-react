import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content } from "../../data/content";
import { swarm } from "../cursors/swarmApi";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
} from "../../engine/viewport";
import { handoff } from "../../engine/handoff";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
} from "../../engine/swarmBuild";
import SkillsFlow, { typeFast } from "./SkillsFlow";

gsap.registerPlugin(ScrollTrigger);

/*
  Cursor leases (agents 0–19). Every group that can be on screen at the same
  time owns its own non-overlapping indices, so one group's outro can never
  hide a cursor another group is still typing with.

  Skills heading lives inside this section too, so it gets a lease that does
  not collide with the Experience heading ([0, 1]): it uses [17, 18], and the
  Skills stop timelines use [19].
*/
const AG = {
  flowHead: [17, 18],
  expHead: [0, 1],
  details: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  projects: [11, 12, 13, 14],
  closing: [15, 16],
};

const ALL_AGENTS = Array.from({ length: 20 }, (_, i) => i);
const OWN_SECTIONS = new Set(["experience-skills", "experience-internship"]);

/* Fast execution: whole groups land in well under a second of real time. */
const SPEED = 3.2;
const BACK = 3.5;

const EXP_STYLE = `
[data-exp-timeline] {
  --tl-pad: clamp(22px, 3vw, 36px);
  padding-left: var(--tl-pad);
}
[data-tl-line] {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--t-timeline-line-width);
  background: linear-gradient(
    to bottom,
    var(--color-line) 0%,
    var(--color-line) 82%,
    transparent 100%
  );
  transform-origin: 0% 0%;
}
[data-tl-dot] {
  position: absolute;
  top: 0.3rem;
  left: calc(var(--tl-pad) * -1);
  width: var(--t-timeline-dot-size);
  height: var(--t-timeline-dot-size);
  margin-left: calc(var(--t-timeline-dot-size) / -2);
  border-radius: 999px;
  background: var(--t-accent);
  box-shadow: 0 0 10px rgb(var(--accent-rgb) / 0.7);
}
[data-int-point] [data-int-dash] {
  display: block;
  width: 1.25rem;
  height: 1px;
  background: var(--color-red);
  transform-origin: 0% 50%;
}
.exp-mark {
  transition: transform 220ms ease;
}
[data-int-point] [data-int-point-text],
[data-proj-row] [data-proj-title],
[data-proj-row] [data-proj-desc] {
  transition: color 220ms ease;
}
@media (hover: hover) {
  [data-int-point]:hover .exp-mark,
  [data-proj-row]:hover .exp-mark { transform: translateX(4px); }
  [data-int-point]:hover [data-int-point-text],
  [data-proj-row]:hover [data-proj-title],
  [data-proj-row]:hover [data-proj-desc] { color: var(--color-ink); }
}
@media (prefers-reduced-motion: reduce) {
  .exp-mark,
  [data-int-point] [data-int-point-text],
  [data-proj-row] [data-proj-title],
  [data-proj-row] [data-proj-desc] {
    transition: none;
  }
}
`;

/* fade only this group's cursors, hide them, then drop the group's overlays */
function outro(tl, agents, end, overlays = [], hold = 0.16) {
  const at = Math.max(0, end) + 0.12;
  cursorOutro(tl, agents, { at, duration: hold });
  tl.add(() => {
    agents.forEach((i) => swarm.hide(i));
    overlays.forEach(({ o }) => o.remove());
  }, at + hold + 0.01);
  return at + hold;
}

function reveal(tl, nodes, at) {
  const list = nodes.filter(Boolean);
  if (list.length) {
    tl.set(list, { autoAlpha: 1, clearProps: "clipPath" }, Math.max(0, at));
  }
}

/* ---------- part 1: heading above the pinned skills card ---------- */

function buildFlowHead(block, host, agents) {
  const [A, B] = agents;
  const ovs = [makeOverlay(host), makeOverlay(host), makeOverlay(host)];
  const [ovA, ovB, ovC] = ovs;
  const label = block.querySelector("[data-flow-label]");
  const h1 = block.querySelector("[data-flow-h1]");
  const h2 = block.querySelector("[data-flow-h2]");
  const intro = block.querySelector("[data-flow-intro]");
  const rule = block.querySelector("[data-flow-rule]");
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  let t = dragBox(tl, ovA, A, label, host, 0.02, {
    tag: "p.label",
    dur: 0.1,
    pad: 2,
  });
  t = typeFast(tl, label, A, t, 0.009);

  let t1 = dragBox(tl, ovA, A, h1, host, Math.max(0.12, t - 0.02), {
    tag: "h3.headline",
    dur: 0.11,
    pad: 3,
  });
  t1 = typeFast(tl, h1, A, t1 + 0.01, 0.009);

  let t2 = dragBox(tl, ovB, B, h2, host, Math.max(0.16, t1 - 0.02), {
    tag: "span.sub",
    dur: 0.11,
    pad: 3,
  });
  t2 = typeFast(tl, h2, B, t2 + 0.01, 0.009);

  let ti = dragBox(tl, ovC, B, intro, host, 0.18, {
    tag: "p.intro",
    dur: 0.11,
    pad: 3,
  });
  ti = typeFast(tl, intro, B, ti, 0.009);

  if (rule) {
    tl.to(rule, { scaleX: 1, duration: 0.4, ease: "power3.out" }, 0.06);
  }

  const end = Math.max(t1, t2, ti);
  reveal(tl, [label, h1, h2, intro], end + 0.01);
  if (rule) tl.set(rule, { scaleX: 1 }, end + 0.01);

  outro(tl, agents, end, ovs);
  return tl;
}

/* ---------- part 2: sticky heading ---------- */

function buildExpHead(layout, host, agents) {
  const [A, B] = agents;
  const ovs = [makeOverlay(host), makeOverlay(host)];
  const [ovA, ovB] = ovs;
  const label = layout.querySelector("[data-exp-label]");
  const h1 = layout.querySelector("[data-exp-h1]");
  const h2 = layout.querySelector("[data-exp-h2]");
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  let t = dragBox(tl, ovA, A, label, host, 0.02, {
    tag: "p.label",
    dur: 0.1,
    pad: 2,
  });
  t = typeFast(tl, label, A, t, 0.009);

  let t1 = dragBox(tl, ovA, A, h1, host, Math.max(0.12, t - 0.02), {
    tag: "h3.display",
    dur: 0.11,
    pad: 3,
  });
  t1 = typeFast(tl, h1, A, t1 + 0.01, 0.009);

  let t2 = dragBox(tl, ovB, B, h2, host, Math.max(0.16, t1 - 0.02), {
    tag: "span.sub",
    dur: 0.11,
    pad: 2,
  });
  t2 = typeFast(tl, h2, B, t2 + 0.01, 0.009);

  const end = Math.max(t1, t2);
  reveal(tl, [label, h1, h2], end + 0.01);

  outro(tl, agents, end, ovs);
  return tl;
}

/* ---------- intern role, summary, bullets, timeline line + dots ---------- */

function buildExpDetails(block, timelineEl, host, agents) {
  const [roleAg, companyAg, periodAg, summaryAg, ...bulletAgents] = agents;
  const ovs = [makeOverlay(host), makeOverlay(host), makeOverlay(host)];
  const [ovA, ovB, ovC] = ovs;
  const role = block.querySelector("[data-int-role]");
  const company = block.querySelector("[data-int-company]");
  const period = block.querySelector("[data-int-period]");
  const summary = block.querySelector("[data-int-summary]");
  const points = [...block.querySelectorAll("[data-int-point]")];
  const line = timelineEl && timelineEl.querySelector("[data-tl-line]");
  const dots = timelineEl ? [...timelineEl.querySelectorAll("[data-tl-dot]")] : [];
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  if (line) {
    tl.to(line, { scaleY: 1, duration: 0.5, ease: "power3.out" }, 0.02);
  }
  dots.forEach((dot, k) => {
    tl.to(
      dot,
      { scale: 1, autoAlpha: 1, duration: 0.18, ease: "back.out(2)" },
      0.06 + k * 0.05
    );
  });

  let tr = dragBox(tl, ovA, roleAg, role, host, 0.02, {
    tag: "h3.role",
    dur: 0.11,
    pad: 3,
  });
  tr = typeFast(tl, role, roleAg, tr, 0.009);

  let tc = dragBox(tl, ovB, companyAg, company, host, Math.max(0.1, tr - 0.05), {
    tag: "span.company",
    dur: 0.1,
    pad: 2,
  });
  tc = typeFast(tl, company, companyAg, tc, 0.009);

  let tp = dragBox(tl, ovC, periodAg, period, host, Math.max(0.16, tc - 0.03), {
    tag: "span.period",
    dur: 0.1,
    pad: 2,
  });
  tp = typeFast(tl, period, periodAg, tp, 0.009);

  let ts = dragBox(tl, ovA, summaryAg, summary, host, Math.max(0.22, tp - 0.02), {
    tag: "p.summary",
    dur: 0.11,
    pad: 3,
  });
  ts = typeFast(tl, summary, summaryAg, ts, 0.009);

  let endT = Math.max(tr, tc, tp, ts);
  const bulletStart = Math.max(0.18, ts + 0.03);

  points.forEach((li, k) => {
    const ag = bulletAgents[k % bulletAgents.length];
    const ov = makeOverlay(host);
    ovs.push(ov);
    const dash = li.querySelector("[data-int-dash]");
    const text = li.querySelector("[data-int-point-text]");
    const startAt = bulletStart + k * 0.03;

    let te = dragBox(tl, ov, ag, li, host, startAt, {
      tag: "li.point",
      dur: 0.1,
      pad: 2,
    });
    if (dash) {
      tl.to(
        dash,
        { scaleX: 1, duration: 0.14, ease: "power3.out" },
        Math.max(0, te - 0.06)
      );
    }
    te = typeFast(tl, text, ag, te, 0.009);
    endT = Math.max(endT, te);
  });

  reveal(tl, [role, company, period, summary], endT + 0.01);
  reveal(
    tl,
    points.flatMap((li) => [
      li.querySelector("[data-int-point-text]"),
      ...li.querySelectorAll("[data-int-point-text] [data-w]"),
    ]),
    endT + 0.01
  );
  const dashes = points.map((li) => li.querySelector("[data-int-dash]")).filter(Boolean);
  if (dashes.length) tl.set(dashes, { scaleX: 1 }, endT + 0.01);
  if (line) tl.set(line, { scaleY: 1 }, endT + 0.01);
  if (dots.length) tl.set(dots, { scale: 1, autoAlpha: 1 }, endT + 0.01);

  outro(tl, agents, endT, ovs);
  return tl;
}

/* ---------- projects built ---------- */

function buildExpProjects(block, host, agents) {
  const [titleAg, ...rowAgents] = agents;
  const ovs = [makeOverlay(host)];
  const label = block.querySelector("[data-proj-label]");
  const heading = block.querySelector("[data-proj-heading]");
  const rows = [...block.querySelectorAll("[data-proj-row]")];
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  let t = dragBox(tl, ovs[0], titleAg, label, host, 0.02, {
    tag: "p.label",
    dur: 0.1,
    pad: 2,
  });
  t = typeFast(tl, label, titleAg, t, 0.009);

  let th = dragBox(tl, ovs[0], titleAg, heading, host, t + 0.01, {
    tag: "h4.heading",
    dur: 0.11,
    pad: 3,
  });
  th = typeFast(tl, heading, titleAg, th, 0.009);

  let endT = th;

  rows.forEach((row, k) => {
    const ag = rowAgents[k % rowAgents.length];
    const ov = makeOverlay(host);
    ovs.push(ov);
    const title = row.querySelector("[data-proj-title]");
    const desc = row.querySelector("[data-proj-desc]");
    const startAt = 0.08 + k * 0.03;

    let rt = dragBox(tl, ov, ag, row, host, startAt, {
      tag: "article.project",
      dur: 0.1,
      pad: 2,
    });
    rt = typeFast(tl, title, ag, rt, 0.009);
    rt = typeFast(tl, desc, ag, rt + 0.01, 0.008);
    endT = Math.max(endT, rt);
  });

  reveal(tl, [label, heading], endT + 0.01);
  reveal(
    tl,
    rows.flatMap((row) => [
      row.querySelector("[data-proj-title]"),
      row.querySelector("[data-proj-desc]"),
      ...row.querySelectorAll("[data-w]"),
    ]),
    endT + 0.01
  );

  outro(tl, agents, endT, ovs);
  return tl;
}

/* ---------- what's next ---------- */

function buildExpNext(block, host, agents) {
  const [labelAg, textAg] = agents;
  const ovs = [makeOverlay(host), makeOverlay(host)];
  const [ovA, ovB] = ovs;
  const label = block.querySelector("[data-next-label]");
  const text = block.querySelector("[data-next-text]");
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  let t = dragBox(tl, ovA, labelAg, label, host, 0.02, {
    tag: "p.label",
    dur: 0.1,
    pad: 2,
  });
  t = typeFast(tl, label, labelAg, t, 0.009);

  let t2 = dragBox(tl, ovB, textAg, text, host, 0.14, {
    tag: "p.next",
    dur: 0.11,
    pad: 3,
  });
  t2 = typeFast(tl, text, textAg, t2, 0.009);

  const end = Math.max(t, t2);
  reveal(tl, [label, text], end + 0.01);

  outro(tl, agents, end, ovs);
  return tl;
}

const PROJECT_TITLES = [
  "Uber Clone: Rider App",
  "Genmise: Online Store Builder",
  "Talkies: Chat App",
];

export default function Experience() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { skillsGained: sg, experience, projects } = content;
  const exp = experience[0];
  const expProjects = PROJECT_TITLES.map((title) =>
    projects.find((project) => project.title === title)
  ).filter(Boolean);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (s) => [...el.querySelectorAll(s)];

    if (reduced) {
      const finish = () => {
        all("[data-ov]").forEach((node) => node.remove());
        all("[data-w]").forEach((node) => {
          node.style.opacity = "1";
          node.style.visibility = "visible";
          node.style.clipPath = "none";
        });
        all("[data-sk-type]").forEach((node) => {
          node.style.opacity = "1";
          node.style.visibility = "visible";
          node.style.clipPath = "none";
        });
        all("[data-int-dash],[data-flow-rule]").forEach((node) => {
          node.style.transform = "none";
        });
        all("[data-tl-line]").forEach((node) => {
          node.style.transform = "none";
        });
        all("[data-tl-dot]").forEach((node) => {
          node.style.opacity = "1";
          node.style.visibility = "visible";
          node.style.transform = "none";
        });
      };
      finish();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(finish);
      }
      let resizeTimer = 0;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(finish, 140);
      };
      window.addEventListener("resize", onResize);
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
      };
    }

    /* hidden starting state for every text node, marker, dot and line */
    const ctx = gsap.context(() => {
      gsap.set(all("[data-w]"), { autoAlpha: 0 });
      gsap.set(all("[data-int-dash]"), {
        scaleX: 0,
        transformOrigin: "0% 50%",
      });
      gsap.set(all("[data-flow-rule]"), {
        scaleX: 0,
        transformOrigin: "0% 50%",
      });
      gsap.set(all("[data-tl-line]"), {
        scaleY: 0,
        transformOrigin: "0% 0%",
      });
      gsap.set(all("[data-tl-dot]"), { scale: 0, autoAlpha: 0 });
    }, root);

    /* Build each timeline once, pause it, and reuse it when it plays. */
    const built = new Map();
    const cache = (build) => (node) => {
      if (built.has(node)) return built.get(node);
      const tl = build(node);
      tl.pause();
      built.set(node, tl);
      return tl;
    };

    /* part 1: skills heading above the pinned card stage */
    const flowBlock = el.querySelector("[data-flow-block]");
    const flowHead = flowBlock && flowBlock.querySelector("[data-flow-head]");
    const flowGroups = flowHead
      ? [
          {
            element: flowHead,
            agents: AG.flowHead,
            build: cache((node) => buildFlowHead(node, el, AG.flowHead)),
          },
        ]
      : [];

    /* part 2: the sticky heading + timeline blocks */
    const expBlock = el.querySelector("[data-exp-block]");
    const layout = el.querySelector("[data-exp-layout]");
    const details = el.querySelector("[data-exp-details]");
    const projectsBlock = el.querySelector("[data-exp-projects]");
    const closing = el.querySelector("[data-exp-next]");
    const timeline = el.querySelector("[data-exp-timeline]");

    const expGroups = [
      layout && {
        element: layout,
        agents: AG.expHead,
        build: cache((node) => buildExpHead(node, el, AG.expHead)),
      },
      details && {
        element: details,
        agents: AG.details,
        build: cache((node) =>
          buildExpDetails(node, timeline, el, AG.details)
        ),
      },
      projectsBlock && {
        element: projectsBlock,
        agents: AG.projects,
        build: cache((node) => buildExpProjects(node, el, AG.projects)),
      },
      closing && {
        element: closing,
        agents: AG.closing,
        build: cache((node) => buildExpNext(node, el, AG.closing)),
      },
    ].filter(Boolean);

    const stopFlow = createViewportReveal({
      root: flowBlock || el,
      sectionId: "experience-skills",
      enabled,
      reduced,
      start: "top 95%",
      speed: SPEED,
      back: BACK,
      groups: flowGroups,
    });

    const stopExp = createViewportReveal({
      root: expBlock || el,
      sectionId: "experience-internship",
      enabled,
      reduced,
      start: "top 92%",
      speed: SPEED,
      back: BACK,
      groups: expGroups,
    });

    /* Build everything while the section is still one screen below the fold. */
    let prebuild = null;
    if (enabled && expGroups.length) {
      prebuild = ScrollTrigger.create({
        trigger: expBlock || el,
        start: "top 150%",
        once: true,
        onEnter: () => {
          prebuild = null;
          // The cursor DOM may not exist yet on a restored scroll position.
          // In that case let the viewport groups build lazily instead.
          if (!swarm.els([AG.expHead[0]]).length) return;
          expGroups.forEach((group) => group.build(group.element));
        },
      });
    }

    const foreignOwner = () => {
      if (!enabled) return false;
      const owner = handoff.getSection();
      return Boolean(owner) && !OWN_SECTIONS.has(owner);
    };

    /* Section sweep: once the section is gone, no cursor may stay visible. */
    const sweep = (force = false) => {
      if (!force && foreignOwner()) return;
      ALL_AGENTS.forEach((i) => {
        const nodes = swarm.els([i]);
        if (!nodes.length) return;
        gsap.killTweensOf(nodes);
        gsap.set(nodes, { opacity: 0, visibility: "hidden" });
      });
      clearOverlays(el);
    };

    const sectionSweep = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onLeave: () => sweep(),
      onLeaveBack: () => sweep(),
    });

    return () => {
      stopFlow();
      stopExp();
      if (prebuild) prebuild.kill();
      sectionSweep.kill();
      sweep(true);
      built.forEach((tl) => tl.kill());
      built.clear();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled, sg.flow]);

  return (
    <section
      id="experience"
      ref={root}
      className="relative flex min-h-svh flex-col border-t border-line px-gutter py-[8svh] bg-bg"
    >
      <h2 className="sr-only">Experience</h2>
      <style>{EXP_STYLE}</style>

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[clamp(4rem,9svh,7rem)]">
        {/* ---------- part 1: the skills request path ---------- */}
        <div data-flow-block className="relative">
          <SkillsFlow flow={sg.flow} returnLabel={sg.returnLabel}>
            <header data-flow-head className="relative">
              <p className="label mb-1 block w-fit">
                <span data-flow-label className="inline-block">
                  <span className="text-red">
                  </span>{" "}
                </span>
              </p>
              <h3 className="display flex flex-wrap items-baseline gap-x-3 text-[clamp(1.7rem,min(4.6vw,7.2svh),3.2rem)] leading-none max-lg:text-[clamp(1.5rem,7vw,2.4rem)]">
                <span data-flow-h1 className="block w-fit text-ink">
                  <Words text={sg.headline[0]} />
                </span>
                <span
                  data-flow-h2
                  className="block w-fit text-[0.42em] font-sans font-medium uppercase tracking-[0.2em] text-red"
                >
                  <Words text={sg.headline[1]} />
                </span>
              </h3>
              <p
                data-flow-intro
                className="mt-2 block max-w-[46rem] text-[clamp(0.7rem,min(1.05vw,1.9svh),0.9rem)] leading-relaxed text-muted"
              >
                <Words text={sg.intro} />
              </p>
              <span
                data-flow-rule
                aria-hidden="true"
                className="mt-3 block h-px w-full origin-left bg-line"
              />
            </header>
          </SkillsFlow>
        </div>

        {/* ---------- part 2: experience (sticky heading + vertical timeline) ---------- */}
        <div data-exp-block className="relative">
          <div
            data-exp-layout
            className="grid grid-cols-1 items-start gap-x-[clamp(2rem,5vw,5rem)] gap-y-[clamp(2.25rem,4vw,2.75rem)] lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)]"
          >
            {/* left: sticky heading (the grid wrapper is the trigger, never this) */}
            <div className="min-w-0 lg:sticky lg:top-[50px] lg:self-start">
              <header data-exp-head>
                <p className="label mb-2 block w-fit">
                  <span data-exp-label className="inline-block">
                    <span className="text-red">
                    </span>{" "}
                    <Words text="Skills From" />
                  </span>
                </p>
                <h3 className="section-heading display flex flex-wrap items-baseline gap-x-4 leading-none">
                  <span data-exp-h1 className="block w-fit text-ink">
                    <Words text="EXPERIENCE" />
                  </span>
                  <span
                    data-exp-h2
                    className="block w-fit text-[0.42em] font-sans font-medium uppercase tracking-[0.2em] text-red"
                  >
                    <Words text="& INTERNSHIP" />
                  </span>
                </h3>
              </header>
            </div>

            {/* right: the timeline */}
            <div data-exp-timeline className="relative min-w-0">
              <span data-tl-line aria-hidden="true" />

              <div className="flex flex-col gap-[clamp(2.25rem,4vw,2.75rem)] lg:gap-[clamp(3rem,4vw,4rem)]">
                {/* block 1: role + summary + bullets */}
                <div data-exp-details className="relative min-w-0">
                  <span data-tl-dot aria-hidden="true" />

                  <h3
                    data-int-role
                    className="display block w-fit text-[clamp(1.6rem,3.2vw,2.75rem)] leading-none text-ink"
                  >
                    <Words text={exp.role} />
                  </h3>

                  <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      data-int-company
                      className="inline-block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold"
                    >
                      <Words text={exp.company} />
                    </span>
                    <i
                      aria-hidden="true"
                      className="size-1 shrink-0 rounded-full bg-red"
                    />
                    <span
                      data-int-period
                      className="label inline-block text-[0.62rem] tracking-[0.16em]"
                    >
                      <Words text={exp.period} />
                    </span>
                  </p>

                  <p
                    data-int-summary
                    className="mt-4 block max-w-[56ch] text-[clamp(1.05rem,1.35vw,1.25rem)] leading-relaxed text-ink/80"
                  >
                    <Words text={exp.summary} />
                  </p>

                  <ul className="mt-5 grid max-w-[58ch] gap-3">
                    {exp.points.map((point) => (
                      <li
                        key={point}
                        data-int-point
                        className="flex items-start gap-3.5"
                      >
                        <span aria-hidden="true" className="exp-mark mt-[0.62rem] shrink-0">
                          <i data-int-dash />
                        </span>
                        <span
                          data-int-point-text
                          className="block text-[clamp(0.95rem,1.15vw,1.06rem)] leading-relaxed text-ink/80"
                        >
                          <Words text={point} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* block 2: projects built */}
                <div data-exp-projects className="relative min-w-0">
                  <span data-tl-dot aria-hidden="true" />

                  <p
                    data-proj-label
                    className="label block w-fit text-[0.62rem] tracking-[0.2em] text-red"
                  >
                    <Words text="PROJECTS BUILT" />
                  </p>
                  <h4
                    data-proj-heading
                    className="display mt-2 block text-[clamp(1.15rem,1.9vw,1.6rem)] leading-tight text-ink"
                  >
                    <Words text="Things I built during this time" />
                  </h4>

                  <div className="mt-5 flex flex-col gap-[clamp(1.1rem,2vw,1.6rem)]">
                    {expProjects.map((project) => (
                      <div key={project.title} data-proj-row className="relative min-w-0">
                        <p className="flex items-baseline gap-2.5">
                          <span
                            aria-hidden="true"
                            className="exp-mark shrink-0 text-[0.85em] leading-none text-red"
                          >
                            ↳
                          </span>
                          <span
                            data-proj-title
                            className="display block text-[clamp(0.8rem,0.95vw,0.95rem)] uppercase tracking-[0.08em] text-ink/85"
                          >
                            <Words text={project.title} />
                          </span>
                        </p>
                        <p
                          data-proj-desc
                          className="mt-1 block max-w-[62ch] pl-[calc(0.85em_+_0.625rem)] text-[clamp(0.85rem,1vw,0.98rem)] leading-relaxed text-muted"
                        >
                          <Words text={project.desc} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* block 3: what's next */}
                <div data-exp-next className="relative min-w-0">
                  <span data-tl-dot aria-hidden="true" />

                  <p
                    data-next-label
                    className="label block w-fit text-[0.62rem] tracking-[0.2em] text-red"
                  >
                    <Words text="WHAT'S NEXT" />
                  </p>
                  <p
                    data-next-text
                    className="mt-2 block max-w-[52ch] text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-ink/85"
                  >
                    <Words text="Looking for more opportunities to learn, build and grow as a developer." />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
