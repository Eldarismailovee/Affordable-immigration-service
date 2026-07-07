import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formInputClass, formLabelClass, formSurfaceClass, pageSurfaceClass } from "../constants/themeClasses.js";

export default function MfaEnrollmentPage() {
  const navigate = useNavigate();
  const {
    mfaChallenge,
    enrollmentSetup,
    recoveryCodes,
    beginEnrollment,
    finishEnrollment,
    acknowledgeRecoveryCodes,
  } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAck, setSavedAck] = useState(false);

  useEffect(() => {
    if (mfaChallenge?.enrollmentRequired && !enrollmentSetup && !recoveryCodes) {
      beginEnrollment().catch((err) => setError(err.message));
    }
  }, [beginEnrollment, enrollmentSetup, mfaChallenge, recoveryCodes]);

  async function handlePasswordStart(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await beginEnrollment({ password });
    } catch (err) {
      setError(err.message || "Could not start enrollment");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await finishEnrollment(code);
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  function handleRecoveryDone() {
    acknowledgeRecoveryCodes();
    navigate(mfaChallenge?.user?.role === "admin" ? "/admin" : "/account", { replace: true });
  }

  if (recoveryCodes?.length) {
    return (
      <div className={`${pageSurfaceClass} px-4 py-16`}>
        <main className="mx-auto max-w-xl">
          <div className={`${formSurfaceClass} p-8`}>
            <h1 className="text-3xl font-semibold text-slate-950">Save your recovery codes</h1>
            <p className="mt-3 text-slate-600">
              These codes are shown once. Store them securely offline. They are not saved in this browser.
            </p>
            <ul className="mt-6 grid gap-2 font-mono text-sm">
              {recoveryCodes.map((entry) => (
                <li key={entry} className="rounded-lg bg-slate-100 px-3 py-2">
                  {entry}
                </li>
              ))}
            </ul>
            <label className="mt-6 flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={savedAck}
                onChange={(event) => setSavedAck(event.target.checked)}
              />
              I have saved these recovery codes in a secure place
            </label>
            <button
              type="button"
              disabled={!savedAck}
              onClick={handleRecoveryDone}
              className="mt-6 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!enrollmentSetup) {
    return (
      <div className={`${pageSurfaceClass} px-4 py-16`}>
        <main className="mx-auto max-w-xl">
          <form onSubmit={handlePasswordStart} className={`${formSurfaceClass} p-8`}>
            <h1 className="text-3xl font-semibold text-slate-950">Set up two-factor authentication</h1>
            <p className="mt-3 text-slate-600">
              Privileged accounts must enroll MFA before accessing admin tools.
            </p>
            {!mfaChallenge?.token ? (
              <div className="mt-6">
                <label htmlFor="enroll-password" className={formLabelClass}>
                  Confirm your password
                </label>
                <input
                  id="enroll-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={formInputClass}
                  required
                />
              </div>
            ) : null}
            {error ? <p className="mt-4 text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              {loading ? "Starting..." : "Begin setup"}
            </button>
            <Link to="/login" className="ml-4 text-sm font-medium text-blue-900">
              Back to sign in
            </Link>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className={`${pageSurfaceClass} px-4 py-16`}>
      <main className="mx-auto max-w-xl">
        <form onSubmit={handleConfirm} className={`${formSurfaceClass} p-8`}>
          <h1 className="text-3xl font-semibold text-slate-950">Scan QR code</h1>
          <p className="mt-3 text-slate-600">
            Add this account to your authenticator app, then enter the first code to finish setup.
          </p>
          {enrollmentSetup.qrCodeDataUrl ? (
            <img
              src={enrollmentSetup.qrCodeDataUrl}
              alt="Authenticator QR code"
              className="mt-6 mx-auto h-48 w-48 rounded-xl border border-slate-200 bg-white p-3"
            />
          ) : null}
          <div className="mt-8">
            <label htmlFor="enroll-code" className={formLabelClass}>
              Verification code
            </label>
            <input
              id="enroll-code"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={formInputClass}
              required
            />
          </div>
          {error ? <p className="mt-4 text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            {loading ? "Confirming..." : "Confirm and enable MFA"}
          </button>
        </form>
      </main>
    </div>
  );
}
