import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white";

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
      const user = await login(form);
      navigate(location.state?.from || (user.role === "admin" ? "/admin" : "/account"), {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-16 text-white">
      <main id="main-content" className="mx-auto max-w-xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
          aria-describedby={error ? "login-form-error" : undefined}
          noValidate
        >
          <Link to="/" className="text-sm font-medium text-amber-400 hover:text-amber-300">
            Back home
          </Link>
          <div className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            Sign in
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-3 text-slate-300">
            Sign in to access your intake, documents, or admin workspace.
          </p>

          <div className="mt-8 grid gap-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={inputClassName}
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-form-error" : undefined}
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className={inputClassName}
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
              className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <Link
              to="/register"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
            >
              Create account
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
