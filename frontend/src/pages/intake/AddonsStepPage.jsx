import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import usePricingCalculator from "../../hooks/usePricingCalculator";
import { cardInsetClass, formInputClass, formLabelClass } from "../../constants/themeClasses.js";

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
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-blue-900">Step 4</div>
      <h2 className="mt-2 text-3xl font-semibold text-slate-950">Add-ons</h2>
      <p className="mt-3 text-slate-600">
        Add additional I-130 petitions or expedited processing.
      </p>

      <div className="mt-8 grid gap-4">
        <div>
          <label htmlFor="intake-i130-count" className={formLabelClass}>
            Additional I-130 count
          </label>
          <input
            id="intake-i130-count"
            name="additionalI130Count"
            type="number"
            min="0"
            value={intake.additionalI130Count}
            onChange={(e) => updateField("additionalI130Count", e.target.value)}
            className={formInputClass}
          />
        </div>

        <label
          htmlFor="intake-expedited"
          className={`flex items-center gap-3 px-4 py-3 ${cardInsetClass}`}
        >
          <input
            id="intake-expedited"
            name="expedited"
            type="checkbox"
            checked={intake.expedited}
            onChange={(e) => updateField("expedited", e.target.checked)}
          />
          <span className="text-slate-700">Expedited processing (+$500)</span>
        </label>
      </div>

      <div className={`mt-6 p-4 text-base leading-7 text-slate-600 ${cardInsetClass}`}>
        Estimated legal fee range:{" "}
        <span className="font-semibold text-blue-900">
          ${preview.minTotal} – ${preview.maxTotal}
        </span>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/case")}
          className="text-slate-600 hover:text-slate-950"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/intake/agreement-preview")}
          className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
