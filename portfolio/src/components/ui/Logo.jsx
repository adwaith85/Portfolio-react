import { useState } from "react";
import { logoUrl } from "../../data/stack";

/*
  A tech logo as a white silhouette that lights up in its brand color when the
  parent has the class "group/chip" and is hovered.
  Falls back to a letter badge if the logo cannot load.
*/
export default function Logo({
  item,
  className = "size-7 sm:size-8 lg:size-9",
  badgeClass = "text-[0.68rem]",
}) {
  const [bad, setBad] = useState(false);
  const showImg = item.slug && !bad;

  return (
    <span className={`grid shrink-0 place-items-center ${className}`}>
      {showImg ? (
        <img
          src={logoUrl(item.slug)}
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
          className={`grid size-full place-items-center rounded-md border border-white/20 font-display leading-none tracking-wide text-ink/70 transition-colors group-hover/chip:border-red group-hover/chip:text-red ${badgeClass}`}
        >
          {item.abbr || item.name.slice(0, 2)}
        </span>
      )}
    </span>
  );
}