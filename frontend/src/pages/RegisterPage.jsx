import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formInputClass, formLabelClass, formSurfaceClass, pageSurfaceClass } from "../constants/themeClasses.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
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
      const user = await register(form);
      navigate("/verify-email", {
        replace: true,
        state: { from: location.state?.from || (user.role === "admin" ? "/admin" : "/account") },
      });
    } catch (err) {
      setError(err.message || "Failed to create account");
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
          aria-describedby={error ? "register-form-error" : undefined}
          noValidate
        >
          <Link to="/" className="text-sm font-medium text-blue-900 hover:text-blue-800">
            Back home
          </Link>
          <div className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-blue-900">
            Register
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create account</h1>
          <p className="mt-3 text-slate-600">
            Registered clients can submit intake and access their own documents.
          </p>

          <div className="mt-8 grid gap-4">
            <div>
              <label htmlFor="register-full-name" className={formLabelClass}>
                Full name
              </label>
              <input
                id="register-full-name"
                name="fullName"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className={formInputClass}
                autoComplete="name"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "register-form-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="register-email" className={formLabelClass}>
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={formInputClass}
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "register-form-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="register-password" className={formLabelClass}>
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className={formInputClass}
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "register-form-error register-password-help" : "register-password-help"}
              />
              <p id="register-password-help" className="mt-1.5 text-sm text-slate-600">
                At least 8 characters.
              </p>
            </div>
          </div>

          {error ? (
            <div
              id="register-form-error"
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
              {loading ? "Creating..." : "Create account"}
            </button>
            <Link
              to="/login"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:border-slate-400 hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
