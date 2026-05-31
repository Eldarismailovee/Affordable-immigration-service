import { useSiteSettings } from "../../context/SiteSettingsContext";
import LegalSection from "./LegalSection";

export default function LegalContactSection({ title = "Contact" }) {
  const { settings } = useSiteSettings();

  return (
    <LegalSection title={title}>
      <p>
        For questions about this page, contact{" "}
        {settings?.firm_name || "the firm"} using the details below or through the website footer.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Email: {settings?.email || "info@immigrationfirm.com"}</li>
        <li>Phone: {settings?.phone || "(555) 123-4567"}</li>
        {settings?.address ? <li>Address: {settings.address}</li> : null}
      </ul>
    </LegalSection>
  );
}
