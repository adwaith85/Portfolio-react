import { useState } from "react";
import { logoUrl } from "../../data/stack";

/*
  A tech logo as a white silhouette that lights up in its brand color when the
  parent has the class "group/chip" and is hovered.
  Falls back to a letter badge if the logo cannot load.

  In light mode the filter is dropped so the SVG's own brand color shows. Logos
  whose official color is near-black are re-inked from a CSS mask in global.css.
*/
const INK_LOGOS = new Set(["express", "nextjs", "socketio"]);

export default function Logo({
  item,
  className = "size-7 sm:size-8 lg:size-9",
  badgeClass = "text-[0.68rem]",
}) {
  const [bad, setBad] = useState(false);
  const showImg = item.slug && !bad;
  const src = item.slug ? logoUrl(item.slug) : "";
  const kind = INK_LOGOS.has(item.slug) ? "ink" : "brand";

  return (
    <span
      className={`grid shrink-0 place-items-center ${className}`}
      {...(showImg
        ? { "data-logo-kind": kind, style: { "--logo-src": `url("${src}")` } }
        : {})}
    >
      {showImg ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable="false"
          onError={() => setBad(true)}
          className={`size-full select-none object-contain opacity-60 brightness-0 invert transition-[filter,opacity] duration-300 group-hover/chip:opacity-100 ${
            item.dark ? "" : "group-hover/chip:filter-none"
          }`}
        />
      ) : (
        <span
          data-logo-kind="fallback"
          className={`grid size-full place-items-center rounded-md border border-[rgb(var(--cursor-rgb)/0.2)] font-display leading-none tracking-wide text-ink/70 transition-colors group-hover/chip:border-red group-hover/chip:text-red ${badgeClass}`}
        >
          {item.abbr || item.name.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
