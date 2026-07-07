import { Link } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import { cardInsetClass } from "../../constants/themeClasses.js";

export default function SuccessPage() {
  const { intake, resetIntake } = useIntake();
  const leadId = intake.submissionResult?.lead?.id;

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-emerald-700">Completed</div>
      <h2 className="mt-2 text-3xl font-semibold text-slate-950">Your intake was submitted</h2>
      <p className="mt-3 text-slate-600">
        Our office will review your submission and follow up regarding your consultation and next steps.
      </p>

      <div className={`mt-8 p-6 text-slate-600 ${cardInsetClass}`}>
        {leadId ? (
          <p>
            <strong className="text-slate-950">Lead ID:</strong> {leadId}
          </p>
        ) : null}
        <p className="mt-4">
          Engagement is not formally initiated until the first consultation with the lawyer confirms the adequacy of the submitted documents.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        {leadId ? (
          <Link
            to={`/onboarding/${leadId}`}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:border-slate-400 hover:bg-slate-50"
          >
            View onboarding packet
          </Link>
        ) : null}

        <Link
          to="/"
          onClick={resetIntake}
          className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
