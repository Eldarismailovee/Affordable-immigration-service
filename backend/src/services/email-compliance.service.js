import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import {
  EMAIL_SUPPRESSION_REASONS,
  EMAIL_SUPPRESSION_SCOPES,
  EMAIL_TEMPLATE_CATEGORIES,
  isMarketingPhysicalAddressConfigured,
} from "../constants/emailCompliance.js";
import { AppError } from "../utils/appError.js";
import { hashEmail, normalizeEmail } from "../utils/email.js";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "../utils/unsubscribeToken.js";
import {
  deleteSuppressionByEmailHashAndScope,
  listSuppressionsByEmailHash,
  upsertEmailSuppression,
} from "../repositories/email-suppression.repository.js";
import {
  findUserByEmail,
  findUserById,
  grantUserMarketingConsent,
  withdrawUserMarketingConsent,
} from "../repositories/user.repository.js";
import { recordAuditEvent } from "./audit.service.js";

const SCOPE_BLOCKS = {
  [EMAIL_SUPPRESSION_SCOPES.MARKETING]: [
    EMAIL_SUPPRESSION_SCOPES.MARKETING,
    EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL,
  ],
  [EMAIL_SUPPRESSION_SCOPES.NEWSLETTER]: [
    EMAIL_SUPPRESSION_SCOPES.NEWSLETTER,
    EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL,
  ],
  [EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL]: [
    EMAIL_SUPPRESSION_SCOPES.MARKETING,
    EMAIL_SUPPRESSION_SCOPES.NEWSLETTER,
    EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL,
  ],
};

function scopesForCategory(category) {
  if (category === EMAIL_TEMPLATE_CATEGORIES.NEWSLETTER) {
    return EMAIL_SUPPRESSION_SCOPES.NEWSLETTER;
  }
  return EMAIL_SUPPRESSION_SCOPES.MARKETING;
}

export async function isEmailSuppressedForCategory(email, category) {
  const emailHash = hashEmail(email);
  const scope = scopesForCategory(category);
  const blockingScopes = SCOPE_BLOCKS[scope] || SCOPE_BLOCKS[EMAIL_SUPPRESSION_SCOPES.MARKETING];
  const rows = await listSuppressionsByEmailHash(emailHash);

  return rows.some((row) => blockingScopes.includes(row.scope));
}

export function assertMarketingPhysicalAddressConfigured() {
  if (!isMarketingPhysicalAddressConfigured()) {
    throw new AppError(
      "Marketing email physical address is not configured",
      500,
      "MARKETING_ADDRESS_REQUIRED"
    );
  }
}

export async function canSendMarketingEmail({ email, userId, category }) {
  const normalized = normalizeEmail(email);
  const templateScope = scopesForCategory(category);

  if (!isMarketingPhysicalAddressConfigured()) {
    return { sent: false, skipped: true, reason: "marketing_address_required" };
  }

  if (await isEmailSuppressedForCategory(normalized, category)) {
    return { sent: false, skipped: true, reason: "marketing_suppressed" };
  }

  if (!userId) {
    return { sent: false, skipped: true, reason: "no_marketing_consent" };
  }

  const user = await findUserById(userId);

  if (!user) {
    return { sent: false, skipped: true, reason: "no_marketing_consent" };
  }

  if (user.ccpa_sale_opt_out_at) {
    return { sent: false, skipped: true, reason: "ccpa_opt_out" };
  }

  if (templateScope === EMAIL_SUPPRESSION_SCOPES.NEWSLETTER) {
    if (!user.newsletter_consent) {
      return { sent: false, skipped: true, reason: "no_newsletter_consent" };
    }
  } else if (!user.marketing_consent) {
    return { sent: false, skipped: true, reason: "no_marketing_consent" };
  }

  return { sent: true, skipped: false };
}

export async function assertCanSendMarketingEmail(params) {
  const result = await canSendMarketingEmail(params);

  if (!result.sent) {
    await recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_MARKETING_SKIPPED_SUPPRESSED,
      category: AUDIT_CATEGORIES.EMAIL,
      action: "skip_marketing_send",
      result: AUDIT_RESULTS.SUCCESS,
      actorUserId: params.userId ?? null,
      metadata: {
        templateKey: params.templateKey ?? null,
        messageType: "marketing",
        category: params.category ?? null,
        reason: result.reason,
        emailHash: hashEmail(params.email),
        userId: params.userId ?? null,
      },
    });
  }

  return result;
}

export async function createMarketingUnsubscribeToken(email, scope) {
  return createUnsubscribeToken({ email, scope });
}

export async function recordEmailSuppression({
  email,
  scope,
  reason,
  source,
  userId = null,
  metadata = {},
}) {
  const emailNormalized = normalizeEmail(email);
  const emailHash = hashEmail(emailNormalized);

  const row = await upsertEmailSuppression({
    emailNormalized,
    emailHash,
    reason,
    source,
    scope,
    userId,
    metadataJson: metadata,
  });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_SUPPRESSION_ADDED,
    category: AUDIT_CATEGORIES.EMAIL,
    action: "add_suppression",
    result: AUDIT_RESULTS.SUCCESS,
    actorUserId: userId,
    metadata: {
      scope,
      reason,
      source,
      emailHash,
      userId: userId ?? null,
    },
  });

  return row;
}

export async function removeEmailSuppressionForScope(email, scope) {
  const emailHash = hashEmail(email);
  const removed = await deleteSuppressionByEmailHashAndScope(emailHash, scope);

  if (removed) {
    await recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_SUPPRESSION_REMOVED,
      category: AUDIT_CATEGORIES.EMAIL,
      action: "remove_suppression",
      result: AUDIT_RESULTS.SUCCESS,
      metadata: { scope, emailHash },
    });
  }

  return removed;
}

export async function processUnsubscribe({ token, scope }) {
  const payload = await verifyUnsubscribeToken(token);

  if (!payload) {
    return {
      success: true,
      message: "You have been unsubscribed from marketing emails.",
    };
  }

  const effectiveScope = scope || payload.scope;
  const email = payload.email;
  const user = await findUserByEmail(email);

  await recordEmailSuppression({
    email,
    scope: effectiveScope,
    reason: EMAIL_SUPPRESSION_REASONS.UNSUBSCRIBE,
    source: "unsubscribe_link",
    userId: user?.id ?? null,
  });

  if (effectiveScope === EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL) {
    for (const extraScope of [
      EMAIL_SUPPRESSION_SCOPES.MARKETING,
      EMAIL_SUPPRESSION_SCOPES.NEWSLETTER,
    ]) {
      await recordEmailSuppression({
        email,
        scope: extraScope,
        reason: EMAIL_SUPPRESSION_REASONS.UNSUBSCRIBE,
        source: "unsubscribe_link",
        userId: user?.id ?? null,
      });
    }
  }

  if (user) {
    await withdrawUserMarketingConsent({
      userId: user.id,
      scope: effectiveScope,
      reason: "unsubscribe",
      source: "unsubscribe_link",
    });
  }

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_UNSUBSCRIBE_CREATED,
    category: AUDIT_CATEGORIES.EMAIL,
    action: "unsubscribe",
    result: AUDIT_RESULTS.SUCCESS,
    actorUserId: user?.id ?? null,
    metadata: {
      scope: effectiveScope,
      emailHash: hashEmail(email),
      userId: user?.id ?? null,
    },
  });

  return {
    success: true,
    message: "You have been unsubscribed from marketing emails.",
  };
}

export async function suppressMarketingForUser({
  userId,
  email,
  reason,
  source,
}) {
  const normalized = normalizeEmail(email);

  for (const scope of [
    EMAIL_SUPPRESSION_SCOPES.MARKETING,
    EMAIL_SUPPRESSION_SCOPES.NEWSLETTER,
    EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL,
  ]) {
    await recordEmailSuppression({
      email: normalized,
      scope,
      reason,
      source,
      userId,
    });
  }

  await withdrawUserMarketingConsent({
    userId,
    scope: EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL,
    reason,
    source,
  });
}

export async function updateEmailPreferences(userId, payload) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const email = user.email;
  let updated = user;

  if (payload.marketingConsent === true) {
    updated = await grantUserMarketingConsent({
      userId,
      marketingConsent: true,
      newsletterConsent: payload.newsletterConsent ?? user.newsletter_consent,
      source: "account_preferences",
    });
    await removeEmailSuppressionForScope(email, EMAIL_SUPPRESSION_SCOPES.MARKETING);
    await recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_MARKETING_CONSENT_GRANTED,
      category: AUDIT_CATEGORIES.EMAIL,
      action: "grant_consent",
      result: AUDIT_RESULTS.SUCCESS,
      actorUserId: userId,
      metadata: { emailHash: hashEmail(email), userId, source: "account_preferences" },
    });
  } else if (payload.marketingConsent === false) {
    await recordEmailSuppression({
      email,
      scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
      reason: EMAIL_SUPPRESSION_REASONS.CONSENT_WITHDRAWN,
      source: "account_preferences",
      userId,
    });
    updated = await withdrawUserMarketingConsent({
      userId,
      scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
      reason: "account_preferences",
      source: "account_preferences",
    });
  }

  if (payload.newsletterConsent === true) {
    updated = await grantUserMarketingConsent({
      userId,
      marketingConsent: payload.marketingConsent ?? updated.marketing_consent,
      newsletterConsent: true,
      source: "account_preferences",
    });
    await removeEmailSuppressionForScope(email, EMAIL_SUPPRESSION_SCOPES.NEWSLETTER);
    await recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_MARKETING_CONSENT_GRANTED,
      category: AUDIT_CATEGORIES.EMAIL,
      action: "grant_newsletter_consent",
      result: AUDIT_RESULTS.SUCCESS,
      actorUserId: userId,
      metadata: { emailHash: hashEmail(email), userId, source: "account_preferences" },
    });
  } else if (payload.newsletterConsent === false) {
    await recordEmailSuppression({
      email,
      scope: EMAIL_SUPPRESSION_SCOPES.NEWSLETTER,
      reason: EMAIL_SUPPRESSION_REASONS.CONSENT_WITHDRAWN,
      source: "account_preferences",
      userId,
    });
    updated = await withdrawUserMarketingConsent({
      userId,
      scope: EMAIL_SUPPRESSION_SCOPES.NEWSLETTER,
      reason: "account_preferences",
      source: "account_preferences",
    });
  }

  return updated;
}
