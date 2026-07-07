import { Link } from "react-router-dom";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import LegalSection from "../components/legal/LegalSection";
import { useSiteSettings } from "../context/SiteSettingsContext";
import {
  acceptedMatters,
  ATTORNEY_REVIEW_WORKFLOW_NOTICE,
  attorneyLicenses,
  availabilityDisclaimers,
  JURISDICTION_AVAILABILITY_VERSION,
  unavailableJurisdictions,
  unavailableMatters,
} from "../constants/jurisdictionAvailability";
import { RESPONSIBLE_ATTORNEY_PUBLIC_TEXT } from "../constants/responsibleAttorney";

function StatusBadge({ status }) {
  const label =
    status === "review_required" ? "Review required" : status.replace(/_/g, " ");

  return (
    <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
      {label}
    </span>
  );
}

export default function AvailabilityPage() {
  const { settings } = useSiteSettings();

  return (
    <LegalPageLayout title="State & Jurisdiction Availability">
      <LegalSection title="1. Service availability">
        <p>
          This page describes where legal services may be available, which matter types the firm
          may consider, and important limitations. It is a disclosure page — not an automatic
          eligibility determination.
        </p>
        <p>{availabilityDisclaimers.jurisdictionLimitation}</p>
        <p className="text-sm text-slate-400">Version: {JURISDICTION_AVAILABILITY_VERSION}</p>
      </LegalSection>

      <LegalSection title="2. Responsible attorney">
        <p>{RESPONSIBLE_ATTORNEY_PUBLIC_TEXT}</p>
      </LegalSection>

      <LegalSection title="3. Attorney licensed jurisdictions">
        <p>{availabilityDisclaimers.licensedJurisdictionsPending}</p>
        {attorneyLicenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <caption className="sr-only">Attorney licensed jurisdictions</caption>
              <thead>
                <tr className="border-b border-white/10 text-slate-200">
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Jurisdiction
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    License type
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Bar number
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {attorneyLicenses.map((license) => (
                  <tr key={`${license.jurisdiction}-${license.barNumber}`} className="border-b border-white/5">
                    <th scope="row" className="px-3 py-3 font-medium text-white">
                      {license.jurisdiction}
                    </th>
                    <td className="px-3 py-3">{license.licenseType}</td>
                    <td className="px-3 py-3">{license.barNumber}</td>
                    <td className="px-3 py-3">{license.status}</td>
                    <td className="px-3 py-3 text-slate-400">{license.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Pending confirmation before launch.</p>
        )}
      </LegalSection>

      <LegalSection title="4. Matters we may accept">
        <p>
          The firm may consider family-based immigration matters listed on this website. Each
          matter requires attorney review, conflict checks, and written confirmation before
          acceptance.
        </p>
        <ul className="list-none space-y-3 pl-0">
          {acceptedMatters.map((matter) => (
            <li
              key={matter.key}
              className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">{matter.label}</span>
                <StatusBadge status={matter.status} />
              </div>
              <p className="mt-2 text-sm text-slate-400">{matter.notes}</p>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="5. Matters not available">
        <p>The following matter types are not offered through this platform or intake flow:</p>
        <ul className="list-none space-y-3 pl-0">
          {unavailableMatters.map((matter) => (
            <li
              key={matter.key}
              className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
            >
              <div className="font-medium text-white">{matter.label}</div>
              <p className="mt-1 text-sm text-slate-300">{matter.reason}</p>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="6. Jurisdictions not available / limited availability">
        <p>{availabilityDisclaimers.jurisdictionLimitation}</p>
        {unavailableJurisdictions.length > 0 ? (
          <ul className="mt-4 list-none space-y-3 pl-0">
            {unavailableJurisdictions.map((entry) => (
              <li
                key={entry.jurisdiction}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <div className="font-medium text-white">{entry.jurisdiction}</div>
                <p className="mt-1 text-sm text-slate-300">{entry.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Specific jurisdiction restrictions will be listed here once confirmed. Until then,
            availability depends on attorney review and written confirmation.
          </p>
        )}
        <p className="mt-4 text-sm text-slate-400">
          Accessing this website from any location does not mean services are available in every
          jurisdiction or for every matter.
        </p>
      </LegalSection>

      <LegalSection title="7. Attorney review required">
        <p>{availabilityDisclaimers.attorneyReviewRequired}</p>
        <p className="text-sm text-slate-400">{ATTORNEY_REVIEW_WORKFLOW_NOTICE}</p>
      </LegalSection>

      <LegalSection title="8. Not legal advice before review">
        <p>{availabilityDisclaimers.notLegalAdviceBeforeReview}</p>
        <p>
          For more detail, see our{" "}
          <Link to="/disclaimer" className="text-amber-300 underline hover:text-amber-200">
            Legal Disclaimer
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. No guarantee of outcome">
        <p>{availabilityDisclaimers.noGuarantee}</p>
      </LegalSection>

      <LegalSection title="10. Attorney advertising notice">
        <p>{availabilityDisclaimers.advertisingNotice}</p>
      </LegalSection>

      <LegalSection title="11. Contact / request review">
        <p>
          If you are unsure whether your matter or location is within scope, contact the firm
          before submitting intake. You may also review our{" "}
          <Link to="/start" className="text-amber-300 underline hover:text-amber-200">
            intake flow
          </Link>{" "}
          after understanding these limitations.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Email: {settings?.email || "info@immigrationfirm.com"}</li>
          <li>Phone: {settings?.phone || "(555) 123-4567"}</li>
          {settings?.address ? <li>Address: {settings.address}</li> : null}
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}
