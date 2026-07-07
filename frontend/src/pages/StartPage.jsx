import { Link } from "react-router-dom";
import { cardSurfaceClass, pageSurfaceClass } from "../constants/themeClasses.js";

export default function StartPage() {
  return (
    <div className={`${pageSurfaceClass} px-4 py-16`}>
      <main id="main-content" className={`mx-auto max-w-3xl p-8 ${cardSurfaceClass}`}>
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-900">
          Full intake
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Continue to guided intake
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          You’ll choose a package, enter your information, review pricing,
          preview your agreement, and request your consultation. Payment details
          are shown before any paid service begins.
        </p>

        <p className="mt-6 text-base leading-7 text-slate-600" role="note">
          Submitting information does not create an attorney-client relationship. Your
          matter must be reviewed and accepted by the firm before legal advice or
          representation is provided.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/intake/package"
            className="rounded-full bg-slate-900 px-5 py-3 text-center font-semibold text-white hover:bg-slate-800"
          >
            Start intake
          </Link>

          <Link
            to="/case-review"
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-900 hover:border-slate-400 hover:bg-slate-50"
          >
            Back to case review
          </Link>
        </div>
      </main>
    </div>
  );
}
