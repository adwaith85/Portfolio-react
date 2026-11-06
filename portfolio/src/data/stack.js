// Where the logos come from. Devicon is a free icon set served over a CDN.
// To host them yourself, download the SVGs into public/logos and edit logoUrl().
const LOGO_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

export const logoUrl = (slug) => `${LOGO_BASE}/${slug}/${slug}-original.svg`;

/*
  name  : text shown next to the logo
  slug  : devicon icon name. Leave it out to get a letter badge instead
  abbr  : letters for the badge
  dark  : true for logos that are black, so they stay white on hover
  Delete any line for something you have not actually used.
*/
export const stack = [
  { name: "React", slug: "react" },
  { name: "Node.js", slug: "nodejs" },
  { name: "Express.js", slug: "express", dark: true },
  { name: "MongoDB", slug: "mongodb" },
  { name: "Mongoose", abbr: "Mg" },
  { name: "JavaScript", slug: "javascript" },
  { name: "TypeScript", slug: "typescript" },
  { name: "Next.js", slug: "nextjs", dark: true },
  { name: "React Native", slug: "react" },
  { name: "Flutter", slug: "flutter" },
  { name: "Dart", slug: "dart" },
  { name: "Redux", slug: "redux" },
  { name: "React Router", abbr: "RR" },
  { name: "Axios", abbr: "Ax" },
  { name: "Socket.IO", slug: "socketio", dark: true },
  { name: "JWT", abbr: "JWT" },
  { name: "Tailwind CSS", slug: "tailwindcss" },
  { name: "Bootstrap", slug: "bootstrap" },
  { name: "HTML5", slug: "html5" },
  { name: "CSS3", slug: "css3" },
  { name: "MySQL", slug: "mysql" },
  { name: "Git", slug: "git" },
  { name: "Vite", slug: "vitejs" },
  // added in Step 5 (used by the project cards and What I Do)
  { name: "AWS", slug: "amazonwebservices", abbr: "AWS", dark: true },
  { name: "Docker", slug: "docker" },
  { name: "Postman", slug: "postman" },
  { name: "Android Studio", slug: "androidstudio" },
];