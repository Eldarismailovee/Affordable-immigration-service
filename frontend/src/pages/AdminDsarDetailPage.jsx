import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  addAdminDsarNote,
  applyAdminDsarAnonymization,
  applyAdminDsarCcpaOptOut,
  applyAdminDsarRestriction,
  generateAdminDsarExport,
  generateAdminDsarPdfExport,
  getAdminDsarRequest,
  resolveAdminDsarObjection,
  updateAdminDsarLegalHold,
  updateAdminDsarStatus,
  verifyAdminDsarIdentity,
} from "../services/api";

export default function AdminDsarDetailPage() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminDsarRequest(requestId);
      setRequest(result.request);
    } catch (err) {
      setError(err.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route id changes
  }, [requestId]);

  async function runAction(name, fn) {
    setBusy(name);
    setError("");
    try {
      const result = await fn();
      setRequest(result.request);
    } catch (err) {
      setError(err.message || `Action failed: ${name}`);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <p className="min-h-screen bg-[#040816] px-4 py-10 text-slate-300">Loading...</p>;
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#040816] px-4 py-10 text-white">
        <p>{error || "Request not found"}</p>
        <Link to="/admin/privacy-requests" className="text-amber-300">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6">
      <main id="main-content" className="mx-auto max-w-3xl">
        <Link to="/admin/privacy-requests" className="text-sm text-amber-300 hover:text-amber-200">
          ← Privacy requests
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Privacy request</h1>
        <p className="mt-2 text-slate-300">
          {request.requesterEmail} · {request.type} · {request.status.replace(/_/g, " ")}
        </p>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </p>
        ) : null}

        <section className="mt-8 space-y-3 rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm">
          <p>
            <strong>Identity:</strong> {request.identityVerificationStatus}
          </p>
          <p>
            <strong>Legal hold:</strong> {request.legalHold ? "Yes" : "No"}
            {request.legalHoldReason ? ` — ${request.legalHoldReason}` : ""}
          </p>
          <p>
            <strong>User message:</strong> {request.userMessage || "—"}
          </p>
          {request.adminNotes ? (
            <pre className="whitespace-pre-wrap rounded-xl bg-slate-950/50 p-4 text-slate-300">
              {request.adminNotes}
            </pre>
          ) : null}
          <p>
            <strong>Export:</strong> JSON {request.hasExport ? "yes" : "no"} · PDF{" "}
            {request.hasExportPdf ? "yes" : "no"}
          </p>
        </section>

        {isAdmin ? (
          <section className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                runAction("verify", () =>
                  verifyAdminDsarIdentity(requestId, {
                    status: "verified",
                    notes: "Verified by admin",
                  })
                )
              }
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Mark identity verified
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runAction("export", () => generateAdminDsarExport(requestId))}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
            >
              Generate JSON export
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runAction("pdf", () => generateAdminDsarPdfExport(requestId))}
              className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
            >
              Generate PDF summary
            </button>
            {request.type === "deletion" ? (
              <button
                type="button"
                disabled={!!busy || request.legalHold}
                onClick={() => runAction("anonymize", () => applyAdminDsarAnonymization(requestId))}
                className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-200 disabled:opacity-50"
              >
                Anonymize account
              </button>
            ) : null}
            {request.type === "restriction" ? (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => runAction("restrict", () => applyAdminDsarRestriction(requestId))}
                className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
              >
                Apply restriction
              </button>
            ) : null}
            {request.type === "objection" ? (
              <>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    runAction("objection-accept", () =>
                      resolveAdminDsarObjection(requestId, {
                        accepted: true,
                        notes: "Objection accepted",
                      })
                    )
                  }
                  className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Accept objection
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    runAction("objection-deny", () =>
                      resolveAdminDsarObjection(requestId, {
                        accepted: false,
                        denialReason: "Not accepted after review",
                      })
                    )
                  }
                  className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Deny objection
                </button>
              </>
            ) : null}
            {request.type === "ccpa_opt_out" ? (
              <button
                type="button"
                disabled={!!busy}
                onClick={() =>
                  runAction("ccpa", () =>
                    applyAdminDsarCcpaOptOut(requestId, {
                      explanation: "Opt-out recorded; we do not sell personal information as defined by applicable law.",
                    })
                  )
                }
                className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
              >
                Record CCPA opt-out
              </button>
            ) : null}
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                runAction("complete", () =>
                  updateAdminDsarStatus(requestId, { status: "completed" })
                )
              }
              className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm text-emerald-200 disabled:opacity-50"
            >
              Mark completed
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() =>
                runAction("legal-hold", () =>
                  updateAdminDsarLegalHold(requestId, {
                    legalHold: !request.legalHold,
                    reason: request.legalHold ? undefined : "Legal hold applied for review",
                  })
                )
              }
              className="rounded-full border border-amber-500/40 px-4 py-2 text-sm disabled:opacity-50"
            >
              {request.legalHold ? "Remove legal hold" : "Apply legal hold"}
            </button>
          </section>
        ) : null}

        {isAdmin ? (
          <section className="mt-8">
            <label htmlFor="dsar-admin-note" className="block text-sm text-slate-300">
              Admin note
            </label>
            <textarea
              id="dsar-admin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
            />
            <button
              type="button"
              disabled={!!busy || !note.trim()}
              onClick={() =>
                runAction("note", async () => {
                  const result = await addAdminDsarNote(requestId, note.trim());
                  setNote("");
                  return result;
                })
              }
              className="mt-3 rounded-full bg-white/10 px-4 py-2 text-sm disabled:opacity-50"
            >
              Add note
            </button>
          </section>
        ) : null}

        {request.events?.length ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Events</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {request.events.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-white/5 bg-white/5 px-4 py-2">
                  {ev.eventType} · {new Date(ev.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
