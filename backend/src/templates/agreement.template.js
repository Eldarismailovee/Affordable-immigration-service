import { escapeHtml } from "../utils/htmlEscape.js";

export function renderAgreementHtml({
  payload,
  packageLabel,
  whoFiles,
  additionalFee,
  expeditedFee,
}) {
  const clientName = `${escapeHtml(payload.firstName)} ${escapeHtml(payload.lastName)}`;

  return `
    <div>
      <h1 style="font-size:28px; margin-bottom:16px;">Flat-Fee Immigration Engagement Preview</h1>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
      <p><strong>Package:</strong> ${escapeHtml(packageLabel)}</p>
      <p><strong>Case type:</strong> ${escapeHtml(payload.caseType)}</p>
      <p><strong>Additional I-130 count:</strong> ${escapeHtml(payload.additionalI130Count)}</p>
      <p><strong>Additional I-130 fees:</strong> $${escapeHtml(additionalFee)}</p>
      <p><strong>Expedited processing:</strong> ${payload.expedited ? "Yes" : "No"}</p>
      <p><strong>Expedited fee:</strong> $${escapeHtml(expeditedFee)}</p>
      <hr style="margin:16px 0; border-color:#334155;" />
      <p><strong>Scope:</strong> ${escapeHtml(whoFiles)}</p>
      <p><strong>Government filing fees:</strong> Separate from legal fees.</p>
      <p><strong>Engagement:</strong> No attorney-client relationship is formed by website use alone.</p>
      <p><strong>Consultation rule:</strong> Engagement begins only after the first 15-minute lawyer consultation confirms the adequacy of submitted documents.</p>
      <p><strong>Processing promise:</strong> Matter will be filed within two weeks after all required documents are received.</p>
    </div>
  `;
}
