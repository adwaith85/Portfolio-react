import { useState } from "react";
import { CertificateArt, imageSrc } from "./CertificateModal";

/* One framed certificate in the full-stage gallery. */
export default function CertFrame({ item, featured, active, onOpen }) {
  const [broken, setBroken] = useState(false);
  const src = imageSrc(item);
  const rotated = item.rotate === 90;
  const w = item.w || 900;
  const h = item.h || 1280;
  const aw = rotated ? h : w;
  const ah = rotated ? w : h;
  const number = String(item.index + 1).padStart(2, "0");
  const classes = [
    "cert-frame",
    featured ? "cert-frame--featured" : "cert-frame--dim",
    active ? "is-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      data-cert-frame={item.index}
      aria-label={`Open ${item.title} certificate`}
      aria-expanded={Boolean(active)}
      onClick={(event) => onOpen(item, event)}
      style={{ "--ar": aw / ah, "--aw": aw, "--ah": ah }}
    >
      <span className="cert-frame-rise" data-cert-rise>
        <span className="cert-frame-media">
          <span className="cert-frame-border">
            <span className="cert-frame-mat">
              <span className={`cert-frame-art${rotated ? " is-rotated" : ""}`}>
                {src && !broken ? (
                  <img
                    src={src}
                    alt={item.title}
                    width={w}
                    height={h}
                    loading="lazy"
                    decoding="async"
                    onError={() => setBroken(true)}
                  />
                ) : (
                  <CertificateArt />
                )}
              </span>
              <span className="cert-frame-glass" aria-hidden="true" />
            </span>
          </span>
        </span>
        <span className="cert-frame-caption">
          <span className="cert-frame-no">{number}</span>
          <span className="cert-frame-name">{item.title}</span>
        </span>
      </span>
    </button>
  );
}
