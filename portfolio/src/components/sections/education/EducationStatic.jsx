import EduCard from "./EduCard";
import CertFrame from "./CertFrame";

/* prefers-reduced-motion: same content, no pin, no tilt, no cursors. */
export default function EducationStatic({ head, cards, achievements, rows, activeIndex, onOpen }) {
  const groups = rows?.length ? rows : [achievements.items];

  return (
    <div className="edu-static">
      <header className="edu-static-head">
        <p className="label">{head.num} / {head.label}</p>
        <h2 className="display edu-static-title">
          <span>{head.lines[0]}</span>
          <span className="text-red">{head.lines[1]}</span>
        </h2>
        <p className="edu-static-tagline">{head.tagline}</p>
      </header>

      <div className="edu-static-cards">
        {cards.map((card, i) => (
          <EduCard key={card.stage} card={card} index={i} />
        ))}
      </div>

      <div className="edu-static-achievements">
        <h2 className="display edu-static-ach-title">
          {achievements.title}<span className="text-red">.</span>
        </h2>
        <p className="edu-static-ach-tagline">{achievements.tagline}</p>
        <div className="edu-static-grid">
          {groups.flat().map((item, i) => (
            <CertFrame
              key={item.index}
              item={item}
              featured={(i % 3) === 1}
              active={activeIndex === item.index}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
