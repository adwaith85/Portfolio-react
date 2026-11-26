import { useCallback, useMemo, useRef, useState } from "react";
import { content } from "../../data/content";
import "../../styles/education.css";
import EducationStack from "./education/EducationStack";
import EducationStatic from "./education/EducationStatic";
import { CertificateModal } from "./education/CertificateModal";
import { buildEducationData } from "./education/educationData";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Education() {
  const [activeIndex, setActiveIndex] = useState(null);
  const lastFocus = useRef(null);
  const [reduced] = useState(prefersReduced);
  const data = useMemo(() => buildEducationData(content), []);

  const openCertificate = useCallback((item, event) => {
    lastFocus.current = event?.currentTarget ?? null;
    setActiveIndex(item.index);
  }, []);

  const closeCertificate = useCallback(() => {
    setActiveIndex(null);
    requestAnimationFrame(() => lastFocus.current?.focus?.());
  }, []);

  return (
    <>
      <section
        id="education"
        aria-label="Education"
        className="relative border-t border-line bg-bg"
      >
        {reduced ? (
          <EducationStatic {...data} activeIndex={activeIndex} onOpen={openCertificate} />
        ) : (
          <EducationStack {...data} activeIndex={activeIndex} onOpen={openCertificate} />
        )}
      </section>

      {activeIndex !== null && (
        <CertificateModal
          items={data.achievements.items}
          index={activeIndex}
          onNavigate={setActiveIndex}
          onClose={closeCertificate}
        />
      )}
    </>
  );
}
