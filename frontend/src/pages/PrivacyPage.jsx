import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#040816] px-4 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Legal
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Privacy Policy
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
            <h2 className="text-2xl font-semibold text-white">1. Information We Collect</h2>
            <p className="mt-3 leading-8">
              We may collect personal information you provide through this website, including your
              name, email address, phone number, case details, billing contact information, intake
              responses, and documents you choose to submit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. How We Use Information</h2>
            <p className="mt-3 leading-8">
              We use collected information to review potential matters, communicate with you,
              generate intake materials, prepare engagement-related documents, coordinate
              consultations, manage administrative workflows, and maintain internal records.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. No Sale of Personal Data</h2>
            <p className="mt-3 leading-8">
              We do not sell your personal data to advertisers. Information submitted through the
              website is used for the firm’s legal, intake, operational, and administrative
              functions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Intake and Documents</h2>
            <p className="mt-3 leading-8">
              Information entered into intake forms and documents uploaded through integrated
              services may be stored in systems used by the firm to manage legal workflows,
              document collection, and client communication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Payment Information</h2>
            <p className="mt-3 leading-8">
              The site may collect billing contact details and payment preferences for manual office
              follow-up. The website is not intended to store full payment card data unless and
              until a compliant payment provider is implemented and disclosed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. Sharing of Information</h2>
            <p className="mt-3 leading-8">
              We may share information with service providers, document platforms, scheduling tools,
              hosting providers, and practice-management tools as reasonably necessary to operate the
              website and legal workflow. We may also disclose information where required by law or
              to protect legal rights and obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">7. Data Security</h2>
            <p className="mt-3 leading-8">
              We use reasonable administrative, technical, and organizational safeguards to protect
              submitted information. However, no method of transmission over the internet or method
              of storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">8. Data Retention</h2>
            <p className="mt-3 leading-8">
              We retain information for as long as reasonably necessary for intake review, legal and
              administrative purposes, compliance obligations, dispute resolution, and internal
              recordkeeping, unless a different retention period is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">9. Cookies and Analytics</h2>
            <p className="mt-3 leading-8">
              The website may use cookies, local storage, session tools, and analytics technologies
              to support site functionality, performance monitoring, and user experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">10. Your Choices</h2>
            <p className="mt-3 leading-8">
              You may contact the firm to request updates or corrections to information you have
              submitted, subject to legal, operational, and ethical obligations that may require
              retention of certain records.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">11. Children’s Privacy</h2>
            <p className="mt-3 leading-8">
              This website is not intended for direct use by children without a parent, guardian,
              sponsor, or adult representative acting on their behalf.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">12. Changes to this Policy</h2>
            <p className="mt-3 leading-8">
              We may update this Privacy Policy from time to time. The updated version will be
              posted on this page with a revised effective date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
