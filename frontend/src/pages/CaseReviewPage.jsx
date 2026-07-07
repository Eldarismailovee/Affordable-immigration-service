import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import services from "../data/services.js";
import { useIntake } from "../context/IntakeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { availabilityDisclaimers } from "../constants/jurisdictionAvailability.js";
import {
  cardInsetClass,
  formInputClass,
  formLabelClass,
  formSurfaceClass,
  pageSurfaceClass,
} from "../constants/themeClasses.js";

const relationshipOptions = [
  "Spouse / fiancé(e)",
  "Parent",
  "Child",
  "Sibling",
  "Other family relationship",
];

export default function CaseReviewPage() {
  const navigate = useNavigate();
  const { intake, updateFields } = useIntake();
  const { isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    caseType: intake.caseType || "",
    petitionRelationship: intake.petitionRelationship || "",
    location: intake.location || "",
    hasUrgentDeadline: intake.hasUrgentDeadline || false,
    urgentDeadlineNotes: intake.urgentDeadlineNotes || "",
    email: intake.email || "",
    acknowledgeNotLegalAdvice: false,
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.caseType || !form.petitionRelationship || !form.location.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.acknowledgeNotLegalAdvice) {
      setError("Please confirm you understand this is not legal advice.");
      return;
    }

    updateFields({
      caseType: form.caseType,
      petitionRelationship: form.petitionRelationship,
      location: form.location.trim(),
      hasUrgentDeadline: form.hasUrgentDeadline,
      urgentDeadlineNotes: form.urgentDeadlineNotes.trim(),
      email: form.email.trim(),
    });

    if (isAuthenticated) {
      navigate("/intake/package");
      return;
    }

    navigate("/register", { state: { from: "/intake/package" } });
  }

  return (
    <div className={pageSurfaceClass}>
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <Link
          to="/"
          className="text-sm font-medium text-blue-900 hover:text-blue-800"
        >
          ← Back to home
        </Link>

        <p className="mt-6 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-blue-900">
          Case review
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Start with a basic fit check
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Answer a few questions about your family immigration matter. No passport or
          financial documents are needed at this step.
        </p>
        {!isAuthenticated ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
            Your answers stay in this browser tab only. If you reload or close the page before signing in,
            you will need to enter them again.
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className={`mt-8 space-y-6 ${formSurfaceClass}`}
          noValidate
        >
          <div>
            <label htmlFor="case-review-matter-type" className={formLabelClass}>
              Family petition type <span className="text-blue-900">*</span>
            </label>
            <select
              id="case-review-matter-type"
              name="caseType"
              value={form.caseType}
              onChange={handleChange}
              required
              className={formInputClass}
            >
              <option value="">Select a matter type</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="case-review-relationship" className={formLabelClass}>
              Petitioner / beneficiary relationship <span className="text-blue-900">*</span>
            </label>
            <select
              id="case-review-relationship"
              name="petitionRelationship"
              value={form.petitionRelationship}
              onChange={handleChange}
              required
              className={formInputClass}
            >
              <option value="">Select relationship</option>
              {relationshipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="case-review-location" className={formLabelClass}>
              Location / jurisdiction <span className="text-blue-900">*</span>
            </label>
            <input
              id="case-review-location"
              name="location"
              type="text"
              value={form.location}
              onChange={handleChange}
              placeholder="City, state, or country where you are located"
              required
              className={formInputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              {availabilityDisclaimers.caseTypeHelper}{" "}
              <Link to="/availability" className="text-blue-900 underline hover:text-blue-800">
                View availability
              </Link>
              .
            </p>
          </div>

          <fieldset className={`p-4 ${cardInsetClass}`}>
            <legend className="px-1 text-sm font-medium text-slate-700">
              Urgent deadline
            </legend>
            <label htmlFor="case-review-urgent" className="mt-2 flex items-start gap-3">
              <input
                id="case-review-urgent"
                name="hasUrgentDeadline"
                type="checkbox"
                checked={form.hasUrgentDeadline}
                onChange={handleChange}
                className="mt-1"
              />
              <span className="text-base leading-7 text-slate-600">
                I have an upcoming deadline or time-sensitive issue
              </span>
            </label>
            {form.hasUrgentDeadline ? (
              <div className="mt-4">
                <label htmlFor="case-review-deadline-notes" className={formLabelClass}>
                  Briefly describe the deadline (optional)
                </label>
                <input
                  id="case-review-deadline-notes"
                  name="urgentDeadlineNotes"
                  type="text"
                  value={form.urgentDeadlineNotes}
                  onChange={handleChange}
                  className={formInputClass}
                />
              </div>
            ) : null}
          </fieldset>

          <div>
            <label htmlFor="case-review-email" className={formLabelClass}>
              Contact email <span className="text-blue-900">*</span>
            </label>
            <input
              id="case-review-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              className={formInputClass}
            />
          </div>

          <label htmlFor="case-review-acknowledge" className={`flex items-start gap-3 p-4 ${cardInsetClass}`}>
            <input
              id="case-review-acknowledge"
              name="acknowledgeNotLegalAdvice"
              type="checkbox"
              checked={form.acknowledgeNotLegalAdvice}
              onChange={handleChange}
              required
              className="mt-1"
            />
            <span className="text-base leading-7 text-slate-600">
              {availabilityDisclaimers.intakeAcknowledgment}{" "}
              {availabilityDisclaimers.notLegalAdviceBeforeReview}
            </span>
          </label>

          {error ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <p className="text-base leading-7 text-slate-600" role="note">
            Submitting information does not create an attorney-client relationship. Your
            matter must be reviewed and accepted by the firm before legal advice or
            representation is provided.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Continue to next step
            </button>
            <Link
              to="/#pricing"
              className="text-center text-sm font-medium text-blue-900 underline hover:text-blue-800"
            >
              View pricing first
            </Link>
            <Link
              to="/login"
              state={{ from: "/intake/package" }}
              className="text-center text-sm font-medium text-slate-600 underline hover:text-slate-950"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
