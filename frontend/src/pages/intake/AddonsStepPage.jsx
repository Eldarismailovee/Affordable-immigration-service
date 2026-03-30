import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import usePricingCalculator from "../../hooks/usePricingCalculator";

export default function AddonsStepPage() {
  const navigate = useNavigate();
  const { intake, updateField } = useIntake();

  const preview = usePricingCalculator({
    selectedPackage: intake.selectedPackage,
    additionalI130Count: intake.additionalI130Count,
    expedited: intake.expedited,
  });

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-amber-400">Step 4</div>
      <h2 className="mt-2 text-3xl font-semibold">Add-ons</h2>
      <p className="mt-3 text-slate-300">
        Add additional I-130 petitions or expedited processing.
      </p>

      <div className="mt-8 grid gap-4">
        <input
          type="number"
          min="0"
          value={intake.additionalI130Count}
          onChange={(e) => updateField("additionalI130Count", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Additional I-130 count"
        />

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
          <input
            type="checkbox"
            checked={intake.expedited}
            onChange={(e) => updateField("expedited", e.target.checked)}
          />
          Expedited processing (+$500)
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-300">
        Estimated legal fee range:{" "}
        <span className="font-semibold text-amber-400">
          ${preview.minTotal} – ${preview.maxTotal}
        </span>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/case")}
          className="text-slate-300 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/intake/agreement-preview")}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}