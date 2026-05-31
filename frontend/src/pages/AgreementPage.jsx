import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAgreementByLead, openAgreementPdf } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { sanitizeDocumentHtml } from "../utils/sanitizeDocumentHtml";

export default function AgreementPage() {
  const { leadId } = useParams();
  const { isAdmin } = useAuth();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingPdf, setOpeningPdf] = useState(false);

  useEffect(() => {
    async function loadAgreement() {
      setLoading(true);
      setError("");

      try {
        const result = await getAgreementByLead(leadId);
        setAgreement(result.agreement);
      } catch (err) {
        setError(err.message || "Failed to load agreement");
      } finally {
        setLoading(false);
      }
    }

    loadAgreement();
  }, [leadId]);

  async function handleOpenPdf() {
    setOpeningPdf(true);
    setError("");

    try {
      await openAgreementPdf(leadId);
    } catch (err) {
      setError(err.message || "Failed to open PDF");
    } finally {
      setOpeningPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6">
      <main id="main-content" className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Agreement
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Fee agreement
            </h1>
          </div>

          <div className="flex gap-3">
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
              >
                Back to admin
              </Link>
            ) : (
              <Link
                to="/account"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
              >
                Account
              </Link>
            )}
            <button
              type="button"
              onClick={handleOpenPdf}
              disabled={openingPdf}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
            >
              {openingPdf ? "Opening..." : "Download PDF"}
            </button>
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
            Loading agreement...
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && agreement ? (
          <>
            <p className="mb-4 text-sm text-slate-300">
              This page is the accessible HTML view of your fee agreement. You can also download a
              PDF copy below; PDF accessibility may vary by viewer.
            </p>
            <article
              className="prose prose-invert max-w-none rounded-[2rem] border border-white/10 bg-white/5 p-8"
              aria-label="Fee agreement content"
              dangerouslySetInnerHTML={{ __html: sanitizeDocumentHtml(agreement.html_content) }}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
