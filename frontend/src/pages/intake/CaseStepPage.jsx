import { Link, useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import {
  availabilityDisclaimers,
  findUnavailableMatterMatch,
} from "../../constants/jurisdictionAvailability";
import { formInputClass, formLabelClass } from "../../constants/themeClasses.js";

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
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-blue-900">Step 3</div>
      <h2 className="mt-2 text-3xl font-semibold text-slate-950">Case details</h2>
      <p className="mt-3 text-slate-600">Add basic information about the family petition matter.</p>

      <div className="mt-8 grid gap-4">
        <div>
          <label htmlFor="intake-case-type" className={formLabelClass}>
            Case type
          </label>
          <input
            id="intake-case-type"
            name="caseType"
            value={intake.caseType}
            onChange={(e) => updateField("caseType", e.target.value)}
            className={formInputClass}
            aria-describedby="intake-case-type-help"
            required
          />
          <p id="intake-case-type-help" className="mt-2 text-sm text-slate-600">
            {availabilityDisclaimers.caseTypeHelper}{" "}
            <Link to="/availability" className="text-blue-900 underline hover:text-blue-800">
              View availability
            </Link>
            .
          </p>
          {unavailableMatch ? (
            <div
              role="alert"
              className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
            >
              <strong>{unavailableMatch.label}</strong> is not offered through this platform.{" "}
              {unavailableMatch.reason}{" "}
              <Link to="/availability" className="underline hover:text-amber-900">
                Learn more
              </Link>
              .
            </div>
          ) : null}
        </div>
        <div>
          <label htmlFor="intake-notes" className={formLabelClass}>
            Describe your matter
          </label>
          <textarea
            id="intake-notes"
            name="notes"
            rows={5}
            value={intake.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className={formInputClass}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/client")}
          className="text-slate-600 hover:text-slate-950"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={Boolean(unavailableMatch)}
          className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
