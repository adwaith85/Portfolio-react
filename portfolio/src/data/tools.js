/*
  The tools strip, grouped by where they sit in the workflow.
  Same item shape as stack.js:
    name  : text shown next to the logo
    slug  : devicon icon name. Leave it out to get a letter badge instead
    abbr  : letters for the badge
    dark  : true for logos that are black, so they stay white on hover

  Items with a "not confirmed" comment are ones you may not have actually
  used. Delete the line if you have not, so the strip stays honest.
  Items already in your real-tools list are left uncommented.
*/
export const toolGroups = [
  {
    label: "FRONTEND",
    items: [
      { name: "VS Code", slug: "vscode" },
      { name: "Vite", slug: "vitejs" },
      // not confirmed: npm comes with Node, but you may not work with it directly
      { name: "npm", slug: "npm" },
      { name: "Android Studio", slug: "androidstudio" },
      { name: "Flutter SDK", slug: "flutter" },
      { name: "Expo", slug: "expo", dark: true },
      // not confirmed: part of React development, but not in your tools list
      { name: "React DevTools", abbr: "RD" },
      // not confirmed: design work could have been done elsewhere
      { name: "Figma", slug: "figma" },
    ],
  },
  {
    label: "BACKEND",
    items: [
      { name: "Node.js", slug: "nodejs" },
      // not confirmed: a convenience tool, not something you listed
      { name: "Nodemon", slug: "nodemon" },
      { name: "Postman", slug: "postman" },
      // not confirmed: a Postman alternative you may not have used
      { name: "Thunder Client", abbr: "TC" },
      // not confirmed: a MongoDB GUI, optional next to the database itself
      { name: "MongoDB Compass", abbr: "MC" },
      // not confirmed: a MySQL GUI, optional next to the database itself
      { name: "MySQL Workbench", abbr: "MW" },
    ],
  },
  {
    label: "RUNNING",
    items: [
      { name: "Vite dev server", slug: "vitejs" },
      { name: "Expo Go", slug: "expo", dark: true },
      // not confirmed: only used if you ran the Android emulator
      { name: "Android Emulator", slug: "android" },
      // not confirmed: browser tooling, not in your listed tools
      { name: "Chrome DevTools", slug: "chrome" },
      { name: "Docker", slug: "docker" },
      { name: "Git", slug: "git" },
      { name: "GitHub", slug: "github", dark: true },
    ],
  },
  {
    label: "DEPLOYMENT",
    items: [
      // AWS is real; these are the specific services the projects use
      { name: "AWS EC2", slug: "amazonwebservices", abbr: "EC2", dark: true },
      { name: "AWS S3", slug: "amazonwebservices", abbr: "S3", dark: true },
      {
        name: "AWS Route 53",
        slug: "amazonwebservices",
        abbr: "R53",
        dark: true,
      },
      // not confirmed: you deployed, but may not have touched Nginx directly
      { name: "Nginx", slug: "nginx" },
      // not confirmed: process manager, not in your listed tools
      { name: "PM2", slug: "pm2" },
      { name: "Docker", slug: "docker" },
      // not confirmed: you used Git/GitHub, but not necessarily Actions
      { name: "GitHub Actions", slug: "githubactions", dark: true },
      // not confirmed: you may have used AWS instead of these hosts
      { name: "Vercel", slug: "vercel", dark: true },
      // not confirmed
      { name: "Netlify", slug: "netlify" },
      // not confirmed
      { name: "Firebase", slug: "firebase" },
      // not confirmed
      { name: "Cloudflare", slug: "cloudflare" },
    ],
  },
  {
    label: "TESTING",
    items: [
      { name: "Postman", slug: "postman" },
      // not confirmed: you tested APIs, but may not have written Jest tests
      { name: "Jest", abbr: "Jest" },
      // not confirmed
      { name: "Vitest", slug: "vitest" },
      // not confirmed
      { name: "React Testing Library", abbr: "RTL" },
      // not confirmed
      { name: "Cypress", abbr: "Cy" },
      // not confirmed
      { name: "Chrome DevTools", slug: "chrome" },
      // not confirmed
      { name: "Lighthouse", abbr: "LH" },
    ],
  },
  {
    label: "PRODUCTION",
    items: [
      // not confirmed: listed for deployment, not necessarily production work
      { name: "Nginx", slug: "nginx" },
      // not confirmed
      { name: "PM2", slug: "pm2" },
      // not confirmed
      { name: "Cloudflare", slug: "cloudflare" },
      // not confirmed
      { name: "Sentry", slug: "sentry", dark: true },
      // not confirmed: AWS is real, CloudWatch specifically is not
      { name: "AWS CloudWatch", slug: "amazonwebservices", abbr: "CW", dark: true },
      // not confirmed: HTTPS is standard, but you may not manage certificates
      { name: "Let's Encrypt (SSL)", abbr: "SSL" },
      // not confirmed
      { name: "Google Analytics", slug: "google" },
    ],
  },
];
