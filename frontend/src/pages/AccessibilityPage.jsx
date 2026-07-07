import { Link } from "react-router-dom";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import LegalSection from "../components/legal/LegalSection";
import { useSiteSettings } from "../context/SiteSettingsContext";

const STATEMENT_DATE = "May 31, 2026";

export default function AccessibilityPage() {
  const { settings } = useSiteSettings();
  const contactEmail = settings?.email || "info@immigrationfirm.com";
  const firmName = settings?.firm_name || "Immigration Law Firm";

  return (
    <LegalPageLayout title="Accessibility Statement">
      <LegalSection title="Our commitment">
        <p>
          We aim to make this website accessible and usable for all users, including people who use
          assistive technologies. Our target is{" "}
          <strong>WCAG 2.2 Level AA</strong>. We are actively improving labels, keyboard access,
          focus visibility, screen-reader error messages, color contrast, and generated document
          accessibility.
        </p>
        <p>
          We have not completed a full third-party accessibility audit and do not claim full WCAG
          2.2 AA conformance at this time.
        </p>
      </LegalSection>

      <LegalSection title="Measures we are taking">
        <ul className="list-disc space-y-2 pl-6">
          <li>Semantic HTML landmarks (`main`, `nav`, `footer`) and skip-to-content link</li>
          <li>Visible labels and programmatic names for form fields</li>
          <li>Keyboard-operable controls and visible focus indicators</li>
          <li>Screen-reader-friendly error and status messages</li>
          <li>Contrast-oriented styling on light content sections and a dark premium hero</li>
          <li>Semantic HTML source for generated PDFs, with in-app HTML views where available</li>
          <li>Automated linting with eslint-plugin-jsx-a11y in development</li>
        </ul>
      </LegalSection>

      <LegalSection title="Known limitations">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Some generated PDFs may require additional validation or remediation before they can be
            considered fully accessible PDF/UA documents. Where practical, we provide accessible HTML
            alternatives for agreements and onboarding packets in your account.
          </li>
          <li>
            Third-party hosted payment pages are outside our direct control; accessibility may vary
            by provider.
          </li>
          <li>
            Manual keyboard, screen reader, contrast, and PDF checks are still required before any
            formal conformance statement.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Generated PDFs and document accessibility">
        <p>
          Fee agreements and onboarding packets can be viewed as HTML in the application. PDF
          downloads are generated from structured HTML but may not include full PDF tagging. If you
          need an alternative format, contact us using the details below.
        </p>
      </LegalSection>

      <LegalSection title="Feedback and contact">
        <p>
          If you experience an accessibility barrier, contact {firmName} at{" "}
          <a href={`mailto:${contactEmail}`} className="text-amber-300 hover:text-amber-200">
            {contactEmail}
          </a>
          . Please include:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>The page URL where you encountered the issue</li>
          <li>A description of the problem</li>
          <li>Your browser and device</li>
          <li>Assistive technology used, if applicable</li>
        </ul>
        <p className="mt-4">
          You can also review our{" "}
          <Link to="/privacy" className="text-amber-300 hover:text-amber-200">
            Privacy Policy
          </Link>{" "}
          for general contact options.
        </p>
      </LegalSection>

      <LegalSection title="Date of statement">
        <p>This accessibility statement was last updated on {STATEMENT_DATE}.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
