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
        <input
          value={intake.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="First name"
        />
        <input
          value={intake.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Last name"
        />
        <input
          value={intake.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Email"
        />
        <input
          value={intake.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
          placeholder="Phone"
        />
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