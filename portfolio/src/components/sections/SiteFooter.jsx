import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { content } from "../../data/content";
import { ENVS, envCss } from "../../theme/palette";
import { scrollToId } from "../../hooks/useSmoothScroll";
import {
  createViewportReveal,
  cursorClick,
  cursorIntro,
  cursorMove,
  cursorOutro,
  cursorType,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import { typeReveal } from "../../engine/buildKit";
import { swarm } from "../cursors/swarmApi";

const FOOTER = ENVS.footer;
const RESUME = "/Adwaith_A_Kumar_Resume.pdf";

/* Disjoint cursor leases: one small set of agents per band. */
const AG = {
  head: [0, 1],
  stats: [2],
  columns: [3, 4, 5],
  socials: [6],
  bar: [7],
};

const SOCIALS = [
  { key: "github", label: "GitHub", brand: "#f2efeb" },
  { key: "linkedin", label: "LinkedIn", brand: "#0a66c2" },
  { key: "twitter", label: "X (Twitter)", brand: "#f2efeb" },
  { key: "facebook", label: "Facebook", brand: "#1877f2" },
  { key: "instagram", label: "Instagram", brand: "#e4405f" },
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
    transition:
      translate 220ms cubic-bezier(0.22, 1, 0.36, 1),
      border-color 220ms ease,
      box-shadow 220ms ease,
      background-color 220ms ease;
  }
  .footer-social svg {
    color: #f2efeb;
    transition: color 220ms ease;
  }
  .footer-social-tip {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    z-index: 40;
    translate: -50% 6px;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    white-space: nowrap;
    border: 1px solid rgba(242, 239, 235, 0.18);
    border-radius: 6px;
    background: rgba(17, 16, 18, 0.88);
    padding: 0.36rem 0.58rem;
    color: #f2efeb;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
    transition:
      opacity 180ms ease,
      translate 220ms cubic-bezier(0.22, 1, 0.36, 1),
      visibility 0s linear 220ms;
  }
  .footer-social-tip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    translate: -50% 0;
    border: 4px solid transparent;
    border-top-color: rgba(17, 16, 18, 0.88);
  }

  .footer-social:focus-visible {
    translate: 0 -4px;
    border-color: color-mix(in srgb, var(--brand) 62%, transparent);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--brand) 28%, transparent),
      0 12px 28px -12px color-mix(in srgb, var(--brand) 60%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }
  .footer-social:focus-visible svg {
    color: var(--brand);
  }
  .footer-social:focus-visible .footer-social-tip {
    translate: -50% 0;
    opacity: 1;
    visibility: visible;
    transition-delay: 0s;
  }

  @media (hover: hover) and (pointer: fine) {
    .footer-social:hover {
      translate: 0 -4px;
      border-color: color-mix(in srgb, var(--brand) 62%, transparent);
      background-color: color-mix(in srgb, var(--brand) 8%, transparent);
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--brand) 28%, transparent),
        0 12px 28px -12px color-mix(in srgb, var(--brand) 60%, transparent),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }
    .footer-social:hover svg {
      color: var(--brand);
    }
    .footer-social:hover .footer-social-tip {
      translate: -50% 0;
      opacity: 1;
      visibility: visible;
      transition-delay: 0s;
    }
  }

  .footer-link-arrow {
    display: inline-block;
    transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .footer-link:hover .footer-link-arrow,
  .footer-link:focus-visible .footer-link-arrow {
    transform: translate(2px, -2px);
  }
  .footer-top-arrow {
    display: inline-block;
  }
  @keyframes footerArrowBounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
  .footer-top:hover .footer-top-arrow,
  .footer-top:focus-visible .footer-top-arrow {
    animation: footerArrowBounce 700ms ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .footer-social,
    .footer-social svg,
    .footer-link-arrow {
      transition: none;
    }
    .footer-top:hover .footer-top-arrow,
    .footer-top:focus-visible .footer-top-arrow {
      animation: none;
    }
  }
`;

/* Fade only this group's cursors, then hide them so none is left roaming. */
function outro(tl, agents, end) {
  const at = Math.max(0, end) + 1;
  cursorOutro(tl, agents, { at, duration: 0.45 });
  tl.add(() => agents.forEach((i) => swarm.hide(i)), at + 0.46);
}

/* ---------- band 1: the closing statement ---------- */

function buildHead(block) {
  const tl = gsap.timeline();
  const [A, B] = AG.head;
  const h1 = block.querySelector("[data-f-h1]");
  const h2 = block.querySelector("[data-f-h2]");
  const script = block.querySelector("[data-f-script]");
  const cta = block.querySelector("[data-f-cta]");
  const ctaBg = block.querySelector("[data-f-cta-bg]");
  const ctaText = block.querySelector("[data-f-cta-text]");
  const ctaArrow = block.querySelector("[data-f-cta-arrow]");

  cursorIntro(tl, AG.head, 0);

  const e1 = cursorType(tl, h1, A, { at: 0.06, duration: 0.5, travel: 0.26 });
  const e2 = cursorType(tl, h2, B, { at: 0.14, duration: 0.5, travel: 0.26 });
  let t = Math.max(e1, e2);

  tl.fromTo(
    script,
    { autoAlpha: 0, clipPath: "inset(0% 100% 0% 0%)" },
    {
      autoAlpha: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 0.55,
      ease: "power2.out",
    },
    t + 0.04
  );
  t += 0.48;

  const arrive = cursorMove(tl, B, cta, {
    at: t,
    duration: 0.28,
    offset: { x: 0.5, y: 0.5 },
  });
  cursorClick(tl, B, arrive);
  tl.to(
    ctaBg,
    { scaleX: 1, duration: 0.42, ease: "power3.out" },
    arrive
  );
  tl.fromTo(
    ctaText,
    { autoAlpha: 0, y: 4 },
    { autoAlpha: 1, y: 0, duration: 0.32, ease: "power2.out" },
    arrive + 0.06
  );
  tl.fromTo(
    ctaArrow,
    { autoAlpha: 0, y: -6 },
    { autoAlpha: 1, y: 0, duration: 0.45, ease: "bounce.out" },
    arrive + 0.16
  );

  outro(tl, AG.head, arrive + 0.55);
  return tl;
}

/* ---------- band 2: the proof strip ---------- */

function buildStats(block) {
  const tl = gsap.timeline();
  const A = AG.stats[0];
  const stats = [...block.querySelectorAll("[data-f-stat]")];

  cursorIntro(tl, AG.stats, 0);

  let t = 0.06;
  stats.forEach((stat) => {
    const num = stat.querySelector("[data-f-stat-num]");
    const label = stat.querySelector("[data-f-stat-label]");
    if (!num) return;

    const to = Number(num.dataset.to || 0);
    const arrive = cursorMove(tl, A, num, {
      at: t,
      duration: 0.2,
      offset: { x: 0.5, y: 0.45 },
    });
    cursorClick(tl, A, arrive);

    tl.fromTo(
      stat,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
      arrive - 0.03
    );

    const counter = { v: 0 };
    tl.to(
      counter,
      {
        v: to,
        duration: 0.55,
        ease: "power2.out",
        onUpdate: () => {
          num.textContent = String(Math.round(counter.v));
        },
        onComplete: () => {
          num.textContent = String(to);
        },
      },
      arrive
    );

    if (label) {
      tl.add(typeReveal(label, { duration: 0.28 }), arrive + 0.04);
    }

    t = arrive + 0.22;
  });

  outro(tl, AG.stats, t + 0.5);
  return tl;
}

/* ---------- band 3: the three quick-read columns ---------- */

function buildColumns(block) {
  const tl = gsap.timeline();
  const cols = [...block.querySelectorAll("[data-f-col]")];

  cursorIntro(tl, AG.columns, 0);

  let end = 0;
  cols.forEach((col, i) => {
    const ag = AG.columns[i % AG.columns.length];
    const title = col.querySelector("[data-f-col-title]");
    const lines = [...col.querySelectorAll("[data-f-line]")];
    let t = 0.08 + i * 0.04;

    if (title) {
      t = cursorType(tl, title, ag, {
        at: t,
        duration: 0.3,
        travel: 0.22,
      });
    }

    lines.forEach((line, k) => {
      tl.fromTo(
        line,
        { autoAlpha: 0, y: 7 },
        { autoAlpha: 1, y: 0, duration: 0.32, ease: "power2.out" },
        t + k * 0.07
      );
    });

    end = Math.max(end, t + Math.max(0, lines.length - 1) * 0.07 + 0.32);
  });

  outro(tl, AG.columns, end);
  return tl;
}

/* ---------- band 3: social icons, one cursor click each ---------- */

function buildSocials(block) {
  const tl = gsap.timeline();
  const A = AG.socials[0];
  const links = [...block.querySelectorAll("[data-f-social]")];

  cursorIntro(tl, AG.socials, 0);

  let t = 0.05;
  links.forEach((link) => {
    const arrive = cursorMove(tl, A, link, {
      at: t,
      duration: 0.18,
      offset: { x: 0.5, y: 0.5 },
    });
    cursorClick(tl, A, arrive);
    tl.fromTo(
      link,
      { autoAlpha: 0, scale: 0.55 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.32,
        ease: "back.out(2.4)",
        clearProps: "transform,translate,rotate,scale",
      },
      arrive
    );
    t = arrive + 0.12;
  });

  outro(tl, AG.socials, t + 0.35);
  return tl;
}

/* ---------- band 5 + 4: bottom bar and the ghost word ---------- */

function buildBar(block, ghost) {
  const tl = gsap.timeline();

  cursorIntro(tl, AG.bar, 0);

  tl.to(
    block,
    { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
    0.05
  );

  if (ghost) {
    tl.to(
      ghost,
      { autoAlpha: 1, yPercent: 0, duration: 1.05, ease: "power3.out" },
      0.1
    );
  }

  outro(tl, AG.bar, 1.15);
  return tl;
}

function Icon({ name }) {
  if (name === "email") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="relative size-[22px]"
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
      className="relative size-[21px]"
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
  const [copied, setCopied] = useState(false);
  const enabled = useAgentsEnabled();
  const footer = content.footer;

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const all = (s) => [...el.querySelectorAll(s)];

    const ctx = gsap.context(() => {
      gsap.set(
        all(
          "[data-f-h1],[data-f-h2],[data-f-script],[data-f-stat]," +
            "[data-f-col-title],[data-f-line],[data-f-social],[data-f-bar]"
        ),
        { autoAlpha: 0 }
      );
      gsap.set(all("[data-f-line]"), { y: 7 });
      gsap.set(all("[data-f-script]"), {
        clipPath: "inset(0% 100% 0% 0%)",
      });
      gsap.set(all("[data-f-cta-bg]"), {
        scaleX: 0,
        transformOrigin: "0% 50%",
      });
      gsap.set(all("[data-f-cta-text],[data-f-cta-arrow]"), {
        autoAlpha: 0,
      });
      gsap.set(all("[data-f-bar]"), { y: 10 });
      all("[data-f-stat-num]").forEach((n) => {
        n.textContent = "0";
      });
      if (ghost.current) {
        gsap.set(ghost.current, { yPercent: 30, autoAlpha: 0 });
      }
    }, el);

    const headEl = el.querySelector("[data-f-head]");
    const statsEl = el.querySelector("[data-f-stats]");
    const columnsEl = el.querySelector("[data-f-columns]");
    const socialsEl = el.querySelector("[data-f-socials]");
    const barEl = el.querySelector("[data-f-bar]");

    const groups = [
      headEl && { element: headEl, agents: AG.head, build: buildHead },
      statsEl && { element: statsEl, agents: AG.stats, build: buildStats },
      columnsEl && {
        element: columnsEl,
        agents: AG.columns,
        build: buildColumns,
      },
      socialsEl && {
        element: socialsEl,
        agents: AG.socials,
        build: buildSocials,
      },
      barEl && {
        element: barEl,
        agents: AG.bar,
        start: "top bottom",
        build: (node) => buildBar(node, ghost.current),
      },
    ].filter(Boolean);

    const stop = createViewportReveal({
      root: el,
      sectionId: "footer",
      enabled,
      reduced,
      start: "top 95%",
      speed: 1.45,
      back: 2.2,
      groups,
    });

    return () => {
      stop();
      ctx.revert();
    };
  }, [enabled]);

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
      className="relative flex min-h-[75svh] flex-col overflow-hidden border-t border-line px-gutter pt-[clamp(3.5rem,9svh,7rem)]"
      style={{ backgroundColor: FOOTER.bg }}
    >
      <style>{FOOTER_STYLE}</style>
      <style>{envCss("footer")}</style>

      <div className="relative z-[2] mx-auto flex w-full max-w-[1500px] flex-1 flex-col">
        {/* ---------- band 1: the closing statement ---------- */}
        <div data-f-head className="relative">
          <h2 className="display text-[clamp(2rem,8.2vw,8.5rem)] leading-[0.9]">
            <span data-f-h1 className="block w-fit text-ink">
              {footer.headline[0]}
            </span>
            <span data-f-h2 className="block w-fit text-red">
              {footer.headline[1]}
            </span>
          </h2>

          <div className="mt-6 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <p
              data-f-script
              className="font-script -rotate-2 text-[clamp(1.15rem,2.6vw,2rem)] leading-tight text-ink/80"
            >
              {footer.script}
            </p>

            <a
              data-f-cta
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("contact");
              }}
              className={`group relative inline-flex w-fit shrink-0 rounded-[2px] ${focusRing}`}
            >
              <span className="relative block transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-y-1">
                <span
                  data-f-cta-bg
                  className="absolute inset-0 rounded-[2px] bg-linear-to-b from-[#e0303d] to-[#a8121e] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-3px_0_rgba(0,0,0,0.25),0_6px_0_#6a0a12,0_16px_26px_rgba(0,0,0,0.6)]"
                />
                <span className="relative inline-flex items-center gap-8 px-6 py-[min(1.1rem,2svh)] font-medium text-white">
                  <span data-f-cta-text>{footer.cta}</span>
                  <span data-f-cta-arrow aria-hidden="true" className="inline-block">
                    ↗
                  </span>
                </span>
              </span>
            </a>
          </div>
        </div>

        {/* ---------- band 2: the proof strip ---------- */}
        <div
          data-f-stats
          className="mt-[clamp(3.5rem,8svh,6.5rem)] border-y border-white/12"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {content.hero.stats.map((stat) => (
              <div
                key={stat.label}
                data-f-stat
                className="flex flex-col gap-2 py-5 pr-4 sm:border-l sm:border-white/15 sm:px-6 sm:first:border-l-0 sm:first:pl-0"
              >
                <span
                  data-f-stat-num
                  data-to={stat.value}
                  className="display text-[clamp(2rem,4.2vw,3.6rem)] leading-none tabular-nums text-red"
                >
                  {stat.value}
                </span>
                <span
                  data-f-stat-label
                  className="label text-[0.62rem] tracking-[0.16em]"
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- band 3: three quick-read columns ---------- */}
        <div
          data-f-columns
          className="mt-[clamp(3.5rem,8svh,6.5rem)] grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14"
        >
          {/* quick facts */}
          <div data-f-col>
            <h3
              data-f-col-title
              className="label mb-5 inline-flex w-fit items-center gap-2.5 text-[0.66rem] tracking-[0.2em] text-ink/55"
            >
              <span aria-hidden="true" className="size-1 rounded-full bg-red" />
              Quick facts
            </h3>
            <ul className="flex flex-col gap-2.5">
              {footer.facts.map((fact) => (
                <li
                  key={fact}
                  data-f-line
                  className="flex items-start gap-3 text-[0.9rem] leading-snug text-ink/75"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.42rem] size-1 shrink-0 rounded-full bg-red"
                  />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* explore */}
          <div data-f-col>
            <h3
              data-f-col-title
              className="label mb-5 inline-flex w-fit items-center gap-2.5 text-[0.66rem] tracking-[0.2em] text-ink/55"
            >
              <span aria-hidden="true" className="size-1 rounded-full bg-red" />
              Explore
            </h3>
            <nav aria-label="Footer sections" className="flex flex-col">
              {content.nav.map((item) => (
                <a
                  key={item.id}
                  data-f-line
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(item.id);
                  }}
                  className={`footer-link flex items-center justify-between gap-3 border-b border-white/10 py-2.5 text-[0.92rem] text-ink/75 transition-colors hover:text-red ${focusRing}`}
                >
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className="footer-link-arrow text-red"
                  >
                    ↗
                  </span>
                </a>
              ))}
              <a
                data-f-line
                href={RESUME}
                download
                className={`footer-link mt-4 inline-flex w-fit items-center gap-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:text-red ${focusRing}`}
              >
                <span>Download CV</span>
                <span
                  aria-hidden="true"
                  className="footer-link-arrow text-red"
                >
                  ↓
                </span>
              </a>
            </nav>
          </div>

          {/* connect */}
          <div data-f-col className="sm:col-span-2 lg:col-span-1">
            <h3
              data-f-col-title
              className="label mb-5 inline-flex w-fit items-center gap-2.5 text-[0.66rem] tracking-[0.2em] text-ink/55"
            >
              <span aria-hidden="true" className="size-1 rounded-full bg-red" />
              Let’s connect
            </h3>

            <div data-f-line className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${content.email}`}
                className={`break-all text-[clamp(1rem,2.1vw,1.45rem)] font-medium leading-tight text-ink transition-colors hover:text-red ${focusRing}`}
              >
                {content.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email address"
                className={`rounded-full border px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] transition-colors ${focusRing} ${
                  copied
                    ? "border-red/60 text-red"
                    : "border-white/20 text-ink/60 hover:border-white/40 hover:text-ink"
                }`}
              >
                <span aria-live="polite">{copied ? "Copied ✓" : "Copy"}</span>
              </button>
            </div>

            <a
              data-f-line
              href={`tel:${footer.phone}`}
              className={`mt-4 inline-flex items-center gap-2.5 text-[0.92rem] text-ink/75 transition-colors hover:text-red ${focusRing}`}
            >
              <span className="label text-[0.58rem] tracking-[0.2em] text-red">
                Phone
              </span>
              {footer.phone}
            </a>

            <div
              data-f-socials
              className="mt-7 flex flex-wrap items-center gap-[7px]"
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
                    className={`footer-social relative grid size-[52px] place-items-center rounded-full border border-white/35 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-14px_rgba(0,0,0,0.9)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60`}
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

        {/* ---------- band 5: the bottom bar ---------- */}
        <div
          data-f-bar
          className="mt-[clamp(3rem,7svh,5.5rem)] flex flex-col gap-2.5 border-t border-white/12 pt-5 text-[0.68rem] leading-relaxed text-ink/50 md:grid md:grid-cols-3 md:items-center md:gap-6"
        >
          <p>
            © {new Date().getFullYear()} {footer.name}. {footer.rights}
          </p>
          <p className="md:text-center">{footer.credit}</p>
          <div className="md:text-right">
            <button
              type="button"
              onClick={() => scrollToId("home")}
              className={`footer-top inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/70 transition-colors hover:text-ink ${focusRing}`}
            >
              <span aria-hidden="true" className="footer-top-arrow text-red">
                ↑
              </span>
              Back to top
            </button>
          </div>
        </div>
      </div>

      {/* ---------- band 4: the ghost word ---------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative mt-5 -mx-[var(--spacing-gutter)] h-[0.7em] select-none overflow-hidden text-[min(22vw,38svh)]"
      >
        <div
          ref={ghost}
          className="absolute inset-x-0 bottom-[-0.06em] flex justify-center will-change-transform"
        >
          <span className="footer-ghost-word display block whitespace-nowrap text-[1em] leading-[0.8]">
            {content.brand}.
          </span>
        </div>
      </div>
    </footer>
  );
}
