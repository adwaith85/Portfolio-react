import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content } from "../../data/content";
import {
  createViewportReveal,
  cursorIntro,
  cursorOutro,
  cursorType,
} from "../../engine/viewport";
import useAgentsEnabled from "../../engine/useAgentsEnabled";
import {
  Words,
  makeOverlay,
  clearOverlays,
  dragBox,
  typeWords,
} from "../../engine/swarmBuild";
import { swarm } from "../cursors/swarmApi";
import { themeRGB, themeColor } from "../../theme/theme";
import { lockScroll, unlockScroll } from "../../hooks/useSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   FORM ENDPOINT: ADD YOUR URL HERE LATER
   Paste the endpoint URL from your form service between the quotes.
   Examples: "https://formspree.io/f/xxxxxxx"
             "https://api.web3forms.com/submit"
   ============================================================ */
const FORM_ENDPOINT = "";

/* Some services need an extra field (for example Web3Forms needs an access key).
   Add it here if your service requires it, otherwise leave it empty.
   Example: { access_key: "YOUR_KEY" } */
const FORM_EXTRA_FIELDS = {};

const ROW_MQ = "(min-width: 1024px), (orientation: landscape) and (min-width: 640px) and (max-height: 560px)";
const STACK_MQ = "(max-width: 1023.98px) and (not ((orientation: landscape) and (min-width: 640px) and (max-height: 560px)))";
const RECT_ERASE = { x: 0.503, y: 0.298, w: 0.472, h: 0.262 }; // sketch rectangle region inside the 800x450 frame (rect is x .51-.9625, y .307-.549)

const FRAME_FILES = import.meta.glob("../../assets/contact-frames/*.webp", { eager: true, query: "?url", import: "default" });
const FRAME_URLS = Object.keys(FRAME_FILES).sort().map((k) => FRAME_FILES[k]);
const FRAME_COUNT = FRAME_URLS.length;          // 190
const FRAME_W = 800, FRAME_H = 450;
const FRAME_BODY_END = 0.88;                    // scroll progress at which the last frame is shown; the rest is a short hold
const FORM_IN = 1.2;                            // seconds, automatic form grow-in
const RECT_CX = 0.7375; // centre x of the sketch rectangle inside the frame (0..1)
const RECT_CY = 0.428;  // centre y of the sketch rectangle inside the frame (0..1)
const WHITE_POINT = 226, BLACK_POINT = 50, GAMMA = 0.9;
const ALPHA_LUT = (() => {
  const t = new Uint8ClampedArray(256);
  for (let l = 0; l < 256; l += 1) {
    const v = Math.min(1, Math.max(0, (WHITE_POINT - l) / (WHITE_POINT - BLACK_POINT)));
    t[l] = Math.round(255 * Math.pow(v, GAMMA));
  }
  return t;
})();

/* Disjoint cursor leases: heading [0,1]. */
const AGENTS = [0, 1];
const OUTRO = 0.35;

/* ---------- small helpers ---------- */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const validate = ({ name, email, message }) => {
  const errors = {};
  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 80) errors.name = "Name must be 80 characters or fewer.";

  if (!email) errors.email = "Please enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";

  if (!message) errors.message = "Please write a short message.";
  else if (message.length > 2000)
    errors.message = "Message must be 2000 characters or fewer.";

  return errors;
};

const vanishField = (el, text) => {
  const ghost = el.parentElement.querySelector(".contact-ghost");
  ghost.textContent = "";
  text.slice(0, 240).split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      ghost.appendChild(document.createTextNode(part));
      return;
    }
    const word = document.createElement("span");
    word.style.display = "inline-block";
    word.style.whiteSpace = "nowrap";
    [...part].forEach((ch) => {
      const letter = document.createElement("span");
      letter.style.display = "inline-block";
      letter.textContent = ch;
      word.appendChild(letter);
    });
    ghost.appendChild(word);
  });
  el.value = "";
  el.classList.add("is-vanishing");
  return gsap.to(ghost.querySelectorAll("span span"), {
    opacity: 0,
    y: () => gsap.utils.random(-26, -10),
    x: () => gsap.utils.random(-10, 10),
    rotation: () => gsap.utils.random(-14, 14),
    scale: 0.7,
    filter: "blur(6px)",
    duration: 0.55,
    ease: "power2.out",
    stagger: { amount: 0.3, from: "random" },
    onComplete: () => {
      ghost.textContent = "";
      el.classList.remove("is-vanishing");
    },
  });
};

/* Cursor build: heading. Cursors leave at the end. */
function buildContact(host) {
  const tl = gsap.timeline();
  const q = (selector) => host.querySelector(selector);
  const [H1, H2] = AGENTS;

  cursorIntro(tl, AGENTS, 0);

  const ovH1 = makeOverlay(host);
  const ovH2 = makeOverlay(host);

  const label = q("[data-contact-label]");
  const h1 = q("[data-contact-h1]");
  const h2 = q("[data-contact-h2]");

  let t = dragBox(tl, ovH1, H1, label, host, 0.04, {
    tag: "p.label",
    dur: 0.1,
    pad: 2,
  });
  t = typeWords(tl, label, H1, t, 0.014);

  let t1 = dragBox(tl, ovH2, H2, h1, host, 0.1, {
    tag: "h3.headline",
    dur: 0.12,
    pad: 3,
  });
  t1 = typeWords(tl, h1, H2, t1, 0.015);

  const t2 = cursorType(tl, h2, H1, {
    at: Math.max(0.18, t1 - 0.03),
    duration: 0.38,
    travel: 0.14,
    offset: { x: 0.5, y: 0.6 },
  });

  const end = Math.max(t, t1, t2) + 0.05 + OUTRO;
  cursorOutro(tl, AGENTS, { at: end, duration: 0.25 });
  tl.add(() => AGENTS.forEach((i) => swarm.hide(i)), end + 0.3);

  return tl;
}

const paintFrame = (canvas, img, ink, erase) => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  ctx.drawImage(img, 0, 0, FRAME_W, FRAME_H);
  const data = ctx.getImageData(0, 0, FRAME_W, FRAME_H);
  const px = data.data;
  const [r, g, b] = ink;
  for (let i = 0; i < px.length; i += 4) {
    px[i + 3] = ALPHA_LUT[px[i]];
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
  if (erase) ctx.clearRect(FRAME_W * RECT_ERASE.x, FRAME_H * RECT_ERASE.y, FRAME_W * RECT_ERASE.w, FRAME_H * RECT_ERASE.h);
};

const CONTACT_STYLE = `
#contact-stage { container-type: size; display: flex; align-items: center; justify-content: center; }
.contact-scene { position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; }
.contact-frame { position: relative; flex: none; align-self: center; aspect-ratio: 16 / 9; height: min(56.25cqw, 34cqh); }
@media ${STACK_MQ} and (min-height: 800px) { .contact-frame { height: min(56.25cqw, 38cqh); } }
@media ${STACK_MQ} and (max-height: 720px) { .contact-frame { height: min(56.25cqw, 30cqh); } }
.contact-frame canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.contact-form-slot { position: relative; flex: 1 1 0; min-height: 0; max-height: 100%; display: flex; align-items: flex-start; justify-content: center; padding-top: 1.5svh; }
.contact-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  background-color: var(--t-panel);
  background-image: linear-gradient(180deg, rgb(var(--t-ink-rgb) / 0.05), transparent 40%);
  border: 1px solid rgb(var(--t-ink-rgb) / 0.2);
  border-radius: 22px;
  padding: clamp(14px, 2.4svh, 28px) clamp(16px, 2vw, 30px);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 1px 2px rgb(var(--shadow-rgb) / 0.25),
    0 24px 48px -24px rgb(var(--shadow-rgb) / 0.55),
    0 60px 90px -50px rgb(var(--shadow-rgb) / 0.5);
  transform-origin: 50% 50%;
  will-change: transform, opacity;
}
.contact-card::before {
  content: "";
  position: absolute;
  top: 0; left: 14%; right: 14%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--t-accent), transparent);
  opacity: 0.55;
  pointer-events: none;
}
.contact-card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-bottom: clamp(8px, 1.6svh, 16px);
  padding-bottom: clamp(8px, 1.6svh, 14px);
  border-bottom: 1px solid rgb(var(--t-ink-rgb) / 0.12);
  font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase;
}
.contact-card-head b { font-weight: 600; color: var(--t-ink); }
.contact-card-head b::before {
  content: ""; display: inline-block; width: 6px; height: 6px; margin-right: 0.8em;
  border-radius: 50%; background: var(--t-accent); vertical-align: 0.08em;
}
.contact-card-head span { color: rgb(var(--t-ink-rgb) / 0.55); letter-spacing: 0.14em; }
@media (max-height: 700px) { .contact-card-head { display: none; } }
@media ${ROW_MQ} {
  #contact-stage { align-items: center; justify-content: center; }
  .contact-scene {
    --fw: min(72cqw, 177.78cqh);
    --cw: clamp(400px, 30cqw, 620px);
    --gap: clamp(48px, 7cqw, 150px);
    display: flex; flex-direction: row; align-items: center; justify-content: center;
    width: 100%; height: auto;
  }
  .contact-frame { position: relative; flex: none; width: var(--fw); height: auto; aspect-ratio: 16 / 9; align-self: center; inset: auto; }
  .contact-form-slot {
    position: relative; flex: none; left: auto; top: auto; transform: none; padding: 0; display: block;
    width: var(--cw);
    margin-left: calc(var(--fw) * -0.46 + var(--gap));
  }
  .contact-card { max-width: none; width: 100%; }
}
.contact-input { --cf-px: 0.95rem; --cf-pl: 2.7rem; --cf-py: 0.7rem; position: relative; border-radius: 14px; }
.contact-input::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: 0; height: 2px; border-radius: 2px; background: var(--t-accent); transform: scaleX(0); transition: transform 280ms cubic-bezier(.2,.7,.2,1); pointer-events: none; }
.contact-input:focus-within::after { transform: scaleX(1); }
.contact-field {
  width: 100%; box-sizing: border-box;
  min-height: clamp(44px, 5.8svh, 50px);
  padding: var(--cf-py) var(--cf-px) var(--cf-py) var(--cf-pl);
  border-radius: 14px; border: 1px solid rgb(var(--t-ink-rgb) / 0.14);
  background: rgb(var(--t-ink-rgb) / 0.05);
  box-shadow: inset 0 1px 2px rgb(var(--shadow-rgb) / 0.18);
  color: var(--t-ink); font: inherit;
  font-size: clamp(0.92rem, 1vw, 1.05rem); line-height: 1.4;
  outline: none;
  transition: border-color 200ms, background-color 200ms, box-shadow 200ms, color 300ms;
}
.contact-field:focus {
  border-color: var(--t-accent);
  background: rgb(var(--t-ink-rgb) / 0.07);
  box-shadow: 0 0 0 4px rgb(var(--accent-rgb) / 0.16), inset 0 1px 2px rgb(var(--shadow-rgb) / 0.12);
}
.contact-field::placeholder { color: rgb(var(--t-ink-rgb) / 0.42); }
.contact-field:hover { border-color: rgb(var(--t-ink-rgb) / 0.32); }
.contact-field[aria-invalid="true"] { border-color: var(--t-accent-hover); background: rgb(var(--accent-rgb) / 0.06); }
.contact-field[aria-invalid="true"]:focus { box-shadow: 0 0 0 4px rgb(var(--accent-rgb) / 0.22), inset 0 1px 2px rgb(var(--shadow-rgb) / 0.12); }
.contact-field:disabled { opacity: 0.72; cursor: progress; }
.contact-input-icon { position: absolute; left: 0.95rem; top: 50%; transform: translateY(-50%); color: rgb(var(--t-ink-rgb) / 0.45); transition: color 200ms; pointer-events: none; }
.contact-input.is-multi .contact-input-icon { top: calc(var(--cf-py) + 0.7em); transform: none; }
.contact-input:focus-within .contact-input-icon { color: var(--t-accent); }
.contact-count { position: absolute; right: 0.8rem; bottom: 0.45rem; font-size: 0.68rem; letter-spacing: 0.08em; color: rgb(var(--t-ink-rgb) / 0.45); pointer-events: none; opacity: 0; transition: opacity 200ms; }
.contact-input:focus-within .contact-count { opacity: 1; }
.contact-label { display: block; margin-bottom: 0.4rem; line-height: 1.2; font-size: clamp(0.64rem, 1.4svh, 0.74rem); font-weight: var(--t-fw-semibold); letter-spacing: 0.16em; text-transform: uppercase; color: rgb(var(--t-ink-rgb) / 0.7); }
.contact-field:-webkit-autofill { -webkit-text-fill-color: var(--t-ink); box-shadow: 0 0 0 1000px var(--t-panel) inset; caret-color: var(--t-ink); }
.contact-ghost { position: absolute; inset: 0; padding: var(--cf-py) var(--cf-px) var(--cf-py) var(--cf-pl); font: inherit; font-size: clamp(0.92rem, 1vw, 1.05rem); line-height: 1.4; color: var(--t-ink); white-space: pre-wrap; word-break: break-word; overflow: hidden; pointer-events: none; border-radius: 14px; }
.contact-input.is-single .contact-ghost { display: flex; align-items: center; white-space: nowrap; }
.contact-field.is-vanishing { color: transparent; caret-color: transparent; }
.contact-field.is-vanishing::placeholder { color: transparent; }
@media ${STACK_MQ} {
  .contact-card { max-width: 460px; width: 100%; border-radius: 16px; padding: clamp(10px, 1.8svh, 16px) 14px; }
  .contact-card-head { display: none; }
  .contact-input { --cf-py: 0.55rem; border-radius: 12px; }
  .contact-field { min-height: 42px; border-radius: 12px; font-size: 0.9rem; }
  textarea.contact-field { height: clamp(64px, 10svh, 92px); min-height: 0; }
  .contact-label { margin-bottom: 0.25rem; font-size: 0.62rem; }
}
@media (max-height: 560px) {
  .contact-card-head { display: none; }
  .contact-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .contact-field { min-height: 36px; }
  textarea.contact-field { height: 56px; }
}
.contact-send {
  border: 0;
  background: var(--t-ink);
  color: var(--t-bg);
  overflow: hidden;
  box-shadow: 0 10px 24px -12px rgb(var(--t-ink-rgb) / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.14);
  transition: translate 220ms cubic-bezier(.2, .7, .2, 1), scale 180ms cubic-bezier(.2, .7, .2, 1), box-shadow 220ms cubic-bezier(.2, .7, .2, 1);
}
.contact-send-arrow { transition: translate 220ms cubic-bezier(.2, .7, .2, 1); }
@media (hover: hover) {
  .contact-send:hover:not(:disabled) {
    translate: 0 -1px;
    box-shadow: 0 16px 30px -12px rgb(var(--t-ink-rgb) / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.18);
  }
  .contact-send:hover:not(:disabled) .contact-send-arrow { translate: 4px 0; }
}
.contact-send:active:not(:disabled) { translate: 0 0; scale: 0.985; }
.contact-send:focus-visible { outline: 2px solid var(--t-accent-hover); outline-offset: 3px; }
.contact-send:disabled { cursor: progress; }
.contact-status { text-shadow: none; }

/* ---------- section atmosphere ---------- */
#contact { isolation: isolate; }
#contact::before {
  content: "";
  position: absolute;
  inset: -12% -6%;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(58% 52% at 54% 48%, rgb(var(--accent-rgb) / 0.11), rgb(var(--accent-rgb) / 0.035) 44%, transparent 72%);
}
#contact::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgb(var(--fg-rgb) / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--fg-rgb) / 0.05) 1px, transparent 1px);
  background-size: 56px 56px, 56px 56px;
  opacity: 0.42;
  -webkit-mask-image: radial-gradient(ellipse 72% 74% at 50% 52%, rgb(var(--fg-rgb)) 0%, rgb(var(--shadow-rgb) / 0.62) 54%, transparent 84%);
  mask-image: radial-gradient(ellipse 72% 74% at 50% 52%, rgb(var(--fg-rgb)) 0%, rgb(var(--shadow-rgb) / 0.62) 54%, transparent 84%);
}
:root[data-theme="dark"] #contact::after { display: none; }
#contact > [data-contact-inner] { position: relative; z-index: 1; }
#contact .label { font-size: 0.85rem; letter-spacing: 0.14em; }

@media (prefers-reduced-motion: reduce) {
  .contact-field,
  .contact-send { transition: none; }
  .contact-send:hover,
  .contact-send:active { translate: none; scale: none; }
}
`;

export default function Contact() {
  const root = useRef(null);
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const formRef = useRef(null);
  const shapeRef = useRef(null);
  const btnRef = useRef(null);
  const rippleRef = useRef(null);
  const labelRef = useRef(null);
  const iconRef = useRef(null);
  const ringRef = useRef(null);
  const checkRef = useRef(null);
  const statusRef = useRef(null);
  const pointRef = useRef(null);
  const savedRef = useRef(null);
  const sendTlRef = useRef(null);
  const spinRef = useRef(null);
  const holdRef = useRef(null);
  const formShownRef = useRef(false);
  const syncRef = useRef(null);
  const guardHeadingRef = useRef(() => {});
  const headingTlRef = useRef(null);
  const headingOkRef = useRef(false);

  const enabled = useAgentsEnabled();
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("idle");
  const [msgLen, setMsgLen] = useState(0);

  const mountedRef = useRef(true);
  const sendingRef = useRef(false);
  const abortRef = useRef(null);
  const framesRef = useRef([]);
  const wantedRef = useRef(0);
  const paintedRef = useRef({ i: -1, ink: "", erase: false });
  const renderFrameRef = useRef(() => {});

  const section =
    content.sections.find((s) => s.id === "contact") || {
      num: "07",
      label: "CONTACT",
      headline: ["LET'S WORK", "TOGETHER."],
    };

  const clearError = (key) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const renderFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas || !FRAME_COUNT) return;
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
    wantedRef.current = clamped;
    let i = clamped;
    while (i >= 0) {
      const img = framesRef.current[i];
      if (img && img.complete && img.naturalWidth) break;
      i -= 1;
    }
    if (i < 0) return;
    const ink = themeRGB("ink").split(" ").map(Number);
    const inkKey = ink.join(",");
    const erase = formShownRef.current;
    if (paintedRef.current.i === i && paintedRef.current.ink === inkKey && paintedRef.current.erase === erase) return;
    paintFrame(canvas, framesRef.current[i], ink, erase);
    paintedRef.current = { i, ink: inkKey, erase };
  }, []);

  const requestMessage = useCallback(async (payload) => {
    if (!FORM_ENDPOINT) {
      console.warn(
        "Contact form: FORM_ENDPOINT is empty. Preview mode, no email is sent."
      );
      await sleep(1200);
      return { ok: true };
    }

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok && data.success !== false };
    } catch (error) {
      return { ok: false, error };
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const onBtnPointerDown = useCallback((e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    pointRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const playSend = useCallback(() => {
    const shape = shapeRef.current;
    const btn = btnRef.current;
    const ripple = rippleRef.current;
    const label = labelRef.current;
    const icon = iconRef.current;
    const ring = ringRef.current;
    const form = formRef.current;
    if (!shape || !btn || !ripple || !label || !icon || !ring || !form) return Promise.resolve();

    if (sendTlRef.current) sendTlRef.current.kill();
    if (spinRef.current) spinRef.current.kill();
    if (holdRef.current) { holdRef.current.kill(); holdRef.current = null; }
    const w0 = shape.offsetWidth;
    const point = pointRef.current || { x: btn.offsetWidth / 2, y: btn.offsetHeight / 2 };
    pointRef.current = null;

    let resolve;
    const arrived = new Promise((res) => { resolve = res; });
    const tl = gsap.timeline();
    sendTlRef.current = tl;

    tl.to(shape, { scale: 0.94, duration: 0.09, ease: "power2.out" }, 0);
    tl.to(shape, { scale: 1, duration: 0.28, ease: "back.out(3)" }, 0.09);
    tl.fromTo(
      ripple,
      { x: point.x - 20, y: point.y - 20, scale: 0, opacity: 0.45 },
      { scale: 14, opacity: 0, duration: 0.6, ease: "power2.out" },
      0
    );

    const name = form.elements.name;
    const email = form.elements.email;
    const message = form.elements.message;
    const values = [name?.value || "", email?.value || "", message?.value || ""];
    [name, email, message].forEach((el, i) => {
      if (!el) return;
      const text = values[i];
      if (!text) return;
      tl.add(vanishField(el, text), 0.1 + i * 0.12);
    });

    tl.to(label, { opacity: 0, duration: 0.15, ease: "power1.out" }, 0.3);
    tl.to(shape, { width: shape.offsetHeight, duration: 0.38, ease: "power3.inOut" }, 0.34);
    tl.to(icon, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0.6);
    tl.call(() => {
      spinRef.current = gsap.to(ring, { rotation: 360, transformOrigin: "50% 50%", repeat: -1, duration: 0.8, ease: "none" });
    }, [], 0.6);
    tl.call(() => {
      setMsgLen(0);
      setErrors({});
    }, [], 1.25);
    tl.call(resolve, [], 1.3);
    tl.set(shape, { attr: { "data-w0": w0 } });

    return arrived;
  }, []);

  const finishOk = useCallback(() => {
    const shape = shapeRef.current;
    const btn = btnRef.current;
    const label = labelRef.current;
    const icon = iconRef.current;
    const ring = ringRef.current;
    const check = checkRef.current;
    const statusEl = statusRef.current;
    const form = formRef.current;
    if (!shape || !btn || !label || !icon || !ring || !check || !statusEl || !form) return;
    if (spinRef.current) { spinRef.current.kill(); spinRef.current = null; }
    if (holdRef.current) { holdRef.current.kill(); holdRef.current = null; }
    const w0 = Number(shape.getAttribute("data-w0")) || shape.offsetWidth || 180;
    const len = check.getTotalLength ? check.getTotalLength() : 40;
    gsap.killTweensOf([ring, check, btn, shape, label, icon, statusEl]);
    gsap.set(statusEl, { clearProps: "color" });

    const tl = gsap.timeline();
    sendTlRef.current = tl;
    tl.to(ring, { opacity: 0, duration: 0.15, ease: "power1.out" }, 0);
    tl.to(btn, { backgroundColor: themeColor("accent"), duration: 0.25, ease: "power1.out" }, 0);
    tl.set(check, { opacity: 1, strokeDasharray: len, strokeDashoffset: len }, 0.05);
    tl.fromTo(icon, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: "back.out(2)" }, 0.05);
    tl.to(check, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }, 0.08);
    tl.call(() => {
      statusEl.textContent = "Message sent \u2713";
      if (mountedRef.current) setStatus("success");
    }, [], 0.2);
    tl.fromTo(statusEl, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.2);

    tl.add(() => {
      holdRef.current = gsap.delayedCall(1.8, () => {
        if (!mountedRef.current) return;
        const out = gsap.timeline({
          onComplete: () => {
            gsap.set(icon, { opacity: 0, clearProps: "scale" });
            gsap.set(check, { opacity: 0, clearProps: "strokeDasharray,strokeDashoffset" });
            gsap.set(ring, { opacity: 1, clearProps: "rotation" });
            gsap.set(btn, { clearProps: "backgroundColor" });
            gsap.set(shape, { clearProps: "width" });
            gsap.set(statusEl, { autoAlpha: 0, y: 0, clearProps: "color" });
            [form.elements.name, form.elements.email, form.elements.message].forEach((el) => {
              if (el) el.readOnly = false;
            });
            if (!mountedRef.current) return;
            setSending(false);
            setStatus("idle");
            sendingRef.current = false;
            savedRef.current = null;
          },
        });
        sendTlRef.current = out;
        out.to(check, { opacity: 0, duration: 0.15, ease: "power1.in" }, 0);
        out.to(btn, { backgroundColor: themeColor("ink"), duration: 0.2, ease: "power1.inOut" }, 0);
        out.to(shape, { width: w0, duration: 0.4, ease: "power3.inOut" }, 0.1);
        out.to(icon, { opacity: 0, duration: 0.15 }, 0.1);
        out.to(label, { opacity: 1, duration: 0.25, ease: "power1.out" }, 0.25);
        out.to(statusEl, { autoAlpha: 0, y: -4, duration: 0.3, ease: "power1.in" }, 1.2);
      });
    }, [], 0.7);
  }, []);

  const finishFail = useCallback(() => {
    const shape = shapeRef.current;
    const btn = btnRef.current;
    const label = labelRef.current;
    const icon = iconRef.current;
    const ring = ringRef.current;
    const statusEl = statusRef.current;
    const form = formRef.current;
    if (!shape || !btn || !label || !icon || !ring || !statusEl || !form) return;
    if (spinRef.current) { spinRef.current.kill(); spinRef.current = null; }
    if (holdRef.current) { holdRef.current.kill(); holdRef.current = null; }
    const w0 = Number(shape.getAttribute("data-w0")) || shape.offsetWidth || 180;
    const saved = savedRef.current || { name: "", email: "", message: "" };
    gsap.killTweensOf([ring, btn, shape, label, icon, statusEl]);
    ["name", "email", "message"].forEach((k) => {
      const el = form.elements[k];
      if (el) el.value = saved[k] || "";
    });
    setMsgLen((saved.message || "").length);

    const tl = gsap.timeline({
      onComplete: () => {
        [form.elements.name, form.elements.email, form.elements.message].forEach((el) => {
          if (el) el.readOnly = false;
        });
        if (!mountedRef.current) return;
        setSending(false);
        setStatus("error");
        sendingRef.current = false;
      },
    });
    sendTlRef.current = tl;

    tl.to(ring, { opacity: 0, duration: 0.1 }, 0);
    tl.to(icon, { opacity: 0, duration: 0.1 }, 0);
    tl.to(shape, { x: -6, duration: 0.05 }, 0);
    tl.to(shape, { x: 6, duration: 0.05 }, 0.05);
    tl.to(shape, { x: -4, duration: 0.05 }, 0.1);
    tl.to(shape, { x: 4, duration: 0.05 }, 0.15);
    tl.to(shape, { x: 0, duration: 0.05 }, 0.2);
    tl.call(() => {
      statusEl.textContent = "Failed. Try again.";
      statusEl.style.color = "var(--t-accent-hover)";
    }, [], 0.05);
    tl.fromTo(statusEl, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.05);

    tl.to(shape, { width: w0, duration: 0.4, ease: "power3.inOut" }, 0.2);
    tl.to(label, { opacity: 1, duration: 0.25, ease: "power1.out" }, 0.35);
    tl.call(() => {
      gsap.set(shape, { clearProps: "width,x" });
      gsap.set(ring, { clearProps: "rotation,opacity" });
    }, [], 0.65);

    tl.add(() => {
      holdRef.current = gsap.delayedCall(3, () => {
        if (!mountedRef.current) return;
        gsap.to(statusEl, {
          autoAlpha: 0, y: -4, duration: 0.3, ease: "power1.in",
          onComplete: () => {
            gsap.set(statusEl, { clearProps: "color" });
            if (!mountedRef.current) return;
            setStatus("idle");
          },
        });
      });
    }, [], 0.7);
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (sendingRef.current || !formRef.current) return;

    const data = new FormData(formRef.current);
    const honeypot = String(data.get("company") || "").trim();
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!honeypot) {
      const found = validate({ name, email, message });
      if (Object.keys(found).length) {
        setErrors(found);
        const first = ["name", "email", "message"].find((key) => found[key]);
        if (first) formRef.current.elements?.[first]?.focus();
        return;
      }
    }

    setErrors({});
    if (holdRef.current) { holdRef.current.kill(); holdRef.current = null; }
    if (statusRef.current) gsap.set(statusRef.current, { clearProps: "color" });
    sendingRef.current = true;
    setSending(true);
    setStatus("sending");
    savedRef.current = { name, email, message };
    [formRef.current.elements.name, formRef.current.elements.email, formRef.current.elements.message].forEach((el) => {
      if (el) el.readOnly = true;
    });

    const reduced = prefersReduced();
    let animDone = Promise.resolve();
    if (reduced) {
      formRef.current.reset();
      setMsgLen(0);
    } else {
      animDone = playSend();
    }

    const result = honeypot
      ? { ok: true }
      : await requestMessage({
          ...FORM_EXTRA_FIELDS,
          name,
          email,
          message,
          _replyto: email,
          subject: `New portfolio message from ${name}`,
        });

    if (!mountedRef.current) return;
    if (!reduced) await animDone;
    if (!mountedRef.current) return;

    if (result.ok) {
      if (reduced) {
        formRef.current?.reset();
        setMsgLen(0);
        [formRef.current?.elements?.name, formRef.current?.elements?.email, formRef.current?.elements?.message].forEach((el) => {
          if (el) el.readOnly = false;
        });
        const statusEl = statusRef.current;
        if (statusEl) {
          statusEl.textContent = "Message sent \u2713";
          gsap.set(statusEl, { autoAlpha: 1, y: 0 });
          holdRef.current = gsap.delayedCall(3, () => {
            if (!mountedRef.current) return;
            gsap.set(statusEl, { autoAlpha: 0 });
            setStatus("idle");
          });
        }
        setSending(false);
        setStatus("success");
        sendingRef.current = false;
        savedRef.current = null;
      } else {
        finishOk();
      }
    } else if (reduced) {
      [formRef.current?.elements?.name, formRef.current?.elements?.email, formRef.current?.elements?.message].forEach((el) => {
        if (el) el.readOnly = false;
      });
      const statusEl = statusRef.current;
      if (statusEl) {
        statusEl.textContent = "Failed. Try again.";
        statusEl.style.color = "var(--t-accent-hover)";
        gsap.set(statusEl, { autoAlpha: 1, y: 0 });
        holdRef.current = gsap.delayedCall(3, () => {
          if (!mountedRef.current) return;
          gsap.set(statusEl, { autoAlpha: 0, clearProps: "color" });
          setStatus("idle");
        });
      }
      setSending(false);
      setStatus("error");
      sendingRef.current = false;
    } else {
      finishFail();
    }
  };

  useLayoutEffect(() => {
    renderFrameRef.current = renderFrame;
    const el = root.current;
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!el || !canvas || !card) return undefined;

    const reduced = prefersReduced();

    const loadFrames = (last) => {
      if (framesRef.current.length) return;
      wantedRef.current = last ? FRAME_COUNT - 1 : 0;
      const imgs = FRAME_URLS.map((url) => {
        const img = new Image();
        img.decoding = "async";
        img.src = url;
        return img;
      });
      framesRef.current = imgs;
      imgs.forEach((img) => {
        img.onload = () => {
          renderFrameRef.current(wantedRef.current);
        };
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          loadFrames(reduced);
        }
      },
      { rootMargin: "300% 0px 300% 0px" }
    );
    observer.observe(el);

    const onThemeChange = () => {
      paintedRef.current = { i: -1, ink: "", erase: false };
      renderFrameRef.current(wantedRef.current);
      syncRef.current?.(undefined, true);
      requestAnimationFrame(() => {
        renderFrameRef.current(wantedRef.current);
        syncRef.current?.(undefined, true);
      });
    };
    window.addEventListener("themechange", onThemeChange);

    if (reduced) {
      formShownRef.current = true;
      gsap.set(card, { autoAlpha: 1, scale: 1 });
      renderFrameRef.current(FRAME_COUNT - 1);
      return () => {
        observer.disconnect();
        window.removeEventListener("themechange", onThemeChange);
        framesRef.current.forEach((img) => { img.onload = null; });
        framesRef.current = [];
        formShownRef.current = false;
      };
    }

    let safety = null;
    let ctx = null;
    ctx = gsap.context(() => {
      const rowMQ = window.matchMedia(ROW_MQ);
      let shown = false, lastP = 0, cardTween = null;
      const release = () => { safety?.kill(); safety = null; unlockScroll("contact-form"); };
      const setCardFinal = (visible) => {
        cardTween?.kill(); cardTween = null; release();
        gsap.set(card, visible ? { autoAlpha: 1, scale: 1, x: 0, y: 0 } : { autoAlpha: 0, scale: 0.08 });
      };
      const flightOffset = () => {
        const frame = canvasRef.current.getBoundingClientRect();
        const slot = card.parentElement.getBoundingClientRect();
        return {
          dx: frame.left + frame.width * RECT_CX - (slot.left + slot.width / 2),
          dy: frame.top + frame.height * RECT_CY - (slot.top + card.offsetHeight / 2),
        };
      };
      const animateCardIn = () => {
        cardTween?.kill();
        gsap.set(card, { x: 0, y: 0, scale: 1 });
        const { dx, dy } = flightOffset();
        lockScroll("contact-form");
        safety?.kill(); safety = gsap.delayedCall(FORM_IN + 1.2, release);
        cardTween = gsap.timeline({ onComplete: release });
        cardTween.fromTo(card, { scale: 0.08, x: dx, y: dy }, { scale: 1, x: 0, y: 0, duration: FORM_IN, ease: "power4.out" }, 0);
        cardTween.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 0);
      };
      const animateCardOut = () => {
        cardTween?.kill(); release();
        gsap.set(card, { x: 0, y: 0, scale: 1 });
        const { dx, dy } = flightOffset();
        cardTween = gsap.to(card, { scale: 0.08, x: dx, y: dy, autoAlpha: 0, duration: 0.5, ease: "power3.in" });
      };
      const sync = (p, instant = false) => {
        const f = Math.min(1, Math.max(0, p / FRAME_BODY_END)) * (FRAME_COUNT - 1);
        const want = shown ? f >= FRAME_COUNT - 4 : f >= FRAME_COUNT - 1.01;
        const jumped = instant || Math.abs(p - lastP) > 0.08;
        lastP = p;
        let changed = false;
        if (want !== shown) {
          shown = want;
          changed = true;
          formShownRef.current = want;
          if (jumped) setCardFinal(want); else if (want) animateCardIn(); else animateCardOut();
        }
        renderFrameRef.current(f);
        if (!changed && !cardTween?.isActive()) {
          const o = Number(gsap.getProperty(card, "opacity"));
          if (shown && o < 1) setCardFinal(true);
          else if (!shown && o > 0) setCardFinal(false);
        }
      };
      gsap.set(card, { autoAlpha: 0, scale: 0.08 });
      const st = ScrollTrigger.create({
        trigger: el, start: "top top",
        end: () => `+=${Math.round(el.offsetHeight * (rowMQ.matches ? 3.2 : 2.6))}`,
        pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
        onUpdate: (self) => { sync(self.progress); guardHeadingRef.current(self.progress); },
        onRefresh: (self) => { sync(self.progress, true); guardHeadingRef.current(self.progress); },
      });
      syncRef.current = (p, instant) => sync(p ?? st.progress, instant);
      sync(st.progress, true);
    }, root);

    return () => {
      safety?.kill();
      syncRef.current = null;
      formShownRef.current = false;
      unlockScroll("contact-form");
      observer.disconnect();
      window.removeEventListener("themechange", onThemeChange);
      framesRef.current.forEach((img) => { img.onload = null; });
      framesRef.current = [];
      ctx.revert();
    };
  }, [renderFrame]);

  useLayoutEffect(() => {
    const h3 = root.current?.querySelector("[data-contact-head] h3");
    const parent = h3?.parentElement;
    if (!h3 || !parent) return undefined;
    const rowMQ = window.matchMedia(ROW_MQ);
    let lastW = parent.clientWidth;
    const fit = () => {
      h3.style.fontSize = "";
      if (rowMQ.matches) return;
      const avail = parent.clientWidth;
      const need = h3.scrollWidth;
      if (need > avail) {
        h3.style.fontSize = `${(parseFloat(getComputedStyle(h3).fontSize) * avail * 0.98) / need}px`;
      }
    };
    fit();
    document.fonts?.ready.then(() => requestAnimationFrame(fit));
    const ro = new ResizeObserver(() => {
      const w = parent.clientWidth;
      if (w === lastW) return;
      lastW = w;
      fit();
    });
    ro.observe(parent);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      h3.style.fontSize = "";
    };
  }, []);

  useLayoutEffect(() => {
    mountedRef.current = true;
    const el = root.current;
    if (!el) return undefined;
    const head = el.querySelector("[data-contact-head]");

    const reduced = prefersReduced();
    let stop = () => {};
    let reveal = null;
    let ctx = null;

    const showHeading = () => {
      gsap.set(el.querySelectorAll("[data-contact-head] [data-w], [data-contact-label], [data-contact-h1], [data-contact-h2]"), { autoAlpha: 1, clearProps: "clipPath,transform,color" });
      headingOkRef.current = true;
    };
    guardHeadingRef.current = (p) => {
      if (p > 0.03 && !headingOkRef.current && !headingTlRef.current?.isActive()) showHeading();
    };

    if (reduced) {
      headingOkRef.current = true;
      return () => {
        guardHeadingRef.current = () => {};
        mountedRef.current = false;
      };
    }

    if (enabled) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
        ctx = gsap.context(() => {
          gsap.set(el.querySelectorAll("[data-contact-head] [data-w]"), { autoAlpha: 0 });
          gsap.set(el.querySelectorAll("[data-contact-h2] [data-w]"), { autoAlpha: 1 });
          gsap.set(el.querySelector("[data-contact-h2]"), { autoAlpha: 0 });
        }, root);
      } else {
        showHeading();
      }

      const host = el.querySelector("[data-contact-inner]") || el;
      stop = createViewportReveal({
        root: el,
        sectionId: "contact",
        enabled,
        reduced,
        start: "top 92%",
        speed: 1.5,
        back: 2.4,
        groups: [
          {
            element: host,
            agents: AGENTS,
            build: () => {
              const t = buildContact(host);
              headingTlRef.current = t;
              t.eventCallback("onComplete", () => { headingOkRef.current = true; });
              return t;
            },
            once: true,
          },
        ],
      });
    } else if (head) {
      reveal = ScrollTrigger.create({
        trigger: head,
        start: "top 92%",
        once: true,
        onEnter: () => gsap.from(head, {
          autoAlpha: 0, y: 18, duration: 0.6, ease: "power2.out",
          immediateRender: false, clearProps: "all", onComplete: showHeading,
        }),
      });
    }

    return () => {
      mountedRef.current = false;
      sendingRef.current = false;
      setSending(false);
      if (abortRef.current) abortRef.current.abort();
      if (sendTlRef.current) { sendTlRef.current.kill(); sendTlRef.current = null; }
      if (spinRef.current) { spinRef.current.kill(); spinRef.current = null; }
      if (holdRef.current) { holdRef.current.kill(); holdRef.current = null; }
      swarm.dismiss(AGENTS);
      stop();
      reveal?.kill();
      if (ctx) ctx.revert();
      headingTlRef.current = null;
      showHeading();
      headingOkRef.current = false;
      guardHeadingRef.current = () => {};
      clearOverlays(el);
    };
  }, [enabled]);

  const liveText =
    status === "sending"
      ? "Sending your message."
      : status === "success"
        ? "Message sent."
        : status === "error"
          ? "Sending failed. Please try again."
          : "";

  return (
    <section
      id="contact"
      ref={root}
      data-sending={sending ? "1" : undefined}
      aria-busy={sending}
      className="relative flex h-svh min-h-0 flex-col overflow-hidden border-t border-line bg-bg px-gutter pt-[max(56px,7svh)] pb-[2svh] lg:pt-[2.8svh] lg:pb-[2.8svh]"
    >
      <h2 className="sr-only">Contact</h2>
      <style>{CONTACT_STYLE}</style>
      <p className="sr-only" aria-live="polite">
        {liveText}
      </p>

      <div
        data-contact-inner
        className="relative flex min-h-0 w-full flex-1 flex-col gap-[1.2svh]"
      >
        <header data-contact-head className="relative shrink-0">
          <p className="label mb-1.5 block w-fit">
            <span data-contact-label className="inline-block">
              <span className="text-red">
              </span>{" "}
                <Words text={section.label} />
            </span>
          </p>
          <h3 className="section-heading display flex flex-nowrap items-baseline gap-x-2 whitespace-nowrap lg:gap-x-4">
            <span data-contact-h1 className="block w-fit text-ink">
              <Words text={section.headline[0]} />
            </span>
            <span data-contact-h2 className="block w-fit text-red">
              <Words text={section.headline[1]} />
            </span>
          </h3>
        </header>

        <div id="contact-stage" className="relative min-h-0 w-full flex-1">
          <div className="contact-scene">
            <div className="contact-frame">
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                role="img"
                aria-label="Illustration of a developer sitting at a cafe table typing on a laptop"
              />
            </div>
            <div className="contact-form-slot">
              <div
                ref={cardRef}
                data-form-card
                className="contact-card"
                style={{ visibility: "hidden", opacity: 0 }}
              >
                <div className="contact-card-head">
                  <b>New message</b>
                  <span>All fields required</span>
                </div>
                <form
                  ref={formRef}
                  onSubmit={submit}
                  noValidate
                  className="flex w-full flex-col gap-[clamp(6px,1.2svh,14px)] lg:gap-[clamp(8px,1.5svh,16px)]"
                >
                  <div data-field>
                    <label
                      htmlFor="contact-name"
                      className="contact-label"
                    >
                      Name
                    </label>
                    <div className="contact-input is-single">
                      <svg className="contact-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        placeholder="Your name"
                        aria-invalid={errors.name ? "true" : undefined}
                        aria-describedby={errors.name ? "contact-name-error" : undefined}
                        onChange={() => clearError("name")}
                        className="contact-field"
                      />
                      <span className="contact-ghost" aria-hidden="true" />
                    </div>
                    {errors.name && (
                      <p id="contact-name-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div data-field>
                    <label
                      htmlFor="contact-email"
                      className="contact-label"
                    >
                      Email
                    </label>
                    <div className="contact-input is-single">
                      <svg className="contact-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-invalid={errors.email ? "true" : undefined}
                        aria-describedby={errors.email ? "contact-email-error" : undefined}
                        onChange={() => clearError("email")}
                        className="contact-field"
                      />
                      <span className="contact-ghost" aria-hidden="true" />
                    </div>
                    {errors.email && (
                      <p id="contact-email-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div data-field>
                    <label
                      htmlFor="contact-message"
                      className="contact-label"
                    >
                      Message
                    </label>
                    <div className="contact-input is-multi">
                      <svg className="contact-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={3}
                        maxLength={2000}
                        placeholder="Tell me what you have in mind"
                        aria-invalid={errors.message ? "true" : undefined}
                        aria-describedby={errors.message ? "contact-message-error" : undefined}
                        onChange={(e) => {
                          clearError("message");
                          setMsgLen(e.target.value.length);
                        }}
                        className="contact-field resize-none"
                      />
                      <span className="contact-ghost" aria-hidden="true" />
                      <span className="contact-count" aria-hidden="true">{msgLen}/2000</span>
                    </div>
                    {errors.message && (
                      <p id="contact-message-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div data-submit className="mt-1 flex h-[44px] w-full items-center justify-center lg:h-[48px] [@media(max-height:560px)]:!h-[38px]">
                    <div ref={shapeRef} className="relative h-[44px] w-full shrink-0 lg:h-[48px] [@media(max-height:560px)]:!h-[38px]">
                      <button
                        ref={btnRef}
                        type="submit"
                        disabled={sending}
                        onPointerDown={onBtnPointerDown}
                        className="contact-send absolute inset-0 z-10 rounded-full text-[0.8rem] font-semibold uppercase tracking-[0.16em]"
                      >
                        <span
                          ref={rippleRef}
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-0 size-10 rounded-full"
                          style={{ opacity: 0, background: "rgb(var(--t-bg-rgb) / 0.28)" }}
                        />
                        <span ref={labelRef} className="relative z-10 inline-flex items-center gap-[0.7em]">
                          Send message
                          <svg className="contact-send-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </span>
                        <svg
                          ref={iconRef}
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 z-10 m-auto size-[30px]"
                          style={{ opacity: 0 }}
                        >
                          <circle
                            ref={ringRef}
                            cx="24"
                            cy="24"
                            r="18"
                            fill="none"
                            stroke="var(--t-bg)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="30 84"
                          />
                          <path
                            ref={checkRef}
                            d="M13 25.5 21 33 35 16"
                            fill="none"
                            stroke="var(--t-on-accent)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ opacity: 0 }}
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p
                    ref={statusRef}
                    aria-hidden="true"
                    className="contact-status mt-1 h-5 text-center text-[0.85rem] font-semibold tracking-wide text-ink"
                    style={{ opacity: 0 }}
                  />

                  {/* Honeypot field */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                  >
                    <label htmlFor="contact-company">Company</label>
                    <input
                      id="contact-company"
                      name="company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
