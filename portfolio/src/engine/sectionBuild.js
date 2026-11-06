import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { swarm } from "../components/cursors/swarmApi";
import { handoff } from "./handoff";

gsap.registerPlugin(ScrollTrigger);

/*
  Runs a section's build when it scrolls into view.

  - scrolling down : cursors appear and the build plays forward
  - scrolling up   : cursors stay hidden and the build plays backward

  build() must return a PAUSED gsap timeline. It is called lazily, the first
  time the section is reached, so the cursors already exist by then
  (building earlier gives empty cursor moves, which is why cursors were missing).

  Returns a cleanup function.
*/
export function playOnEnter(
  trigger,
  build,
  { start = "top 60%", useAgents = true, speed = 1.3, back = 2.4 } = {}
) {
  let tl = null;
  let alive = true;
  let offReady = () => {};
  let timer;

  const make = (cb) => {
    if (tl) return cb();

    const go = () => {
      if (!alive || tl) return;
      clearTimeout(timer);
      offReady();
      tl = build();
      tl.pause();
      cb();
    };

    if (useAgents) {
      offReady = swarm.whenReady(go);
      timer = setTimeout(go, 600); // never wait longer than this for the cursors
    } else {
      go();
    }
  };

  const st = ScrollTrigger.create({
    trigger,
    start,

    onEnter: () =>
      make(() => {
        swarm.setVisible(true);
        handoff.claim(tl); // the previous section is finished instantly
        swarm.takeOver(); // cursors: idle, invisible, ready for this build
        if (tl.progress() > 0) tl.progress(0); // rewind any half-reversed build
        tl.invalidate().timeScale(speed).restart(); // re-measure positions, then play
      }),

    onLeaveBack: () => {
      swarm.setVisible(false); // no cursors while scrolling backward
      if (tl) tl.timeScale(back).reverse();
    },
  });

  return () => {
    alive = false;
    offReady();
    clearTimeout(timer);
    st.kill();
    if (tl) tl.kill();
  };
}