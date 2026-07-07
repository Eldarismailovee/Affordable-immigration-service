import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";
import { formInputClass, formLabelClass } from "../../constants/themeClasses.js";

export default function ClientStepPage() {
  const navigate = useNavigate();
  const { intake, updateField } = useIntake();

  function handleContinue() {
    navigate("/intake/case");
  }

  return (
    <div>
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-blue-900">Step 2</div>
      <h2 className="mt-2 text-3xl font-semibold text-slate-950">Client information</h2>
      <p className="mt-3 text-slate-600">Enter your name, email, and phone number.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="intake-first-name" className={formLabelClass}>
            First name
          </label>
          <input
            id="intake-first-name"
            name="firstName"
            value={intake.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            className={formInputClass}
            autoComplete="given-name"
            required
          />
        </div>
        <div>
          <label htmlFor="intake-last-name" className={formLabelClass}>
            Last name
          </label>
          <input
            id="intake-last-name"
            name="lastName"
            value={intake.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            className={formInputClass}
            autoComplete="family-name"
            required
          />
        </div>
        <div>
          <label htmlFor="intake-email" className={formLabelClass}>
            Email
          </label>
          <input
            id="intake-email"
            name="email"
            type="email"
            value={intake.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={formInputClass}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="intake-phone" className={formLabelClass}>
            Phone
          </label>
          <input
            id="intake-phone"
            name="phone"
            type="tel"
            value={intake.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={formInputClass}
            autoComplete="tel"
            required
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/package")}
          className="text-slate-600 hover:text-slate-950"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
