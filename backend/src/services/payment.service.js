import env from "../config/env.js";
import {
  updateIntakePaymentStatusByLeadId,
  updatePaymentStatusByLeadId,
  updateHostedPaymentUrlByLeadId,
} from "../repositories/payment.repository.js";
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import { paymentNotFoundError } from "../domain/errors.js";
import {
  assertCanUpdatePaymentStatus,
  parsePaymentStatus,
} from "../domain/payment.policy.js";
import { parseHostedPaymentUrl } from "../utils/hostedPaymentUrl.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { buildActor } from "../utils/auditContext.js";
import { findLatestPaymentByLeadId } from "../repositories/lead.repository.js";

// TODO: add Stripe/LawPay webhook signature verification when provider integration is enabled.

export function createManualPaymentRecord(payload) {
  return {
    success: true,
    paymentMode: "payment_link",
    email: payload.email || null,
    message: "Use hosted payment link; card data is not collected in this application",
  };
}

export async function updateLeadPaymentStatus({
  leadId,
  status,
  actor,
  auditContext = null,
}) {
  assertCanUpdatePaymentStatus(actor);
  const nextStatus = parsePaymentStatus(status);
  const existing = await findLatestPaymentByLeadId(leadId);
  const oldStatus = existing?.status ?? null;

  const payment = await withUnitOfWork(async (client) => {
    const updatedPayment = await updatePaymentStatusByLeadId(leadId, nextStatus, client);

    if (!updatedPayment) {
      return null;
    }

    await updateIntakePaymentStatusByLeadId(leadId, nextStatus, client);

    await recordAuditEvent(
      {
        eventType: AUDIT_EVENT_TYPES.PAYMENT_STATUS_CHANGE,
        category: AUDIT_CATEGORIES.PAYMENT,
        action: "update_status",
        result: AUDIT_RESULTS.SUCCESS,
        ...buildActor(actor),
        targetType: "payment",
        targetId: updatedPayment.id,
        request: auditContext,
        metadata: {
          leadId,
          oldStatus,
          newStatus: nextStatus,
          provider: updatedPayment.provider ?? null,
          providerReference: updatedPayment.provider_reference ?? null,
        },
      },
      client
    );

    return updatedPayment;
  });

  if (!payment) {
    throw paymentNotFoundError();
  }

  return payment;
}

export async function setLeadHostedPaymentUrl({
  leadId,
  hostedPaymentUrl,
  provider,
  providerReference,
  actor,
}) {
  assertCanUpdatePaymentStatus(actor);

  const normalizedUrl = parseHostedPaymentUrl(hostedPaymentUrl, {
    allowedHosts: env.PAYMENT_HOST_ALLOWLIST,
  });

  const payment = await updateHostedPaymentUrlByLeadId({
    leadId,
    hostedPaymentUrl: normalizedUrl,
    provider: provider || null,
    providerReference: providerReference || null,
  });

  if (!payment) {
    throw paymentNotFoundError();
  }

  return payment;
}
