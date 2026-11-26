/* eslint-disable react-refresh/only-export-components -- CertificateArt and imageSrc are shared by the frames. */
import { useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "../../../hooks/useSmoothScroll";

/* Placeholder used when a certificate image is missing or fails to load. */
export const imageSrc = (item) =>
  item?.image
    ? /^https?:\/\//i.test(item.image)
      ? item.image
      : `/${item.image}`
    : "";

export function CertificateArt({ large = false }) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 text-center"
      style={{
        background:
          "radial-gradient(circle at 50% 35%, rgb(var(--accent-rgb) / 0.16), transparent 58%), linear-gradient(145deg, var(--t-panel), var(--t-panel-sunken))",
      }}
    >
      <span className="absolute inset-3 rounded-[2px] border border-dashed border-[rgb(var(--cursor-rgb)/0.1)]" />
      <svg
        viewBox="0 0 24 24"
        className={large ? "size-12 text-red" : "size-7 text-red"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M5 4.5h14v11H5z" />
        <path d="M8 8h8M8 11h5" />
        <path d="M9 15.5v5l3-1.4 3 1.4v-5" />
      </svg>
      <span className={`label mt-2 block ${large ? "text-[0.65rem]" : "text-[0.5rem]"} text-muted`}>
        CERTIFICATE
      </span>
      {large && (
        <span className="absolute bottom-5 left-1/2 h-px w-16 -translate-x-1/2 bg-red/40" />
      )}
    </div>
  );
}

/* Two-column certificate dialog. */
export function CertificateModal({ items, index, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const [brokenFor, setBrokenFor] = useState(null);
  const total = items.length;
  const item = items[index] || items[0];
  const broken = brokenFor === index;
  const src = imageSrc(item);
  const rotated = item?.rotate === 90;
  const number = String((item?.index ?? index) + 1).padStart(2, "0");

  useEffect(() => {
    lockScroll();
    closeRef.current?.focus();
    return () => unlockScroll();
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const buttons = [...dialog.querySelectorAll("button:not([disabled])")];
        if (!buttons.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (!dialog.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="cert-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="cert-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-modal-title"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close certificate"
          className="cert-dialog-close"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="cert-dialog-media">
          {src && !broken ? (
            <img
              src={src}
              alt={item.title}
              className={rotated ? "is-rotated" : ""}
              decoding="async"
              onError={() => setBrokenFor(index)}
            />
          ) : (
            <CertificateArt large />
          )}
        </div>

        <div className="cert-dialog-info">
          <p className="cert-dialog-kicker">CERTIFICATE {number} / {String(total).padStart(2, "0")}</p>
          <h2 id="cert-modal-title" className="display cert-dialog-title">{item.title}</h2>
          <span className="cert-dialog-rule" aria-hidden="true" />
          <p className="cert-dialog-caption">{item.caption}</p>
        </div>
      </div>
    </div>
  );
}
