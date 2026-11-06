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
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) return;

    const lenis = new Lenis({ lerp: 0.1 });
    lenisInstance = lenis;
    if (locked) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}