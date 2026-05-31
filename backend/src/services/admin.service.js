import {
  findLeadById,
  findLatestBookingByLeadId,
  findLatestDocketwiseSyncByLeadId,
  findLatestIntakeByLeadId,
  findLatestPaymentByLeadId,
  softDeleteLeadById,
} from "../repositories/lead.repository.js";
import { findLatestAgreementByLeadId } from "../repositories/agreement.repository.js";
import { findLatestOnboardingPacketByLeadId } from "../repositories/onboarding.repository.js";
import { leadNotFoundError } from "../domain/errors.js";
import { isLeadVisibleToAttorney } from "../domain/lead-state.policy.js";
import { isAttorney } from "../domain/user.policy.js";
import { AppError } from "../utils/appError.js";
import { assertAdminAccess, assertStaffAccess } from "./access.service.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { buildActor } from "../utils/auditContext.js";

export async function getLeadDetail({ leadId, actor, auditContext = null }) {
  assertStaffAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  if (isAttorney(actor) && !isLeadVisibleToAttorney(lead)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }

  if (auditContext) {
    await recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.ADMIN_SENSITIVE_LEAD_READ,
      category: AUDIT_CATEGORIES.ADMIN_ACCESS,
      action: "read",
      result: AUDIT_RESULTS.SUCCESS,
      ...buildActor(actor),
      targetType: "lead",
      targetId: leadId,
      request: auditContext,
      metadata: {
        route: "/api/admin/leads/:leadId",
        sensitivity: "lead_detail",
      },
    });
  }

  return {
    lead,
    intake: await findLatestIntakeByLeadId(leadId),
    agreement: await findLatestAgreementByLeadId(leadId),
    onboarding: await findLatestOnboardingPacketByLeadId(leadId),
    booking: await findLatestBookingByLeadId(leadId),
    payment: await findLatestPaymentByLeadId(leadId),
    docketwise: await findLatestDocketwiseSyncByLeadId(leadId),
  };
}

export async function deleteLead({ leadId, actor }) {
  assertAdminAccess(actor);

  const lead = await softDeleteLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  return lead;
}
