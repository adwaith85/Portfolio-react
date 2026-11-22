import { useState } from "react";
import { CertificateArt, imageSrc } from "./CertificateModal";

export default function CertFrame({ item, active, onOpen }) {
  const [broken, setBroken] = useState(false);
  const src = imageSrc(item);
  const rotated = item.rotate === 90;
  const w = item.w || 900;
  const h = item.h || 1280;
  const aw = rotated ? h : w;
  const ah = rotated ? w : h;

  return (
    <button
      type="button"
      className={rotated ? "edu-cert is-rotated" : "edu-cert"}
      aria-label={`Open ${item.title} certificate`}
      aria-expanded={Boolean(active)}
      onClick={(event) => onOpen(item, event)}
      style={{ "--ar": aw / ah }}
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
            onError={() => setBroken(true)}
          />
        ) : (
          <CertificateArt />
        )}
      </span>
      <span className="edu-cert-heading">
        <span className="edu-cert-name">{item.title}</span>
        <span className="edu-cert-caption">{item.caption}</span>
      </span>
    </button>
  );
}
