export default function SectionTitle({ eyebrow, title, accent, subtitle }) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
        {title} <span className="text-amber-400">{accent}</span>
      </h2>

      {subtitle ? (
        <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}