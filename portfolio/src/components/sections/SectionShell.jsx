export default function SectionShell({ id, num, label, headline, note, children }) {
  return (
    <section
      id={id}
      className="flex h-svh flex-col overflow-hidden border-t border-line px-gutter py-[5svh]"
    >
      <div className="mb-[3svh] shrink-0">
        <p className="label">
          <span className="text-red">{num}</span> / {label}
        </p>
        <h2 className="display mt-3 text-[min(7.5vw,13svh)] max-sm:text-[clamp(2.2rem,11vw,3.4rem)]">
          <span className="block">{headline[0]}</span>
          <span className="block text-red">{headline[1]}</span>
        </h2>
      </div>

      <div className="min-h-0 flex-1">
        {children ?? (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-line px-6 text-center text-muted">
            {note}
          </div>
        )}
      </div>
    </section>
  );
}