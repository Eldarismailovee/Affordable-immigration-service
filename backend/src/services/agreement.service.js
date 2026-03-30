export function generateAgreement(payload) {
  const packageLabel =
    payload.selectedPackage === "guidance"
      ? "Attorney Guidance"
      : "Attorney Filing";

  const whoFiles =
    payload.selectedPackage === "guidance" ? "Client files the matter." : "Attorney files the matter.";

  const additionalFee = Number(payload.additionalI130Count || 0) * 500;
  const expeditedFee = payload.expedited ? 500 : 0;

  return {
    agreementTitle: "Flat-Fee Immigration Engagement Preview",
    html: `
      <div>
        <h1 style="font-size:28px; margin-bottom:16px;">Flat-Fee Immigration Engagement Preview</h1>
        <p><strong>Client:</strong> ${payload.firstName} ${payload.lastName}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Phone:</strong> ${payload.phone}</p>
        <p><strong>Package:</strong> ${packageLabel}</p>
        <p><strong>Case type:</strong> ${payload.caseType}</p>
        <p><strong>Additional I-130 count:</strong> ${payload.additionalI130Count}</p>
        <p><strong>Additional I-130 fees:</strong> $${additionalFee}</p>
        <p><strong>Expedited processing:</strong> ${payload.expedited ? "Yes" : "No"}</p>
        <p><strong>Expedited fee:</strong> $${expeditedFee}</p>
        <hr style="margin:16px 0; border-color:#334155;" />
        <p><strong>Scope:</strong> ${whoFiles}</p>
        <p><strong>Government filing fees:</strong> Separate from legal fees.</p>
        <p><strong>Engagement:</strong> No attorney-client relationship is formed by website use alone.</p>
        <p><strong>Consultation rule:</strong> Engagement begins only after the first 15-minute lawyer consultation confirms the adequacy of submitted documents.</p>
        <p><strong>Processing promise:</strong> Matter will be filed within two weeks after all required documents are received.</p>
      </div>
    `,
  };
}