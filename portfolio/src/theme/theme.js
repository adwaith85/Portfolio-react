/*
  Edit colors/fonts here only.
  This module is the single source of truth for the palette, fonts, weights,
  section-heading size and card radii. All other files read CSS variables.
*/
import { useEffect, useState } from "react";

/* Base colors. Every other shade below is mixed from these values. */
const BASE = {
  sage: "#C2CEBE",
  claret: "#4B1B27",
  pine: "#204B39",
  black: "#000000",
  red: "#d61a29",
  white: "#f2efeb",
  cursor: "#ffffff",
  cursorStroke: "#090909",
  build: "#4c8dff",
  heroBlue: "#326eff",
  linkedin: "#0a66c2",
  facebook: "#1877f2",
  instagram: "#e1306c",
  aboutWordHover: "#ff6f79",
};

const fonts = {
  display: '"Anton", Impact, sans-serif',
  body: '"Manrope", sans-serif',
  script: '"Caveat", cursive',
  sans: '"Manrope", sans-serif',
};

const weights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  smallLight: 600,
  bodyLight: 500,
  boldLight: 700,
};

const radius = {
  cardRound: "20px",
  cardLight: "20px",
  cardDark: "20px",
  media: "6px",
  contact: "26px",
};

const sectionHeading = {
  desktop: "min(5.2vw, 9.5svh)",
  mobile: "clamp(2.4rem, 11vw, 3.6rem)",
  breakpoint: "1023px",
};

const modeSpacing = {
  eduBoost: { light: "2px", dark: "2px" },
};

const STORAGE_KEY = "theme";

/* ---------- mixing math ---------- */
const rgbOfHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const channelMix = (a, b, factors) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * factors[i]));
const hexOf = (c) => `#${c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
const channels = (value) => {
  if (Array.isArray(value)) return value.join(" ");
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (text.startsWith("#")) return rgbOfHex(text).join(" ");
  const nums = text.match(/[\d.]+/g) || [];
  return nums.slice(0, 3).map((n) => Math.round(Number(n))).join(" ");
};
const alpha = (value, amount) => `rgb(${channels(value)} / ${amount})`;

const S = rgbOfHex(BASE.sage);
const C = rgbOfHex(BASE.claret);
const P = rgbOfHex(BASE.pine);
const K = rgbOfHex(BASE.black);
const R = rgbOfHex(BASE.red);
const W = rgbOfHex(BASE.white);
const WHITE = rgbOfHex(BASE.cursor);
const B = rgbOfHex(BASE.build);
const HERO_BLUE = rgbOfHex(BASE.heroBlue);
const BUILD_GLOW = hexOf(channelMix(B, K, [0.658, 0.78, 1]));

/* About's reveal states keep their dark alphas and become solid claret in light. */
const aboutTokens = (mode) =>
  mode === "dark"
    ? {
        aboutTextDim: alpha(W, 0.35),
        aboutBioDim: alpha(W, 0.62),
        aboutBioBase: alpha(W, 0.86),
        aboutTextLit: alpha(W, 0.94),
        aboutBioLit: alpha(W, 0.98),
        aboutSubLit: alpha(W, 0.96),
        aboutHeadLit: hexOf(WHITE),
        aboutWordHover: BASE.aboutWordHover,
        aboutShineRgb: channels(WHITE),
      }
    : {
        aboutTextDim: alpha(C, 0.4),
        aboutBioDim: hexOf(C),
        aboutBioBase: hexOf(C),
        aboutTextLit: hexOf(C),
        aboutBioLit: hexOf(C),
        aboutSubLit: hexOf(C),
        aboutHeadLit: hexOf(C),
        aboutWordHover: hexOf(C),
        aboutShineRgb: channels(P),
      };

/* Twelve claret extrusion steps, derived from the base accent. */
const extrusions = (mode) =>
  Array.from({ length: 12 }, (_, i) => {
    const t = mode === "dark" ? 0.43 + i * 0.042 : 0.06 + i * 0.052;
    return hexOf(mix(mode === "dark" ? R : C, K, t));
  });

/* Powder palette stops; weights stay in photoDissolve.js. */
const dissolveStops = (mode) => {
  if (mode === "dark") {
    return [
      hexOf(WHITE),
      hexOf(channelMix(R, WHITE, [0.268, 0.013, 0])),
      hexOf(channelMix(R, K, [0.271, 0.5, 0.415])),
      hexOf(channelMix(R, K, [0.724, 0.692, 0.756])),
      hexOf(channelMix(R, K, [0.874, 0.808, 0.805])),
      hexOf(mix(K, WHITE, 0.043)),
      hexOf(channelMix(R, WHITE, [1, 0.389, 0.383])),
      hexOf(channelMix(R, WHITE, [0.954, 0.678, 0.68])),
      hexOf(mix(K, WHITE, 0.71)),
      hexOf(mix(K, WHITE, 0.42)),
    ];
  }
  return [
    hexOf(mix(S, WHITE, 0.18)),
    hexOf(C),
    hexOf(mix(C, K, 0.18)),
    hexOf(P),
    hexOf(mix(P, K, 0.32)),
    hexOf(mix(S, C, 0.34)),
    hexOf(mix(C, S, 0.34)),
    hexOf(mix(C, S, 0.6)),
    hexOf(mix(S, C, 0.24)),
    hexOf(mix(S, C, 0.42)),
  ];
};

const brands = (mode) => ({
  github: mode === "dark" ? BASE.white : BASE.black,
  twitter: mode === "dark" ? BASE.white : BASE.black,
  linkedin: BASE.linkedin,
  facebook: BASE.facebook,
  instagram: BASE.instagram,
  email: mode === "dark" ? BASE.red : BASE.claret,
});

const brandTokens = (mode) => ({
  ...brands(mode),
  build: BASE.build,
  buildGlow: BUILD_GLOW,
  cursor: BASE.cursor,
  cursorStroke: BASE.cursorStroke,
});

const sharedTokens = () => ({
  heroGlowBlue: alpha(HERO_BLUE, 0.11),
  heroMobileScrim: alpha(BASE.cursorStroke, 0.8),
  timelineDotSize: "10px",
  timelineLineWidth: "3px",
  aboutSectionGap: "5svh",
  aboutHeadGap: "1px",
  skArrowFlatOpacity: 1,
  skLiveFlatOpacity: 1,
  contactShimmerFlatOpacity: 0.5,
});

/* ---------- semantic tokens ---------- */
const lightTokens = () => {
  const t = {
    bg: hexOf(S),
    panel: hexOf(mix(S, WHITE, 0.3)),
    panelSunken: hexOf(mix(S, C, 0.06)),
    ink: hexOf(C),
    muted: hexOf(mix(C, S, 0.85)),
    line: hexOf(P),
    pine: hexOf(P),
    onPine: hexOf(S),
    photoGlow: hexOf(P),
    onImage: BASE.cursor,
    imageScrim: "linear-gradient(to top, rgb(0 0 0 / 0.85), rgb(0 0 0 / 0.5) 50%, transparent)",
    imageTextShadow: "0 1px 6px rgb(0 0 0 / 0.85)",
    pineGlow: alpha(P, 0.35),
    rowLine: hexOf(P),
    frameFill: hexOf(mix(S, P, 0.08)),
    frameEdge: hexOf(P),
    speckDensity: 0.6,
    speckOpacity: 0.6,
    speckFadeStart: 0.45,
    speckFadeSpan: 0.25,
    accent: hexOf(C),
    accentBright: hexOf(mix(C, S, 0.16)),
    accentHover: hexOf(mix(C, S, 0.24)),
    accentSoft: hexOf(mix(C, S, 0.4)),
    accentPale: hexOf(mix(C, S, 0.62)),
    accentDeep: hexOf(mix(C, K, 0.3)),
    detail: hexOf(P),
    deepFill: hexOf(mix(P, C, 0.22)),
    onAccent: hexOf(S),
    hoverInk: hexOf(C),
    glass: hexOf(mix(S, WHITE, 0.1)),
    glassHot: hexOf(mix(C, S, 0.9)),
    overlay: hexOf(mix(S, C, 0.05)),
    cardFill: hexOf(mix(S, C, 0.07)),
    cardEdge: hexOf(P),
    cardFillHot: hexOf(C),
    cardEdgeHot: hexOf(P),
    tipFill: hexOf(mix(S, C, 0.12)),
    shadow: hexOf(mix(C, K, 0.3)),
    silFill: hexOf(mix(S, C, 0.34)),
    silStroke: hexOf(mix(S, C, 0.5)),
    silText: hexOf(mix(S, C, 0.62)),
    silText2: hexOf(mix(S, C, 0.72)),
    ghost1: hexOf(mix(C, K, 0.06)),
    ghost2: hexOf(mix(C, K, 0.3)),
    ghost3: hexOf(mix(C, K, 0.62)),
    ghost4: hexOf(mix(C, K, 0.88)),
    fg: hexOf(C),
    ...sharedTokens(),
    ...aboutTokens("light"),
    ...brandTokens("light"),
  };
  extrusions("light").forEach((color, i) => { t[`extrude${i + 1}`] = color; });
  dissolveStops("light").forEach((color, i) => { t[`dissolve${i}`] = color; });
  return t;
};

const darkTokens = () => {
  const t = {
    bg: hexOf(K),
    panel: hexOf(mix(K, WHITE, 0.063)),
    panelSunken: hexOf(mix(K, WHITE, 0.043)),
    ink: hexOf(W),
    muted: hexOf(mix(W, K, 0.34)),
    line: hexOf(channelMix(K, WHITE, [0.17, 0.14, 0.14])),
    pine: hexOf(R),
    onPine: hexOf(W),
    photoGlow: hexOf(R),
    onImage: BASE.cursor,
    imageScrim: "linear-gradient(to top, rgb(0 0 0 / 0.85), rgb(0 0 0 / 0.5) 50%, transparent)",
    imageTextShadow: "0 1px 6px rgb(0 0 0 / 0.85)",
    pineGlow: alpha(R, 0.42),
    rowLine: alpha(WHITE, 0.02),
    frameFill: alpha(WHITE, 0.05),
    frameEdge: alpha(WHITE, 0.12),
    speckDensity: 1,
    speckOpacity: 1,
    speckFadeStart: 0.65,
    speckFadeSpan: 0.25,
    accent: hexOf(R),
    accentBright: hexOf(channelMix(R, WHITE, [1, 0.1, 0.13])),
    accentHover: hexOf(channelMix(R, WHITE, [1, 0.275, 0.276])),
    accentSoft: hexOf(channelMix(R, WHITE, [1, 0.419, 0.421])),
    accentPale: hexOf(channelMix(R, WHITE, [1, 0.672, 0.668])),
    accentDeep: hexOf(channelMix(R, K, [0.346, 0.615, 0.512])),
    detail: hexOf(W),
    deepFill: hexOf(channelMix(R, K, [0.346, 0.615, 0.512])),
    onAccent: hexOf(W),
    hoverInk: hexOf(channelMix(W, WHITE, [0.46, 0.375, 0.3])),
    glass: hexOf(mix(K, WHITE, 0.05)),
    glassHot: hexOf(mix(R, K, 0.6)),
    overlay: hexOf(K),
    cardFill: hexOf(mix(K, WHITE, 0.071)),
    cardEdge: alpha(WHITE, 0.1),
    cardFillHot: hexOf(channelMix(R, K, [0.804, 0.615, 0.634])),
    cardEdgeHot: alpha(R, 0.45),
    tipFill: hexOf(mix(K, WHITE, 0.067)),
    shadow: hexOf(K),
    silFill: hexOf(channelMix(K, WHITE, [0.075, 0.063, 0.063])),
    silStroke: hexOf(channelMix(K, WHITE, [0.165, 0.133, 0.133])),
    silText: hexOf(channelMix(K, WHITE, [0.29, 0.251, 0.251])),
    silText2: hexOf(channelMix(K, WHITE, [0.227, 0.196, 0.196])),
    fg: hexOf(WHITE),
    ...sharedTokens(),
    ...aboutTokens("dark"),
    ...brandTokens("dark"),
  };
  const stops = [0.085, 0.335, 0.73, 0.965];
  stops.forEach((amount, i) => {
    t[`ghost${i + 1}`] = hexOf(channelMix(R, K, [amount, amount, amount]));
  });
  extrusions("dark").forEach((color, i) => { t[`extrude${i + 1}`] = color; });
  dissolveStops("dark").forEach((color, i) => { t[`dissolve${i}`] = color; });
  return t;
};

const kebab = (name) =>
  String(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .toLowerCase();

const cssFor = (mode) => {
  const tokens = mode === "dark" ? darkTokens() : lightTokens();
  const decls = [
    `color-scheme: ${mode}`,
    `--t-font-body: ${fonts.body}`,
    `--t-font-display: ${fonts.display}`,
    `--t-font-script: ${fonts.script}`,
    `--t-font-sans: ${fonts.sans}`,
    ...Object.entries(weights).map(([name, value]) => `--t-fw-${name}: ${value}`),
    `--fw-small-light: ${weights.smallLight}`,
    `--fw-body-light: ${weights.bodyLight}`,
    `--fw-bold-light: ${weights.boldLight}`,
    `--edu-boost: ${modeSpacing.eduBoost[mode]}`,
    `--fs-section-heading: ${sectionHeading.desktop}`,
    `--radius-card: ${mode === "dark" ? radius.cardDark : radius.cardLight}`,
    `--radius-card-round: ${radius.cardRound}`,
    `--radius-media: ${radius.media}`,
    `--radius-contact: ${radius.contact}`,
    `--cursor-rgb: ${channels(BASE.cursor)}`,
    `--cursor-stroke-rgb: ${channels(BASE.cursorStroke)}`,
    `--build-rgb: ${channels(BASE.build)}`,
    `--build-glow-rgb: ${channels(BUILD_GLOW)}`,
    `--fg-rgb: ${channels(tokens.fg)}`,
    `--shadow-rgb: ${channels(tokens.shadow)}`,
    `--detail-rgb: ${channels(tokens.detail)}`,
    `--bg-rgb: ${channels(tokens.bg)}`,
    `--line-rgb: ${mode === "dark" ? "255 255 255" : channels(tokens.line)}`,
    `--pine-rgb: ${channels(tokens.pine)}`,
  ];
  Object.entries(tokens).forEach(([name, value]) => {
    decls.push(`--t-${kebab(name)}: ${value}`);
    decls.push(`--t-${kebab(name)}-rgb: ${channels(value)}`);
  });
  decls.push(
    `--about-text-dim: ${tokens.aboutTextDim}`,
    `--about-bio-dim: ${tokens.aboutBioDim}`,
    `--about-bio-base: ${tokens.aboutBioBase}`,
    `--about-text-lit: ${tokens.aboutTextLit}`,
    `--about-bio-lit: ${tokens.aboutBioLit}`,
    `--about-sub-lit: ${tokens.aboutSubLit}`,
    `--about-head-lit: ${tokens.aboutHeadLit}`,
    `--about-word-hover: ${tokens.aboutWordHover}`,
    `--about-shine-rgb: ${tokens.aboutShineRgb}`
  );
  return `:root[data-theme="${mode}"]{${decls.join(";")}}`;
};

export const themeCss =
  cssFor("light") +
  cssFor("dark") +
  `@media (max-width: ${sectionHeading.breakpoint}){` +
  `:root[data-theme="light"],:root[data-theme="dark"]{--fs-section-heading:${sectionHeading.mobile}}` +
  `}`;

/* Injected synchronously at import time so the first paint already has tokens. */
if (typeof document !== "undefined" && !document.getElementById("theme-vars")) {
  const style = document.createElement("style");
  style.id = "theme-vars";
  style.textContent = themeCss;
  document.head.appendChild(style);
}

export function getTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(mode, originElement = null) {
  const next = mode === "dark" ? "dark" : "light";
  const root = document.documentElement;
  root.dataset.theme = next;
  const bg = getComputedStyle(root).getPropertyValue("--t-bg").trim() || BASE.sage;
  root.style.backgroundColor = bg;
  if (document.body) document.body.style.backgroundColor = bg;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage may be unavailable (private mode / blocked cookies) */
  }
  window.dispatchEvent(
    new CustomEvent("themechange", { detail: { theme: next, origin: originElement } })
  );
  return next;
}

export function useTheme() {
  const [theme, setCurrent] = useState(getTheme);
  useEffect(() => {
    const onChange = (event) => setCurrent(event.detail?.theme || getTheme());
    window.addEventListener("themechange", onChange);
    return () => window.removeEventListener("themechange", onChange);
  }, []);
  return theme;
}

/* Live CSS variable lookup for canvas, GSAP and SVG code. */
export function themeColor(name) {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--t-${kebab(name)}`)
    .trim();
}

export function themeRGB(name) {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--t-${kebab(name)}-rgb`)
    .trim();
}

/* First paint: apply the stored theme as soon as the variables exist. */
if (typeof document !== "undefined") setTheme(getTheme());
