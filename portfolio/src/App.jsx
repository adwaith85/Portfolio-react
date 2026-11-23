
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
import SiteFooter from "./components/sections/SiteFooter";
import CursorSwarm from "./components/cursors/CursorSwarm";

export default function App() {
  useSmoothScroll();

  return (
    <>
      <main>
        <Intro />
        <div className="relative z-10 bg-bg">
          <StackStrip />
          <WhatIDo />
          <Projects />
          <About />
          <Education />
          <ToolsStrip />
          <Experience />
          <Contact />
        </div>
      </main>

      <SiteFooter />

      <CursorSwarm />
    </>
  );
}
