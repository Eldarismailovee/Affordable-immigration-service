import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import { submitIntake } from "../../services/api";
import usePricingCalculator from "../../hooks/usePricingCalculator";
import {
  containsCardLikeData,
  PAYMENT_CARD_DATA_MESSAGE,
} from "../../lib/paymentRedaction.js";
import {
  availabilityDisclaimers,
  findUnavailableMatterMatch,
} from "../../constants/jurisdictionAvailability";

const requiredFields = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["caseType", "Case type"],
  ["preferredDateTime", "Preferred date/time"],
  ["billingName", "Billing contact name"],
  ["billingEmail", "Billing contact email"],
];

function getValidationMessage(intake) {
  const missingField = requiredFields.find(([field]) => {
    const value = intake[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingField) {
    return `${missingField[1]} is required. Please go back and complete it.`;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.email)) {
    return "Client email is invalid. Please go back and check it.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.billingEmail)) {
    return "Billing email is invalid.";
  }

  if (String(intake.phone).trim().length < 5) {
    return "Phone is required. Please go back and check it.";
  }

  if (!intake.consentManualProcessing) {
    return "Please confirm hosted secure payment consent.";
  }

  if (!intake.consentAvailabilityAcknowledgment) {
    return "Please confirm the availability acknowledgment before submitting.";
  }

  const unavailableMatch = findUnavailableMatterMatch(intake.caseType);
  if (unavailableMatch) {
    return `${unavailableMatch.label} is not offered through this platform. See State & Jurisdiction Availability for details.`;
  }

  if (containsCardLikeData(intake.paymentNotes || "")) {
    return PAYMENT_CARD_DATA_MESSAGE;
  }

  return "";
}

const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white";

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
      const validationMessage = getValidationMessage(intake);

      if (validationMessage) {
        setError(validationMessage);
        return;
      }

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
        Request your consultation and provide billing contact details. Card payments happen only
        on a secure hosted checkout link from our payment provider — never on this site.
      </p>

      {error ? (
        <div
          id="booking-form-error"
          role="alert"
          className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4">
        <div>
          <label htmlFor="booking-consultation-type" className="mb-1.5 block text-sm font-medium text-slate-200">
            Consultation type
          </label>
          <select
            id="booking-consultation-type"
            name="consultationType"
            value={intake.consultationType}
            onChange={(e) => updateField("consultationType", e.target.value)}
            className={fieldClassName}
          >
            <option>Zoom</option>
            <option>Phone</option>
          </select>
        </div>

        <div>
          <label htmlFor="booking-preferred-datetime" className="mb-1.5 block text-sm font-medium text-slate-200">
            Preferred date and time
          </label>
          <input
            id="booking-preferred-datetime"
            name="preferredDateTime"
            value={intake.preferredDateTime}
            onChange={(e) => updateField("preferredDateTime", e.target.value)}
            className={fieldClassName}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "booking-form-error" : undefined}
          />
        </div>

        <div>
          <label htmlFor="booking-billing-name" className="mb-1.5 block text-sm font-medium text-slate-200">
            Billing contact name
          </label>
          <input
            id="booking-billing-name"
            name="billingName"
            value={intake.billingName || ""}
            onChange={(e) => updateField("billingName", e.target.value)}
            className={fieldClassName}
            autoComplete="name"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "booking-form-error" : undefined}
          />
        </div>

        <div>
          <label htmlFor="booking-billing-email" className="mb-1.5 block text-sm font-medium text-slate-200">
            Billing contact email
          </label>
          <input
            id="booking-billing-email"
            name="billingEmail"
            type="email"
            value={intake.billingEmail || ""}
            onChange={(e) => updateField("billingEmail", e.target.value)}
            className={fieldClassName}
            autoComplete="email"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "booking-form-error" : undefined}
          />
        </div>

        <div>
          <label htmlFor="booking-payment-preference" className="mb-1.5 block text-sm font-medium text-slate-200">
            Payment preference
          </label>
          <select
            id="booking-payment-preference"
            name="paymentPreference"
            value={intake.paymentPreference || "invoice"}
            onChange={(e) => updateField("paymentPreference", e.target.value)}
            className={fieldClassName}
          >
            <option value="invoice">Invoice by email</option>
            <option value="office_call">Office call for payment coordination</option>
            <option value="manual_follow_up">Manual follow-up</option>
          </select>
        </div>

        <div>
          <label htmlFor="booking-payment-notes" className="mb-1.5 block text-sm font-medium text-slate-200">
            Optional billing notes
          </label>
          <textarea
            id="booking-payment-notes"
            name="paymentNotes"
            rows={4}
            value={intake.paymentNotes || ""}
            onChange={(e) => updateField("paymentNotes", e.target.value)}
            className={fieldClassName}
            aria-describedby="payment-notes-help"
            aria-invalid={Boolean(error)}
          />
          <p id="payment-notes-help" className="mt-2 text-sm text-slate-300">
            Do not enter card numbers, CVV/CVC, or expiry dates here. You will receive a secure
            payment link when it is ready.
          </p>
        </div>

        <label
          htmlFor="booking-availability-ack"
          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
        >
          <input
            id="booking-availability-ack"
            name="consentAvailabilityAcknowledgment"
            type="checkbox"
            checked={Boolean(intake.consentAvailabilityAcknowledgment)}
            onChange={(e) => updateField("consentAvailabilityAcknowledgment", e.target.checked)}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "booking-form-error" : undefined}
          />
          <span className="text-sm text-slate-300">
            {availabilityDisclaimers.intakeAcknowledgment}{" "}
            <Link to="/availability" className="text-amber-300 underline hover:text-amber-200">
              State &amp; Jurisdiction Availability
            </Link>
            .
          </span>
        </label>

        <label
          htmlFor="booking-consent"
          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
        >
          <input
            id="booking-consent"
            name="consentManualProcessing"
            type="checkbox"
            checked={Boolean(intake.consentManualProcessing)}
            onChange={(e) => updateField("consentManualProcessing", e.target.checked)}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "booking-form-error" : undefined}
          />
          <span className="text-sm text-slate-300">
            I understand card payment happens only on a secure hosted checkout link, and I will not
            enter card details on this website.
          </span>
        </label>
      </div>

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
