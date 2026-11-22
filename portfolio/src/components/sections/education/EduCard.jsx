import { useLayoutEffect, useRef } from "react";

/*
  Largest --fit in [0.8, 1.7] that keeps the card body inside its own box.
  Layout metrics only (no getBoundingClientRect), so card transforms never
  affect the measurement.
*/
export function fitCard(card) {
  const body = card?.querySelector(".edu-card-body");
  if (!body) return;
  let low = 0.8;
  let high = 1.7;
  let best = 0.8;
  for (let i = 0; i < 12; i += 1) {
    const value = (low + high) / 2;
    card.style.setProperty("--fit", value.toFixed(4));
    const fits =
      body.scrollHeight <= body.clientHeight * 0.96 &&
      body.scrollWidth <= body.clientWidth;
    if (fits) {
      best = value;
      low = value;
    } else {
      high = value;
    }
  }
  card.style.setProperty("--fit", best.toFixed(4));
}

export default function EduCard({ card, index }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    fitCard(ref.current);
    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (!cancelled) fitCard(ref.current);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <article ref={ref} className="edu-card" data-edu-card={index} aria-label={card.title}>
      <span className="edu-card-num" aria-hidden="true">{card.stage}</span>
      <div className="edu-card-body">
        <p className="edu-card-label">
          <span className="text-red">{card.level}</span>
          <span className="edu-card-dot"> · </span>
          <span className="text-muted">{card.tag}</span>
        </p>
        <h3 className="edu-card-title display">{card.title}</h3>
        <p className="edu-card-place">{card.place}</p>
        <p className="edu-card-meta">{card.meta}</p>
        <span className="edu-card-rule" aria-hidden="true" />
        <p className="edu-card-studied">{card.studied}</p>
        {card.points.length > 0 && (
          <ul className="edu-card-list">
            {card.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
        {card.chips.length > 0 && (
          <div className="edu-card-chips">
            {card.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        )}
        {card.script && <p className="edu-card-script">{card.script}</p>}
        {card.next && <p className="edu-card-next">{card.next}</p>}
      </div>
    </article>
  );
}
