import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import { submitIntake } from "../../services/api";
import usePricingCalculator from "../../hooks/usePricingCalculator";

export default function BookingStepPage() {
  const navigate = useNavigate();
  const { intake, updateField, setSubmissionResult } = useIntake();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pricing = usePricingCalculator({
    selectedPackage: intake.selectedPackage,
    additionalI130Count: intake.additionalI130Count,
    expedited: intake.expedited,
  });

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const result = await submitIntake({
        ...intake,
        additionalI130Count: Number(intake.additionalI130Count || 0),
        pricingPreview: pricing,
      });

      setSubmissionResult(result);
      navigate("/intake/success");
    } catch (err) {
      setError(err.message || "Failed to submit intake");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-amber-400">Step 6</div>
      <h2 className="mt-2 text-3xl font-semibold">Consultation and payment</h2>
      <p className="mt-3 text-slate-300">
        Request your consultation and provide billing details for manual payment processing.
      </p>

      <div className="mt-8 grid gap-4">
        <select
          value={intake.consultationType}
          onChange={(e) => updateField("consultationType", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
        >
          <option>Zoom</option>
          <option>Phone</option>
        </select>

        <input
          value={intake.preferredDateTime}
          onChange={(e) => updateField("preferredDateTime", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Preferred date/time"
        />

        <input
          value={intake.billingName || ""}
          onChange={(e) => updateField("billingName", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Billing contact name"
        />

        <input
          value={intake.billingEmail || ""}
          onChange={(e) => updateField("billingEmail", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Billing contact email"
        />

        <select
          value={intake.paymentPreference || "invoice"}
          onChange={(e) => updateField("paymentPreference", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
        >
          <option value="invoice">Invoice by email</option>
          <option value="office_call">Office call for payment coordination</option>
          <option value="manual_follow_up">Manual follow-up</option>
        </select>

        <textarea
          rows={4}
          value={intake.paymentNotes || ""}
          onChange={(e) => updateField("paymentNotes", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Optional payment notes"
        />

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
          <input
            type="checkbox"
            checked={Boolean(intake.consentManualProcessing)}
            onChange={(e) => updateField("consentManualProcessing", e.target.checked)}
          />
          <span className="text-sm text-slate-300">
            I understand payment will be processed manually by the office, and I am not submitting card details through this website.
          </span>
        </label>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/agreement-preview")}
          className="text-slate-300 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-70"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
