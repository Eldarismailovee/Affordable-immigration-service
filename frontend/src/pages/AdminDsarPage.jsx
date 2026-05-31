import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAdminDsarRequests } from "../services/api";

const STATUS_OPTIONS = ["all", "submitted", "identity_verification_required", "identity_verified", "in_review", "action_required", "completed", "denied", "cancelled"];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminDsarPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminDsarRequests();
      setRequests(result.requests || []);
    } catch (err) {
      setError(err.message || "Failed to load privacy requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      return true;
    });
  }, [requests, statusFilter, typeFilter]);

  const types = useMemo(() => {
    const set = new Set(requests.map((r) => r.type));
    return ["all", ...set];
  }, [requests]);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <main id="main-content" className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              {isAdmin ? "Admin" : "Staff"}
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Privacy requests</h1>
            <p className="mt-3 text-slate-300">
              Review DSAR / privacy rights requests, verify identity, and process exports or restrictions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40"
            >
              Leads
            </Link>
            <button
              type="button"
              onClick={loadRequests}
              className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <label htmlFor="dsar-status-filter" className="flex items-center gap-2 text-sm text-slate-300">
            Status
            <select
              id="dsar-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All" : s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="dsar-type-filter" className="flex items-center gap-2 text-sm text-slate-300">
            Type
            <select
              id="dsar-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-white"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All types" : t}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-slate-400">Loading requests...</p>
        ) : (
          <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/5">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Identity</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-4 py-3">{item.requesterEmail}</td>
                    <td className="px-4 py-3">{item.type}</td>
                    <td className="px-4 py-3">{item.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{item.identityVerificationStatus}</td>
                    <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/privacy-requests/${item.id}`}
                        className="text-amber-300 hover:text-amber-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length ? (
              <p className="px-4 py-8 text-center text-slate-400">No privacy requests match the filters.</p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
