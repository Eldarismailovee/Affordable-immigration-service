import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import { generateAgreementPreview } from "../../services/api";
import usePricingCalculator from "../../hooks/usePricingCalculator";

export default function AgreementPreviewPage() {
  const navigate = useNavigate();
  const { intake, setAgreementPreview } = useIntake();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pricing = usePricingCalculator({
    selectedPackage: intake.selectedPackage,
    additionalI130Count: intake.additionalI130Count,
    expedited: intake.expedited,
  });

  useEffect(() => {
    async function loadPreview() {
      setLoading(true);
      setError("");

      try {
        const result = await generateAgreementPreview({
          ...intake,
          additionalI130Count: Number(intake.additionalI130Count || 0),
          pricingPreview: pricing,
        });

        setAgreementPreview(result);
      } catch (err) {
        setError(err.message || "Failed to generate agreement preview");
      } finally {
        setLoading(false);
      }
    }

    loadPreview();
  }, [
    intake,
    pricing,
    setAgreementPreview,
  ]);

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-amber-400">Step 5</div>
      <h2 className="mt-2 text-3xl font-semibold">Fee agreement preview</h2>
      <p className="mt-3 text-slate-300">Review the generated agreement summary.</p>

      {loading ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-slate-300">
          Generating preview...
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !error && intake.agreementPreview ? (
        <div
          className="prose prose-invert mt-8 max-w-none rounded-3xl border border-white/10 bg-slate-950/50 p-6"
          dangerouslySetInnerHTML={{ __html: intake.agreementPreview.html }}
        />
      ) : null}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/addons")}
          className="text-slate-300 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/intake/booking")}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}