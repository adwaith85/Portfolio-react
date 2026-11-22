import { Fragment, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { handoff } from "../../../engine/handoff";
import { swarm } from "../../cursors/swarmApi";
import useAgentsEnabled from "../../../engine/useAgentsEnabled";
import EduCard, { fitCard } from "./EduCard";
import EduCertCard from "./EduCertCard";
import CertStage from "./CertStage";
import { ALL_AGENTS, buildCardTyping, showLines, hideLines } from "./typing";

gsap.registerPlugin(ScrollTrigger);

const SLOTS = [
  { offset: 0, scale: 1, rotation: 0, opacity: 1, filter: "blur(0px) brightness(1)", zIndex: 40 },
  { offset: 0.52, scale: 0.82, rotation: 3, opacity: 0.85, filter: "blur(1.5px) brightness(0.55)", zIndex: 20 },
  { offset: 0.15, scale: 0.7, rotation: 0, opacity: 0, filter: "blur(3px) brightness(0.4)", zIndex: 10 },
  { offset: -0.15, scale: 0.7, rotation: 0, opacity: 0, filter: "blur(3px) brightness(0.4)", zIndex: 10 },
  { offset: -0.52, scale: 0.82, rotation: -3, opacity: 0.85, filter: "blur(1.5px) brightness(0.55)", zIndex: 20 },
];

const STEPS = [
  "01 SCHOOL",
  "02 BCA",
  "03 MERN",
  "04 OPEN TO WORK",
  "05 ACHIEVEMENTS",
];

const FULL_CLIP = "inset(0px 0px 0px 0px round 0px)";
const clampStep = (n) => Math.max(0, Math.min(4, n));

// Step 0 uses the opening pose: Open to Work on the left, Achievements
// hidden-left. Every later step follows (index - step + 5) % 5.
const slotFor = (index, step) => {
  if (step === 0 && index === 3) return 4;
  if (step === 0 && index === 4) return 3;
  return (index - step + 5) % 5;
};

export default function EducationStack({ head, cards, achievements, rows, miniItems, activeIndex, onOpen }) {
  const pinRef = useRef(null);
  const enabled = useAgentsEnabled();
  const [version, setVersion] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Rebuild only for a real viewport change (ignore small mobile toolbar moves).
  useLayoutEffect(() => {
    let timer;
    let last = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (Math.abs(w - last.w) < 2 && Math.abs(h - last.h) < 120) return;
      last = { w, h };
      clearTimeout(timer);
      timer = setTimeout(() => setVersion((v) => v + 1), 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    if (!pin) return undefined;

    const cardsZone = pin.querySelector(".edu-cards");
    const cardEls = [...pin.querySelectorAll("[data-edu-card]")];
    const headEl = pin.querySelector(".edu-head");
    const bottomEl = pin.querySelector(".edu-bottom");
    const certStage = pin.querySelector("[data-cert-stage]");
    const certHead = pin.querySelector("[data-cert-head]");
    const miniLayer = pin.querySelector("[data-cert-mini]");
    const miniThumbs = [...pin.querySelectorAll("[data-cert-mini-item]")];
    const certRiseEls = [...pin.querySelectorAll("[data-cert-rise]")];
    const certFrames = [...pin.querySelectorAll("[data-cert-frame]")];
    if (!cardsZone || cardEls.length !== 5 || !certStage || !certHead) return undefined;

    const certHeadItems = [...certHead.children];
    const others = cardEls.slice(0, 4);
    const chrome = [headEl, bottomEl].filter(Boolean);
    const isMobile = () => window.innerWidth < 700;
    const isTablet = () => window.innerWidth >= 700 && window.innerWidth < 1024;
    const stepDistance = () => window.innerHeight * (isMobile() ? 0.6 : 0.7);
    const expandDistance = () => window.innerHeight;
    const holdDistance = () => window.innerHeight * 0.4;

    let cardW = 400;
    let cardH = 380;
    let step = 0;
    let desired = 0;
    let fastQueue = false;
    let ready = false;
    let slideTl = null;
    let frontFailsafe = null;
    let activeTyping = null;
    const typings = [null, null, null, null];
    const typingState = ["idle", "idle", "idle", "idle"];

    const hideSwarm = () => {
      if (enabled) ALL_AGENTS.forEach((k) => swarm.hide(k));
    };

    const sizeCards = () => {
      const H = cardsZone.clientHeight;
      const W = cardsZone.clientWidth;
      if (!H || !W) return;
      const aspect = isMobile() ? 1.4 : isTablet() ? 1.05 : 0.95;
      const widthFactor = isMobile() ? 0.84 : isTablet() ? 0.72 : 0.44;
      cardW = Math.min(640, W * widthFactor, (H * 0.92) / aspect);
      cardH = cardW * aspect;
      pin.style.setProperty("--card-w", `${cardW}px`);
      pin.style.setProperty("--card-h", `${cardH}px`);
      cardEls.forEach(fitCard);
    };

    const slotVars = (slot) => {
      const cfg = SLOTS[slot];
      const side = slot === 1 || slot === 4;
      const mobile = isMobile();
      const offset = side && mobile ? (slot === 1 ? 0.62 : -0.62) : cfg.offset;
      return {
        xPercent: -50,
        yPercent: -50,
        x: offset * cardW,
        y: 0,
        rotation: cfg.rotation,
        scale: side && mobile ? 0.8 : cfg.scale,
        autoAlpha: cfg.opacity,
        filter: side && mobile ? "blur(1px) brightness(0.55)" : cfg.filter,
        zIndex: cfg.zIndex,
      };
    };

    const setButtons = (active) => {
      certFrames.forEach((button) => {
        button.disabled = !active;
        button.tabIndex = active ? 0 : -1;
        button.style.pointerEvents = active ? "auto" : "none";
      });
      certStage.style.pointerEvents = active ? "auto" : "none";
    };

    // Analytic front-card rect: the front card is centred in .edu-cards at
    // scale 1, so no measurement of the moving element is needed.
    const cardClip = () => {
      const sr = pin.getBoundingClientRect();
      const zr = cardsZone.getBoundingClientRect();
      const top = zr.top + (zr.height - cardH) / 2 - sr.top;
      const left = zr.left + (zr.width - cardW) / 2 - sr.left;
      const right = sr.width - left - cardW;
      const bottom = sr.height - top - cardH;
      const px = (n) => Math.max(0, Math.round(n));
      return `inset(${px(top)}px ${px(right)}px ${px(bottom)}px ${px(left)}px round 6px)`;
    };

    const resetWall = () => {
      setButtons(false);
      gsap.set(certStage, { autoAlpha: 0, clipPath: FULL_CLIP });
      gsap.set(certHeadItems, { autoAlpha: 0, y: -12 });
      gsap.set(certRiseEls, { autoAlpha: 0, y: 36, scale: 0.94 });
      gsap.set(chrome, { autoAlpha: 1 });
      gsap.set(miniLayer, { autoAlpha: 1 });
      gsap.set(miniThumbs, { autoAlpha: 1, y: 0, scale: 1 });
    };

    const linesVisible = (i) => {
      const lines = cardEls[i]?.querySelectorAll("[data-ty]") || [];
      if (!lines.length) return true;
      return [...lines].every((el) => {
        const s = getComputedStyle(el);
        return s.visibility !== "hidden" && Number(s.opacity) > 0.95;
      });
    };

    const markDone = (i) => {
      typingState[i] = "done";
      if (cardEls[i]) showLines(cardEls[i]);
    };

    const finishActive = () => {
      const t = activeTyping;
      if (!t) return;
      try {
        if (t.progress() < 1) t.progress(1);
      } catch {
        /* a killed timeline can no longer be measured */
      }
      if (activeTyping === t) activeTyping = null;
    };

    // If the timeline is killed or replaced, its lines must still be shown.
    const finishCard = (i) => {
      const t = typings[i];
      if (t) {
        try {
          if (t.progress() < 1) t.progress(1);
        } catch {
          /* already killed */
        }
        if (!linesVisible(i)) showLines(cardEls[i]);
      } else {
        markDone(i);
      }
    };

    const startTyping = (i) => {
      if (i > 3 || !cardEls[i] || typingState[i] !== "idle") return;
      finishActive();
      typingState[i] = "running";
      const t = buildCardTyping(cardEls[i], enabled);
      typings[i] = t;
      activeTyping = t;
      handoff.begin("education", t);
      if (enabled) ALL_AGENTS.forEach((k) => swarm.show(k));
      t.eventCallback("onComplete", () => {
        if (typings[i] !== t) return;
        markDone(i);
        if (activeTyping === t) activeTyping = null;
        handoff.end("education", t);
        hideSwarm();
      });
      t.play(0);
    };

    const scheduleFailsafe = (i) => {
      if (frontFailsafe) frontFailsafe.kill();
      frontFailsafe = null;
      if (i < 0 || i > 3) return;
      frontFailsafe = gsap.delayedCall(1.6, () => {
        frontFailsafe = null;
        if (!linesVisible(i)) {
          finishCard(i);
          showLines(cardEls[i]);
        }
      });
    };

    const startSlide = (next, duration) => {
      finishActive();
      setActiveStep(next);
      const tl = gsap.timeline({
        defaults: { duration, ease: "power3.inOut" },
        onComplete: () => {
          slideTl = null;
          step = next;
          pump();
        },
      });

      cardEls.forEach((card, i) => {
        const to = slotVars(slotFor(i, next));
        tl.to(
          card,
          {
            x: to.x,
            xPercent: to.xPercent,
            yPercent: to.yPercent,
            y: to.y,
            rotation: to.rotation,
            scale: to.scale,
            autoAlpha: to.autoAlpha,
            filter: to.filter,
            zIndex: to.zIndex,
            overwrite: "auto",
          },
          0
        );
      });

      if (next <= 3) {
        scheduleFailsafe(next);
        if (typingState[next] === "idle") tl.call(() => startTyping(next), null, 0.25);
      }
      slideTl = tl;
    };

    const pump = () => {
      if (!ready || slideTl || desired === step) return;
      const dir = desired > step ? 1 : -1;
      const next = clampStep(step + dir);
      const fast = fastQueue || Math.abs(desired - step) > 1;
      if (Math.abs(desired - step) <= 1) fastQueue = false;
      startSlide(next, fast ? 0.55 : 1.0);
    };

    const requestStep = (next) => {
      const clamped = clampStep(next);
      if (clamped === desired) return;
      desired = clamped;
      if (Math.abs(clamped - step) > 1) fastQueue = true;
      finishActive();
      pump();
    };

    const stepFromScroll = (trigger) => {
      const travelled = Math.max(0, (trigger?.scroll?.() ?? window.scrollY) - (trigger?.start ?? 0));
      return clampStep(Math.floor(travelled / stepDistance() + 0.3));
    };

    const applyStepInstant = (target, introTrigger) => {
      if (slideTl) slideTl.kill();
      slideTl = null;
      step = clampStep(target);
      desired = step;
      fastQueue = false;
      setActiveStep(step);
      cardEls.forEach((card, i) => gsap.set(card, { ...slotVars(slotFor(i, step)), overwrite: true }));
      for (let i = 0; i < Math.min(step, 4); i += 1) markDone(i);
      if (step === 0 && typingState[0] === "idle") {
        const alreadyThere =
          introTrigger && introTrigger.scroll() >= introTrigger.start;
        if (alreadyThere) startTyping(0);
        else hideLines(cardEls[0]);
      }
      scheduleFailsafe(step);
    };

    // ---------- initial state ----------
    sizeCards();
    gsap.set(cardEls, {
      xPercent: -50,
      yPercent: -50,
      transformOrigin: "50% 50%",
      overwrite: true,
    });
    cardEls.slice(0, 4).forEach((card) => {
      if (typingState[Number(card.dataset.eduCard)] === "idle") hideLines(card);
    });
    resetWall();

    // Re-fit once webfonts settle: the measured text height can change.
    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (cancelled) return;
      cardEls.forEach(fitCard);
      ScrollTrigger.refresh();
    });

    // ---------- scrubbed expand timeline ----------
    const syncExpand = () => {
      const p = expandTl.progress();
      setButtons(p >= 0.98);
      if (p > 0.02) {
        finishActive();
        hideSwarm();
      }
    };

    const achCard = cardEls[4];
    const coverScale = () =>
      Math.max(pin.clientWidth / cardW, pin.clientHeight / cardH) * 1.02;

    const expandTl = gsap.timeline({ paused: true, onUpdate: syncExpand });
    expandTl
      // The Achievements card itself grows; the mini certificates grow with it.
      .fromTo(
        achCard,
        { scale: 1 },
        { scale: coverScale, duration: 0.7, ease: "power3.inOut" },
        0
      )
      .to(chrome, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 0)
      .to(others, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 0)
      // Transparent at first, so the wall cross-fades over the zooming card.
      .fromTo(
        certStage,
        { autoAlpha: 0, clipPath: cardClip },
        {
          autoAlpha: 1,
          clipPath: FULL_CLIP,
          duration: 0.4,
          ease: "power3.inOut",
        },
        0.15
      )
      .fromTo(
        miniLayer,
        { autoAlpha: 1 },
        { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" },
        0.35
      )
      .fromTo(
        certHeadItems,
        { autoAlpha: 0, y: -12 },
        { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.03, ease: "power2.out" },
        0.55
      )
      .fromTo(
        certRiseEls,
        { autoAlpha: 0, y: 36, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.33,
          stagger: (i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            return (row + col) * 0.03;
          },
          ease: "power3.out",
        },
        0.55
      );

    const ctx = gsap.context(() => {
      const onPinUpdate = (self) => {
        if (ready) requestStep(stepFromScroll(self));
      };

      const pinTrigger = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () =>
          `+=${Math.round(stepDistance() * 4 + expandDistance() + holdDistance())}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: onPinUpdate,
        onRefresh: (self) => {
          sizeCards();
          onPinUpdate(self);
        },
        onLeaveBack: () => {
          finishActive();
          hideSwarm();
        },
      });

      const introTrigger = ScrollTrigger.create({
        trigger: pin,
        start: "top 65%",
        onEnter: () => startTyping(0),
      });

      ScrollTrigger.create({
        trigger: pin,
        start: () => pinTrigger.start + stepDistance() * 4,
        end: () => `+=${Math.round(expandDistance())}`,
        scrub: 0.6,
        animation: expandTl,
        invalidateOnRefresh: true,
        onRefreshInit: () => sizeCards(),
        onUpdate: syncExpand,
        onLeave: syncExpand,
        onLeaveBack: () => setButtons(false),
      });

      applyStepInstant(stepFromScroll(pinTrigger), introTrigger);
      ready = true;
    }, pin);

    return () => {
      ready = false;
      cancelled = true;
      if (slideTl) slideTl.kill();
      expandTl.kill();
      if (frontFailsafe) frontFailsafe.kill();
      typings.forEach((t, i) => {
        if (!t) return;
        try {
          if (t.progress() < 1) t.progress(1);
        } catch {
          /* already killed */
        }
        showLines(cardEls[i]);
        handoff.release(t);
        t.kill();
      });
      hideSwarm();
      ctx.revert();
    };
  }, [enabled, version, setActiveStep]);

  return (
    <div ref={pinRef} className="edu-stage">
      <header className="edu-head">
        <p className="label edu-head-label">{head.num} / {head.label}</p>
        <h2 className="display edu-head-title">
          <span>{head.lines[0]}</span>
          <span className="text-red">{head.lines[1]}</span>
        </h2>
      </header>

      <div className="edu-cards">
        {cards.map((card, i) => (
          <EduCard key={card.stage} card={card} index={i} />
        ))}
        <EduCertCard achievements={achievements} miniItems={miniItems ?? achievements.items} />
      </div>

      <div className="edu-bottom">
        <p className="edu-bottom-tagline">{head.tagline}</p>
        <p className="edu-bottom-label label" aria-label={STEPS.join(" · ")}>
          {STEPS.map((label, i) => (
            <Fragment key={label}>
              {i > 0 && <span className="edu-step-sep"> · </span>}
              <span className={i === activeStep ? "edu-step is-active" : "edu-step"}>{label}</span>
            </Fragment>
          ))}
        </p>
      </div>

      <CertStage
        achievements={achievements}
        rows={rows ?? [achievements.items]}
        activeIndex={activeIndex}
        onOpen={onOpen}
      />
    </div>
  );
}
