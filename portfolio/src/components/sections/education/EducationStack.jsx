import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { safeRefresh } from "../../../hooks/useSmoothScroll";
import EduCard, { fitCard } from "./EduCard";
import EduCertCard from "./EduCertCard";

gsap.registerPlugin(ScrollTrigger);

export default function EducationStack({ head, cards, achievements, onOpen }) {
  const pinRef = useRef(null);
  const [version, setVersion] = useState(0);
  const measured = useRef({ fonts: false });

  useLayoutEffect(() => {
    let timer;
    let last = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (Math.abs(w - last.w) < 2 && Math.abs(h - last.h) < 120) return;
      last = { w, h };
      clearTimeout(timer);
      timer = setTimeout(() => {
        setVersion((v) => v + 1);
        safeRefresh();
      }, 200);
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

    const track = pin.querySelector(".edu-track");
    const train = pin.querySelector(".edu-train");
    const cardEls = [...pin.querySelectorAll("[data-edu-card]")];
    const certCard = cardEls[4];
    const certEls = [...pin.querySelectorAll(".edu-cert")];
    const certMedias = certEls.map((el) => el.querySelector(".edu-cert-media"));
    const certNames = certEls.map((el) => el.querySelector(".edu-cert-name"));
    const certGroups = [...pin.querySelectorAll(".edu-cert-group")];
    const certTitle = certCard.querySelector(".edu-certs-title");
    const certTitleHead = certCard.querySelector(".edu-certs-title-head");
    if (
      !track ||
      !train ||
      cardEls.length !== 5 ||
      certEls.length !== 9 ||
      certGroups.length !== 3 ||
      !certTitle ||
      !certTitleHead
    ) return undefined;

    let cancelled = false;

    const build = () => {
      const W = track.clientWidth;
      const H = track.clientHeight;
      if (!W || !H) return null;

      const mobile = window.innerWidth < 700;
      const gap = Math.min(48, Math.max(24, window.innerWidth * 0.03));
      const cardSize = mobile ? Math.min(W, H * 0.5) : Math.min(H * 0.9, 440);
      const pad = Math.max(mobile ? 12 : 16, Math.round(cardSize * (mobile ? 0.05 : 0.055)));
      const titleSize = Math.round(Math.min(24, Math.max(17, cardSize * 0.075)));
      const gridGap = 8;
      const items = achievements.items;
      const aspect = (item) => {
        const w = item.w || 900;
        const h = item.h || 1280;
        return item.rotate === 90 ? h / w : w / h;
      };

      gsap.set(train, { x: 0, y: 0 });

      if (mobile) {
        const left = (W - cardSize) / 2;
        const firstTop = H - cardSize;
        cardEls.forEach((el, i) => {
          gsap.set(el, {
            left,
            top: firstTop + i * (gap + cardSize),
            width: cardSize,
            height: cardSize,
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
          });
        });
      } else {
        const firstLeft = W - cardSize;
        const top = (H - cardSize) / 2;
        cardEls.forEach((el, i) => {
          gsap.set(el, {
            left: firstLeft + i * (gap + cardSize),
            top,
            width: cardSize,
            height: cardSize,
            x: 0,
            y: 0,
            xPercent: 0,
            yPercent: 0,
          });
        });
      }

      cardEls.forEach(fitCard);

      if (mobile) {
        const titleH = Math.max(80, Math.round(cardSize * 0.3));
        const titleGap = Math.max(8, Math.round(cardSize * 0.035));
        certCard.style.setProperty("--cert-title-h", `${titleH}px`);
        certCard.style.setProperty("--cert-title-gap", `${titleGap}px`);
        const gridW = cardSize - 2 * pad;
        const gridH = H - 2 * pad - titleH - titleGap;
        const cellW = Math.max(1, (gridW - 2 * gridGap) / 3);
        const cellH = Math.max(1, (gridH - 2 * gridGap) / 3);
        const headingH = Math.max(22, Math.min(26, Math.round(cellH * 0.2)));
        const imageH = Math.max(10, cellH - headingH - 4);

        certCard.style.setProperty("--cert-pad", `${pad}px`);
        certCard.style.setProperty("--cert-gap", `${gridGap}px`);
        certCard.style.setProperty("--cert-heading-h", `${headingH - 4}px`);
        certCard.style.setProperty("--cert-title-size", `${titleSize}px`);

        certEls.forEach((el, i) => {
          const ar = aspect(items[i]);
          const h = Math.min(imageH, cellW / ar);
          const w = h * ar;
          el.style.width = `${Math.round(w)}px`;
          certMedias[i].style.width = `${Math.round(w)}px`;
          certMedias[i].style.height = `${Math.round(h)}px`;
        });
      } else {
        const vpad = Math.max(10, Math.round(cardSize * 0.025));
        const hGap = Math.min(20, Math.max(10, Math.round(window.innerWidth * 0.012)));
        const vGap = Math.min(16, Math.max(8, Math.round(window.innerHeight * 0.014)));
        const titleGap = Math.min(80, Math.max(32, Math.round(window.innerWidth * 0.05)));
        const innerW = W - 2 * pad;
        const innerH = cardSize - 2 * vpad;
        const cellH = Math.max(1, (innerH - 2 * vGap) / 3);
        const maxAspect = [0, 1, 2].map((column) =>
          Math.max(...[0, 1, 2].map((row) => aspect(items[column * 3 + row])))
        );
        const nameLine = parseFloat(getComputedStyle(certNames[0]).lineHeight) || 10;
        const headingH = Math.ceil(nameLine * 2) + 3;
        const headingReserve = headingH + 4;

        certCard.style.setProperty("--cert-pad", `${pad}px`);
        certCard.style.setProperty("--cert-pad-v", `${vpad}px`);
        certCard.style.setProperty("--cert-h-gap", `${hGap}px`);
        certCard.style.setProperty("--cert-v-gap", `${vGap}px`);
        certCard.style.setProperty("--cert-title-gap", `${titleGap}px`);
        certCard.style.setProperty("--cert-heading-h", `${headingH}px`);
        certCard.style.setProperty("--cert-title-w", `${Math.round(innerW)}px`);

        let fittedTitle = Math.round(Math.min(34, Math.max(18, cardSize * 0.075)));
        let titleW;
        for (;;) {
          certCard.style.setProperty("--cert-title-size", `${fittedTitle}px`);
          titleW = Math.ceil(certTitleHead.scrollWidth) + 4;
          if (titleW <= innerW * 0.45 || fittedTitle <= 18) break;
          fittedTitle -= 1;
        }
        titleW = Math.min(titleW, Math.round(innerW * 0.45));
        certCard.style.setProperty("--cert-title-w", `${titleW}px`);
        certCard.style.setProperty("--cert-title-size", `${fittedTitle}px`);

        const totalAspect = maxAspect.reduce((sum, value) => sum + value, 0);
        const colsAvail = Math.max(10, innerW - titleW - titleGap - 2 * hGap);
        const imageH = Math.max(
          10,
          Math.min(Math.floor(cellH - headingReserve), Math.floor(colsAvail / totalAspect))
        );
        const columnWidths = maxAspect.map((value) => Math.max(1, Math.round(imageH * value)));

        certEls.forEach((el, i) => {
          const column = Math.floor(i / 3);
          const w = Math.max(1, Math.round(imageH * aspect(items[i])));
          el.style.width = `${columnWidths[column]}px`;
          certMedias[i].style.width = `${w}px`;
          certMedias[i].style.height = `${imageH}px`;
        });
      }

      const moveAxis = mobile ? "y" : "x";
      const growProp = mobile ? "height" : "width";
      const growTo = mobile ? H : W;

      certGroups.forEach((group) => gsap.set(group, { x: 0, y: 0 }));
      gsap.set(certCard, { [growProp]: growTo });
      const cardRect = certCard.getBoundingClientRect();
      const slots = certGroups.map((group) => {
        const rect = group.getBoundingClientRect();
        return mobile
          ? Math.max(0, cardRect.bottom - rect.top + 4)
          : Math.max(0, cardRect.right - rect.left + 4);
      });
      gsap.set(certCard, { [growProp]: cardSize });
      certGroups.forEach((group, i) => {
        gsap.set(group, mobile ? { y: slots[i] } : { x: slots[i] });
      });

      const trainTravel = 4 * (gap + cardSize);
      const widenTravel = (mobile ? H : W) - cardSize;
      const setDuration = Math.round(window.innerHeight * 0.5);
      const hold = Math.round(window.innerHeight * 0.4);
      const revealStart = trainTravel + widenTravel * 0.6;
      const afterReveal = revealStart + 3 * setDuration;
      const total = afterReveal + hold;

      const tl = gsap.timeline({ defaults: { ease: "none" } });
      tl.to(train, { [moveAxis]: -trainTravel, duration: trainTravel }, 0);
      if (widenTravel > 0) {
        tl.to(train, { [moveAxis]: -(trainTravel + widenTravel), duration: widenTravel }, trainTravel);
        tl.to(certCard, { [growProp]: growTo, duration: widenTravel }, trainTravel);
      } else {
        gsap.set(certCard, { [growProp]: growTo });
      }
      certGroups.forEach((group, i) => {
        tl.to(
          group,
          { [moveAxis]: 0, duration: setDuration, ease: "power2.out" },
          revealStart + i * setDuration
        );
      });
      tl.to({ v: 0 }, { v: 1, duration: hold }, afterReveal);

      ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () => `+=${Math.round(total)}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 2,
        scrub: true,
        animation: tl,
      });

      return total;
    };

    const ctx = gsap.context(build, pin);

    if (!measured.current.fonts) {
      measured.current.fonts = true;
      document.fonts?.ready?.then(() => {
        if (cancelled) return;
        cardEls.forEach(fitCard);
        setVersion((v) => v + 1);
      });
    }

    const images = [...pin.querySelectorAll("img")];
    const refresh = () => {
      if (!cancelled) setVersion((v) => v + 1);
    };
    images.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", refresh, { once: true });
      img.addEventListener("error", refresh, { once: true });
    });

    return () => {
      cancelled = true;
      images.forEach((img) => {
        img.removeEventListener("load", refresh);
        img.removeEventListener("error", refresh);
      });
      ctx.revert();
    };
  }, [version]);

  return (
    <div ref={pinRef} className="edu-stage">
      <header className="edu-head">
        <p className="label edu-head-label">{head.num} / {head.label}</p>
        <h2 className="display edu-head-title">
          <span>{head.lines[0]}</span>
          <span className="text-red">{head.lines[1]}</span>
        </h2>
      </header>

      <div className="edu-track">
        <div className="edu-train">
          {cards.map((card, i) => (
            <EduCard key={card.stage} card={card} index={i} />
          ))}
          <EduCertCard achievements={achievements} onOpen={onOpen} />
        </div>
      </div>

      <div className="edu-bottom">
        <p className="edu-bottom-tagline">{head.tagline}</p>
      </div>
    </div>
  );
}
