import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOnboardingPacket, getOnboardingPdfUrl } from "../services/api";

export default function OnboardingPacketPage() {
  const { leadId } = useParams();
  const [packet, setPacket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPacket() {
      setLoading(true);
      setError("");

      try {
        const result = await getOnboardingPacket(leadId);
        setPacket(result.onboarding);
      } catch (err) {
        setError(err.message || "Failed to load onboarding packet");
      } finally {
        setLoading(false);
      }
    }

    loadPacket();
  }, [leadId]);

  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Onboarding packet
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Client onboarding
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
              href={getOnboardingPdfUrl(leadId)}
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
            Loading onboarding packet...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-red-300">
            {error}
          </div>
        ) : null}

        {!loading && !error && packet ? (
          <div
            className="prose prose-invert max-w-none rounded-[2rem] border border-white/10 bg-white/5 p-8"
            dangerouslySetInnerHTML={{ __html: packet.html_content }}
          />
        ) : null}
      </div>
    </div>
  );
}
