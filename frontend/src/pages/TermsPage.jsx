import LegalContactSection from "../components/legal/LegalContactSection";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import LegalSection from "../components/legal/LegalSection";
import { REFUND_CANCELLATION_NOTICE, RESPONSIBLE_ATTORNEY_PUBLIC_TEXT } from "../data/legalMeta";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <LegalSection title="1. Last Updated">
        <p>
          These Terms of Service were last updated on May 31, 2026. We may update these Terms as
          described in Section 23.
        </p>
      </LegalSection>

      <LegalSection title="2. Agreement to Terms">
        <p>
          By accessing or using this website, creating an account, or submitting information through
          our intake workflows, you agree to these Terms of Service. If you do not agree, do not
          use the website.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility">
        <p>
          You must be at least 18 years old, or the age of majority in your jurisdiction, to use this
          website for yourself. If you submit information on behalf of another person, you represent
          that you have authority to do so.
        </p>
      </LegalSection>

      <LegalSection title="4. Scope of Services">
        <p>
          This website provides an online platform for immigration-related intake, account access,
          pricing information, document collection, agreement preview, consultation booking
          coordination, and related administrative workflows connected to {`the firm's`} services.
        </p>
        <p>
          <strong>What may be included:</strong> online intake forms, account features, generated
          engagement materials, document upload tools, administrative communications, and coordination
          of attorney-reviewed or attorney-filed service packages as described on the site and in
          final engagement documents.
        </p>
        <p>
          <strong>What is not included unless expressly agreed:</strong> emergency legal services,
          representation in every jurisdiction, guaranteed government outcomes, unlimited revisions,
          work outside the agreed package scope, or services beyond what is stated in a signed
          engagement agreement.
        </p>
        <p>
          Website use alone is a platform and intake experience. Legal services, where provided, are
          subject to separate engagement terms and attorney acceptance of the matter.
        </p>
      </LegalSection>

      <LegalSection title="5. No Emergency Services">
        <p>
          This website is not for emergencies. Do not use the website or contact forms for urgent
          immigration enforcement, detention, or time-critical matters requiring immediate legal
          intervention. Contact appropriate emergency or legal resources directly.
        </p>
      </LegalSection>

      <LegalSection title="6. Attorney-Client Relationship">
        <p>
          Use of this website, registration, intake submission, document upload, or payment-related
          information does not by itself create an attorney-client relationship. Representation, if
          any, begins only after the firm accepts the matter and any required consultation,
          engagement agreement, and payment terms are satisfied, as applicable.
        </p>
      </LegalSection>

      <LegalSection title="7. Attorney Review / Responsible Attorney">
        <p>
          Certain service packages described on this website involve attorney review, preparation, or
          filing support. The responsible attorney and applicable licensing details will be
          identified in engagement documents and required attorney disclosures before
          representation begins.
        </p>
        <p>{RESPONSIBLE_ATTORNEY_PUBLIC_TEXT}</p>
      </LegalSection>

      <LegalSection title="8. User Responsibilities">
        <p>You agree to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Upload only documents you are authorized to share</li>
          <li>Respond promptly to reasonable requests for information needed to evaluate or process a matter</li>
          <li>Use the website only for lawful purposes</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Accuracy of Information">
        <p>
          You remain responsible for the truthfulness and completeness of all information and
          documents you submit. The firm relies on the information you provide when evaluating a
          matter and preparing materials. Incomplete or inaccurate information may delay review,
          change scope, or affect outcomes.
        </p>
      </LegalSection>

      <LegalSection title="10. Fees and Payment">
        <p>
          Pricing shown on the website describes flat-fee ranges for designated immigration service
          packages. Government filing fees, translations, mailing, third-party costs, and work
          outside the agreed scope are separate unless expressly stated otherwise in writing.
        </p>
        <p>
          Payment details may be collected online for administrative follow-up. Unless a compliant
          payment processor is disclosed and implemented, payments may be processed manually by the
          office through approved channels.
        </p>
      </LegalSection>

      <LegalSection title="11. Refund and Cancellation Policy">
        <p>
          Cancellation and refund eligibility depend on the service stage, engagement agreement,
          applicable law, and whether substantive attorney review, document preparation, or filing
          work has begun.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            You may request cancellation before substantive work begins, subject to any disclosed
            administrative or processing costs
          </li>
          <li>
            After attorney review, document preparation, or filing work begins, fees may become
            non-refundable in whole or in part, depending on work performed
          </li>
          <li>
            Government filing fees paid to a government agency are generally non-refundable by the
            firm once submitted to the agency
          </li>
          <li>
            If subscriptions or recurring services are offered in the future, they must be
            cancellable through a clear process disclosed at purchase
          </li>
        </ul>
        <p>{REFUND_CANCELLATION_NOTICE}</p>
      </LegalSection>

      <LegalSection title="12. No Guarantee of Outcome">
        <p>
          We do not guarantee any immigration result, government approval, visa issuance, processing
          time, or agency action. Outcomes depend on facts, documentation, eligibility, government
          discretion, policy changes, and circumstances outside our control.
        </p>
      </LegalSection>

      <LegalSection title="13. Immigration / Government Filing Disclaimer">
        <p>
          Only authorized government agencies make final decisions on immigration matters. Filing
          timelines stated on the website, including internal filing targets, depend on receiving
          complete documents, signatures, and information from you in usable form. Government
          processing times are not controlled by the firm.
        </p>
      </LegalSection>

      <LegalSection title="14. Electronic Communications and Signatures">
        <p>
          By using the website, you consent to receive communications electronically, including
          email and in-app or account messages, where permitted by law. Electronic signatures or
          acknowledgments may be used where appropriate and permitted for intake and administrative
          workflows, subject to final engagement terms.
        </p>
      </LegalSection>

      <LegalSection title="15. Documents and Uploads">
        <p>
          You are responsible for the documents you upload and for ensuring they are relevant,
          accurate, and lawfully obtained. We may store uploaded files and generated documents in
          systems used to operate intake, agreement, and onboarding workflows. Uploaded content must
          not contain unlawful, malicious, or unauthorized material.
        </p>
      </LegalSection>

      <LegalSection title="16. Consumer Rights">
        <p>
          Nothing in these Terms limits non-waivable consumer rights under applicable law. Depending
          on your location, you may have additional rights under consumer protection, unfair
          contract, or professional responsibility laws. Specific state, provincial, or country
          rights may vary.
        </p>
      </LegalSection>

      <LegalSection title="17. Prohibited Uses">
        <p>You may not:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Use the website to submit false, misleading, or fraudulent information</li>
          <li>Attempt unauthorized access to accounts, systems, or data</li>
          <li>Interfere with website security or functionality</li>
          <li>Scrape, copy, or misuse site content except as permitted by law</li>
          <li>Use the website in violation of applicable law or professional rules</li>
        </ul>
      </LegalSection>

      <LegalSection title="18. Intellectual Property">
        <p>
          Website text, branding, design, graphics, and other content are owned by or licensed to
          the firm and may not be copied, reproduced, distributed, or reused without written
          permission, except as allowed by law.
        </p>
      </LegalSection>

      <LegalSection title="19. Third-Party Services">
        <p>
          The website may rely on third-party infrastructure or tools for hosting, authentication,
          document generation, email, or workflow support. Use of those services may be subject to
          their own terms and privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="20. Disclaimers">
        <p>
          The website and its content are provided on an &ldquo;as available&rdquo; basis for
          informational and administrative purposes. To the fullest extent permitted by law, we
          disclaim warranties not required by applicable consumer protection law.
        </p>
      </LegalSection>

      <LegalSection title="21. Limitation of Liability">
        <p>
          To the fullest extent permitted by applicable law, the firm is not liable for indirect,
          incidental, special, consequential, or punitive damages arising from website use,
          technical interruptions, reliance on general information, unauthorized access, or delays
          outside our reasonable control. Nothing in these Terms excludes liability that cannot be
          excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="22. Dispute Resolution / Governing Law">
        <p>
          These Terms are governed by the laws applicable to the firm&rsquo;s principal place of
          business, without regard to conflict-of-law rules, except where mandatory consumer or
          professional responsibility rules require otherwise.
        </p>
        <p>
          Dispute resolution procedures, venue, and arbitration terms, if any, will be specified in
          engagement documents or updated in a future version of these Terms after legal review.
        </p>
      </LegalSection>

      <LegalSection title="23. Changes to Terms">
        <p>
          We may revise these Terms by posting an updated version on this page with a revised last
          updated date. Continued use after changes become effective may constitute acceptance where
          permitted by law.
        </p>
      </LegalSection>

      <LegalContactSection title="24. Contact" />
    </LegalPageLayout>
  );
}
