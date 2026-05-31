import { Link, useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import {
  availabilityDisclaimers,
  findUnavailableMatterMatch,
} from "../../constants/jurisdictionAvailability";

export default function CaseStepPage() {
  const navigate = useNavigate();
  const { intake, updateField } = useIntake();
  const unavailableMatch = findUnavailableMatterMatch(intake.caseType);

  function handleContinue() {
    if (unavailableMatch) {
      return;
    }
    navigate("/intake/addons");
  }

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-amber-400">Step 3</div>
      <h2 className="mt-2 text-3xl font-semibold">Case details</h2>
      <p className="mt-3 text-slate-300">Add basic information about the family petition matter.</p>

      <div className="mt-8 grid gap-4">
        <div>
          <label htmlFor="intake-case-type" className="mb-1.5 block text-sm font-medium text-slate-200">
            Case type
          </label>
          <input
            id="intake-case-type"
            name="caseType"
            value={intake.caseType}
            onChange={(e) => updateField("caseType", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            aria-describedby="intake-case-type-help"
            required
          />
          <p id="intake-case-type-help" className="mt-2 text-sm text-slate-300">
            {availabilityDisclaimers.caseTypeHelper}{" "}
            <Link to="/availability" className="text-amber-300 underline hover:text-amber-200">
              View availability
            </Link>
            .
          </p>
          {unavailableMatch ? (
            <div
              role="alert"
              className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
            >
              <strong>{unavailableMatch.label}</strong> is not offered through this platform.{" "}
              {unavailableMatch.reason}{" "}
              <Link to="/availability" className="underline hover:text-white">
                Learn more
              </Link>
              .
            </div>
          ) : null}
        </div>
        <div>
          <label htmlFor="intake-notes" className="mb-1.5 block text-sm font-medium text-slate-200">
            Describe your matter
          </label>
          <textarea
            id="intake-notes"
            name="notes"
            rows={5}
            value={intake.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/client")}
          className="text-slate-300 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={Boolean(unavailableMatch)}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
