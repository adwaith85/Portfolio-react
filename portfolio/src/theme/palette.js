/*
  Colour plan for the sections that still scope their own CSS variables.
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
  experience: {
    name: "Carbon",
    bg: "#232726",
    main: "#d61a29",
    gold: "#b08d4d",
    deep: "#21402d",
    ink: "#efe8da",
    tint: "rgba(45,53,54,0.55)",
    tintHot: "rgba(196,160,104,0.16)",
  },
  contact: {
    name: "Jet Black",
    bg: "#0a0a0c",
    main: "#d61a29",
    gold: "#f2efeb",
    deep: "#8c0a14",
    ink: "#f2efeb",
    tint: "rgba(92,18,32,0.34)",
    tintHot: "rgba(214,26,41,0.16)",
  },
  // Jet Black, closing the loop with the hero. Red, black and white only.
  footer: {
    name: "Jet Black",
    bg: "#0a0a0c",
    main: "#d61a29",
    gold: "#f2efeb",
    deep: "#8c0a14",
    ink: "#f2efeb",
    tint: "rgba(92,18,32,0.34)",
    tintHot: "rgba(214,26,41,0.16)",
  },
};

export const rgbOf = (h) => hex(h);

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => c.join(" ");
const rgba = (c, a) => `rgba(${c.join(",")},${a})`;

/* One section's CSS variables, rendered locally by the sections that opt in. */
const envRule = (id, e) => {
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
};

/* Scoped CSS variables for the sections that opt in. */
export const envCss = (id) => (ENVS[id] ? envRule(id, ENVS[id]) : "");
