import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import {
  acceptedMatters,
  unavailableMatters,
} from "../constants/jurisdictionAvailability.js";

export default function AcceptedMattersSummary() {
  return (
    <section aria-labelledby="accepted-matters-heading">
      <h3 id="accepted-matters-heading" className="text-2xl font-semibold text-white">
        What we handle
      </h3>
      <p className="mt-3 text-base leading-7 text-slate-300">
        Family-based immigration petition support, subject to attorney review and jurisdiction
        availability.
      </p>

      <ul className="mt-6 space-y-3">
        {acceptedMatters.map((matter) => (
          <li
            key={matter.key}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200"
          >
            <span className="mt-0.5 rounded-full bg-amber-400/15 p-1.5 text-amber-400">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span>{matter.label}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-6 text-slate-400">
        Each matter requires attorney review and conflict check before acceptance.
      </p>

      {unavailableMatters.length > 0 ? (
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-white">Not currently handled here</h4>
          <ul className="mt-4 space-y-3">
            {unavailableMatters.map((matter) => (
              <li
                key={matter.key}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300"
              >
                <span className="mt-0.5 rounded-full bg-white/10 p-1.5 text-slate-400">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>
                  <span className="font-medium text-slate-200">{matter.label}</span>
                  {" — "}
                  {matter.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Link
        to="/availability"
        className="mt-6 inline-block text-sm font-medium text-amber-300 underline hover:text-amber-200"
      >
        State &amp; jurisdiction availability
      </Link>
    </section>
  );
}
