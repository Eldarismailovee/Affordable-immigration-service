import { useState } from "react";
import LegalContactSection from "../components/legal/LegalContactSection";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import LegalSection from "../components/legal/LegalSection";
import {
  DATA_RETENTION_SUMMARY,
  EU_TRANSFER_NOTICE,
  SUBPROCESSORS_DETAIL_NOTICE,
  SUBPROCESSORS_NOTICE,
} from "../data/legalMeta";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import { submitPublicPrivacyRequest } from "../services/api";

const PRIVACY_REQUEST_TYPES = [
  { value: "access", label: "Access / copy of my data" },
  { value: "correction", label: "Correct inaccurate data" },
  { value: "deletion", label: "Delete / anonymize my data" },
  { value: "restriction", label: "Restrict processing" },
  { value: "portability", label: "Data portability" },
  { value: "objection", label: "Object to processing" },
  { value: "ccpa_opt_out", label: "CCPA opt-out of sale/share" },
];

export default function PrivacyPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const firmName = settings?.firm_name || "Immigration Law Firm";
  const contactEmail = settings?.email || "info@immigrationfirm.com";
  const [form, setForm] = useState({
    type: "access",
    email: user?.email || "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  async function handlePrivacySubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const payload = {
        type: form.type,
        message: form.message.trim() || undefined,
      };
      if (!user?.email) {
        payload.email = form.email.trim();
      }
      const result = await submitPublicPrivacyRequest(payload);
      setSubmitSuccess(result.message || "Request submitted.");
      setForm((prev) => ({ ...prev, message: "" }));
    } catch (err) {
      setSubmitError(err.message || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalSection title="1. Last Updated">
        <p>
          This Privacy Policy was last updated on May 31, 2026. We may update this policy from time
          to time as described in Section 19.
        </p>
      </LegalSection>

      <LegalSection title="2. Who We Are / Controller Contact">
        <p>
          {firmName} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates this
          website and related intake, account, and document workflows. For purposes of applicable
          privacy laws, including the EU General Data Protection Regulation (&ldquo;GDPR&rdquo;), we
          act as the data controller for personal information collected through this website,
          subject to applicable law.
        </p>
        <p>
          <strong>Controller contact:</strong> {firmName}, {contactEmail}
        </p>
        <p>
          <strong>Data Protection Officer:</strong> We have not designated a Data Protection
          Officer. For privacy inquiries, contact us using the details in Section 20.
        </p>
      </LegalSection>

      <LegalSection title="3. What Personal Information We Collect">
        <p>Depending on how you use the website, we may collect:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Identity and contact details (name, email, phone, address)</li>
          <li>Account credentials and authentication data</li>
          <li>Immigration intake and case inquiry information</li>
          <li>Documents and files you upload</li>
          <li>Engagement, agreement, and onboarding packet information</li>
          <li>Billing contact details and payment-related preferences</li>
          <li>Consultation booking information</li>
          <li>Communications with us, including support messages</li>
          <li>Technical and security data (IP address, browser type, device data, logs)</li>
          <li>Cookie, session, and local storage data where used for site functionality</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Sources of Personal Information">
        <p>We collect personal information from:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>You directly, when you register, complete intake forms, upload documents, or contact us</li>
          <li>Your use of the website and authenticated account features</li>
          <li>Administrative workflows operated by the firm</li>
          <li>Service providers that support hosting, email, document generation, or security</li>
          <li>Where permitted by law, publicly available or third-party sources relevant to a matter</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Purposes of Processing">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Operate the website and provide account access</li>
          <li>Review potential matters and manage intake workflows</li>
          <li>Generate, review, and deliver engagement-related documents and packets</li>
          <li>Communicate with you about your inquiry, account, or matter</li>
          <li>Coordinate consultations and administrative follow-up</li>
          <li>Maintain records required for legal, ethical, and operational purposes</li>
          <li>Protect the security and integrity of the website and our systems</li>
          <li>Comply with applicable law and respond to lawful requests</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Legal Bases for Processing Under GDPR">
        <p>
          Where GDPR applies, we rely on one or more of the following legal bases, depending on
          context:
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white">
                <th className="py-2 pr-4 font-semibold">Purpose</th>
                <th className="py-2 font-semibold">Legal basis</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Account creation and website operation</td>
                <td className="py-2">Performance of a contract; legitimate interests in operating the service</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Intake review and matter evaluation</td>
                <td className="py-2">Steps prior to contract; legitimate interests in evaluating inquiries</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Legal services and document preparation after engagement</td>
                <td className="py-2">Performance of a contract; compliance with legal obligations</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Security, fraud prevention, and system logs</td>
                <td className="py-2">Legitimate interests in protecting systems and users</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Compliance and recordkeeping</td>
                <td className="py-2">Legal obligation; legitimate interests in maintaining records</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Optional communications or features requiring consent</td>
                <td className="py-2">Consent, where required</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Where we rely on legitimate interests, those interests include operating an immigration
          intake platform, communicating with prospective and current clients, maintaining secure
          systems, and managing firm workflows. You may object to processing based on legitimate
          interests where applicable law provides that right.
        </p>
        <p>
          <strong>Contractual or statutory requirement:</strong> Some information is necessary to
          create an account, submit intake information, or receive services. If required
          information is not provided, we may be unable to provide some or all requested features
          or services.
        </p>
        <p>
          <strong>Automated decision-making:</strong> We do not use automated decision-making that
          produces legal or similarly significant effects.
        </p>
      </LegalSection>

      <LegalSection title="7. How We Share Personal Information">
        <p>We may share personal information with:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Service providers and subprocessors that help us host, secure, and operate the website</li>
          <li>Personnel and contractors working under appropriate confidentiality obligations</li>
          <li>Document generation, storage, and workflow tools used to prepare client materials</li>
          <li>Professional advisors where reasonably necessary</li>
          <li>Authorities, courts, or other parties when required by law or to protect legal rights</li>
        </ul>
        <p>
          We do not sell personal information as the term &ldquo;sell&rdquo; is commonly understood.
          If our use of certain tools is considered a &ldquo;sale&rdquo; or &ldquo;sharing&rdquo;
          under California law, we will provide required opt-out controls.
        </p>
      </LegalSection>

      <LegalSection title="8. Subprocessors / Service Providers">
        <p>{SUBPROCESSORS_NOTICE}</p>
        <p>
          These providers may support website hosting, database storage, email delivery, payment
          coordination through third-party checkout links, document and PDF generation, file
          uploads, authentication, and security monitoring. They process personal information on
          our behalf under contractual or operational safeguards where applicable.
        </p>
        <p>Categories of providers may include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Hosting and infrastructure (e.g., web server / reverse proxy)</li>
          <li>Database provider (PostgreSQL)</li>
          <li>Email provider (when configured for production)</li>
          <li>Payment processor (hosted checkout; card data not collected on this site)</li>
          <li>Legal workflow / case management tools (when configured)</li>
          <li>Document and PDF generation infrastructure (e.g., headless browser rendering)</li>
          <li>Local or cloud file storage for uploaded documents</li>
          <li>Security and logging tools</li>
        </ul>
        <p className="text-sm text-slate-400">{SUBPROCESSORS_DETAIL_NOTICE}</p>
      </LegalSection>

      <LegalSection title="9. International Transfers, Including EU/US Transfers">
        <p>
          We may process and store personal information in the United States and other countries
          where we or our service providers operate. If you access the website from outside the
          United States, your information may be transferred to jurisdictions that may have different
          data protection laws than your country of residence.
        </p>
        <p>{EU_TRANSFER_NOTICE}</p>
        <p>
          Additional information about transfer safeguards may be provided upon request.
        </p>
      </LegalSection>

      <LegalSection title="10. Data Retention">
        <p>
          We retain personal information only for as long as reasonably necessary for the purposes
          described in this policy, unless a longer period is required or permitted by law.
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white">
                <th className="py-2 pr-4 font-semibold">Category</th>
                <th className="py-2 font-semibold">Retention approach</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Account data</td>
                <td className="py-2">While the account is active and for a reasonable period thereafter</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Immigration intake / case inquiry data</td>
                <td className="py-2">For intake review, matter evaluation, and related operational needs</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Lead / contact data</td>
                <td className="py-2">While the inquiry remains active and as needed for follow-up records</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Uploaded documents</td>
                <td className="py-2">For matter processing and as required by legal, ethical, or operational obligations</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Generated agreements / document packets</td>
                <td className="py-2">For engagement administration and recordkeeping</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Billing / payment records</td>
                <td className="py-2">As needed for billing, accounting, and compliance</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Logs / security records</td>
                <td className="py-2">For a limited period necessary for security, troubleshooting, and audit purposes</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Support communications</td>
                <td className="py-2">For as long as needed to resolve inquiries and maintain service records</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">{DATA_RETENTION_SUMMARY}</p>
      </LegalSection>

      <LegalSection title="11. Your Privacy Rights">
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict,
          object to, or port certain personal information, and to withdraw consent where processing
          is based on consent. Rights vary by jurisdiction and may be subject to exceptions under
          applicable law, including legal, ethical, and recordkeeping obligations applicable to legal
          services.
        </p>
        <p>
          You also have the right to lodge a complaint with a supervisory authority in the EU/EEA,
          UK, or other jurisdiction where applicable law provides that right.
        </p>
      </LegalSection>

      <LegalSection title="12. GDPR Rights / DSAR">
        <p>
          If GDPR applies to our processing of your personal information, you may request access to
          your data, correction, deletion, restriction, portability, or object to certain
          processing. These requests are sometimes called Data Subject Access Requests
          (&ldquo;DSARs&rdquo;).
        </p>
        <p>
          We will respond within the timeframes required by applicable law, subject to verification
          and lawful exceptions. We may need to retain certain information where required for legal
          services, professional responsibility, dispute resolution, or compliance.
        </p>
      </LegalSection>

      <LegalSection title="13. California CCPA/CPRA Rights">
        <p>
          If you are a California resident, you may have rights under the California Consumer
          Privacy Act, as amended by the California Privacy Rights Act (&ldquo;CPRA&rdquo;),
          including:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Right to know / access categories and specific pieces of personal information collected</li>
          <li>Right to delete personal information, subject to exceptions</li>
          <li>Right to correct inaccurate personal information</li>
          <li>Right to opt out of sale or sharing, if applicable</li>
          <li>Right to limit use and disclosure of sensitive personal information, if applicable</li>
          <li>Right to non-discrimination for exercising privacy rights</li>
        </ul>
        <p>
          <strong>Categories collected:</strong> identifiers, contact information, account data,
          immigration-related inquiry information, documents, commercial information related to
          services, internet or device information, and professional or employment-related
          information you provide.
        </p>
        <p>
          <strong>Business purposes:</strong> providing services, intake review, communications,
          security, compliance, and internal operations as described in this policy.
        </p>
        <p>
          <strong>Sale / sharing:</strong> We do not sell personal information as the term
          &ldquo;sell&rdquo; is commonly understood. If our use of analytics or advertising tools is
          considered a &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; under California law, we will
          provide the required opt-out controls.
        </p>
      </LegalSection>

      <LegalSection title="14. How to Submit a Privacy Request">
        <p>
          You may submit a request using the form below or by emailing {contactEmail} with the
          subject line &ldquo;Privacy Request.&rdquo; We may need to verify your identity before
          fulfilling certain requests.
        </p>
        <form
          onSubmit={handlePrivacySubmit}
          className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
          aria-describedby={
            submitError
              ? "privacy-form-error"
              : submitSuccess
                ? "privacy-form-success"
                : undefined
          }
          noValidate
        >
          <div>
            <label htmlFor="privacy-request-type" className="block text-sm text-slate-200">
              Request type
            </label>
            <select
              id="privacy-request-type"
              name="type"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-white"
              aria-invalid={Boolean(submitError)}
              aria-describedby={submitError ? "privacy-form-error" : undefined}
            >
              {PRIVACY_REQUEST_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {!user?.email ? (
            <div>
              <label htmlFor="privacy-request-email" className="block text-sm text-slate-200">
                Email
              </label>
              <input
                id="privacy-request-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-white"
                aria-invalid={Boolean(submitError)}
                aria-describedby={submitError ? "privacy-form-error" : undefined}
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="privacy-request-message" className="block text-sm text-slate-200">
              Message (optional)
            </label>
            <textarea
              id="privacy-request-message"
              name="message"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={4}
              maxLength={4000}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-white"
            />
          </div>
          {submitError ? (
            <p id="privacy-form-error" role="alert" className="text-sm text-red-200">
              {submitError}
            </p>
          ) : null}
          {submitSuccess ? (
            <p id="privacy-form-success" role="status" className="text-sm text-emerald-200">
              {submitSuccess}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit privacy request"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Authorized agents may submit requests on your behalf where permitted by law, subject to
          verification. You can also manage cookie preferences and Global Privacy Control signals on
          our{" "}
          <a href="/cookie-preferences" className="text-amber-300 hover:text-amber-200">
            Cookie Preferences
          </a>{" "}
          page.
        </p>
      </LegalSection>

      <LegalSection title="15. Verification of Privacy Requests">
        <p>
          To protect your information, we may need to verify your identity before fulfilling a
          request. Verification steps may include confirming account credentials, responding from
          the email address associated with your inquiry, or providing additional identifying
          information reasonably necessary to confirm the request.
        </p>
      </LegalSection>

      <LegalSection title="16. Cookies / Analytics / Tracking">
        <p>
          We use cookies and similar technologies in three categories. You can manage optional
          categories at any time on our{" "}
          <a href="/cookie-preferences" className="text-amber-300 hover:text-amber-200">
            Cookie Preferences
          </a>{" "}
          page.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Strictly necessary:</strong> always enabled. Includes authentication,
            security, and storage of your cookie choices. These cannot be disabled because the
            site cannot function without them.
          </li>
          <li>
            <strong>Analytics:</strong> optional and off by default. If enabled and configured,
            analytics tools help us understand site usage. Analytics vendors are loaded only if
            configured and you have opted in.
          </li>
          <li>
            <strong>Marketing:</strong> optional and off by default. If enabled and configured,
            marketing tools support outreach and measure campaign effectiveness. Marketing vendors
            are loaded only if configured and you have opted in.
          </li>
        </ul>
        <p>
          Optional cookies are not set before you opt in. You can accept all, reject optional
          cookies, or choose categories individually. Withdrawing consent is as easy as giving it.
        </p>
        <p>
          <strong>Global Privacy Control (GPC):</strong> If your browser sends a GPC signal, we
          treat it as an opt-out preference for marketing and sale/share-related tracking.
          Marketing cookies remain disabled while GPC is active. We do not ask you to override
          GPC to enable optional tracking.
        </p>
        <p className="text-sm text-slate-400">
          Cookie banner text, category definitions, GPC behavior, and region assumptions are
          subject to privacy counsel review before production launch.
        </p>
      </LegalSection>

      <LegalSection title="17. Security">
        <p>
          We use reasonable administrative, technical, and organizational safeguards designed to
          protect personal information. However, no method of transmission over the internet or
          electronic storage is completely secure.
        </p>
      </LegalSection>

      <LegalSection title="18. Children&rsquo;s Privacy">
        <p>
          This website is not directed to children under 13, and we do not knowingly collect
          personal information directly from children without appropriate adult involvement. If you
          believe a child has provided personal information without proper authorization, contact us
          so we can review the matter.
        </p>
      </LegalSection>

      <LegalSection title="19. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. The updated version will be posted on
          this page with a revised last updated date. Material changes may also be communicated
          where required by applicable law.
        </p>
      </LegalSection>

      <LegalContactSection title="20. Contact" />
    </LegalPageLayout>
  );
}
