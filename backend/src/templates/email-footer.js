import {
  EMAIL_COMPLIANCE,
  buildUnsubscribeUrl,
  getMarketingPhysicalAddress,
} from "../constants/emailCompliance.js";

export function buildMarketingHtmlFooter({ unsubscribeToken }) {
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);
  const address = getMarketingPhysicalAddress();

  return `
<hr />
<p style="font-size:12px;color:#666;">
  You are receiving this email because you opted in to receive updates from ${EMAIL_COMPLIANCE.senderName}.
</p>
<p style="font-size:12px;color:#666;">
  Our mailing address: ${address}
</p>
<p style="font-size:12px;color:#666;">
  <a href="${unsubscribeUrl}">Unsubscribe from marketing emails</a>
</p>
`.trim();
}

export function buildMarketingTextFooter({ unsubscribeToken }) {
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);
  const address = getMarketingPhysicalAddress();

  return [
    "",
    "---",
    `You are receiving this email because you opted in to receive updates from ${EMAIL_COMPLIANCE.senderName}.`,
    "",
    `Mailing address: ${address}`,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}
