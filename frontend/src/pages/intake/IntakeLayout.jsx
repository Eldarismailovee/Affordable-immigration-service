import { Outlet } from "react-router-dom";
import { useIntake } from "../../context/IntakeContext.jsx";
import { formSurfaceClass, pageSurfaceClass } from "../../constants/themeClasses.js";

function DraftStatusBanner() {
  const { saveStatus, isServerDraftEnabled } = useIntake();

  if (!isServerDraftEnabled || saveStatus === "idle") {
    return null;
  }

  const message =
    saveStatus === "saving"
      ? "Saving draft…"
      : saveStatus === "saved"
        ? "Draft saved securely to your account."
        : "Could not save draft. Changes remain in this tab only.";

  const tone =
    saveStatus === "error"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <p className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${tone}`} role="status">
      {message}
    </p>
  );
}

export default function IntakeLayout() {
  return (
    <div className={pageSurfaceClass}>
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-medium text-blue-900 hover:text-blue-800"
          >
            ← Back to home
          </a>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Start your intake
          </h1>
          <p className="mt-3 text-slate-600">
            Complete each step to begin your immigration matter.
          </p>
        </div>

        <div className={formSurfaceClass}>
          <DraftStatusBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
