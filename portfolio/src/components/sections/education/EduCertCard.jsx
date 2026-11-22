import { useEffect, useState } from "react";
import { CertificateArt, imageSrc } from "./CertificateModal";

const INTERACTIVE = "(min-width: 700px) and (hover: hover) and (pointer: fine)";

function CertItem({ item, interactive, onOpen }) {
  const [broken, setBroken] = useState(false);
  const src = imageSrc(item);
  const rotated = item.rotate === 90;
  const w = item.w || 900;
  const h = item.h || 1280;

  const handleOpen = (event) => {
    if (interactive) onOpen?.(item, event);
  };
  const onKeyDown = (event) => {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.(item, event);
    }
  };

  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      {...(interactive
        ? {
            type: "button",
            "aria-label": `Open ${item.title} certificate`,
            onClick: handleOpen,
            onKeyDown,
          }
        : {})}
      className={rotated ? "edu-cert is-rotated" : "edu-cert"}
    >
      <span className="edu-cert-media">
        {src && !broken ? (
          <img
            className="edu-cert-img"
            src={src}
            alt={item.title}
            width={w}
            height={h}
            loading="lazy"
            decoding="async"
            draggable="false"
            onError={() => setBroken(true)}
          />
        ) : (
          <CertificateArt />
        )}
      </span>
      <span className="edu-cert-heading">
        <span className="edu-cert-name">{item.title}</span>
      </span>
    </Tag>
  );
}

export default function EduCertCard({ achievements, onOpen }) {
  const count = String(achievements.items.length).padStart(2, "0");
  const [interactive, setInteractive] = useState(
    () => typeof window !== "undefined" && window.matchMedia(INTERACTIVE).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(INTERACTIVE);
    const update = () => setInteractive(mq.matches);
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const items = achievements.items;
  const groups = [
    [items[0], items[1], items[2]],
    [items[3], items[4], items[5]],
    [items[6], items[7], items[8]],
  ];

  return (
    <article
      className="edu-card edu-card--certs"
      data-edu-card="4"
      aria-label={achievements.cardTitle}
    >
      <span className="edu-card-num" aria-hidden="true">05</span>
      <div className="edu-certs-inner">
        <div className="edu-certs-title">
          <h3 className="display edu-certs-title-head">{achievements.cardTitle}</h3>
          <p className="edu-certs-line">{achievements.cardLine}</p>
          <span className="edu-certs-underline" aria-hidden="true" />
          <p className="edu-certs-kicker">{count} CERTIFICATES</p>
        </div>
        <div className="edu-certs-grid">
          {groups.map((group, groupIndex) => (
            <div className="edu-cert-group" data-cert-group={groupIndex} key={groupIndex}>
              {group.map((item) => (
                <div className="edu-cert-cell" key={item.index}>
                  <CertItem item={item} interactive={interactive} onOpen={onOpen} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
