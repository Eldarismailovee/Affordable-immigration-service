import { Link } from "react-router-dom";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Legal
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Disclaimer
            </h1>
            <p className="mt-3 text-slate-300">Effective date: March 31, 2026</p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:border-amber-400/40 hover:text-amber-300"
            >
              Back home
            </Link>
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white">1. No Legal Advice</h2>
            <p className="mt-3 leading-8">
              The information on this website is provided for general informational purposes only
              and does not constitute legal advice. Immigration matters are highly fact-specific, and
              no content on this website should be treated as legal advice for any individual case.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. No Attorney-Client Relationship</h2>
            <p className="mt-3 leading-8">
              Contacting the firm, filling out online forms, uploading documents, or using any
              feature of this site does not create an attorney-client relationship. Representation
              begins only after the firm accepts the matter and the first lawyer consultation
              confirms the adequacy of the submitted documents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. Results Not Guaranteed</h2>
            <p className="mt-3 leading-8">
              Past outcomes, examples, or descriptions of services do not guarantee any specific
              result. Immigration adjudications depend on facts, documentation, agency review,
              government processing times, and other circumstances outside the firm’s control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Filing Fees and Third-Party Costs</h2>
            <p className="mt-3 leading-8">
              Government filing fees and other third-party costs are separate from legal fees unless
              explicitly stated otherwise in a final written agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Package and Scope Limitations</h2>
            <p className="mt-3 leading-8">
              Website package descriptions are summaries only. The precise scope of representation,
              attorney responsibilities, client responsibilities, and exclusions are governed by the
              final fee agreement and engagement documents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. Timeline Disclaimer</h2>
            <p className="mt-3 leading-8">
              Internal filing timelines, including any statement that a matter will be filed within
              two weeks, depend on the firm receiving all required client documents, signatures, and
              accurate information in complete form.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">7. Manual Payment Processing</h2>
            <p className="mt-3 leading-8">
              Payment-related information collected through this website is for manual office
              coordination unless a separate secure payment provider is implemented. Submission of
              payment preferences does not itself confirm engagement or representation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">8. Communication Risk</h2>
            <p className="mt-3 leading-8">
              Internet communications may not always be secure. You should avoid sending highly
              sensitive information unless and until the firm instructs you to do so through an
              approved secure channel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">9. Jurisdictional Notice</h2>
            <p className="mt-3 leading-8">
              Website access from any location does not necessarily mean that legal services are
              available in every jurisdiction or for every matter. Services remain subject to
              applicable law, professional responsibility rules, and firm acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">10. Professional Review Required</h2>
            <p className="mt-3 leading-8">
              This disclaimer, along with the Terms and Privacy Policy, should be reviewed and
              finalized by qualified legal counsel before public launch.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
