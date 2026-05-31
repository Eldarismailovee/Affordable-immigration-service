import { APPROVED_PACKET_STATUS } from "../constants/domain.js";
import { AppError } from "./errors.js";
import { isAdmin, isAttorney } from "./user.policy.js";

export function assertPacketIsDraft(packet) {
  if (!packet || packet.status !== "draft") {
    throw new AppError(
      "Only draft packets can be approved",
      400,
      "PACKET_NOT_DRAFT"
    );
  }
}

export function assertAttorneyCanApprovePacket(actor) {
  if (!isAttorney(actor) && !isAdmin(actor)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }
}

export function assertPacketApprovedForDownload(packet) {
  if (!packet || packet.status !== APPROVED_PACKET_STATUS) {
    throw new AppError(
      "Document is not approved for download",
      403,
      "PACKET_NOT_APPROVED"
    );
  }
}
