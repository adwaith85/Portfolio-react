
import useSmoothScroll from "./hooks/useSmoothScroll";
import Intro from "./components/sections/Intro";
import StackStrip from "./components/sections/StackStrip";
import WhatIDo from "./components/sections/WhatIDo";
import Projects from "./components/sections/Projects";
import SectionShell from "./components/sections/SectionShell";
import SiteFooter from "./components/sections/SiteFooter";
import CursorSwarm from "./components/cursors/CursorSwarm";
import { content } from "./data/content";

export default function App() {
  useSmoothScroll();

  const rest = content.sections.filter(
    (s) => !["what-i-do", "projects"].includes(s.id)
  );

  return (
    <>
      <main>
        <Intro />
        <StackStrip />
        <WhatIDo />
        <Projects />

        {rest.map((s) => (
          <SectionShell key={s.id} {...s} />
        ))}
      </main>

      <SiteFooter />

      <CursorSwarm />
    </>
  );
}
