import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Legal
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Terms of Use
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
            <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-3 leading-8">
              By accessing or using this website, you agree to be bound by these Terms of Use.
              If you do not agree to these terms, you should not use the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. Informational Purpose</h2>
            <p className="mt-3 leading-8">
              This website is provided for general informational and administrative purposes only.
              Content on this site does not constitute legal advice and should not be relied upon
              as a substitute for individualized legal counsel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. No Attorney-Client Relationship</h2>
            <p className="mt-3 leading-8">
              Use of this website, completion of any online intake form, submission of documents,
              or communication through the site does not by itself create an attorney-client
              relationship. Engagement is not formally initiated until the first consultation with
              the lawyer confirms the adequacy of the submitted documents and the matter is accepted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Flat Fees and Filing Fees</h2>
            <p className="mt-3 leading-8">
              Legal fees presented on this site are flat-fee ranges for designated services.
              Government filing fees, translation costs, mailing charges, and third-party expenses
              are separate unless expressly stated otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Package Scope</h2>
            <p className="mt-3 leading-8">
              Service packages are limited to the scope described on the website and in the final
              engagement documents. Additional petitions, supplemental filings, expedited processing,
              and work outside the agreed scope may require additional fees.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. User Responsibilities</h2>
            <p className="mt-3 leading-8">
              You agree to provide accurate, current, and complete information. You are responsible
              for ensuring that all documents and information submitted through the site are truthful
              and complete to the best of your knowledge.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">7. Payment Processing</h2>
            <p className="mt-3 leading-8">
              Payment details may be collected for administrative follow-up, but payments are
              processed manually by the office or through approved payment channels. The website does
              not promise immediate acceptance of representation based on payment-related activity
              alone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">8. Timeline Statements</h2>
            <p className="mt-3 leading-8">
              Any filing timeline described on the website, including a two-week internal filing
              timeline, is conditioned on the office receiving all required client documents and
              information in complete and usable form.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">9. Intellectual Property</h2>
            <p className="mt-3 leading-8">
              All text, branding, design elements, graphics, and content on this website are owned
              by or licensed to the firm and may not be copied, reproduced, distributed, or reused
              without written permission, except as allowed by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">10. Limitation of Liability</h2>
            <p className="mt-3 leading-8">
              To the fullest extent permitted by law, the firm disclaims liability for damages
              arising from use of the website, technical interruptions, delays, reliance on general
              information, or unauthorized access to user-submitted content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">11. Third-Party Services</h2>
            <p className="mt-3 leading-8">
              This website may connect with third-party services or platforms for intake, scheduling,
              document management, communication, or workflow support. Use of such services may also
              be subject to their own terms and privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">12. Modifications</h2>
            <p className="mt-3 leading-8">
              The firm may revise these Terms of Use at any time by posting an updated version on
              this website. Continued use of the site after changes are posted constitutes acceptance
              of the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
