import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAgreementByLead, getAgreementPdfUrl } from "../services/api";

export default function AgreementPage() {
  const { leadId } = useParams();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
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
            <Link
              to="/admin"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
            >
              Back to admin
            </Link>
            <a
              href={getAgreementPdfUrl(leadId)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300"
            >
              Download PDF
            </a>
            <Link
              to="/"
              className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Back home
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
            Loading agreement...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-300">
            {error}
          </div>
        ) : null}

        {!loading && !error && agreement ? (
          <div
            className="prose prose-invert max-w-none rounded-[2rem] border border-white/10 bg-white/5 p-8"
            dangerouslySetInnerHTML={{ __html: agreement.html_content }}
          />
        ) : null}
      </div>
    </div>
  );
}
