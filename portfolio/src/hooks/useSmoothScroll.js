import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;
let locked = false;

export function lockScroll() {
  locked = true;
  document.documentElement.style.overflow = "hidden";
  if (lenisInstance) lenisInstance.stop();
}

export function unlockScroll() {
  locked = false;
  document.documentElement.style.overflow = "";
  if (lenisInstance) lenisInstance.start();
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

    let refreshTimer = 0;
    let disposed = false;
    const refresh = () => {
      if (disposed) return;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 80);
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
        window.clearTimeout(refreshTimer);
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
    if (locked) lenis.stop();
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
      window.clearTimeout(refreshTimer);
    };
  }, []);
}
