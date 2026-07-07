import { unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { withTransaction } from "../db/transaction.js";
import { revokeUserRefreshTokens } from "../repositories/auth-token.repository.js";
import { anonymizeLeadsForUserId } from "../repositories/lead.repository.js";
import { anonymizeUserById } from "../repositories/user.repository.js";
import {
  anonymizeAgreementsForUserLeads,
  anonymizeBookingsForUserLeads,
  anonymizeConflictChecksForUserLeads,
  anonymizeCookieConsentForUser,
  anonymizeDsarRequestsForUser,
  anonymizeIntakesForUserLeads,
  anonymizeOnboardingForUserLeads,
  anonymizePaymentsForUserLeads,
  clearCurrentDsarRequestPii,
  clearDocketwiseForUserLeads,
  deleteAuthTokensForUser,
  deleteEmailSuppressionsForUser,
  deleteIntakeDraftsForUser,
  findRemainingPiiIndicators,
  listDsarExportPathsForUser,
} from "../repositories/dsar-deletion.repository.js";
import { resolveDsarPdfAbsolutePath } from "../services/dsar-pdf-export.service.js";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function summarizeRemainingPii(indicators) {
  return Object.entries(indicators)
    .filter(([, count]) => Number(count) > 0)
    .map(([key, count]) => ({ key, count: Number(count) }));
}

export async function executeDsarDatabaseDeletion({ userId, requestId, client }) {
  await anonymizeLeadsForUserId(userId, client);
  await anonymizeIntakesForUserLeads(userId, client);
  await deleteIntakeDraftsForUser(userId, client);
  await anonymizeBookingsForUserLeads(userId, client);
  await anonymizePaymentsForUserLeads(userId, client);
  await anonymizeAgreementsForUserLeads(userId, client);
  await anonymizeOnboardingForUserLeads(userId, client);
  await anonymizeConflictChecksForUserLeads(userId, client);
  await clearDocketwiseForUserLeads(userId, client);
  await deleteAuthTokensForUser(userId, client);
  await revokeUserRefreshTokens(userId, client);
  await deleteEmailSuppressionsForUser(userId, client);
  await anonymizeCookieConsentForUser(userId, client);
  await anonymizeDsarRequestsForUser(userId, requestId, client);
  await clearCurrentDsarRequestPii(requestId, client);
  const user = await anonymizeUserById(userId, client);
  return user;
}

export async function collectDsarExportFilePaths(userId) {
  const relativePaths = await listDsarExportPathsForUser(userId);
  return relativePaths.map((relativePath) => resolveDsarPdfAbsolutePath(relativePath));
}

export async function deleteDsarExportFiles(filePaths) {
  const failures = [];

  for (const absolutePath of filePaths) {
    if (!absolutePath.startsWith(path.join(ROOT_DIR, "var"))) {
      failures.push({ path: absolutePath, reason: "path_outside_export_root" });
      continue;
    }

    try {
      await unlink(absolutePath);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        failures.push({ path: absolutePath, reason: error.code || "delete_failed" });
      }
    }
  }

  return failures;
}

export async function verifyDsarDeletionComplete(userId) {
  const indicators = await findRemainingPiiIndicators(userId);
  const remaining = summarizeRemainingPii(indicators);

  return {
    complete: remaining.length === 0,
    remaining,
    indicators,
  };
}

export async function runDsarDeletionWorkflow({ userId, requestId }) {
  const exportPaths = await collectDsarExportFilePaths(userId);

  const user = await withTransaction(async (client) =>
    executeDsarDatabaseDeletion({ userId, requestId, client })
  );

  const fileFailures = await deleteDsarExportFiles(exportPaths);
  const verification = await verifyDsarDeletionComplete(userId);

  return {
    user,
    verification,
    fileFailures,
    exportPaths,
  };
}
