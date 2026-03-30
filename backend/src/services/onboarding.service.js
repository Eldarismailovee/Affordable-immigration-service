export function generateOnboardingPacket(payload) {
  const packageLabel =
    payload.selectedPackage === "guidance"
      ? "Attorney Guidance"
      : "Attorney Filing";

  const whoFiles =
    payload.selectedPackage === "guidance"
      ? "Client files the petition package."
      : "Attorney prepares and files the petition package.";

  const additionalCount = Number(payload.additionalI130Count || 0);
  const expeditedText = payload.expedited
    ? "Expedited firm processing selected (+$500)."
    : "No expedited processing selected.";

  return {
    title: "Client Onboarding Packet",
    html: `
      <div>
        <h1 style="font-size:28px; margin-bottom:16px;">Client Onboarding Packet</h1>

        <p><strong>Client:</strong> ${payload.firstName} ${payload.lastName}</p>
        <p><strong>Package selected:</strong> ${packageLabel}</p>
        <p><strong>Case type:</strong> ${payload.caseType}</p>

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
        <p>${whoFiles}</p>
        <p><strong>Additional I-130 petitions:</strong> ${additionalCount}</p>
        <p><strong>Expedited option:</strong> ${expeditedText}</p>

        <h2 style="font-size:22px; margin:20px 0 10px;">Required documents checklist</h2>
        <ul>
          <li>Government-issued identification</li>
          <li>Civil documents relevant to the family relationship</li>
          <li>Prior immigration records, if applicable</li>
          <li>Any supporting documents requested by the office</li>
        </ul>

        <h2 style="font-size:22px; margin:20px 0 10px;">Timeline</h2>
        <p>
          The matter will be filed within two weeks after the office receives all required client documents.
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
    `,
  };
}