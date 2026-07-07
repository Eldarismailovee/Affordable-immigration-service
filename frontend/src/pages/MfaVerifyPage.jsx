import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formInputClass, formLabelClass, formSurfaceClass, pageSurfaceClass } from "../constants/themeClasses.js";

export default function MfaVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mfaChallenge, completeMfaVerify } = useAuth();
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!mfaChallenge?.token) {
    return (
      <div className={`${pageSurfaceClass} px-4 py-16`}>
        <main className="mx-auto max-w-xl text-center">
          <p className="text-slate-600">Your verification session expired.</p>
          <Link to="/login" className="mt-4 inline-block font-semibold text-blue-900">
            Sign in again
          </Link>
        </main>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await completeMfaVerify(
        useRecovery ? { recoveryCode } : { code }
      );
      const target =
        location.state?.from ||
        (user.role === "admin" || user.role === "attorney" ? "/admin" : "/account");
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${pageSurfaceClass} px-4 py-16`}>
      <main id="main-content" className="mx-auto max-w-xl">
        <form onSubmit={handleSubmit} className={`${formSurfaceClass} p-8`} noValidate>
          <h1 className="text-3xl font-semibold text-slate-950">Two-factor verification</h1>
          <p className="mt-3 text-slate-600">
            Enter the 6-digit code from your authenticator app
            {mfaChallenge.user?.email ? ` for ${mfaChallenge.user.email}` : ""}.
          </p>

          {!useRecovery ? (
            <div className="mt-8">
              <label htmlFor="mfa-code" className={formLabelClass}>
                Authentication code
              </label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={formInputClass}
                required
              />
            </div>
          ) : (
            <div className="mt-8">
              <label htmlFor="recovery-code" className={formLabelClass}>
                Recovery code
              </label>
              <input
                id="recovery-code"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                className={formInputClass}
                required
              />
            </div>
          )}

          {error ? (
            <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-900"
              onClick={() => setUseRecovery((value) => !value)}
            >
              {useRecovery ? "Use authenticator code" : "Use recovery code"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
