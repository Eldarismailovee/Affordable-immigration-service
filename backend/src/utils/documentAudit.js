import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "../services/audit.service.js";
import { buildActor } from "./auditContext.js";

export async function auditDocumentAccess({
  eventType,
  action,
  leadId,
  document,
  documentType,
  user,
  auditContext,
}) {
  await recordAuditEvent({
    eventType,
    category: AUDIT_CATEGORIES.DOCUMENT,
    action,
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(user),
    targetType: "lead",
    targetId: leadId,
    request: auditContext,
    metadata: {
      documentType,
      documentId: document?.id ?? null,
      leadId,
    },
  });
}

export function auditDocumentView(args) {
  return auditDocumentAccess({
    ...args,
    eventType: AUDIT_EVENT_TYPES.DOCUMENT_VIEW,
    action: "view",
  });
}

export function auditDocumentPdfGenerate(args) {
  return auditDocumentAccess({
    ...args,
    eventType: AUDIT_EVENT_TYPES.DOCUMENT_PDF_GENERATE,
    action: "generate_pdf",
  });
}

export function auditDocumentDownload(args) {
  return auditDocumentAccess({
    ...args,
    eventType: AUDIT_EVENT_TYPES.DOCUMENT_DOWNLOAD,
    action: "download",
  });
}
