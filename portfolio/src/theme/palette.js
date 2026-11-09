/*
  Colour plan for the whole portfolio, the single source of truth.
  - The wall (components/ui/Wall.jsx) reads `bg` for each section.
  - Content reads the rest through CSS variables (see ENV_CSS).
  The reasoning is in src/README.md.

  bg    : the plain wall colour behind that section (from the dark fabric palette)
  main  : the accent that carries about 70% of the colour in content (headlines, numbers, glows)
  gold  : the 10% detail colour (borders, rules, small icons)
  deep  : the 10% secondary colour (soft fills, hover washes)
  ink   : the 10% text colour
  tint  : the glass tint of the cards (rgba)
  tintHot : the glass tint of the highlighted card
*/
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export const ENVS = {
  // Jet Black. Red 70, old gold 10, deep green 10, white 10.
  hero: {
    name: "Jet Black",
    bg: "#0a0a0c",
    main: "#d61a29",
    gold: "#b08d4d",
    deep: "#21402d",
    ink: "#f2efeb",
    tint: "rgba(92,18,32,0.34)",
    tintHot: "rgba(176,141,77,0.16)",
  },
  // the thin stack strip is a bridge: it keeps the hero colours and has no wall colour of its own
  stack: {
    name: "Bridge",
    bg: "#0a0a0c",
    main: "#d61a29",
    gold: "#b08d4d",
    deep: "#21402d",
    ink: "#f2efeb",
    tint: "rgba(92,18,32,0.34)",
    tintHot: "rgba(176,141,77,0.16)",
  },
  // Midnight. Burgundy 70, camel 10, chocolate 10, cream 10.
  "what-i-do": {
    name: "Midnight",
    bg: "#0f1524",
    main: "#b8344a",
    gold: "#c4a068",
    deep: "#5a3a2c",
    ink: "#efe8da",
    tint: "rgba(96,20,42,0.38)",
    tintHot: "rgba(196,160,104,0.18)",
  },
  // Obsidian. Eucalyptus 70, mist 10, moss 10, plaster 10, soot for the glass.
  projects: {
    name: "Obsidian",
    bg: "#0b0b10",
    main: "#98aa9d",
    gold: "#b3c9d6",
    deep: "#697c70",
    ink: "#f2efe2",
    tint: "rgba(45,53,54,0.62)",
    tintHot: "rgba(179,201,214,0.14)",
  },
  // later sections, ready for the next steps
  about: {
    name: "Charcoal",
    bg: "#211a1d",
    main: "#c9a25a",
    gold: "#efe8da",
    deep: "#5a3a2c",
    ink: "#efe8da",
    tint: "rgba(120,80,40,0.32)",
    tintHot: "rgba(239,232,218,0.14)",
  },
  education: {
    name: "Slate",
    bg: "#2f3544",
    main: "#b3c9d6",
    gold: "#98aa9d",
    deep: "#697c70",
    ink: "#f2efe2",
    tint: "rgba(60,72,92,0.5)",
    tintHot: "rgba(152,170,157,0.16)",
  },
  experience: {
    name: "Carbon",
    bg: "#232726",
    main: "#98aa9d",
    gold: "#c4a068",
    deep: "#2d3536",
    ink: "#efe8da",
    tint: "rgba(45,53,54,0.55)",
    tintHot: "rgba(196,160,104,0.16)",
  },
  contact: {
    name: "Moss Black",
    bg: "#1a201d",
    main: "#d61a29",
    gold: "#b08d4d",
    deep: "#21402d",
    ink: "#f2efeb",
    tint: "rgba(92,18,32,0.34)",
    tintHot: "rgba(176,141,77,0.16)",
  },
  // Cloud Grey: the one light surface, so text turns dark here
  footer: {
    name: "Cloud Grey",
    bg: "#8b8c90",
    main: "#8c1422",
    gold: "#6b5224",
    deep: "#3a3b3f",
    ink: "#151517",
    tint: "rgba(255,255,255,0.3)",
    tintHot: "rgba(255,255,255,0.4)",
  },
};

export const rgbOf = (h) => hex(h);

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => c.join(" ");
const rgba = (c, a) => `rgba(${c.join(",")},${a})`;

/* CSS variables per section. Tailwind classes such as text-red, text-gold, bg-deep,
   text-ink and border-line read these, so each section recolours itself without
   changing its markup. */
export const ENV_CSS = Object.entries(ENVS)
  .map(([id, e]) => {
    const main = hex(e.main);
    const gold = hex(e.gold);
    const deep = hex(e.deep);
    const ink = hex(e.ink);
    const muted = mix(ink, hex(e.bg), 0.42);
    return (
      `[data-env="${id}"]{` +
      `--env-rgb:${rgb(main)};` +
      `--env-gold-rgb:${rgb(gold)};` +
      `--env-deep-rgb:${rgb(deep)};` +
      `--color-red:${e.main};` +
      `--color-gold:${e.gold};` +
      `--color-deep:${e.deep};` +
      `--color-ink:${e.ink};` +
      `--color-muted:rgb(${rgb(muted)});` +
      `--color-line:${rgba(gold, 0.24)};` +
      `--env-tint:${e.tint};` +
      `--env-tint-hot:${e.tintHot};` +
      `--env-edge:${rgba(gold, 0.3)};` +
      `--env-edge-hot:${rgba(main, 0.55)};` +
      `color:${e.ink};` +
      `}`
    );
  })
  .join("\n");
