import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAccountLeads } from "../services/api";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function StatusBadge({ value }) {
  const normalized = (value || "").toLowerCase();
  let classes = "border-white/10 bg-white/5 text-slate-300";

  if (normalized.includes("generated") || normalized === "paid") {
    classes = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (normalized.includes("pending") || normalized.includes("requested")) {
    classes = "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
      {value || "—"}
    </span>
  );
}

export default function AccountPage() {
  const { user, logout, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeads() {
      setLoading(true);
      setError("");

      try {
        const result = await getAccountLeads();
        setLeads(result.leads || []);
      } catch (err) {
        setError(err.message || "Failed to load your matters");
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, []);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <main id="main-content" className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Client account
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Your dashboard
            </h1>
            <p className="mt-3 text-slate-300">
              Signed in as {user?.fullName || user?.email}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
              >
                Admin
              </Link>
            ) : null}
            <Link
              to="/start"
              className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
            >
              Start intake
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
            >
              Sign out
            </button>
          </div>
        </div>

        {loading ? (
          <div role="status" className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
            Loading your matters...
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && leads.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-semibold">No intake records yet</h2>
            <p className="mt-3 text-slate-300">
              Start an intake to create your client record and generated documents.
            </p>
          </div>
        ) : null}

        {!loading && !error && leads.length > 0 ? (
          <div className="grid gap-5">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {lead.case_type || "Immigration matter"}
                    </h2>
                    <p className="mt-2 text-slate-300">
                      {lead.selected_package || "Package pending"} · Created {formatDate(lead.created_at)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusBadge value={lead.agreement_document_status || lead.agreement_status} />
                      <StatusBadge value={lead.onboarding_status} />
                      <StatusBadge value={lead.payment_status} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {lead.agreement_document_status ? (
                      <Link
                        to={`/agreement/${lead.id}`}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
                      >
                        Agreement
                      </Link>
                    ) : null}
                    {lead.onboarding_status ? (
                      <Link
                        to={`/onboarding/${lead.id}`}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
                      >
                        Onboarding
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
