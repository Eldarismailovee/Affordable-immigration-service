import LegalContactSection from "../components/legal/LegalContactSection";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import LegalSection from "../components/legal/LegalSection";
import { BAR_ADVERTISING_NOTICE, RESPONSIBLE_ATTORNEY_PUBLIC_TEXT } from "../data/legalMeta";

export default function DisclaimerPage() {
  return (
    <LegalPageLayout title="Legal Disclaimer / Attorney Advertising Notice">
      <LegalSection title="1. Last Updated">
        <p>
          This Legal Disclaimer and Attorney Advertising Notice was last updated on May 31, 2026.
        </p>
      </LegalSection>

      <LegalSection title="2. No Legal Advice from General Website Content">
        <p>
          Information on this website is provided for general informational and administrative
          purposes only. It does not constitute legal advice for any individual case. Immigration
          matters are highly fact-specific, and website content should not be relied on as a
          substitute for advice from a qualified attorney who knows your circumstances.
        </p>
      </LegalSection>

      <LegalSection title="3. Attorney-Client Relationship Only After Engagement / Approval">
        <p>
          Contacting the firm, registering for an account, completing intake forms, uploading
          documents, previewing agreements, or submitting payment-related information does not by
          itself create an attorney-client relationship. Representation, if any, begins only after
          the firm accepts the matter and applicable engagement requirements are met.
        </p>
      </LegalSection>

      <LegalSection title="4. Responsible Attorney">
        <p>
          Legal services offered through this website, where provided, are delivered under the
          supervision of a responsible attorney identified in engagement documents and applicable
          attorney disclosures.
        </p>
        <p>{RESPONSIBLE_ATTORNEY_PUBLIC_TEXT}</p>
      </LegalSection>

      <LegalSection title="5. Jurisdictional Limitations">
        <p>
          Legal services may be limited to jurisdictions where the responsible attorney is authorized
          to practice. Laws and procedures vary by jurisdiction, agency, and case type. Accessing
          this website from any location does not mean services are available in every jurisdiction
          or for every matter.
        </p>
        <p>
          You should not rely on general website content as jurisdiction-specific advice unless an
          attorney engagement confirms that the firm can assist with your matter under applicable
          professional responsibility rules.
        </p>
      </LegalSection>

      <LegalSection title="6. Attorney Advertising Notice">
        <p>{BAR_ADVERTISING_NOTICE}</p>
        <p>
          Descriptions of services, pricing ranges, process steps, and outcomes are intended to
          provide general information about how the firm may assist prospective clients. They are
          not guarantees of results.
        </p>
      </LegalSection>

      <LegalSection title="7. No Guarantee of Results">
        <p>
          We do not guarantee any specific immigration outcome, approval, filing date, or government
          processing time. Agency decisions depend on eligibility, documentation, policy, and factors
          outside the firm&rsquo;s control.
        </p>
      </LegalSection>

      <LegalSection title="8. Prior Results, Testimonials, or Examples">
        <p>
          Any examples, descriptions, or references to prior outcomes are illustrative only and do
          not guarantee similar results in your case. Each matter depends on its own facts and
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="9. Immigration / Government Agency Disclaimer">
        <p>
          Only U.S. government agencies and authorized decision-makers determine immigration
          outcomes. The firm does not control agency processing times, requests for evidence, or
          adjudication standards. Government filing fees and third-party costs are separate from
          legal fees unless expressly stated otherwise in a signed agreement.
        </p>
      </LegalSection>

      <LegalSection title="10. External Links Disclaimer">
        <p>
          This website may contain links to third-party websites or resources for convenience. We do
          not control and are not responsible for the content, privacy practices, or availability of
          third-party sites. Links do not imply endorsement unless expressly stated.
        </p>
      </LegalSection>

      <LegalContactSection title="11. Contact" />
    </LegalPageLayout>
  );
}
