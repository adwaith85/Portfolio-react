import { createContext, useCallback, useContext, useEffect, useState } from "react";
import gsap from "gsap";

const SPEEDS = [1, 2, 0.5];

const MotionContext = createContext({
  motionOn: true,
  speed: 1,
  toggleMotion() {},
  cycleSpeed() {},
});

export function MotionProvider({ children }) {
  const [motionOn, setMotionOn] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    gsap.globalTimeline.paused(!motionOn);
    document.documentElement.dataset.motion = motionOn ? "on" : "off";
  }, [motionOn]);

  useEffect(() => {
    gsap.globalTimeline.timeScale(speed);
  }, [speed]);

  const toggleMotion = useCallback(() => setMotionOn((v) => !v), []);
  const cycleSpeed = useCallback(
    () => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]),
    []
  );

  return (
    <MotionContext.Provider value={{ motionOn, speed, toggleMotion, cycleSpeed }}>
      {children}
    </MotionContext.Provider>
  );
}

export const useMotion = () => useContext(MotionContext);