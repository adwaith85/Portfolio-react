import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content } from "../../data/content";
import { ENVS, envCss } from "../../theme/palette";
import {
  lockScroll,
  scrollToId,
  unlockScroll,
} from "../../hooks/useSmoothScroll";
import {
  createViewportReveal,
  cursorClick,
  cursorIntro,
  cursorMove,
  cursorOutro,
  cursorType,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import { handoff } from "../../engine/handoff";
import { swarm } from "../cursors/swarmApi";

gsap.registerPlugin(ScrollTrigger);

const FOOTER = ENVS.footer;
const RESUME = "/Adwaith_A_Kumar_Resume.pdf";
const INK = "#f2efeb";

/* Exactly the 20 build cursors: every one gets a small footer job. */
const AG = {
  head: [0, 1],
  explore: [2],
  links: [3, 4, 5, 6, 7, 8],
  resume: [9],
  copy: [10],
  email: [11],
  phone: [12],
  socials: [13, 14, 15, 16, 17, 18],
  top: [19],
};
const AGENTS = Array.from({ length: 20 }, (_, i) => i);

const SOCIALS = [
  { key: "github", label: "GitHub", brand: "#f2efeb" },
  { key: "linkedin", label: "LinkedIn", brand: "#0a66c2" },
  { key: "twitter", label: "X", brand: "#f2efeb" },
  { key: "facebook", label: "Facebook", brand: "#1877f2" },
  { key: "instagram", label: "Instagram", brand: "#e1306c" },
  { key: "email", label: "Email", brand: "#d61a29" },
];

const ICONS = {
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  twitter:
    "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram:
    "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
};

const FOOTER_STYLE = `
  .footer-ghost-word {
    background: linear-gradient(
      180deg,
      rgba(242, 239, 235, 0.13) 0%,
      rgba(214, 26, 41, 0.12) 38%,
      rgba(140, 10, 20, 0.06) 70%,
      rgba(10, 10, 12, 0) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.035));
  }

  .footer-social {
    --brand: #f2efeb;
  }
  .footer-social svg {
    color: #f2efeb;
    transition:
      color 200ms ease,
      transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .footer-social:focus-visible svg {
    color: var(--brand);
    transform: scale(1.16) translateY(-1px);
  }

  .footer-social-tip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    z-index: 40;
    translate: -50% 5px;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    white-space: nowrap;
    border: 1px solid rgba(242, 239, 235, 0.14);
    border-radius: 5px;
    background: rgba(17, 16, 18, 0.9);
    padding: 0.3rem 0.5rem;
    color: #f2efeb;
    font-size: 0.56rem;
    font-weight: 600;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    transition:
      opacity 160ms ease,
      translate 200ms cubic-bezier(0.22, 1, 0.36, 1),
      visibility 0s linear 200ms;
  }
  .footer-social-tip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    translate: -50% 0;
    border: 4px solid transparent;
    border-top-color: rgba(17, 16, 18, 0.9);
  }
  .footer-social:last-child .footer-social-tip {
    right: 0;
    left: auto;
    translate: 0 5px;
  }
  .footer-social:last-child .footer-social-tip::after {
    right: 8px;
    left: auto;
    translate: 0 0;
  }
  .footer-social:last-child:hover .footer-social-tip,
  .footer-social:last-child:focus-visible .footer-social-tip {
    translate: 0 0;
  }
  .footer-social:focus-visible .footer-social-tip,
  .footer-social:last-child:focus-visible .footer-social-tip {
    translate: -50% 0;
    opacity: 1;
    visibility: visible;
    transition-delay: 0s;
  }
  .footer-social:last-child:focus-visible .footer-social-tip {
    translate: 0 0;
  }

  /* link: sliding underline + tiny lift + colour shift */
  .footer-link {
    position: relative;
    transition:
      color 200ms ease,
      transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .footer-link::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 1px;
    background: #d61a29;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
  }
  .footer-link:focus-visible {
    color: #d61a29;
    transform: translateY(-1px);
  }
  .footer-link:focus-visible::after {
    transform: scaleX(1);
  }
  .footer-link-arrow {
    display: inline-block;
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .footer-link:focus-visible .footer-link-arrow {
    transform: translate(2px, -2px);
  }

  .footer-copy {
    transition:
      color 200ms ease,
      border-color 200ms ease,
      transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .footer-copy:focus-visible {
    color: #d61a29;
    border-color: rgba(214, 26, 41, 0.55);
    transform: translateY(-1px);
  }

  .footer-top {
    transition:
      color 200ms ease,
      transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .footer-top:focus-visible {
    color: #d61a29;
    transform: translateY(-1px);
  }
  .footer-top-arrow {
    display: inline-block;
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .footer-top:focus-visible .footer-top-arrow {
    transform: translateY(-3px);
  }

  @media (hover: hover) and (pointer: fine) {
    .footer-social:hover svg {
      color: var(--brand);
      transform: scale(1.16) translateY(-1px);
    }
    .footer-social:hover .footer-social-tip {
      translate: -50% 0;
      opacity: 1;
      visibility: visible;
      transition-delay: 0s;
    }
    .footer-social:last-child:hover .footer-social-tip {
      translate: 0 0;
    }
    .footer-link:hover {
      color: #d61a29;
      transform: translateY(-1px);
    }
    .footer-link:hover::after {
      transform: scaleX(1);
    }
    .footer-link:hover .footer-link-arrow {
      transform: translate(2px, -2px);
    }
    .footer-copy:hover {
      color: #d61a29;
      border-color: rgba(214, 26, 41, 0.55);
      transform: translateY(-1px);
    }
    .footer-top:hover {
      color: #d61a29;
      transform: translateY(-1px);
    }
    .footer-top:hover .footer-top-arrow {
      transform: translateY(-3px);
    }
  }

  .footer-curtain {
    position: fixed !important;
    margin: 0 !important;
    backface-visibility: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .footer-social svg,
    .footer-link,
    .footer-link::after,
    .footer-link-arrow,
    .footer-copy,
    .footer-top,
    .footer-top-arrow {
      transition: none;
    }
    .footer-social:focus-visible svg,
    .footer-link:focus-visible,
    .footer-copy:focus-visible,
    .footer-top:focus-visible {
      transform: none;
    }
  }
`;

function agentIds() {
  const ids = [];
  for (let i = 0; i < 64; i++) {
    if (swarm.els([i]).length) ids.push(i);
  }
  return ids;
}

/* every cursor leaves with the footer build */
function hideAllCursors() {
  swarm.dismiss(agentIds());
  swarm.hoverEnd();
}

/* put the hero back into its pre-build state before its timeline is replayed */
function resetHero(hero) {
  const all = (s) => [...hero.querySelectorAll(s)];

  gsap.set(
    all(
      "[data-role],[data-hello],[data-line],[data-title],[data-gl],[data-loc],[data-logo],[data-row-inner],[data-stat-label],[data-plus],[data-rule-handle],[data-sel],[data-caret],[data-pen],[data-glow],[data-btn-arrow],[data-dl-label],[data-dl-icon]"
    ),
    { autoAlpha: 0 }
  );
  gsap.set(all("[data-ch]"), { opacity: 0 });
  gsap.set(all("[data-gl]"), {
    yPercent: 45,
    scaleY: 1.3,
    transformOrigin: "50% 100%",
  });
  gsap.set(all("[data-dot]"), { scale: 0 });
  gsap.set(all("[data-period],[data-title]"), { color: INK });
  gsap.set(all("[data-rule]"), { clipPath: "inset(0 100% 0 0)" });
  gsap.set(all("[data-btn-bg]"), { scaleX: 0, transformOrigin: "0% 50%" });
  gsap.set(all("[data-sketch]"), { clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set(all("[data-real]"), { clipPath: "inset(0% -60% 100% -60%)" });
  all("[data-stat-num]").forEach((n) => {
    n.textContent = "0";
  });
}

/* find the intro timeline by the hero targets it owns */
function findHeroTimeline(hero) {
  const timelines = gsap.globalTimeline.getChildren(false, false, true);
  for (const tl of timelines) {
    if (!tl || tl.duration() < 2) continue;
    const children = tl.getChildren(true, true, true);
    for (const child of children) {
      const targets = child.targets ? child.targets() : [];
      if (targets.some((t) => t instanceof Element && hero.contains(t))) {
        return tl;
      }
    }
  }
  return null;
}

function replayHeroIntro(known) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const hero = document.getElementById("home");
  if (!hero) return;

  // Resolve the intro before touching the hero. If it cannot be replayed the
  // finished hero must be left exactly as it is, never blanked.
  const intro = known || findHeroTimeline(hero);
  if (!intro) return;

  resetHero(hero);
  agentIds().forEach((i) => swarm.show(i));
  swarm.showAll();

  handoff.claim(intro);
  // No invalidate(): restarting rewinds to the values recorded on the first
  // play, so counters, typing and drag boxes replay exactly as before.
  intro.timeScale(1.35).restart();
}

/* ---------- one fast build for the whole footer ---------- */

function buildFooter(root, ghost) {
  const tl = gsap.timeline();

  const h1 = root.querySelector("[data-f-h1]");
  const h2 = root.querySelector("[data-f-h2]");
  const more = root.querySelector("[data-f-continue]");
  const exploreTitle = root.querySelector("[data-f-explore] [data-f-col-title]");
  const navLinks = [...root.querySelectorAll("[data-f-nav]")];
  const resume = root.querySelector("[data-f-resume]");
  const copy = root.querySelector("[data-f-copy]");
  const email = root.querySelector("[data-f-email]");
  const phone = root.querySelector("[data-f-phone]");
  const socials = [...root.querySelectorAll("[data-f-social]")];
  const bar = root.querySelector("[data-f-bar]");

  cursorIntro(tl, AGENTS, 0);

  const t1 = cursorType(tl, h1, AG.head[0], {
    at: 0.02,
    duration: 0.18,
    travel: 0.07,
  });
  const t2 = cursorType(tl, h2, AG.head[1], {
    at: 0.04,
    duration: 0.2,
    travel: 0.07,
  });
  let headEnd = Math.max(t1, t2);
  tl.fromTo(
    more,
    { autoAlpha: 0, y: 5 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.16,
      ease: "power2.out",
      clearProps: "transform",
    },
    headEnd + 0.01
  );
  headEnd += 0.12;

  // One cursor per item keeps all 20 agents busy for the whole build.
  const reveal = (node, agent, at, ease = "power2.out") => {
    if (!node) return at;
    const arrive = cursorMove(tl, agent, node, {
      at,
      duration: 0.08,
      offset: { x: 0.16, y: 0.5 },
    });
    cursorClick(tl, agent, arrive);
    tl.to(
      node,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.14,
        ease,
        clearProps: "transform",
      },
      arrive
    );
    return arrive + 0.14;
  };

  const titleEnd = cursorType(tl, exploreTitle, AG.explore[0], {
    at: 0.08,
    duration: 0.14,
    travel: 0.07,
  });

  let leftEnd = titleEnd;
  navLinks.forEach((link, i) => {
    const at = Math.max(0.16, titleEnd) + i * 0.032;
    leftEnd = Math.max(leftEnd, reveal(link, AG.links[i], at));
  });
  leftEnd = Math.max(
    leftEnd,
    reveal(resume, AG.resume[0], Math.max(0.2, titleEnd) + navLinks.length * 0.032)
  );

  let rightEnd = reveal(copy, AG.copy[0], 0.1);
  rightEnd = Math.max(rightEnd, reveal(email, AG.email[0], rightEnd + 0.015));
  rightEnd = Math.max(rightEnd, reveal(phone, AG.phone[0], rightEnd + 0.015));

  let socialEnd = Math.max(rightEnd + 0.02, 0.22);
  socials.forEach((link, i) => {
    const at = socialEnd + i * 0.038;
    const arrive = cursorMove(tl, AG.socials[i], link, {
      at,
      duration: 0.07,
      offset: { x: 0.5, y: 0.5 },
    });
    cursorClick(tl, AG.socials[i], arrive);
    tl.to(
      link,
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.15,
        ease: "back.out(2.2)",
        clearProps: "transform,scale",
      },
      arrive
    );
    socialEnd = arrive + 0.12;
  });

  const barAt = Math.max(headEnd, leftEnd, rightEnd, socialEnd) + 0.02;
  const arriveBar = cursorMove(tl, AG.top[0], bar, {
    at: barAt,
    duration: 0.1,
    offset: { x: 0.7, y: 0.5 },
  });
  cursorClick(tl, AG.top[0], arriveBar);
  tl.to(
    bar,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.18,
      ease: "power2.out",
      clearProps: "transform",
    },
    arriveBar
  );
  if (ghost) {
    tl.to(
      ghost,
      { autoAlpha: 1, yPercent: 0, duration: 0.3, ease: "power3.out" },
      arriveBar + 0.04
    );
  }

  const end = arriveBar + 0.36;
  cursorOutro(tl, AGENTS, { at: end, duration: 0.16 });
  tl.add(() => {
    AGENTS.forEach((i) => swarm.hide(i));
    hideAllCursors();
  }, end + 0.18);

  return tl;
}

function Icon({ name }) {
  if (name === "email") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="relative size-[19px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="relative size-[18px]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export default function SiteFooter() {
  const root = useRef(null);
  const ghost = useRef(null);
  const copyTimer = useRef(0);
  const exitLocked = useRef(false);
  const stopReveal = useRef(null);
  const exitApi = useRef(null);
  const heroTl = useRef(null);
  const [copied, setCopied] = useState(false);
  const enabled = useAgentsEnabled();
  const footer = content.footer;

  const triggerExit = useCallback(() => {
    exitApi.current?.trigger();
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const all = (s) => [...el.querySelectorAll(s)];

    const ctx = gsap.context(() => {
      gsap.set(
        all(
          "[data-f-h1],[data-f-h2],[data-f-continue],[data-f-col-title]," +
            "[data-f-nav],[data-f-resume],[data-f-copy],[data-f-email]," +
            "[data-f-phone],[data-f-social],[data-f-bar]"
        ),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-f-nav],[data-f-resume]"), { x: -6 });
      gsap.set(
        all("[data-f-continue],[data-f-copy],[data-f-email],[data-f-phone]"),
        { y: 6 }
      );
      gsap.set(all("[data-f-social]"), { scale: 0.6 });
      gsap.set(all("[data-f-bar]"), { y: 10 });
      if (ghost.current) {
        gsap.set(ghost.current, { yPercent: 30, autoAlpha: 0 });
      }
    }, el);

    const stop = createViewportReveal({
      root: el,
      sectionId: "footer",
      enabled,
      reduced,
      start: "top 92%",
      speed: 2.05,
      back: 2.4,
      groups: [
        {
          element: el,
          agents: AGENTS,
          build: (node) => buildFooter(node, ghost.current),
        },
      ],
    });
    stopReveal.current = stop;

    return () => {
      stop();
      stopReveal.current = null;
      ctx.revert();
    };
  }, [enabled]);

  /*
    Scroll-driven curtain exit.
    The page stays put at the footer end until a deliberate extra wheel / touch
    crosses the resistance threshold. From there progress is scrubbed by the
    same gesture; stopping or releasing early snaps the curtain back down.
  */
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      exitApi.current = {
        trigger() {
          window.scrollTo(0, 0);
          ScrollTrigger.refresh();
        },
      };
      return () => {
        exitApi.current = null;
      };
    }

    const THRESHOLD = 140;
    const MAX_STEP = 280;
    const IDLE = 260;
    const RESISTANCE = 0.9;

    const state = {
      acc: 0,
      engaged: false,
      completing: false,
      heroStarted: false,
      progress: 0,
      mode: "",
      vh: 0,
      travel: 300,
      yTo: null,
      tween: null,
      idle: 0,
      wheelRaf: 0,
      wheelDelta: 0,
      touchStart: 0,
      touchLast: 0,
    };
    let alive = true;

    const atEnd = () =>
      Math.ceil(window.scrollY + window.innerHeight) >=
      document.documentElement.scrollHeight - 3;

    const bottom = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const clearIdle = () => {
      if (state.idle) {
        window.clearTimeout(state.idle);
        state.idle = 0;
      }
    };

    // If a user reaches the end while the footer build is still running, make
    // sure the curtain itself is never half-hidden.
    const finalFooter = () => {
      const nodes = el.querySelectorAll(
        "[data-f-h1],[data-f-h2],[data-f-continue],[data-f-col-title]," +
          "[data-f-nav],[data-f-resume],[data-f-copy],[data-f-email]," +
          "[data-f-phone],[data-f-social],[data-f-bar]"
      );
      if (nodes.length) {
        gsap.set(nodes, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          clearProps: "transform,clipPath",
        });
      }
      if (ghost.current) {
        gsap.set(ghost.current, { yPercent: 0, autoAlpha: 1 });
      }
    };

    const stripCurtain = () => {
      el.classList.remove("footer-curtain");
      [
        "top",
        "left",
        "width",
        "height",
        "padding-top",
        "z-index",
        "margin",
        "will-change",
      ].forEach((prop) => el.style.removeProperty(prop));
      gsap.set(el, { clearProps: "transform" });
      state.yTo = null;
    };

    const startHero = () => {
      if (state.heroStarted) return;
      state.heroStarted = true;
      replayHeroIntro(heroTl.current);
    };

    const COMPLETE_HOLD = 420;

    const setAnchor = (off) => {
      if (off) {
        document.documentElement.style.overflowAnchor = "none";
      } else {
        document.documentElement.style.removeProperty("overflow-anchor");
      }
    };

    const complete = () => {
      if (!alive || state.completing) return;
      state.completing = true;
      clearIdle();
      if (state.wheelRaf) {
        cancelAnimationFrame(state.wheelRaf);
        state.wheelRaf = 0;
      }
      state.wheelDelta = 0;
      if (state.tween) {
        state.tween.kill();
        state.tween = null;
      }
      gsap.killTweensOf(el);
      gsap.set(el, { y: -state.vh });
      startHero();

      // The hero is already running behind the finished curtain. Put the page
      // geometry back at the top without a smooth journey.
      stripCurtain();
      window.scrollTo(0, 0);

      // Hold the lock for a beat so the rest of the same flick cannot scroll
      // the freshly replayed hero, then unlock exactly at the top.
      window.setTimeout(() => {
        if (!alive) return;
        window.scrollTo(0, 0);
        // Keep Lenis's internal target in sync with the instant jump.
        scrollToId("home");
        if (exitLocked.current) {
          unlockScroll();
          exitLocked.current = false;
        }
        ScrollTrigger.refresh();
        ScrollTrigger.update();

        requestAnimationFrame(() => {
          if (!alive) return;
          window.scrollTo(0, 0);
          ScrollTrigger.update();
          setAnchor(false);
          state.engaged = false;
          state.completing = false;
          state.progress = 0;
          state.acc = 0;
          state.mode = "";
          state.heroStarted = false;
        });
      }, COMPLETE_HOLD);
    };

    const restoreSnap = () => {
      if (!alive) return;
      stripCurtain();
      if (exitLocked.current) {
        unlockScroll();
        exitLocked.current = false;
      }
      ScrollTrigger.refresh();
      window.scrollTo(0, bottom());
      ScrollTrigger.update();

      requestAnimationFrame(() => {
        if (!alive) return;
        window.scrollTo(0, bottom());
        ScrollTrigger.update();
        setAnchor(false);
        state.engaged = false;
        state.completing = false;
        state.progress = 0;
        state.acc = 0;
        state.mode = "";
        state.heroStarted = false;
      });
    };

    const snapBack = () => {
      if (!alive || !state.engaged || state.completing) return;
      state.completing = true;
      clearIdle();
      if (state.tween) {
        state.tween.kill();
        state.tween = null;
      }
      gsap.killTweensOf(el);
      state.yTo = null;
      gsap.to(el, {
        y: 0,
        duration: 0.42,
        ease: "power3.out",
        onComplete: restoreSnap,
      });
    };

    const applyProgress = () => {
      if (!alive || !state.engaged) return;
      const p = Math.max(0, Math.min(1, state.progress));
      state.progress = p;
      if (state.yTo) state.yTo(-p * state.vh);
      if (p >= 0.55) startHero();
      if (p >= 1) complete();
    };

    const scheduleIdle = () => {
      clearIdle();
      state.idle = window.setTimeout(() => {
        state.idle = 0;
        if (state.engaged && !state.completing && state.progress < 1) snapBack();
      }, IDLE);
    };

    const engage = (mode) => {
      if (!alive || state.engaged || state.completing) return;

      hideAllCursors();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const rect = el.getBoundingClientRect();
      const padTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
      state.vh = window.innerHeight;
      state.travel = Math.max(240, Math.min(360, state.vh * 0.34));
      state.engaged = true;
      state.completing = false;
      state.heroStarted = false;
      state.progress = 0;
      state.acc = THRESHOLD;
      state.mode = mode;

      // Stop the footer's own reveal trigger from reversing as the page jumps
      // to the top behind the fixed curtain.
      finalFooter();
      stopReveal.current?.();

      lockScroll();
      exitLocked.current = true;

      el.classList.add("footer-curtain");
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "100%";
      el.style.height = `${state.vh}px`;
      // Keep the content exactly where the user saw it while the background
      // becomes a full-viewport curtain.
      el.style.paddingTop = `${Math.max(0, rect.top + padTop)}px`;
      el.style.zIndex = "10000";
      el.style.margin = "0";
      el.style.willChange = "transform";

      window.scrollTo(0, 0);
      ScrollTrigger.update();

      if (mode === "button") {
        state.tween = gsap.to(el, {
          y: -state.vh,
          duration: 0.72,
          ease: "power3.inOut",
          overwrite: true,
          onUpdate() {
            if (this.progress() > state.progress) state.progress = this.progress();
            if (state.progress >= 0.55) startHero();
          },
          onComplete: complete,
        });
      } else {
        state.yTo = gsap.quickTo(el, "y", {
          duration: 0.2,
          ease: "power2.out",
        });
        state.yTo(0);
        scheduleIdle();
      }
    };

    const handleWheelDelta = (delta) => {
      if (!alive || !delta || state.completing) return;

      if (state.engaged) {
        if (state.mode !== "scroll") return;
        state.acc += delta;
        const next = (state.acc - THRESHOLD) / state.travel;
        if (delta < 0 && next <= 0) {
          snapBack();
          return;
        }
        state.progress = Math.max(0, Math.min(1, next));
        applyProgress();
        if (state.progress < 1) scheduleIdle();
        return;
      }

      if (!atEnd()) {
        if (delta < 0) state.acc = 0;
        return;
      }
      if (delta <= 0) {
        state.acc = 0;
        return;
      }
      state.acc += Math.min(delta, MAX_STEP) * RESISTANCE;
      if (state.acc >= THRESHOLD) engage("scroll");
    };

    const onWheel = (e) => {
      if (!alive || state.completing) return;
      if (state.engaged) {
        state.wheelDelta += e.deltaY;
      } else if (atEnd() && e.deltaY > 0) {
        state.wheelDelta += e.deltaY;
      } else {
        if (e.deltaY < 0) {
          state.acc = 0;
          state.wheelDelta = 0;
        }
        return;
      }
      if (!state.wheelRaf) {
        state.wheelRaf = requestAnimationFrame(() => {
          state.wheelRaf = 0;
          const delta = state.wheelDelta;
          state.wheelDelta = 0;
          handleWheelDelta(delta);
        });
      }
    };

    const onTouchStart = (e) => {
      if (!alive) return;
      state.touchStart = e.touches[0]?.clientY ?? 0;
      state.touchLast = 0;
    };

    const onTouchMove = (e) => {
      if (!alive || state.completing) return;
      const y = e.touches[0]?.clientY ?? 0;
      const up = state.touchStart - y; // moving up = scrolling down
      const delta = up - state.touchLast;
      state.touchLast = up;

      if (state.engaged) {
        if (state.mode !== "scroll") return;
        state.acc += delta;
        const next = (state.acc - THRESHOLD) / state.travel;
        if (delta < 0 && next <= 0) {
          snapBack();
          return;
        }
        state.progress = Math.max(0, Math.min(1, next));
        applyProgress();
        return;
      }

      if (!atEnd()) {
        if (delta < 0) state.acc = 0;
        return;
      }
      if (delta <= 0) {
        state.acc = 0;
        return;
      }
      state.acc += Math.min(delta, 120);
      if (state.acc >= THRESHOLD) engage("scroll");
    };

    const onTouchEnd = () => {
      if (!alive || !state.engaged || state.completing) return;
      if (state.progress < 1) snapBack();
      else complete();
    };

    exitApi.current = {
      trigger() {
        if (!alive || state.completing) return;
        if (!state.engaged) {
          engage("button");
          return;
        }
        // Already scrubbing: finish the lift from wherever it is.
        state.mode = "button";
        clearIdle();
        state.yTo = null;
        if (state.tween) state.tween.kill();
        state.tween = gsap.to(el, {
          y: -state.vh,
          duration: 0.55,
          ease: "power2.inOut",
          overwrite: true,
          onUpdate() {
            if (this.progress() > state.progress) state.progress = this.progress();
            if (state.progress >= 0.55) startHero();
          },
          onComplete: complete,
        });
      },
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      alive = false;
      clearIdle();
      if (state.wheelRaf) cancelAnimationFrame(state.wheelRaf);
      if (state.tween) state.tween.kill();
      gsap.killTweensOf(el);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      stripCurtain();
      if (exitLocked.current) {
        unlockScroll();
        exitLocked.current = false;
      }
      exitApi.current = null;
    };
  }, []);

  /* keep a handle on the hero timeline before GSAP removes it when it ends */
  useEffect(() => {
    const started = performance.now();
    let timer = 0;

    const find = () => {
      if (heroTl.current) return;
      const hero = document.getElementById("home");
      if (hero) heroTl.current = findHeroTimeline(hero);
      if (!heroTl.current && performance.now() - started < 12000) {
        timer = window.setTimeout(find, 220);
      }
    };

    timer = window.setTimeout(find, 220);
    return () => window.clearTimeout(timer);
  }, []);

  /* Ghost word: a small drift opposite the mouse (desktop, motion allowed). */
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced || !ghost.current) return;

    const ctx = gsap.context(() => {
      const opts = { duration: 0.9, ease: "power3.out" };
      const gx = gsap.quickTo(ghost.current, "x", opts);
      const gy = gsap.quickTo(ghost.current, "y", opts);

      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        gx(-nx * 22);
        gy(-ny * 10);
      };

      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    }, ghost.current);

    return () => ctx.revert();
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const copyEmail = useCallback(() => {
    const done = () => {
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    };

    const fallback = () => {
      try {
        const field = document.createElement("textarea");
        field.value = content.email;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        document.body.removeChild(field);
      } catch {
        /* clipboard access can be blocked; the label still confirms */
      }
      done();
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(content.email).then(done).catch(fallback);
    } else {
      fallback();
    }
  }, []);

  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red";

  return (
    <footer
      ref={root}
      data-env="footer"
      className="relative overflow-hidden border-t border-line px-gutter py-[clamp(3rem,5.5vw,4rem)]"
      style={{ backgroundColor: FOOTER.bg }}
    >
      <style>{FOOTER_STYLE}</style>
      <style>{envCss("footer")}</style>

      <div className="relative z-[2] mx-auto w-full max-w-[1400px]">
        <div className="grid items-center gap-x-10 gap-y-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)_minmax(0,0.85fr)] md:gap-x-12">
          {/* left: explore links */}
          <div
            data-f-explore
            className="order-2 w-full md:order-1 md:max-w-[14rem]"
          >
            <h3
              data-f-col-title
              className="label mb-3 inline-flex w-fit items-center gap-2.5 text-[0.64rem] tracking-[0.2em] text-ink/55"
            >
              <span aria-hidden="true" className="size-1 rounded-full bg-red" />
              Explore
            </h3>
            <nav aria-label="Footer sections" className="flex flex-col">
              {content.nav.map((item) => (
                <a
                  key={item.id}
                  data-f-nav
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(item.id);
                  }}
                  className={`footer-link flex items-center justify-between gap-3 border-b border-white/10 py-2 text-[0.86rem] text-ink/75 ${focusRing}`}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true" className="footer-link-arrow text-red">
                    ↗
                  </span>
                </a>
              ))}
              <a
                data-f-resume
                href={RESUME}
                download
                className={`footer-link mt-4 inline-flex w-fit items-center gap-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink ${focusRing}`}
              >
                <span>Download CV</span>
                <span aria-hidden="true" className="footer-link-arrow text-red">
                  ↓
                </span>
              </a>
            </nav>
          </div>

          {/* center: the closing line */}
          <div data-f-head className="order-1 text-center md:order-2">
            <h2 className="display mx-auto whitespace-nowrap text-[clamp(1.3rem,4vw,3.6rem)] leading-[0.92] tracking-[-0.015em]">
              <span data-f-h1 className="inline-block text-ink">
                THANKS FOR
              </span>{" "}
              <span data-f-h2 className="inline-block text-red">
                WATCHING.
              </span>
            </h2>
            <p
              data-f-continue
              className="mt-2 font-script text-[clamp(1rem,1.7vw,1.35rem)] leading-tight text-ink/70"
            >
              Keep scrolling, endlessly.
            </p>
          </div>

          {/* right: copy, email, phone and socials */}
          <div
            data-f-contact
            className="order-3 w-full md:max-w-[17rem] md:justify-self-end md:text-right"
          >
            <button
              type="button"
              data-f-copy
              onClick={copyEmail}
              aria-label="Copy email address"
              className={`footer-copy inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.16em] ${focusRing} ${
                copied ? "border-red/60 text-red" : "border-white/20 text-ink/65"
              }`}
            >
              <span aria-hidden="true" className="size-[5px] rounded-full bg-current" />
              <span aria-live="polite">{copied ? "Copied ✓" : "Copy email"}</span>
            </button>

            <a
              data-f-email
              href={`mailto:${content.email}`}
              className={`mt-3 block break-all text-[clamp(0.74rem,1.1vw,0.88rem)] leading-relaxed text-ink/80 transition-colors hover:text-red ${focusRing}`}
            >
              {content.email}
            </a>
            <a
              data-f-phone
              href={`tel:${footer.phone}`}
              className={`mt-1.5 inline-block text-[0.74rem] text-ink/55 transition-colors hover:text-red ${focusRing}`}
            >
              {footer.phone}
            </a>

            <div
              data-f-socials
              className="mt-4 flex flex-wrap items-center gap-3.5 md:justify-end"
            >
              {SOCIALS.map((social) => {
                const href =
                  social.key === "email"
                    ? `mailto:${content.email}`
                    : content.social[social.key];

                return (
                  <a
                    key={social.key}
                    data-f-social
                    href={href}
                    target={social.key === "email" ? undefined : "_blank"}
                    rel={
                      social.key === "email"
                        ? undefined
                        : "noopener noreferrer"
                    }
                    aria-label={social.label}
                    style={{ "--brand": social.brand }}
                    className={`footer-social relative grid size-7 place-items-center ${focusRing}`}
                  >
                    <span aria-hidden="true" className="footer-social-tip">
                      {social.label}
                    </span>
                    <Icon name={social.key} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* the big name, sitting just above the divider */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative mt-[clamp(2.5rem,5vw,3.5rem)] mb-4 -mx-[var(--spacing-gutter)] h-[0.78em] select-none overflow-hidden text-[clamp(2.4rem,9vw,7rem)]"
        >
          <div
            ref={ghost}
            className="absolute inset-x-0 bottom-[-0.04em] flex justify-center will-change-transform"
          >
            <span className="footer-ghost-word display block whitespace-nowrap text-[1em] leading-[0.8]">
              {content.brand}.
            </span>
          </div>
        </div>

        {/* bottom bar */}
        <div
          data-f-bar
          className="flex flex-col gap-4 border-t border-white/12 pt-4 text-[0.68rem] leading-relaxed text-ink/50 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
        >
          <p>
            © {new Date().getFullYear()} {footer.name}. {footer.rights}
          </p>
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <button
              type="button"
              onClick={triggerExit}
              className={`footer-top inline-flex shrink-0 items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/70 ${focusRing}`}
            >
              Back to top{" "}
              <span aria-hidden="true" className="footer-top-arrow text-red">
                ↑
              </span>
            </button>
            <span className="cursor-default select-none text-[0.58rem] tracking-[0.12em] text-ink/35">
              Continue scrolling ↓
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
