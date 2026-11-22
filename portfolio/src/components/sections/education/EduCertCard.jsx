import { useState } from "react";
import { CertificateArt, imageSrc } from "./CertificateModal";

/* One scaled-down gold-framed thumbnail for the Achievements card preview. */
function MiniCertificate({ item }) {
  const [broken, setBroken] = useState(false);
  const src = imageSrc(item);
  const rotated = item.rotate === 90;

  return (
    <span className="edu-mini-frame" data-cert-mini-item>
      <span className="edu-mini-mat">
        <span className={`edu-mini-art${rotated ? " is-rotated" : ""}`}>
          {src && !broken ? (
            <img
              src={src}
              alt={item.title}
              loading="lazy"
              decoding="async"
              onError={() => setBroken(true)}
            />
          ) : (
            <CertificateArt />
          )}
        </span>
      </span>
    </span>
  );
}

/* Card 5: only the preview lives here; the full wall is a separate stage layer. */
export default function EduCertCard({ achievements, miniItems }) {
  const count = String(achievements.items.length).padStart(2, "0");

  return (
    <article
      className="edu-card edu-card--certs"
      data-edu-card="4"
      data-edu-certs
      aria-label={achievements.title}
    >
      <div className="edu-certs-mini" data-cert-mini>
        <p className="edu-cert-mini-label">05 / ACHIEVEMENTS</p>
        <h3 className="edu-cert-mini-title display">
          {achievements.title}<span className="text-red">.</span>
        </h3>
        <p className="edu-cert-mini-count">{count} CERTIFICATES</p>
        <div className="edu-cert-mini-grid">
          {miniItems.map((item) => (
            <MiniCertificate key={item.index} item={item} />
          ))}
        </div>
      </div>
    </article>
  );
}
