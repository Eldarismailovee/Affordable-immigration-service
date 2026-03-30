import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  generateAgreementForLead,
  generateOnboardingPacketForLead,
  getAdminLeads,
  syncLeadToDocketwise,
} from "../services/api";

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

  if (normalized.includes("generated") || normalized.includes("synced")) {
    classes = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (normalized.includes("requested") || normalized.includes("pending")) {
    classes = "border-amber-500/30 bg-amber-500/10 text-amber-300";
  } else if (normalized.includes("error") || normalized.includes("failed")) {
    classes = "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
      {value || "—"}
    </span>
  );
}

export default function AdminPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingLeadId, setGeneratingLeadId] = useState("");
  const [generatingAgreementLeadId, setGeneratingAgreementLeadId] = useState("");
  const [syncingLeadId, setSyncingLeadId] = useState("");

  async function loadLeads() {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminLeads();
      setLeads(result.leads || []);
    } catch (err) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePacket(leadId) {
    setGeneratingLeadId(leadId);
    setError("");

    try {
      await generateOnboardingPacketForLead(leadId);
      await loadLeads();
    } catch (err) {
      setError(err.message || "Failed to generate onboarding packet");
    } finally {
      setGeneratingLeadId("");
    }
  }

  async function handleGenerateAgreement(leadId) {
    setGeneratingAgreementLeadId(leadId);
    setError("");

    try {
      await generateAgreementForLead(leadId);
      await loadLeads();
    } catch (err) {
      setError(err.message || "Failed to generate agreement");
    } finally {
      setGeneratingAgreementLeadId("");
    }
  }

  async function handleSyncDocketwise(leadId) {
    setSyncingLeadId(leadId);
    setError("");

    try {
      await syncLeadToDocketwise(leadId);
      await loadLeads();
    } catch (err) {
      setError(err.message || "Failed to sync with Docketwise");
    } finally {
      setSyncingLeadId("");
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Admin
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Leads dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              View new leads, submitted intake records, selected packages,
              pricing ranges, and workflow statuses.
            </p>
          </div>

          <div className="flex gap-3">
            
            <Link
              to="/"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
            >
              Back to site
              <Link
              
  to="/admin/settings"
  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
>
  Site settings
</Link>
            </Link>

            <button
              type="button"
              onClick={loadLeads}
              className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
            Loading leads...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-300">
            {error}
          </div>
        ) : null}

        {!loading && !error && leads.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
            No leads found yet.
          </div>
        ) : null}

        {!loading && !error && leads.length > 0 ? (
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-950/60">
                  <tr className="border-b border-white/10 text-left text-sm text-slate-300">
                    <th className="px-4 py-4 font-medium">Client</th>
                    <th className="px-4 py-4 font-medium">Contact</th>
                    <th className="px-4 py-4 font-medium">Package</th>
                    <th className="px-4 py-4 font-medium">Case type</th>
                    <th className="px-4 py-4 font-medium">Pricing</th>
                    <th className="px-4 py-4 font-medium">Agreement</th>
                    <th className="px-4 py-4 font-medium">Onboarding</th>
                    <th className="px-4 py-4 font-medium">Booking</th>
                    <th className="px-4 py-4 font-medium">Payment</th>
                    <th className="px-4 py-4 font-medium">Docketwise</th>
                    <th className="px-4 py-4 font-medium">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/10 align-top text-sm text-slate-200"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          ID: {lead.id}
                        </div>
                        <Link
                          to={`/admin/leads/${lead.id}`}
                          className="mt-2 inline-block text-xs font-medium text-amber-300 hover:text-amber-200"
                        >
                          Open lead
                        </Link>
                      </td>

                      <td className="px-4 py-4">
                        <div>{lead.email || "—"}</div>
                        <div className="mt-1 text-slate-400">{lead.phone || "—"}</div>
                      </td>

                      <td className="px-4 py-4">{lead.selected_package || "—"}</td>
                      <td className="px-4 py-4">{lead.case_type || "—"}</td>

                      <td className="px-4 py-4">
                        {lead.pricing_min && lead.pricing_max
                          ? `$${lead.pricing_min} – $${lead.pricing_max}`
                          : "—"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge value={lead.agreement_document_status || lead.agreement_status} />
                          {lead.agreement_document_status ? (
                            <Link
                              to={`/agreement/${lead.id}`}
                              className="text-xs font-medium text-amber-300 hover:text-amber-200"
                            >
                              Open agreement
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGenerateAgreement(lead.id)}
                              disabled={generatingAgreementLeadId === lead.id}
                              className="text-left text-xs font-medium text-amber-300 hover:text-amber-200 disabled:opacity-60"
                            >
                              {generatingAgreementLeadId === lead.id
                                ? "Generating..."
                                : "Generate agreement"}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge value={lead.onboarding_status} />
                          {lead.onboarding_status ? (
                            <Link
                              to={`/onboarding/${lead.id}`}
                              className="text-xs font-medium text-amber-300 hover:text-amber-200"
                            >
                              Open packet
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGeneratePacket(lead.id)}
                              disabled={generatingLeadId === lead.id}
                              className="text-left text-xs font-medium text-amber-300 hover:text-amber-200 disabled:opacity-60"
                            >
                              {generatingLeadId === lead.id
                                ? "Generating..."
                                : "Generate packet"}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={lead.booking_status} />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge value={lead.payment_status} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge value={lead.docketwise_status} />
                          {lead.docketwise_status === "synced" ? (
                            <div className="text-xs text-slate-400">
                              {lead.docketwise_external_id || "Synced"}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSyncDocketwise(lead.id)}
                              disabled={syncingLeadId === lead.id}
                              className="text-left text-xs font-medium text-amber-300 hover:text-amber-200 disabled:opacity-60"
                            >
                              {syncingLeadId === lead.id
                                ? "Syncing..."
                                : "Sync Docketwise"}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-400">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
