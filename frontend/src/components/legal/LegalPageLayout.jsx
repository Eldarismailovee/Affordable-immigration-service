import { Link } from "react-router-dom";
import { ATTORNEY_REVIEW_NOTICE, LEGAL_LAST_UPDATED } from "../../data/legalMeta";
import { cardSurfaceClass, pageSurfaceClass } from "../../constants/themeClasses.js";

export default function LegalPageLayout({ title, children }) {
  return (
    <div className={`${pageSurfaceClass} px-4 py-10 md:px-6 lg:px-8`}>
      <main id="main-content" className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-blue-900">
              Legal
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-3 text-slate-600">Last updated: {LEGAL_LAST_UPDATED}</p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:border-slate-400 hover:bg-slate-50"
            >
              Back home
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-base leading-7 text-amber-950">
          {ATTORNEY_REVIEW_NOTICE}
        </div>

        <div className={`max-w-4xl space-y-6 p-8 text-base leading-7 text-slate-700 ${cardSurfaceClass}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
