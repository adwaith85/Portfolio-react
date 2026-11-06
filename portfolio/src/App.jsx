
import useSmoothScroll from "./hooks/useSmoothScroll";
import Intro from "./components/sections/Intro";
import StackStrip from "./components/sections/StackStrip";
import WhatIDo from "./components/sections/WhatIDo";
import Projects from "./components/sections/Projects";
import SectionShell from "./components/sections/SectionShell";
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

      <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-line px-gutter py-10 max-sm:flex-col max-sm:items-start">
        <span className="display text-[2rem]">
          {content.brand}
          <span className="text-red">.</span>
        </span>

        <span className="label">
          © {new Date().getFullYear()} Adwaith A Kumar.
          Built live, line by line.
        </span>

        <span className="label flex gap-6">
          <a href={content.social.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a href={content.social.linkedin} target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
        </span>
      </footer>

      <CursorSwarm />
    </>
  );
}
