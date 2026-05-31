import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { hashEmail, normalizeEmail } from "../../src/utils/email.js";
import {
  EMAIL_SUPPRESSION_REASONS,
  EMAIL_SUPPRESSION_SCOPES,
  EMAIL_TEMPLATES,
} from "../../src/constants/emailCompliance.js";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";

function grantMarketingConsent(store, userId) {
  const user = store.users.get(userId);
  user.marketing_consent = true;
  user.marketing_consent_at = new Date();
  user.marketing_consent_source = "test";
}

process.env.MARKETING_PHYSICAL_ADDRESS =
  "123 Compliance Way, Suite 100, Example City, CA 90000";

let store;

before(async () => {
  ({ store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
  process.env.MARKETING_PHYSICAL_ADDRESS =
    "123 Compliance Way, Suite 100, Example City, CA 90000";
});

test("marketing email is skipped when physical mailing address is missing", async () => {
  delete process.env.MARKETING_PHYSICAL_ADDRESS;
  const { canSendMarketingEmail } = await import(
    "../../src/services/email-compliance.service.js"
  );

  const result = await canSendMarketingEmail({
    email: "user@example.com",
    userId: null,
    category: EMAIL_TEMPLATES.MARKETING_ANNOUNCEMENT.category,
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, "marketing_address_required");
});

test("marketing email is skipped without consent", async () => {
  const { canSendMarketingEmail } = await import(
    "../../src/services/email-compliance.service.js"
  );
  const { createUser, findUserByEmail } = await import(
    "../../src/repositories/user.repository.js"
  );
  await createUser({
    email: "noconsent@example.com",
    passwordHash: "scrypt:aa:bb",
    fullName: "No Consent",
    role: "user",
  });
  const user = await findUserByEmail("noconsent@example.com");

  const result = await canSendMarketingEmail({
    email: user.email,
    userId: user.id,
    category: EMAIL_TEMPLATES.MARKETING_ANNOUNCEMENT.category,
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, "no_marketing_consent");
});

test("marketing email sends when consent is granted and not suppressed", async () => {
  const { canSendMarketingEmail } = await import(
    "../../src/services/email-compliance.service.js"
  );
  const { createUser, findUserByEmail } = await import(
    "../../src/repositories/user.repository.js"
  );

  await createUser({
    email: "consented@example.com",
    passwordHash: "scrypt:aa:bb",
    fullName: "Consented",
    role: "user",
  });
  const user = await findUserByEmail("consented@example.com");
  grantMarketingConsent(store, user.id);

  const result = await canSendMarketingEmail({
    email: user.email,
    userId: user.id,
    category: EMAIL_TEMPLATES.MARKETING_ANNOUNCEMENT.category,
  });

  assert.equal(result.sent, true);
  assert.equal(result.skipped, false);
});

test("marketing email is skipped when suppressed", async () => {
  const { canSendMarketingEmail, recordEmailSuppression } = await import(
    "../../src/services/email-compliance.service.js"
  );
  const { createUser, findUserByEmail } = await import(
    "../../src/repositories/user.repository.js"
  );

  await createUser({
    email: "suppressed@example.com",
    passwordHash: "scrypt:aa:bb",
    fullName: "Suppressed",
    role: "user",
  });
  const user = await findUserByEmail("suppressed@example.com");
  grantMarketingConsent(store, user.id);
  await recordEmailSuppression({
    email: user.email,
    scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
    reason: EMAIL_SUPPRESSION_REASONS.UNSUBSCRIBE,
    source: "test",
    userId: user.id,
  });

  const result = await canSendMarketingEmail({
    email: user.email,
    userId: user.id,
    category: EMAIL_TEMPLATES.MARKETING_ANNOUNCEMENT.category,
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, "marketing_suppressed");
});

test("suppression stores normalized email hash", async () => {
  const { recordEmailSuppression } = await import(
    "../../src/services/email-compliance.service.js"
  );

  await recordEmailSuppression({
    email: "MixedCase@Example.COM",
    scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
    reason: EMAIL_SUPPRESSION_REASONS.UNSUBSCRIBE,
    source: "test",
  });

  const key = `${hashEmail("mixedcase@example.com")}:${EMAIL_SUPPRESSION_SCOPES.MARKETING}`;
  const row = store.emailSuppressions.get(key);
  assert.ok(row);
  assert.equal(row.email_normalized, normalizeEmail("MixedCase@Example.COM"));
  assert.equal(row.email_hash, hashEmail("mixedcase@example.com"));
});

test("marketing send includes footer with address and unsubscribe link", async () => {
  const { sendMarketingEmail } = await import("../../src/services/email.service.js");
  const { createUser, findUserByEmail } = await import(
    "../../src/repositories/user.repository.js"
  );
  const { EMAIL_TEMPLATES } = await import("../../src/constants/emailCompliance.js");

  await createUser({
    email: "footer@example.com",
    passwordHash: "scrypt:aa:bb",
    fullName: "Footer",
    role: "user",
  });
  const user = await findUserByEmail("footer@example.com");
  grantMarketingConsent(store, user.id);

  const result = await sendMarketingEmail({
    to: user.email,
    userId: user.id,
    templateKey: EMAIL_TEMPLATES.MARKETING_ANNOUNCEMENT.key,
    subject: "News",
    htmlBody: "<p>Hello</p>",
    textBody: "Hello",
  });

  assert.equal(result.sent, true);
  assert.match(result.html, /123 Compliance Way/);
  assert.match(result.html, /unsubscribe/i);
  assert.match(result.text, /Unsubscribe:/i);
});

test("transactional email still sends when marketing suppressed", async () => {
  const { sendTransactionalEmail, sendMarketingEmail } = await import(
    "../../src/services/email.service.js"
  );
  const { recordEmailSuppression } = await import(
    "../../src/services/email-compliance.service.js"
  );
  const { EMAIL_SUPPRESSION_REASONS, EMAIL_TEMPLATES } = await import(
    "../../src/constants/emailCompliance.js"
  );

  const email = "txn@example.com";
  await recordEmailSuppression({
    email,
    scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
    reason: EMAIL_SUPPRESSION_REASONS.UNSUBSCRIBE,
    source: "test",
  });

  const marketing = await sendMarketingEmail({
    to: email,
    userId: null,
    templateKey: EMAIL_TEMPLATES.MARKETING_ANNOUNCEMENT.key,
    subject: "Promo",
    htmlBody: "<p>Promo</p>",
  });
  const transactional = await sendTransactionalEmail({
    to: email,
    templateKey: EMAIL_TEMPLATES.PASSWORD_RESET.key,
    subject: "Reset",
    htmlBody: "<p>Reset</p>",
  });

  assert.equal(marketing.skipped, true);
  assert.equal(transactional.success, true);
});

test("audit metadata does not include raw email body", async () => {
  const { sanitizeAuditMetadata } = await import("../../src/utils/auditRedaction.js");
  const sanitized = sanitizeAuditMetadata({
    email: "secret@example.com",
    htmlBody: "<p>promo</p>",
    templateKey: "newsletter",
    emailHash: hashEmail("secret@example.com"),
  });

  assert.equal(sanitized.email, undefined);
  assert.equal(sanitized.htmlBody, undefined);
  assert.equal(sanitized.templateKey, "newsletter");
  assert.ok(sanitized.emailHash);
});
