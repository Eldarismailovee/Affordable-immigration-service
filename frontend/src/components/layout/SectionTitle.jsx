export default function SectionTitle({ eyebrow, title, accent, subtitle }) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
        {title} <span className="text-blue-900">{accent}</span>
      </h2>

      {subtitle ? (
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
