import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
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
      navigate(user.role === "admin" ? "/admin" : "/account", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-16 text-white">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8"
      >
        <Link to="/" className="text-sm font-medium text-amber-400 hover:text-amber-300">
          Back home
        </Link>
        <div className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
          Register
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-3 text-slate-300">
          Registered clients can submit intake and access their own documents.
        </p>

        <div className="mt-8 grid gap-4">
          <input
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            placeholder="Full name"
            autoComplete="name"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            placeholder="Email"
            autoComplete="email"
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
            placeholder="Password, at least 8 characters"
            autoComplete="new-password"
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
          <Link
            to="/login"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
