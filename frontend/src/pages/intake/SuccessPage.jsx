import { Link } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";

export default function SuccessPage() {
  const { intake, resetIntake } = useIntake();
  const leadId = intake.submissionResult?.lead?.id;

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-emerald-400">Completed</div>
      <h2 className="mt-2 text-3xl font-semibold">Your intake was submitted</h2>
      <p className="mt-3 text-slate-300">
        Our office will review your submission and follow up regarding your consultation and next steps.
      </p>

      <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-slate-300">
        {leadId ? (
          <p>
            <strong className="text-white">Lead ID:</strong> {leadId}
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
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
          >
            View onboarding packet
          </Link>
        ) : null}

        <Link
          to="/"
          onClick={resetIntake}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
