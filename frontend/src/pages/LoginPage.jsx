import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formInputClass, formLabelClass, formSurfaceClass, pageSurfaceClass } from "../constants/themeClasses.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(form);

      if (result?.mfaPending) {
        navigate(
          result.enrollmentRequired ? "/mfa/enroll" : "/mfa/verify",
          { replace: true, state: { from: location.state?.from } }
        );
        return;
      }

      navigate(location.state?.from || (result.role === "admin" ? "/admin" : "/account"), {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${pageSurfaceClass} px-4 py-16`}>
      <main id="main-content" className="mx-auto max-w-xl">
        <form
          onSubmit={handleSubmit}
          className={`${formSurfaceClass} p-8`}
          aria-describedby={error ? "login-form-error" : undefined}
          noValidate
        >
          <Link to="/" className="text-sm font-medium text-blue-900 hover:text-blue-800">
            Back home
          </Link>
          <div className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-blue-900">
            Sign in
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-3 text-slate-600">
            Sign in to access your intake, documents, or admin workspace.
          </p>

          <div className="mt-8 grid gap-4">
            <div>
              <label htmlFor="login-email" className={formLabelClass}>
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={formInputClass}
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-form-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="login-password" className={formLabelClass}>
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className={formInputClass}
                autoComplete="current-password"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-form-error" : undefined}
              />
            </div>
          </div>

          {error ? (
            <div
              id="login-form-error"
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <Link
              to="/register"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:border-slate-400 hover:bg-slate-50"
            >
              Create account
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
