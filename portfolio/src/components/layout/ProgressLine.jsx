import { useEffect, useRef } from "react";

export default function ProgressLine() {
    const ref = useRef(null);

    useEffect(() => {
        let raf = 0;
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? window.scrollY / max : 0;
            if (ref.current) ref.current.style.transform = `scaleX(${p})`;
            raf = 0;
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div
            ref={ref}
            style={{ transform: "scaleX(0)" }}
            className="fixed left-0 top-0 z-[1001] h-[3px] w-full origin-left bg-red"
        />
    );
}