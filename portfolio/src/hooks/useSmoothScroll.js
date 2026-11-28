import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;
const locks = new Set();
const applyLock = () => {
  const on = locks.size > 0;
  document.documentElement.style.overflow = on ? "hidden" : "";
  if (lenisInstance) {
    if (on) lenisInstance.stop();
    else lenisInstance.start();
  }
};
export function lockScroll(owner = "default") {
  locks.add(owner);
  applyLock();
}
export function unlockScroll(owner = "default") {
  if (!locks.delete(owner)) return;
  applyLock();
  if (!locks.size && lenisInstance)
    lenisInstance.scrollTo(window.scrollY, { immediate: true, force: true });
}
export function isScrollLocked() {
  return locks.size > 0;
}
export function syncScroll(y) {
  if (lenisInstance) lenisInstance.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}
let globalRefreshTimer = 0;
export function safeRefresh(delay = 90) {
  clearTimeout(globalRefreshTimer);
  const run = () => {
    if (locks.size) {
      globalRefreshTimer = setTimeout(run, 120);
      return;
    }
    ScrollTrigger.refresh();
  };
  globalRefreshTimer = setTimeout(run, delay);
}

export function scrollToTop() {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, {
      duration: 1.8,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function scrollToId(id) {
  if (id === "home") {
    if (lenisInstance) lenisInstance.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisInstance) lenisInstance.scrollTo(el, { offset: 0 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export default function useSmoothScroll() {
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });

    let disposed = false;
    const refresh = () => {
      if (disposed) return;
      safeRefresh(80);
    };
    const onAssetLoad = (event) => {
      if (event.target instanceof HTMLImageElement) refresh();
    };
    document.addEventListener("load", onAssetLoad, true);
    window.addEventListener("load", refresh, { once: true });
    if (document.fonts?.ready) document.fonts.ready.then(refresh).catch(() => {});
    const images = [...document.images].filter((image) => !image.complete);
    if (images.length) {
      Promise.all(images.map((image) => image.decode?.().catch(() => undefined)))
        .then(refresh)
        .catch(() => {});
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchDevice = navigator.maxTouchPoints > 0;
    if (!finePointer || reduced || touchDevice) {
      return () => {
        disposed = true;
        document.removeEventListener("load", onAssetLoad, true);
        window.removeEventListener("load", refresh);
      };
    }

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });
    lenisInstance = lenis;
    if (locks.size) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
      document.removeEventListener("load", onAssetLoad, true);
      window.removeEventListener("load", refresh);
    };
  }, []);
}
