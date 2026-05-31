import { useNavigate } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext";

export default function ClientStepPage() {
  const navigate = useNavigate();
  const { intake, updateField } = useIntake();

  function handleContinue() {
    navigate("/intake/case");
  }

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-amber-400">Step 2</div>
      <h2 className="mt-2 text-3xl font-semibold">Client information</h2>
      <p className="mt-3 text-slate-300">Enter your name, email, and phone number.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="intake-first-name" className="mb-1.5 block text-sm font-medium text-slate-200">
            First name
          </label>
          <input
            id="intake-first-name"
            name="firstName"
            value={intake.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            autoComplete="given-name"
            required
          />
        </div>
        <div>
          <label htmlFor="intake-last-name" className="mb-1.5 block text-sm font-medium text-slate-200">
            Last name
          </label>
          <input
            id="intake-last-name"
            name="lastName"
            value={intake.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            autoComplete="family-name"
            required
          />
        </div>
        <div>
          <label htmlFor="intake-email" className="mb-1.5 block text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id="intake-email"
            name="email"
            type="email"
            value={intake.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="intake-phone" className="mb-1.5 block text-sm font-medium text-slate-200">
            Phone
          </label>
          <input
            id="intake-phone"
            name="phone"
            type="tel"
            value={intake.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            autoComplete="tel"
            required
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/intake/package")}
          className="text-slate-300 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
