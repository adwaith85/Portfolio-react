import { useEffect, useRef } from "react";
import { ENVS, ENV_CSS, rgbOf } from "../../theme/palette";

/*
  The wall: one plain, continuous background behind every section.
  Each section has its own flat colour (the dark fabric palette); the colour only
  changes in a short blend where one section meets the next. There are no gradients
  inside a section, no glows and no painted effects. A fine fabric texture and a soft
  vignette give it the feel of a real surface instead of flat paint.
*/

const smooth = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

export default function Wall() {
  const wrap = useRef(null);

  useEffect(() => {
    const host = wrap.current.parentElement;
    let timer;

    const apply = () => {
      const hr = host.getBoundingClientRect();
      const H = Math.max(host.scrollHeight, hr.height);
      const vh = window.innerHeight;
      const items = [...host.querySelectorAll("[data-env]")]
        .filter((e) => e.dataset.wall !== "skip")
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { color: rgbOf((ENVS[e.dataset.env] || ENVS.hero).bg), top: r.top - hr.top, bottom: r.bottom - hr.top };
        });
      if (!items.length) return;

      const c = (a) => `rgb(${a.map(Math.round).join(",")})`;
      const stops = [`${c(items[0].color)} 0px`];
      for (let j = 1; j < items.length; j++) {
        const prev = items[j - 1];
        const cur = items[j];
        const z = Math.min(0.28 * vh, 0.5 * (prev.bottom - prev.top), 0.5 * (cur.bottom - cur.top));
        const a = cur.top - z;
        stops.push(`${c(prev.color)} ${a.toFixed(1)}px`);
        for (let k = 1; k <= 7; k++) {
          const t = smooth(k / 8);
          const col = prev.color.map((v, i) => v + (cur.color[i] - v) * t);
          stops.push(`${c(col)} ${(a + (2 * z * k) / 8).toFixed(1)}px`);
        }
        stops.push(`${c(cur.color)} ${(cur.top + z).toFixed(1)}px`);
      }
      stops.push(`${c(items[items.length - 1].color)} ${H}px`);
      wrap.current.style.backgroundImage = `linear-gradient(180deg, ${stops.join(", ")})`;
    };

    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 80);
    };

    apply();
    const ro = new ResizeObserver(later);
    ro.observe(host);
    window.addEventListener("resize", later);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", later);
    };
  }, []);

  return (
    <>
      <style>{ENV_CSS}</style>
      <div
        ref={wrap}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#0a0a0c]"
      >
        <div className="fabric absolute inset-0" />
      </div>
      {/* the screen corners sit a little darker, which pushes the centre forward */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_45%,transparent_60%,rgba(0,0,0,0.38)_100%)]"
      />
    </>
  );
}
