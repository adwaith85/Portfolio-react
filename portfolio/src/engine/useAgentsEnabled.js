import { useEffect, useState } from "react";

const POINTER = "(pointer: fine) and (min-width: 768px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

const check = () =>
  typeof window !== "undefined" &&
  window.matchMedia(POINTER).matches &&
  !window.matchMedia(REDUCED).matches;

export default function useAgentsEnabled() {
  const [enabled, setEnabled] = useState(check);

  useEffect(() => {
    const a = window.matchMedia(POINTER);
    const b = window.matchMedia(REDUCED);
    const update = () => setEnabled(check());
    a.addEventListener("change", update);
    b.addEventListener("change", update);
    return () => {
      a.removeEventListener("change", update);
      b.removeEventListener("change", update);
    };
  }, []);

  return enabled;
}