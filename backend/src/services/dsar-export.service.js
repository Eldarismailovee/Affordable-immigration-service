import {
  findUserExportRow,
  listAgreementsForUserLeads,
  listBookingsForUserLeads,
  listDocketwiseForUserLeads,
  listDsarRequestsForUserExport,
  listIntakesForUserLeads,
  listLeadsForUserExport,
  listOnboardingForUserLeads,
  listPaymentsForUserLeads,
} from "../repositories/dsar-export.repository.js";
import { stripSecretsFromExportUser } from "../utils/dsar.js";

function mapLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDsarHistory(row) {
  return {
    id: row.id,
    type: row.request_type,
    status: row.status,
    identityVerificationStatus: row.identity_verification_status,
    legalHold: row.legal_hold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function buildUserDataExport(userId) {
  const userRow = await findUserExportRow(userId);

  const [
    leads,
    intakes,
    agreements,
    onboarding,
    bookings,
    payments,
    docketwise,
    dsarRequests,
  ] = await Promise.all([
    listLeadsForUserExport(userId),
    listIntakesForUserLeads(userId),
    listAgreementsForUserLeads(userId),
    listOnboardingForUserLeads(userId),
    listBookingsForUserLeads(userId),
    listPaymentsForUserLeads(userId),
    listDocketwiseForUserLeads(userId),
    listDsarRequestsForUserExport(userId),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    user: stripSecretsFromExportUser(userRow),
    leads: leads.map(mapLead),
    intakes,
    agreements,
    onboardingPackets: onboarding,
    bookings,
    payments,
    docketwiseSync: docketwise,
    dsarRequests: dsarRequests.map(mapDsarHistory),
  };
}
