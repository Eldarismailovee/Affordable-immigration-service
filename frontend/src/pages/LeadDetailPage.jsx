import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  generateAgreementForLead,
  generateOnboardingPacketForLead,
  getAdminLeadDetail,
  syncLeadToDocketwise,
  updateHostedPaymentUrl,
  updatePaymentStatus,
} from "../services/api";
import { sanitizeDocumentHtml } from "../utils/sanitizeDocumentHtml";

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

  if (normalized.includes("generated") || normalized.includes("synced") || normalized === "paid") {
    classes = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (normalized.includes("requested") || normalized.includes("pending") || normalized.includes("invoice")) {
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

function InfoRow({ label, value }) {
  return (
    <div className="grid gap-2 border-b border-white/10 py-3 md:grid-cols-[180px_1fr]">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="text-sm text-slate-200">{value || "—"}</div>
    </div>
  );
}

function SectionCard({ title, children, actions }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingAgreement, setGeneratingAgreement] = useState(false);
  const [generatingPacket, setGeneratingPacket] = useState(false);
  const [syncingDocketwise, setSyncingDocketwise] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [hostedPaymentUrl, setHostedPaymentUrl] = useState("");
  const [savingHostedUrl, setSavingHostedUrl] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminLeadDetail(leadId);
      setDetail(result);
    } catch (err) {
      setError(err.message || "Failed to load lead detail");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  async function handleGenerateAgreement() {
    setGeneratingAgreement(true);
    setError("");

    try {
      await generateAgreementForLead(leadId);
      await loadDetail();
    } catch (err) {
      setError(err.message || "Failed to generate agreement");
    } finally {
      setGeneratingAgreement(false);
    }
  }

  async function handleGeneratePacket() {
    setGeneratingPacket(true);
    setError("");

    try {
      await generateOnboardingPacketForLead(leadId);
      await loadDetail();
    } catch (err) {
      setError(err.message || "Failed to generate onboarding packet");
    } finally {
      setGeneratingPacket(false);
    }
  }

  async function handleSyncDocketwise() {
    setSyncingDocketwise(true);
    setError("");

    try {
      await syncLeadToDocketwise(leadId);
      await loadDetail();
    } catch (err) {
      setError(err.message || "Failed to sync with Docketwise");
    } finally {
      setSyncingDocketwise(false);
    }
  }

  async function handlePaymentStatus(status) {
    setUpdatingPayment(true);
    setError("");

    try {
      await updatePaymentStatus(leadId, status);
      await loadDetail();
    } catch (err) {
      setError(err.message || "Failed to update payment status");
    } finally {
      setUpdatingPayment(false);
    }
  }

  async function handleSaveHostedPaymentUrl(event) {
    event.preventDefault();
    setSavingHostedUrl(true);
    setError("");

    try {
      await updateHostedPaymentUrl(leadId, { hostedPaymentUrl: hostedPaymentUrl.trim() });
      await loadDetail();
    } catch (err) {
      setError(err.message || "Failed to save hosted payment URL");
    } finally {
      setSavingHostedUrl(false);
    }
  }

  useEffect(() => {
    setHostedPaymentUrl(detail?.payment?.hosted_payment_url || "");
  }, [detail?.payment?.hosted_payment_url]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <main id="main-content" className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Admin / Lead detail
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Lead profile
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Review the full lead record, agreement, onboarding packet, booking,
              payment, and Docketwise status.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/admin"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
            >
              Back to admin
            </Link>
            <Link
              to="/"
              className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Back home
            </Link>
          </div>
        </div>

        {loading ? (
          <div role="status" className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
            Loading lead detail...
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && detail ? (
          <div className="grid gap-6">
            <SectionCard title="Client">
              <InfoRow
                label="Name"
                value={`${detail.lead?.first_name || ""} ${detail.lead?.last_name || ""}`.trim()}
              />
              <InfoRow label="Email" value={detail.lead?.email} />
              <InfoRow label="Phone" value={detail.lead?.phone} />
              <InfoRow label="Status" value={detail.lead?.status} />
              <InfoRow label="Created" value={formatDate(detail.lead?.created_at)} />
              <InfoRow label="Lead ID" value={detail.lead?.id} />
            </SectionCard>

            <SectionCard title="Intake">
              <InfoRow label="Package" value={detail.intake?.selected_package} />
              <InfoRow label="Case type" value={detail.intake?.case_type} />
              <InfoRow label="Additional I-130" value={detail.intake?.additional_i130_count} />
              <InfoRow label="Expedited" value={detail.intake?.expedited ? "Yes" : "No"} />
              <InfoRow
                label="Pricing range"
                value={
                  detail.intake?.pricing_min && detail.intake?.pricing_max
                    ? `$${detail.intake.pricing_min} – $${detail.intake.pricing_max}`
                    : "—"
                }
              />
              <InfoRow label="Notes" value={detail.intake?.notes} />
              <div className="pt-4 flex flex-wrap gap-3">
                <StatusBadge value={detail.intake?.agreement_status} />
                <StatusBadge value={detail.intake?.booking_status} />
                <StatusBadge value={detail.intake?.payment_status} />
                <StatusBadge value={detail.intake?.docketwise_status} />
              </div>
            </SectionCard>

            <SectionCard
              title="Agreement"
              actions={
                detail.agreement ? (
                  <Link
                    to={`/agreement/${leadId}`}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
                  >
                    Open agreement
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateAgreement}
                    disabled={generatingAgreement}
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                  >
                    {generatingAgreement ? "Generating..." : "Generate agreement"}
                  </button>
                )
              }
            >
              <div className="mb-4">
                <StatusBadge value={detail.agreement?.status || detail.intake?.agreement_status} />
              </div>

              {detail.agreement?.html_content ? (
                <div
                  className="prose prose-invert max-w-none rounded-3xl border border-white/10 bg-slate-950/50 p-6"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeDocumentHtml(detail.agreement.html_content),
                  }}
                />
              ) : (
                <div className="text-slate-400">No agreement found.</div>
              )}
            </SectionCard>

            <SectionCard
              title="Onboarding packet"
              actions={
                detail.onboarding ? (
                  <Link
                    to={`/onboarding/${leadId}`}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
                  >
                    Open packet
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleGeneratePacket}
                    disabled={generatingPacket}
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                  >
                    {generatingPacket ? "Generating..." : "Generate packet"}
                  </button>
                )
              }
            >
              <div className="mb-4">
                <StatusBadge value={detail.onboarding?.status} />
              </div>

              {detail.onboarding?.title ? (
                <>
                  <InfoRow label="Title" value={detail.onboarding.title} />
                  <InfoRow
                    label="Generated"
                    value={formatDate(detail.onboarding.generated_at)}
                  />
                </>
              ) : (
                <div className="text-slate-400">No onboarding packet found.</div>
              )}
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-3">
              <SectionCard title="Booking">
                <InfoRow label="Type" value={detail.booking?.consultation_type} />
                <InfoRow label="Preferred date/time" value={detail.booking?.preferred_date_time} />
                <InfoRow label="Status" value={detail.booking?.status} />
                <InfoRow label="Created" value={formatDate(detail.booking?.created_at)} />
              </SectionCard>

              <SectionCard title="Payment">
                <InfoRow
                  label="Amount range"
                  value={
                    detail.payment?.amount_min && detail.payment?.amount_max
                      ? `$${detail.payment.amount_min} – $${detail.payment.amount_max}`
                      : "—"
                  }
                />
                <InfoRow label="Status" value={detail.payment?.status} />
                <InfoRow
                  label="Billing name"
                  value={detail.payment?.billing_name}
                />
                <InfoRow
                  label="Billing email"
                  value={detail.payment?.billing_email}
                />
                <InfoRow
                  label="Payment preference"
                  value={detail.payment?.payment_preference}
                />
                <InfoRow
                  label="Manual processing consent"
                  value={detail.payment?.consent_manual_processing ? "Yes" : "No"}
                />
                <InfoRow
                  label="Manual review"
                  value={detail.payment?.manual_review ? "Yes" : "No"}
                />
                <InfoRow label="Notes" value={detail.payment?.notes} />
                {detail.payment?.notes_redacted ? (
                  <InfoRow label="Notes redacted" value="Yes (card-like data removed)" />
                ) : null}
                <InfoRow
                  label="Payment method"
                  value={detail.payment?.payment_method || "payment_link"}
                />
                <InfoRow
                  label="Hosted payment URL"
                  value={
                    detail.payment?.hosted_payment_url ? (
                      <a
                        href={detail.payment.hosted_payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 underline hover:text-amber-200"
                      >
                        Pay securely (hosted checkout)
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />

                <form onSubmit={handleSaveHostedPaymentUrl} className="mt-4 space-y-3">
                  <label className="block text-sm text-slate-300" htmlFor="hosted-payment-url">
                    Set hosted payment link (HTTPS only)
                  </label>
                  <input
                    id="hosted-payment-url"
                    type="url"
                    value={hostedPaymentUrl}
                    onChange={(e) => setHostedPaymentUrl(e.target.value)}
                    placeholder="https://checkout.stripe.com/..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={savingHostedUrl || !hostedPaymentUrl.trim()}
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                  >
                    {savingHostedUrl ? "Saving..." : "Save payment link"}
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "payment_requested",
                    "invoice_sent",
                    "paid",
                    "failed",
                  ].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handlePaymentStatus(status)}
                      disabled={updatingPayment}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:border-amber-400/40 hover:text-amber-300 disabled:opacity-60"
                    >
                      {updatingPayment ? "Updating..." : status}
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Docketwise"
                actions={
                  detail.docketwise?.status === "synced" ? null : (
                    <button
                      type="button"
                      onClick={handleSyncDocketwise}
                      disabled={syncingDocketwise}
                      className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                      {syncingDocketwise ? "Syncing..." : "Sync Docketwise"}
                    </button>
                  )
                }
              >
                <InfoRow label="Status" value={detail.docketwise?.status} />
                <InfoRow label="External ID" value={detail.docketwise?.external_id} />
                <InfoRow label="Last synced" value={formatDate(detail.docketwise?.last_synced_at)} />
                <InfoRow label="Error" value={detail.docketwise?.error_message} />
              </SectionCard>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
