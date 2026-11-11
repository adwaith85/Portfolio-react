import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { ENVS, envCss } from "../../theme/palette";
import { swarm } from "../cursors/swarmApi";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  BLUE,
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
} from "../../engine/swarmBuild";
import Logo from "../ui/Logo";
import SkillsFlow, {
  buildFlowNode,
  drawFlow,
  techItem,
  typeFast,
} from "./SkillsFlow";

/* Cursor leases: all twenty agents (0–19) in disjoint groups for both parts. */
const AG = {
  // Part 1: Skills Flow (20 agents across 7 disjoint groups)
  flowHead: [0, 1],
  flowNodes: [
    [2, 3, 4],     // Node 0: USER
    [5, 6, 7],     // Node 1: CLIENT
    [8, 9, 10],    // Node 2: API
    [11, 12, 13],  // Node 3: SERVER
    [14, 15, 16],  // Node 4: DATA
    [17, 18, 19],  // Node 5: CLOUD
  ],
  // Part 2: Experience & Internship (20 agents across 2 disjoint groups)
  expHead: [0, 1],
  internship: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
};

/* Fast execution: groups run at 2x, travel in 0.15–0.25s. */
const SPEED = 2.0;
const BACK = 2.6;

const EXP = ENVS.experience;

const EXP_STYLE = `
[data-tech-chip] {
  transition: border-color 200ms ease, background-color 200ms ease,
    translate 200ms ease, scale 200ms ease;
}
[data-tech-chip]:hover {
  border-color: rgb(var(--env-rgb) / .6);
  background-color: rgb(var(--env-rgb) / .12);
}
@media (prefers-reduced-motion: reduce) {
  [data-tech-chip] { transition: none; }
}
`;

/* fade only this group's cursors, then hide them so none is left roaming */
function outro(tl, agents, end) {
  const at = Math.max(0, end) + 0.3;
  cursorOutro(tl, agents, { at, duration: 0.22 });
  tl.add(() => agents.forEach((i) => swarm.hide(i)), at + 0.24);
  return at;
}

/* ---------- part 1: heading above the skills flowchart ---------- */

function buildFlowHead(block, host, agents) {
  const [A, B] = agents;
  const ovA = makeOverlay(host);
  const ovB = makeOverlay(host);
  const label = block.querySelector("[data-flow-label]");
  const h1 = block.querySelector("[data-flow-h1]");
  const h2 = block.querySelector("[data-flow-h2]");
  const intro = block.querySelector("[data-flow-intro]");
  const rule = block.querySelector("[data-flow-rule]");
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  let t = dragBox(tl, ovA, A, label, host, 0.03, {
    tag: "p.label",
    dur: 0.15,
    pad: 2,
  });
  t = typeFast(tl, label, A, t, 0.018);

  let t1 = dragBox(tl, ovA, A, h1, host, Math.max(0.18, t - 0.04), {
    tag: "h3.headline",
    dur: 0.18,
    pad: 3,
  });
  t1 = typeFast(tl, h1, A, t1 + 0.02, 0.018);

  let t2 = dragBox(tl, ovA, A, h2, host, Math.max(0.28, t1 + 0.02), {
    tag: "span.sub",
    dur: 0.18,
    pad: 3,
  });
  t2 = typeFast(tl, h2, A, t2 + 0.02, 0.018);

  let ti = dragBox(tl, ovB, B, intro, host, 0.16, {
    tag: "p.intro",
    dur: 0.18,
    pad: 3,
  });
  ti = typeFast(tl, intro, B, ti, 0.014);

  if (rule) {
    tl.to(rule, { scaleX: 1, duration: 0.45, ease: "power3.out" }, 0.08);
  }

  outro(tl, agents, Math.max(t2, ti));
  return tl;
}

/* ---------- part 2: heading above the experience block ---------- */

function buildExpHead(block, host, agents) {
  const [A, B] = agents;
  const ovA = makeOverlay(host);
  const ovB = makeOverlay(host);
  const label = block.querySelector("[data-exp-label]");
  const h1 = block.querySelector("[data-exp-h1]");
  const h2 = block.querySelector("[data-exp-h2]");
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  let t = dragBox(tl, ovA, A, label, host, 0.02, {
    tag: "p.label",
    dur: 0.14,
    pad: 2,
  });
  t = typeFast(tl, label, A, t, 0.018);

  let t1 = dragBox(tl, ovA, A, h1, host, Math.max(0.16, t - 0.04), {
    tag: "h3.headline",
    dur: 0.18,
    pad: 3,
  });
  t1 = typeFast(tl, h1, A, t1 + 0.02, 0.018);

  let t2 = dragBox(tl, ovB, B, h2, host, Math.max(0.22, t1 - 0.04), {
    tag: "span.sub",
    dur: 0.18,
    pad: 3,
  });
  t2 = typeFast(tl, h2, B, t2 + 0.02, 0.018);

  outro(tl, agents, Math.max(t1, t2));
  return tl;
}

/* ---------- part 2: full-width internship details (not in boxes) ---------- */

function buildInternship(details, host) {
  const agents = AG.internship;
  // agents: [A, B, C, D, B1, B2, B3, B4, B5, CH0, CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8]
  const [A, B, C, D, B1, B2, B3, B4, B5, ...chipAgents] = agents;
  const ovA = makeOverlay(host);
  const ovB = makeOverlay(host);
  const ovC = makeOverlay(host);
  const ovD = makeOverlay(host);
  const tl = gsap.timeline();

  cursorIntro(tl, agents, 0);

  const role = details.querySelector("[data-int-role]");
  const company = details.querySelector("[data-int-company]");
  const period = details.querySelector("[data-int-period]");
  const summary = details.querySelector("[data-int-summary]");
  const techLabel = details.querySelector("[data-tech-label]");
  const rule = details.querySelector("[data-int-rule]");

  // Agent A selects and types role in Anton display font
  let tr = dragBox(tl, ovA, A, role, host, 0.04, {
    tag: "h3.role",
    dur: 0.18,
    pad: 3,
  });
  tr = typeFast(tl, role, A, tr, 0.018);

  // Agent B selects and types company name
  let tc = dragBox(tl, ovB, B, company, host, Math.max(0.14, tr - 0.08), {
    tag: "span.company",
    dur: 0.15,
    pad: 2,
  });
  tc = typeFast(tl, company, B, tc, 0.018);

  // Agent C selects and types period
  let tp = dragBox(tl, ovC, C, period, host, Math.max(0.22, tc - 0.04), {
    tag: "span.period",
    dur: 0.15,
    pad: 2,
  });
  tp = typeFast(tl, period, C, tp, 0.018);

  // Agent D selects and types summary line
  let ts = dragBox(tl, ovD, D, summary, host, Math.max(0.28, tp - 0.02), {
    tag: "p.summary",
    dur: 0.18,
    pad: 3,
  });
  ts = typeFast(tl, summary, D, ts, 0.014);

  // One cursor per bullet, typing in parallel! (Agents B1..B5)
  const bulletAgents = [B1, B2, B3, B4, B5];
  const points = [...details.querySelectorAll("[data-int-point]")];
  let tBulletsEnd = Math.max(tr, tc, tp, ts);

  points.forEach((li, k) => {
    const ag = bulletAgents[k % bulletAgents.length];
    const ov = makeOverlay(host);
    const startAt = 0.38 + k * 0.04;
    const dash = li.querySelector("[data-int-dash]");
    const text = li.querySelector("[data-int-point-text]");

    let te = dragBox(tl, ov, ag, li, host, startAt, {
      tag: "li.point",
      dur: 0.14,
      pad: 2,
    });
    if (dash) {
      tl.to(dash, { scaleX: 1, duration: 0.16, ease: "power3.out" }, te - 0.04);
    }
    te = typeFast(tl, text, ag, te, 0.015);
    tl.set(
      [text, ...text.querySelectorAll("[data-w]")],
      { autoAlpha: 1, clearProps: "clipPath" },
      te
    );
    tBulletsEnd = Math.max(tBulletsEnd, te);
  });

  if (rule) {
    tl.to(rule, { scaleX: 1, duration: 0.45, ease: "power3.out" }, tBulletsEnd - 0.1);
  }

  // Tech chips and label pop in with cursor interaction across chipAgents
  const chips = [...details.querySelectorAll("[data-tech-chip]")];
  const chipAt = tBulletsEnd + 0.04;
  if (techLabel) {
    tl.fromTo(
      techLabel,
      { autoAlpha: 0, x: -4 },
      { autoAlpha: 1, x: 0, duration: 0.18 },
      chipAt - 0.06
    );
  }

  chips.forEach((chip, k) => {
    const ag = chipAgents[k % chipAgents.length];
    tl.fromTo(
      chip,
      { autoAlpha: 0, scale: 0.8 },
      { autoAlpha: 1, scale: 1, duration: 0.2, ease: "back.out(2)" },
      chipAt + k * 0.035
    );
    if (ag) {
      tl.add(
        swarm.moveTo(ag, chip, { duration: 0.14, offset: { x: 0.5, y: 0.5 } }),
        chipAt + k * 0.04
      );
      tl.add(() => swarm.click(ag), chipAt + k * 0.04 + 0.14);
    }
  });

  const end = Math.max(
    tBulletsEnd,
    chipAt + Math.max(0, chips.length - 1) * 0.035 + 0.24
  );

  // Guarantee all texts are completely revealed
  tl.set(
    details.querySelectorAll("[data-w],[data-int-point-text],[data-int-dash]"),
    { autoAlpha: 1, clearProps: "clipPath" },
    end
  );

  outro(tl, agents, end);
  return tl;
}

export default function Experience() {
  const root = useRef(null);
  const enabled = useAgentsEnabled();
  const { skillsGained: sg, experience } = content;
  const exp = experience[0];

  useLayoutEffect(() => {
    const el = root.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = (s) => [...el.querySelectorAll(s)];

    if (reduced) {
      const finish = () => {
        drawFlow(el);
        all("[data-seg],[data-return]").forEach((path) => {
          path.dataset.drawn = "1";
          path.style.strokeDashoffset = "0";
        });
        all("[data-seg-flow],[data-seg-pulse],[data-return-flow],[data-return-pulse]").forEach(
          (path) => {
            path.style.opacity = "1";
          }
        );
        all("[data-sel],[data-tag]").forEach((node) => {
          node.style.display = "none";
        });
        all(
          "[data-w],[data-int-point-text],[data-int-dash],[data-tech-chip],[data-tech-label],[data-int-rule]"
        ).forEach((item) => {
          item.style.opacity = "1";
          item.style.visibility = "visible";
        });
        all("[data-int-dash],[data-int-rule],[data-flow-rule]").forEach((item) => {
          item.style.transform = "none";
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

    // Hidden starting state
    const ctx = gsap.context(() => {
      gsap.set(
        all(
          "[data-w],[data-sel],[data-tag],[data-node-glow],[data-fan-icon]," +
            "[data-fan-name],[data-mob-icon],[data-spoke],[data-fan-arc]," +
            "[data-junction],[data-seg],[data-seg-flow],[data-seg-pulse]," +
            "[data-return],[data-return-flow],[data-return-pulse]," +
            "[data-return-label],[data-tech-chip],[data-tech-label]"
        ),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-handle]"), { scale: 0 });
      gsap.set(all("[data-bar]"), { scaleX: 0 });
      gsap.set(all("[data-int-dash]"), { scaleX: 0 });
      gsap.set(all("[data-flow-rule],[data-int-rule]"), {
        scaleX: 0,
        transformOrigin: "0% 50%",
      });
      gsap.set(all("[data-bg]"), {
        clipPath: "inset(0 100% 100% 0)",
        backgroundColor: "#121212",
        borderColor: "rgba(255,255,255,0.12)",
      });
      gsap.set(all("[data-sel]"), { width: "0%", height: "0%" });
      gsap.set(all("[data-spoke]"), {
        scaleX: 0,
        transformOrigin: "0% 50%",
      });
      gsap.set(all("[data-seg],[data-return]"), { strokeDashoffset: 1 });
    }, root);

    drawFlow(el);

    // Block 1: Skills Flow
    const flowBlock = el.querySelector("[data-flow-block]");
    const flowGroups = [
      flowBlock && flowBlock.querySelector("[data-flow-head]") && {
        element: flowBlock.querySelector("[data-flow-head]"),
        agents: AG.flowHead,
        build: (node) => buildFlowHead(node, el, AG.flowHead),
      },
      ...sg.flow.map((node, i) => {
        const nodeEl = flowBlock && flowBlock.querySelector(`[data-flow-node="${node.key}"]`);
        return (
          nodeEl && {
            element: nodeEl,
            agents: AG.flowNodes[i],
            build: (target) => buildFlowNode(target, i, el, AG.flowNodes[i]),
          }
        );
      }),
    ].filter(Boolean);

    // Block 2: Full-Width Experience (Internship details, no boxes)
    const expBlock = el.querySelector("[data-exp-block]");
    const expGroups = [
      expBlock && expBlock.querySelector("[data-exp-head]") && {
        element: expBlock.querySelector("[data-exp-head]"),
        agents: AG.expHead,
        build: (node) => buildExpHead(node, el, AG.expHead),
      },
      expBlock && expBlock.querySelector("[data-internship-details]") && {
        element: expBlock.querySelector("[data-internship-details]"),
        agents: AG.internship,
        build: (node) => buildInternship(node, el),
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
      start: "top 95%",
      speed: SPEED,
      back: BACK,
      groups: expGroups,
    });

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => drawFlow(el), 140);
    };
    window.addEventListener("resize", onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => drawFlow(el));
    }

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      stopFlow();
      stopExp();
      clearOverlays(el);
      ctx.revert();
    };
  }, [enabled, sg.flow]);

  return (
    <section
      id="experience"
      data-env="experience"
      ref={root}
      className="relative flex min-h-svh flex-col border-t border-line px-gutter py-[8svh]"
      style={{ backgroundColor: EXP.bg }}
    >
      <h2 className="sr-only">Experience</h2>
      <style>{EXP_STYLE}</style>
      <style>{envCss("experience")}</style>

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-[10svh]">
        {/* ---------- part 1: the skills request path ---------- */}
        <div data-flow-block className="relative">
          <header data-flow-head className="relative">
            <p className="label mb-2 block w-fit">
              <span data-flow-label className="inline-block">
                <span className="text-red">
                  <Words text={sg.num} />
                </span>{" "}
                / <Words text={sg.label} />
              </span>
            </p>
            <h3 className="display flex flex-wrap items-baseline gap-x-4 text-[min(6vw,10svh)] max-lg:text-[clamp(2.4rem,10vw,3.8rem)]">
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
              className="mt-3 block max-w-[38rem] text-[min(0.95rem,2.1svh)] leading-relaxed text-muted"
            >
              <Words text={sg.intro} />
            </p>
            <span
              data-flow-rule
              aria-hidden="true"
              className="mt-5 block h-px w-full origin-left bg-line"
            />
          </header>

          <SkillsFlow flow={sg.flow} returnLabel={sg.returnLabel} />
        </div>

        {/* ---------- part 2: the internship experience (full width, not in boxes) ---------- */}
        <div data-exp-block className="relative">
          <header data-exp-head className="mb-8">
            <p className="label mb-2 block w-fit">
              <span data-exp-label className="inline-block">
                <span className="text-red">
                  <Words text="02" />
                </span>{" "}
                / <Words text="EXPERIENCE" />
              </span>
            </p>
            <h3 className="display flex flex-wrap items-baseline gap-x-4 text-[min(6vw,10svh)] max-lg:text-[clamp(2.4rem,10vw,3.8rem)]">
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

          {/* Full-width internship details */}
          <div
            data-internship-details
            className="relative w-full max-w-[1300px] border-t border-line/60 pt-6 lg:pt-8"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h3
                  data-int-role
                  className="display block w-fit text-[clamp(2.2rem,6vw,3.6rem)] leading-none text-ink transition-colors duration-300 hover:text-red"
                >
                  <Words text={exp.role} />
                </h3>

                <p className="mt-1 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
                  <span
                    data-int-company
                    className="inline-block text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-gold"
                  >
                    <Words text={exp.company} />
                  </span>
                  <i
                    aria-hidden="true"
                    className="size-1 rounded-full bg-red"
                  />
                  <span
                    data-int-period
                    className="label inline-block text-[0.68rem] tracking-[0.16em]"
                  >
                    <Words text={exp.period} />
                  </span>
                </p>
              </div>

              <p
                data-int-summary
                className="block max-w-[50rem] text-[1.02rem] leading-relaxed text-ink/80"
              >
                <Words text={exp.summary} />
              </p>

              <ul className="mt-2 grid gap-3 max-w-[56rem]">
                {exp.points.map((point) => (
                  <li
                    key={point}
                    data-int-point
                    className="flex items-start gap-3.5"
                  >
                    <i
                      data-int-dash
                      aria-hidden="true"
                      className="mt-[0.58rem] h-px w-5 shrink-0 origin-left bg-red"
                    />
                    <span
                      data-int-point-text
                      className="block text-[0.88rem] leading-relaxed text-ink/80"
                    >
                      <Words text={point} />
                    </span>
                  </li>
                ))}
              </ul>

              <span
                data-int-rule
                aria-hidden="true"
                className="mt-4 block h-px w-full origin-left bg-line"
              />

              <div className="pt-2">
                <p
                  data-tech-label
                  className="label block w-fit text-[0.62rem] tracking-[0.2em]"
                >
                  <span className="text-red">↳</span> {exp.techLabel}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2.5">
                  {exp.tech.map((name) => (
                    <li
                      key={name}
                      data-tech-chip
                      className="group/chip flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-3.5 outline-offset-[6px] hover:-translate-y-1 hover:scale-108 hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#4c8dff]/70"
                    >
                      <Logo
                        item={techItem(name)}
                        className="size-4"
                        badgeClass="text-[0.48rem]"
                      />
                      <span className="whitespace-nowrap text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted transition-colors group-hover/chip:text-ink">
                        {name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
