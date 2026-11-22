import { Fragment } from "react";
import CertFrame from "./CertFrame";

/*
  The full certificate wall. It is a separate, solid layer over the pinned
  stage so it can clip open without resizing any card. The middle row holds
  BCA Degree, MERN Stack Certification and Internship Certificate.
*/
export default function CertStage({ achievements, rows, activeIndex, onOpen }) {
  const groups = rows?.length ? rows : [achievements.items];
  const count = String(achievements.items.length).padStart(2, "0");

  return (
    <div className="cert-stage" data-cert-stage>
      <div className="cert-stage-inner">
        <header className="cert-head" data-cert-head>
          <p className="cert-kicker">ACHIEVEMENTS · {count} CERTIFICATES</p>
          <h2 className="display cert-title">
            {achievements.title}<span className="text-red">.</span>
          </h2>
          <span className="cert-rule" aria-hidden="true" />
          <p className="cert-tagline">{achievements.tagline}</p>
        </header>

        <div className="cert-grid" data-cert-grid>
          {groups.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              {row.map((item) => (
                <CertFrame
                  key={item.index}
                  item={item}
                  featured={rowIndex === 1 && groups.length === 3}
                  active={activeIndex === item.index}
                  onOpen={onOpen}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
