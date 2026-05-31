import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAttorneyCanApprovePacket,
  assertPacketApprovedForDownload,
  assertPacketIsDraft,
} from "../../src/domain/packet.policy.js";

const ATTORNEY = { id: "attorney-1", role: "attorney" };
const ADMIN = { id: "admin-1", role: "admin" };
const USER = { id: "user-1", role: "user" };

test("assertPacketIsDraft accepts draft packets only", () => {
  assert.doesNotThrow(() => assertPacketIsDraft({ status: "draft" }));

  assert.throws(() => assertPacketIsDraft({ status: "approved" }), {
    name: "AppError",
    statusCode: 400,
    code: "PACKET_NOT_DRAFT",
  });
});

test("assertAttorneyCanApprovePacket allows attorney and admin", () => {
  assert.doesNotThrow(() => assertAttorneyCanApprovePacket(ATTORNEY));
  assert.doesNotThrow(() => assertAttorneyCanApprovePacket(ADMIN));

  assert.throws(() => assertAttorneyCanApprovePacket(USER), {
    name: "AppError",
    statusCode: 403,
    code: "INSUFFICIENT_PERMISSIONS",
  });
});

test("assertPacketApprovedForDownload requires approved status", () => {
  assert.doesNotThrow(() => assertPacketApprovedForDownload({ status: "approved" }));

  assert.throws(() => assertPacketApprovedForDownload({ status: "draft" }), {
    name: "AppError",
    statusCode: 403,
    code: "PACKET_NOT_APPROVED",
  });
});
