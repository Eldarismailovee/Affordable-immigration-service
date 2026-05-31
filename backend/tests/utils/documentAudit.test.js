import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { AUDIT_EVENT_TYPES } from "../../src/constants/audit.js";

test("document audit helpers log ids without document body", async (t) => {
  const events = [];

  t.mock.module("../../src/services/audit.service.js", {
    namedExports: {
      recordAuditEvent: async (entry) => {
        events.push(entry);
      },
    },
  });

  const { auditDocumentView } = await import(
    `../../src/utils/documentAudit.js?case=${Math.random()}`
  );

  await auditDocumentView({
    leadId: "lead-1",
    document: { id: "doc-1", html_content: "<p>secret</p>" },
    documentType: "agreement",
    user: { id: "user-1", role: "user" },
    auditContext: { requestId: "req-1", ipHash: "hash", userAgent: "ua" },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, AUDIT_EVENT_TYPES.DOCUMENT_VIEW);
  assert.equal(events[0].metadata.documentId, "doc-1");
  assert.equal(events[0].metadata.html_content, undefined);
  assert.equal(JSON.stringify(events).includes("secret"), false);
});
