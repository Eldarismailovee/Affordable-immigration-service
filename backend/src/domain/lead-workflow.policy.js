import { GUIDANCE_PACKAGE } from "../constants/domain.js";
import { responsibleAttorneyProfile } from "../constants/responsibleAttorney.js";
import { evaluateJurisdictionAvailability } from "../constants/jurisdictionAvailability.js";
import { AppError } from "./errors.js";

export const CONFLICT_CHECK_RESULTS = {
  PENDING: "pending",
  CLEAR: "clear",
  CONFLICT_FOUND: "conflict_found",
  NEEDS_MORE_INFO: "needs_more_info",
};

export const ATTORNEY_REVIEW_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

export function assertConflictCheckClear(conflictCheck) {
  if (!conflictCheck || conflictCheck.result !== CONFLICT_CHECK_RESULTS.CLEAR) {
    throw new AppError(
      "Conflict check must be completed with a clear result",
      400,
      "CONFLICT_CHECK_NOT_CLEAR"
    );
  }
}

export function assertAttorneyReviewAccepted(lead) {
  if (lead?.attorney_review_status !== ATTORNEY_REVIEW_STATUSES.ACCEPTED) {
    throw new AppError(
      "Attorney review must be accepted before this action",
      400,
      "ATTORNEY_REVIEW_NOT_ACCEPTED"
    );
  }
}

export function assertResponsibleAttorneyConfirmed(lead) {
  if (!lead?.responsible_attorney_confirmed) {
    throw new AppError(
      "Responsible attorney must be assigned and confirmed",
      400,
      "RESPONSIBLE_ATTORNEY_NOT_CONFIRMED"
    );
  }
}

export function assertMatterAvailableForLead({ intake, jurisdiction }) {
  const availability = evaluateJurisdictionAvailability({
    jurisdiction,
    matterType: intake?.case_type,
  });

  if (!availability.reviewRequired && !availability.available) {
    throw new AppError(availability.reason, 400, "JURISDICTION_NOT_AVAILABLE");
  }
}

export function assertLeadCanGenerateAgreement(lead) {
  const allowedStatuses = ["accepted", "engaged"];

  if (!allowedStatuses.includes(lead?.status)) {
    throw new AppError(
      "Agreement generation requires lead status accepted or engaged",
      400,
      "LEAD_STATUS_BLOCKS_AGREEMENT"
    );
  }

  assertAttorneyReviewAccepted(lead);
  assertResponsibleAttorneyConfirmed(lead);
}

export function assertLeadCanGenerateFilingPacket(lead) {
  if (lead?.status !== "engaged") {
    throw new AppError(
      "Filing packet generation requires lead status engaged",
      400,
      "LEAD_STATUS_BLOCKS_FILING_PACKET"
    );
  }

  assertAttorneyReviewAccepted(lead);
  assertConflictCheckClearForLead(lead);
}

export function assertConflictCheckClearForLead(lead) {
  if (lead?.conflict_check_result !== CONFLICT_CHECK_RESULTS.CLEAR) {
    throw new AppError(
      "Conflict check must be clear before this action",
      400,
      "CONFLICT_CHECK_NOT_CLEAR"
    );
  }
}

export function assertAttorneyApprovedForLegalRecommendation(intake) {
  if (!intake?.legal_recommendation_approved_at) {
    throw new AppError(
      "Legal recommendations require attorney approval before display",
      403,
      "LEGAL_RECOMMENDATION_NOT_APPROVED"
    );
  }
}

export function assertLeadCanShowLegalRecommendation({ lead, intake, actorIsStaff }) {
  if (actorIsStaff) {
    return;
  }

  if (intake?.selected_package !== GUIDANCE_PACKAGE) {
    return;
  }

  assertAttorneyApprovedForLegalRecommendation(intake);
}

export function assertLeadCanMoveToEngaged(lead) {
  assertConflictCheckClearForLead(lead);
  assertAttorneyReviewAccepted(lead);
  assertResponsibleAttorneyConfirmed(lead);

  if (lead?.status !== "accepted") {
    throw new AppError(
      "Lead must be accepted before becoming engaged",
      400,
      "LEAD_NOT_ACCEPTED"
    );
  }
}

export function assertLeadCanMoveToAccepted(lead, intake, jurisdiction) {
  assertConflictCheckClearForLead(lead);
  assertMatterAvailableForLead({ intake, jurisdiction });

  if (lead?.attorney_review_status !== ATTORNEY_REVIEW_STATUSES.ACCEPTED) {
    throw new AppError(
      "Attorney review must be accepted before matter acceptance",
      400,
      "ATTORNEY_REVIEW_NOT_ACCEPTED"
    );
  }
}

export function assertLeadCanMoveToAttorneyReview(conflictCheck) {
  assertConflictCheckClear(conflictCheck);
}

export function assertProductionAttorneyProfileIfRequired() {
  if (!responsibleAttorneyProfile.confirmedBeforeProduction) {
    return;
  }
}
