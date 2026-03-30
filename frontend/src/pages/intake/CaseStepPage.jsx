import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";

export default function CaseStepPage() {
  const navigate = useNavigate();
  const { intake, updateField } = useIntake();

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-amber-400">Step 3</div>
      <h2 className="mt-2 text-3xl font-semibold">Case details</h2>
      <p className="mt-3 text-slate-300">Add basic information about the family petition matter.</p>

      <div className="mt-8 grid gap-4">
        <input
          value={intake.caseType}
          onChange={(e) => updateField("caseType", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Case type"
        />
        <textarea
          rows={5}
          value={intake.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Describe your matter"
        />
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
          onClick={() => navigate("/intake/addons")}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}