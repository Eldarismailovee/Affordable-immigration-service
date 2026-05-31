import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import {
  EMAIL_MESSAGE_TYPES,
  EMAIL_SUPPRESSION_SCOPES,
  EMAIL_TEMPLATES,
} from "../constants/emailCompliance.js";
import {
  buildMarketingHtmlFooter,
  buildMarketingTextFooter,
} from "../templates/email-footer.js";
import { hashEmail } from "../utils/email.js";
import { recordAuditEvent } from "./audit.service.js";
import {
  assertCanSendMarketingEmail,
  createMarketingUnsubscribeToken,
} from "./email-compliance.service.js";

function stubSend({ to, subject, html, text, templateKey }) {
  return {
    success: true,
    email: to,
    subject,
    html,
    text,
    templateKey,
    message: "Email service stub",
  };
}

export async function sendTransactionalEmail({
  to,
  templateKey,
  subject,
  htmlBody = "",
  textBody = "",
}) {
  const template = Object.values(EMAIL_TEMPLATES).find((entry) => entry.key === templateKey);

  if (template?.messageType !== EMAIL_MESSAGE_TYPES.TRANSACTIONAL) {
    throw new Error(`Template ${templateKey} is not transactional`);
  }

  const result = stubSend({
    to,
    subject,
    html: htmlBody,
    text: textBody,
    templateKey,
  });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_TRANSACTIONAL_SENT,
    category: AUDIT_CATEGORIES.EMAIL,
    action: "send_transactional",
    result: AUDIT_RESULTS.SUCCESS,
    metadata: {
      templateKey,
      messageType: EMAIL_MESSAGE_TYPES.TRANSACTIONAL,
      category: template?.category ?? null,
      emailHash: hashEmail(to),
    },
  });

  return result;
}

export async function sendMarketingEmail({
  to,
  userId = null,
  templateKey,
  subject,
  htmlBody = "",
  textBody = "",
  scope = EMAIL_SUPPRESSION_SCOPES.MARKETING,
}) {
  const template = Object.values(EMAIL_TEMPLATES).find((entry) => entry.key === templateKey);

  if (template?.messageType !== EMAIL_MESSAGE_TYPES.MARKETING) {
    throw new Error(`Template ${templateKey} is not marketing`);
  }

  const gate = await assertCanSendMarketingEmail({
    email: to,
    userId,
    category: template.category,
    templateKey,
  });

  if (!gate.sent) {
    return {
      success: false,
      sent: false,
      skipped: true,
      reason: gate.reason,
      email: to,
      templateKey,
    };
  }

  const unsubscribeToken = await createMarketingUnsubscribeToken(to, scope);
  const htmlFooter = buildMarketingHtmlFooter({ unsubscribeToken });
  const textFooter = buildMarketingTextFooter({ unsubscribeToken });
  const html = `${htmlBody}${htmlFooter}`;
  const text = `${textBody}${textFooter}`;

  const result = stubSend({
    to,
    subject,
    html,
    text,
    templateKey,
  });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_MARKETING_SENT,
    category: AUDIT_CATEGORIES.EMAIL,
    action: "send_marketing",
    result: AUDIT_RESULTS.SUCCESS,
    actorUserId: userId,
    metadata: {
      templateKey,
      messageType: EMAIL_MESSAGE_TYPES.MARKETING,
      category: template.category,
      scope,
      emailHash: hashEmail(to),
      userId: userId ?? null,
    },
  });

  return {
    ...result,
    sent: true,
    skipped: false,
  };
}

export function sendConfirmationEmail(email) {
  return sendTransactionalEmail({
    to: email,
    templateKey: EMAIL_TEMPLATES.EMAIL_VERIFICATION.key,
    subject: "Confirmation",
    htmlBody: "<p>Confirmation</p>",
    textBody: "Confirmation",
  });
}

export function sendPasswordResetEmail(email, token) {
  return sendTransactionalEmail({
    to: email,
    templateKey: EMAIL_TEMPLATES.PASSWORD_RESET.key,
    subject: "Password reset",
    htmlBody: `<p>Reset link token: ${token}</p>`,
    textBody: `Reset link token: ${token}`,
  });
}

export function sendEmailVerificationEmail(email, token) {
  return sendTransactionalEmail({
    to: email,
    templateKey: EMAIL_TEMPLATES.EMAIL_VERIFICATION.key,
    subject: "Verify your email",
    htmlBody: `<p>Verification token: ${token}</p>`,
    textBody: `Verification token: ${token}`,
  });
}
