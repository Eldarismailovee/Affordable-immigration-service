import { Link } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import {
  documentSecurityPoints,
  documentSecuritySummary,
} from "../constants/trustSignals.js";
import { cardInsetClass } from "../constants/themeClasses.js";

export default function DocumentSecurityTrustBlock({ compact = false }) {
  if (compact) {
    return (
      <aside
        className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5"
        aria-labelledby="document-security-heading-compact"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-400/10 p-2 text-amber-400">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="document-security-heading-compact"
              className="text-lg font-semibold text-white"
            >
              Secure document upload
            </h3>
            <p className="mt-2 text-base leading-7 text-slate-300">{documentSecuritySummary}</p>
            <Link
              to="/privacy"
              className="mt-3 inline-block text-sm font-medium text-amber-300 underline hover:text-amber-200"
            >
              Privacy &amp; security
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      aria-labelledby="document-security-heading"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-900">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 id="document-security-heading" className="text-2xl font-semibold text-slate-950">
            How we handle sensitive documents
          </h3>
          <p className="mt-3 text-base leading-7 text-slate-600">{documentSecuritySummary}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {documentSecurityPoints.map((point) => (
          <li key={point.label} className={`p-4 ${cardInsetClass}`}>
            <div className="font-medium text-slate-950">{point.label}</div>
            <p className="mt-1 text-base leading-7 text-slate-600">{point.detail}</p>
          </li>
        ))}
      </ul>

      <Link
        to="/privacy"
        className="mt-6 inline-block text-sm font-medium text-blue-900 underline hover:text-blue-800"
      >
        Privacy &amp; security
      </Link>
    </aside>
  );
}
