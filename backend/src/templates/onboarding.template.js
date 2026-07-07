import { escapeHtml } from "../utils/htmlEscape.js";

export function renderOnboardingHtml({
  payload,
  packageLabel,
  whoFiles,
  additionalCount,
  expeditedText,
}) {
  const clientName = `${escapeHtml(payload.firstName)} ${escapeHtml(payload.lastName)}`;

  return `
    <div>
      <h1 style="font-size:28px; margin-bottom:16px;">Client Onboarding Packet</h1>

      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Package selected:</strong> ${escapeHtml(packageLabel)}</p>
      <p><strong>Case type:</strong> ${escapeHtml(payload.caseType)}</p>

      <hr style="margin:20px 0; border-color:#334155;" />

      <h2 style="font-size:22px; margin-bottom:10px;">Welcome</h2>
      <p>
        Welcome to the onboarding process. This packet summarizes what happens next,
        what your package includes, and what documents you should prepare.
      </p>

      <h2 style="font-size:22px; margin:20px 0 10px;">What is included</h2>
      <ul>
        <li>Flat-fee family petition support</li>
        <li>Guidance based on the selected service package</li>
        <li>Document checklist and intake review</li>
        <li>Consultation scheduling</li>
      </ul>

      <h2 style="font-size:22px; margin:20px 0 10px;">What is not included</h2>
      <ul>
        <li>Government filing fees</li>
        <li>Services outside the agreed package scope</li>
        <li>Unlisted additional petitions unless added separately</li>
      </ul>

      <h2 style="font-size:22px; margin:20px 0 10px;">Your service structure</h2>
      <p>${escapeHtml(whoFiles)}</p>
      <p><strong>Additional I-130 petitions:</strong> ${escapeHtml(additionalCount)}</p>
      <p><strong>Expedited option:</strong> ${escapeHtml(expeditedText)}</p>

      <h2 style="font-size:22px; margin:20px 0 10px;">Required documents checklist</h2>
      <ul>
        <li>Government-issued identification</li>
        <li>Civil documents relevant to the family relationship</li>
        <li>Prior immigration records, if applicable</li>
        <li>Any supporting documents requested by the office</li>
      </ul>

      <h2 style="font-size:22px; margin:20px 0 10px;">Preparation target</h2>
      <p>
        Internal preparation target: within two weeks after all required documents and information
        are received and the matter is accepted. This is not a guarantee of filing date, USCIS
        acceptance, approval, or government processing time.
      </p>

      <h2 style="font-size:22px; margin:20px 0 10px;">Important reminders</h2>
      <ul>
        <li>Government filing fees are separate from legal fees.</li>
        <li>No attorney-client relationship is formed by website use alone.</li>
        <li>
          Engagement is formally initiated only after the first 15-minute Zoom or phone consultation
          confirms the adequacy of submitted documents.
        </li>
      </ul>
    </div>
  `;
}
