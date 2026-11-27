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

const FRAME_FILES = import.meta.glob("../../assets/contact-frames/*.webp", { eager: true, query: "?url", import: "default" });
const FRAME_URLS = Object.keys(FRAME_FILES).sort().map((k) => FRAME_FILES[k]);
const FRAME_COUNT = FRAME_URLS.length;          // 190
const FRAME_W = 800, FRAME_H = 450;
const FRAME_BODY_END = 0.88;                    // scroll progress at which the last frame is shown; the rest is a short hold
const FORM_IN = 1.1;                            // seconds, automatic form grow-in
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

const paintFrame = (canvas, img, ink) => {
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
};

const CONTACT_STYLE = `
#contact-stage { container-type: size; display: flex; align-items: center; justify-content: center; }
.contact-scene { position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; }
.contact-frame { position: relative; flex: none; align-self: center; aspect-ratio: 16 / 9; height: min(56.25cqw, 26cqh); }
@media (max-width: 1023.98px) and (min-height: 800px) { .contact-frame { height: min(56.25cqw, 34cqh); } }
.contact-frame canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.contact-form-slot { position: relative; flex: 1 1 0; min-height: 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 1.5svh; }
.contact-card {
  width: 100%; max-width: 480px; box-sizing: border-box;
  background: var(--t-bg); border: 2px solid var(--t-ink); border-radius: 6px;
  padding: clamp(10px, 1.8svh, 26px) clamp(14px, 1.8vw, 28px);
  transform-origin: 50% 0%; will-change: transform, opacity;
}
.contact-card form { counter-reset: contact-field; }
@media (min-width: 1024px) {
  .contact-scene { display: block; width: min(100cqw, 177.78cqh); height: auto; aspect-ratio: 16 / 9; }
  .contact-frame { position: absolute; inset: 0; width: 100%; height: 100%; align-self: auto; aspect-ratio: auto; }
  .contact-form-slot { position: absolute; left: 51%; top: 42.8%; width: 45.5%; transform: translateY(-50%); display: block; padding: 0; }
  .contact-card { max-width: none; transform-origin: 50% 50%; }
}
.contact-field {
  width: 100%;
  border: 1px solid rgb(var(--fg-rgb) / 0.16);
  border-radius: 12px;
  background: rgb(var(--fg-rgb) / 0.05);
  padding: clamp(0.4rem, 1.3svh, 0.8rem) 1rem;
  font-family: inherit;
  font-size: clamp(0.95rem, 1vw, 1.05rem);
  line-height: 1.42;
  color: var(--t-hover-ink);
  outline: none;
  box-shadow:
    0 20px 40px -20px rgb(var(--shadow-rgb)),
    inset 0 1px 0 rgb(var(--fg-rgb) / 0.055),
    inset 0 8px 20px rgb(var(--shadow-rgb) / 0.28);
  transition:
    border-color 240ms cubic-bezier(.2, .7, .2, 1),
    box-shadow 240ms cubic-bezier(.2, .7, .2, 1),
    background-color 240ms cubic-bezier(.2, .7, .2, 1);
}
.contact-field::placeholder { color: rgb(var(--t-ink-rgb) / 0.45); }
.contact-field:hover { border-color: rgb(var(--fg-rgb) / 0.3); }
.contact-field:focus {
  border-color: rgb(var(--accent-rgb) / 0.92);
  background: rgb(var(--fg-rgb) / 0.072);
  box-shadow:
    0 20px 40px -20px rgb(var(--shadow-rgb)),
    inset 3px 0 0 0 var(--t-accent),
    inset 0 1px 0 rgb(var(--fg-rgb) / 0.07),
    0 0 0 3px rgb(var(--accent-rgb) / 0.17),
    0 0 26px rgb(var(--accent-rgb) / 0.26);
}
.contact-field[aria-invalid="true"] {
  border-color: var(--t-accent-hover);
  background: rgb(var(--accent-rgb) / 0.075);
  box-shadow:
    0 20px 40px -20px rgb(var(--shadow-rgb)),
    inset 3px 0 0 0 var(--t-accent-hover),
    0 0 0 3px rgb(var(--accent-rgb) / 0.14),
    0 0 22px rgb(var(--accent-rgb) / 0.18);
}
.contact-field[aria-invalid="true"]:focus {
  box-shadow:
    0 20px 40px -20px rgb(var(--shadow-rgb)),
    inset 3px 0 0 0 var(--t-accent-hover),
    0 0 0 3px rgb(var(--accent-rgb) / 0.2),
    0 0 28px rgb(var(--accent-rgb) / 0.3);
}
.contact-field:disabled { opacity: 0.72; cursor: progress; }
.contact-label {
  display: block;
  margin-bottom: 0.38rem;
  font-size: 0.85rem;
  font-weight: var(--t-fw-semibold);
  line-height: 1.2;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(var(--t-ink-rgb) / 0.74);
  counter-increment: contact-field;
}
.contact-label::before {
  content: counter(contact-field, decimal-leading-zero) " /";
  margin-right: 0.55em;
  color: var(--t-accent-hover);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgb(var(--accent-rgb) / 0.55);
}
.contact-field { min-height: clamp(40px, 5.6svh, 48px); }
textarea.contact-field { height: clamp(64px, 11svh, 104px); min-height: 0; }
.contact-label { margin-bottom: 0.25rem; font-size: clamp(0.66rem, 1.5svh, 0.85rem); }
@media (hover: none) {
  .contact-field,
  .contact-send { min-height: 48px; }
}
.contact-send {
  border: 1px solid rgb(var(--fg-rgb) / 0.2);
  background: transparent;
  color: rgb(var(--fg-rgb));
  overflow: hidden;
  text-shadow: 0 1px 4px rgb(var(--shadow-rgb) / 0.5);
  transition:
    translate 240ms cubic-bezier(.2, .7, .2, 1),
    scale 180ms cubic-bezier(.2, .7, .2, 1),
    box-shadow 240ms cubic-bezier(.2, .7, .2, 1),
    border-color 240ms cubic-bezier(.2, .7, .2, 1),
    background-color 240ms cubic-bezier(.2, .7, .2, 1);
}
@media (hover: hover) {
  .contact-send:hover:not(:disabled) {
    translate: 0 -2px;
    border-color: rgb(var(--fg-rgb) / 0.38);
    box-shadow:
      0 14px 34px -12px rgb(var(--accent-rgb) / 0.72),
      0 0 26px rgb(var(--accent-rgb) / 0.32);
  }
}
.contact-send:active:not(:disabled) {
  translate: 0 0;
  scale: 0.98;
}
.contact-send:focus-visible {
  outline: 2px solid rgb(var(--t-accent-hover-rgb) / 0.95);
  outline-offset: 3px;
  box-shadow:
    0 0 0 4px rgb(var(--accent-rgb) / 0.2),
    0 0 30px rgb(var(--accent-rgb) / 0.4);
}
.contact-send:disabled { cursor: progress; }
.contact-status { text-shadow: 0 1px 8px rgb(var(--shadow-rgb) / 0.65); }

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

  const enabled = useAgentsEnabled();
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("idle");

  const mountedRef = useRef(true);
  const sendingRef = useRef(false);
  const abortRef = useRef(null);
  const framesRef = useRef([]);
  const wantedRef = useRef(0);
  const paintedRef = useRef({ i: -1, ink: "" });
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
    if (paintedRef.current.i === i && paintedRef.current.ink === inkKey) return;
    paintFrame(canvas, framesRef.current[i], ink);
    paintedRef.current = { i, ink: inkKey };
  }, []);

  renderFrameRef.current = renderFrame;

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

  const eraseTween = useCallback((el, text) => {
    const o = { n: text.length };
    return gsap.to(o, {
      n: 0,
      duration: Math.min(0.7, Math.max(0.25, text.length * 0.022)),
      ease: "power1.in",
      onUpdate: () => {
        el.value = text.slice(0, Math.round(o.n));
      },
      onComplete: () => {
        el.value = "";
      },
    });
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
      tl.add(eraseTween(el, text), 0.12 + i * 0.28);
    });

    tl.to(label, { opacity: 0, duration: 0.15, ease: "power1.out" }, 0.3);
    tl.to(shape, { width: 48, duration: 0.38, ease: "power3.inOut" }, 0.34);
    tl.to(icon, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0.6);
    tl.call(() => {
      spinRef.current = gsap.to(ring, { rotation: 360, transformOrigin: "50% 50%", repeat: -1, duration: 0.8, ease: "none" });
    }, [], 0.6);
    tl.call(resolve, [], 1.0);
    tl.set(shape, { attr: { "data-w0": w0 } });

    return arrived;
  }, [eraseTween]);

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
            gsap.set([ring, check, icon], { clearProps: "opacity,strokeDasharray,strokeDashoffset,scale,rotation" });
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
        out.to(btn, { backgroundColor: "transparent", duration: 0.2, ease: "power1.inOut" }, 0);
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

    ["name", "email", "message"].forEach((k) => {
      const el = form.elements[k];
      const text = saved[k] || "";
      if (!el) return;
      const o = { n: 0 };
      tl.to(o, {
        n: text.length,
        duration: 0.4,
        ease: "power1.out",
        onUpdate: () => { el.value = text.slice(0, Math.round(o.n)); },
        onComplete: () => { el.value = text; },
      }, 0.15);
    });

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
      paintedRef.current = { i: -1, ink: "" };
      renderFrameRef.current(wantedRef.current);
    };
    window.addEventListener("themechange", onThemeChange);

    if (reduced) {
      gsap.set(card, { autoAlpha: 1, scale: 1 });
      renderFrameRef.current(FRAME_COUNT - 1);
      return () => {
        observer.disconnect();
        window.removeEventListener("themechange", onThemeChange);
        framesRef.current.forEach((img) => { img.onload = null; });
        framesRef.current = [];
      };
    }

    let safety = null;
    const ctx = gsap.context(() => {
      gsap.set(card, { autoAlpha: 0, scale: 0.06 });
      const formTween = gsap.to(card, {
        autoAlpha: 1,
        scale: 1,
        duration: FORM_IN,
        ease: "back.out(1.5)",
        paused: true,
        onComplete: () => {
          safety?.kill();
          unlockScroll();
        },
      });
      let shown = false;
      const showForm = () => {
        shown = true;
        lockScroll();
        safety?.kill();
        safety = gsap.delayedCall(FORM_IN + 1.2, unlockScroll);
        formTween.timeScale(1).play();
      };
      const hideForm = () => {
        shown = false;
        safety?.kill();
        unlockScroll();
        formTween.timeScale(2.2).reverse();
      };

      const state = { f: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * (window.innerWidth < 1024 ? 2.6 : 3.2))}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: -1,
        },
      });
      tl.to(state, {
        f: FRAME_COUNT - 1,
        duration: FRAME_BODY_END,
        onUpdate: () => {
          renderFrameRef.current(state.f);
          if (!shown && state.f >= FRAME_COUNT - 1.01) showForm();
          else if (shown && state.f < FRAME_COUNT - 4) hideForm();
        },
      });
      tl.to({}, { duration: 1 - FRAME_BODY_END });
      renderFrameRef.current(0);
    }, root);

    return () => {
      safety?.kill();
      unlockScroll();
      observer.disconnect();
      window.removeEventListener("themechange", onThemeChange);
      framesRef.current.forEach((img) => { img.onload = null; });
      framesRef.current = [];
      ctx.revert();
    };
  }, []);

  useLayoutEffect(() => {
    mountedRef.current = true;
    const el = root.current;
    if (!el) return undefined;

    const reduced = prefersReduced();
    let stop = () => {};
    let ctx = null;

    if (reduced) {
      return () => {
        mountedRef.current = false;
      };
    }

    ctx = gsap.context(() => {
      gsap.set(el.querySelectorAll("[data-contact-head] [data-w]"), { autoAlpha: 0 });
      gsap.set(el.querySelectorAll("[data-contact-h2] [data-w]"), { autoAlpha: 1 });
      gsap.set(el.querySelector("[data-contact-h2]"), { autoAlpha: 0 });
    }, root);

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
          build: () => buildContact(host),
        },
      ],
    });

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
      clearOverlays(el);
      if (ctx) ctx.revert();
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
          <h3 className="section-heading display flex flex-wrap items-baseline gap-x-4">
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
                <form
                  ref={formRef}
                  onSubmit={submit}
                  noValidate
                  className="flex w-full flex-col gap-[clamp(6px,1.2svh,14px)]"
                >
                  <div data-field>
                    <label
                      htmlFor="contact-name"
                      className="contact-label mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
                    >
                      Name
                    </label>
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
                    {errors.name && (
                      <p id="contact-name-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div data-field>
                    <label
                      htmlFor="contact-email"
                      className="contact-label mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
                    >
                      Email
                    </label>
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
                    {errors.email && (
                      <p id="contact-email-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div data-field>
                    <label
                      htmlFor="contact-message"
                      className="contact-label mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink/70"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={3}
                      maxLength={2000}
                      placeholder="Tell me what you have in mind"
                      aria-invalid={errors.message ? "true" : undefined}
                      aria-describedby={errors.message ? "contact-message-error" : undefined}
                      onChange={() => clearError("message")}
                      className="contact-field resize-none"
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="mt-1.5 text-[0.85rem] leading-snug text-red">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div data-submit className="mt-1 flex h-[52px] w-full items-center justify-center">
                    <div ref={shapeRef} className="relative h-[48px] w-[clamp(170px,15vw,200px)] shrink-0">
                      <button
                        ref={btnRef}
                        type="submit"
                        disabled={sending}
                        onPointerDown={onBtnPointerDown}
                        className="contact-send absolute inset-0 z-10 rounded-full text-[0.85rem] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--cursor-rgb))]"
                      >
                        <span
                          ref={rippleRef}
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-0 size-10 rounded-full"
                          style={{ opacity: 0, background: "rgb(var(--accent-rgb) / 0.4)" }}
                        />
                        <span ref={labelRef} className="relative z-10 inline-block">Send message</span>
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
                            stroke="var(--t-accent)"
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
