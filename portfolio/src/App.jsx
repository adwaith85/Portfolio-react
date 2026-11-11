
import useSmoothScroll from "./hooks/useSmoothScroll";
import Intro from "./components/sections/Intro";
import StackStrip from "./components/sections/StackStrip";
import WhatIDo from "./components/sections/WhatIDo";
import Projects from "./components/sections/Projects";
import About from "./components/sections/About";
import Education from "./components/sections/Education";
import ToolsStrip from "./components/sections/ToolsStrip";
import Experience from "./components/sections/Experience";
import Contact from "./components/sections/Contact";
import SectionShell from "./components/sections/SectionShell";
import SiteFooter from "./components/sections/SiteFooter";
import CursorSwarm from "./components/cursors/CursorSwarm";
import { content } from "./data/content";

export default function App() {
  useSmoothScroll();

  const rest = content.sections.filter(
    (s) =>
      ![
        "what-i-do",
        "projects",
        "about",
        "education",
        "experience",
        "contact",
      ].includes(s.id)
  );

  return (
    <>
      <main>
        <Intro />
        <StackStrip />
        <WhatIDo />
        <Projects />
        <About />
        <Education />
        <ToolsStrip />
        <Experience />
        <Contact />

        {rest.map((s) => (
          <SectionShell key={s.id} {...s} />
        ))}
      </main>

      <SiteFooter />

      <CursorSwarm />
    </>
  );
}
