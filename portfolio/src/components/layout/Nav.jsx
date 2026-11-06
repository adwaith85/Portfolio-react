import { useEffect, useState } from "react";
import { content } from "../../data/content.js";
import { useMotion } from "../../hooks/useMotion.jsx";
import { scrollToId } from "../../hooks/useSmoothScroll.js";

export default function Nav() {
    const { nav, brand } = content;
    const { motionOn, toggleMotion } = useMotion();
    const [active, setActive] = useState("home");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const ids = ["home", ...nav.map((n) => n.id)];
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) setActive(e.target.id);
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) obs.observe(el);
        });
        return () => obs.disconnect();
    }, [nav]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const go = (e, id) => {
        e.preventDefault();
        setOpen(false);
        scrollToId(id);
    };

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-[1000] grid h-nav grid-cols-[1fr_auto] items-center border-b border-line bg-bg/80 px-gutter backdrop-blur-md lg:grid-cols-[1fr_auto_1fr]">
                <a href="#home" className="display text-[2rem]" onClick={(e) => go(e, "home")}>
                    {brand}
                    <span className="text-red">.</span>
                </a>

                <ul className="hidden gap-[clamp(1rem,2.2vw,2.4rem)] lg:flex">
                    {nav.map((n) => (
                        <li key={n.id}>
                            <a
                                href={`#${n.id}`}
                                onClick={(e) => go(e, n.id)}
                                className={`relative text-[0.95rem] transition-colors before:absolute before:-left-3 before:top-1/2 before:size-[5px] before:-translate-y-1/2 before:rounded-full before:bg-red before:transition-transform hover:text-ink ${active === n.id ? "text-ink before:scale-100" : "text-muted before:scale-0"
                                    }`}
                            >
                                {n.label}
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center justify-end gap-6">
                    <button
                        onClick={toggleMotion}
                        aria-pressed={motionOn}
                        className="flex items-center gap-2.5 text-[0.9rem] text-muted transition-colors hover:text-ink"
                    >
                        <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5 fill-current">
                            {motionOn ? (
                                <>
                                    <rect x="2" y="1" width="3.5" height="12" />
                                    <rect x="8.5" y="1" width="3.5" height="12" />
                                </>
                            ) : (
                                <polygon points="2,1 13,7 2,13" />
                            )}
                        </svg>
                        <span className="hidden lg:inline">Motion {motionOn ? "on" : "off"}</span>
                    </button>

                    <a href="#contact" onClick={(e) => go(e, "contact")} className="hidden lg:block">
                        Let's talk <span className="text-red">↗</span>
                    </a>

                    <button className="label lg:hidden" onClick={() => setOpen((v) => !v)}>
                        {open ? "Close" : "Menu"}
                    </button>
                </div>
            </header>

            <nav
                className={`fixed inset-x-0 bottom-0 top-nav z-[999] flex flex-col gap-4 bg-bg px-gutter py-8 transition duration-300 lg:hidden ${open
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-[8%] opacity-0"
                    }`}
            >
                {nav.map((n) => (
                    <a key={n.id} href={`#${n.id}`} className="display text-5xl" onClick={(e) => go(e, n.id)}>
                        {n.label}
                    </a>
                ))}
            </nav>
        </>
    );
}