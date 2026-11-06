/*
  Section 2 content. Everything here comes from your CV except the
  "Learning" row, which is a draft: edit it freely.
  tools use the names from src/data/stack.js (so they get the same logos).
*/
export const whatIDo = {
  now: {
    kicker: "Right now",
    rows: [
      { k: "Open to", v: "Junior full-stack and MERN roles" },
      { k: "Learning", v: "Next.js, TypeScript, Docker, AWS" },
      { k: "Building", v: "This portfolio, line by line" },
    ],
    basedLabel: "Based in",
  },

  capabilities: [
    {
      slug: "frontend",
      title: "Frontend",
      line: "Responsive React interfaces that work on every screen size.",
      tools: ["React", "Next.js", "Tailwind CSS", "Bootstrap"],
      proof: "Used in all 4 live demos",
    },
    {
      slug: "backend",
      title: "Backend",
      line: "REST APIs with Node and Express, authentication and real-time sockets.",
      tools: ["Node.js", "Express.js", "Socket.IO", "Postman"],
      proof: "Behind all 5 projects",
    },
    {
      slug: "data",
      title: "Data and cloud",
      line: "MongoDB and MySQL databases, deployed on AWS and packaged with Docker.",
      tools: ["MongoDB", "MySQL", "AWS", "Docker"],
      proof: "MongoDB in 4 projects, MySQL in 1",
    },
    {
      slug: "mobile",
      title: "Mobile",
      line: "Cross-platform apps with React Native and Flutter.",
      tools: ["React Native", "Flutter", "Dart", "Android Studio"],
      proof: "Talkies chat app, built in React Native",
      hot: true,
    },
  ],

  route: {
    label: "Where I stand",
    nodes: [
      { when: "2022 – 2025", title: "BCA degree", where: "Srinivas University" },
      { when: "Jul 2025", title: "MERN training and internship begin", where: "GTEC, Kannur" },
      { when: "Dec 2025", title: "MERN certification", where: "6 months complete" },
      { when: "Feb 2026", title: "Internship complete", where: "Web Developer Intern, 8 months" },
      { when: "Now", title: "Open to junior roles", where: "Ready for the next chapter", now: true },
    ],
  },

  effort: "The effort so far",
};