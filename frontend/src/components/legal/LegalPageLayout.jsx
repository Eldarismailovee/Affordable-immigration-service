import { Link } from "react-router-dom";
import { ATTORNEY_REVIEW_TODO, LEGAL_LAST_UPDATED } from "../../data/legalMeta";

export default function LegalPageLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Legal
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-3 text-slate-300">Last updated: {LEGAL_LAST_UPDATED}</p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
            >
              Back home
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-sm leading-7 text-amber-100">
          {ATTORNEY_REVIEW_TODO}
        </div>

        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
