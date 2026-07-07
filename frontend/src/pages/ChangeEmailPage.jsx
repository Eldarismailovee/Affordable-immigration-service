import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { changeEmail } from "../services/api";

export default function ChangeEmailPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await changeEmail({ email, password });
      setMessage(result.message || "Check your inbox to confirm the new email.");
      setPassword("");
      setEmail("");
    } catch (err) {
      setError(err.message || "Could not request email change.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-16 text-white">
      <div className="mx-auto max-w-xl">
        <Card className="space-y-6 p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Account security</p>
            <h1 className="mt-2 text-3xl font-semibold">Change email</h1>
            <p className="mt-3 text-slate-300">
              Current email: <strong>{user?.email}</strong>. Your account stays restricted until
              the new address is verified.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">New email</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Current password</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error ? <p className="text-red-300">{error}</p> : null}
            {message ? <p className="text-emerald-200">{message}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Request email change"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/verify-email")}>
                Back to verification
              </Button>
              <Button type="button" variant="ghost" onClick={() => logout()}>
                Sign out
              </Button>
            </div>
          </form>

          <p className="text-sm text-slate-400">
            Wrong inbox? You can request a new verification email from the{" "}
            <Link className="text-white underline" to="/verify-email">
              verification page
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
