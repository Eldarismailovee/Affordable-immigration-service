import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  addDays,
  addHours,
  addMinutes,
  createAccessToken,
  createOpaqueToken,
  hashPassword,
  hashToken,
  sanitizeUser,
  verifyAuthToken,
  verifyPassword,
} from "../../src/utils/auth.js";

test("hashPassword produces a salted scrypt hash", async () => {
  const hash = await hashPassword("super-secret");
  const [algorithm, salt, key] = hash.split(":");

  assert.equal(algorithm, "scrypt");
  assert.ok(salt.length >= 16);
  assert.ok(key.length > 0);
});

test("hashPassword produces different hashes for the same password", async () => {
  const a = await hashPassword("same-password");
  const b = await hashPassword("same-password");
  assert.notEqual(a, b);
});

test("verifyPassword returns true for the matching password", async () => {
  const hash = await hashPassword("matched-password");
  assert.equal(await verifyPassword("matched-password", hash), true);
});

test("verifyPassword returns false for the wrong password", async () => {
  const hash = await hashPassword("matched-password");
  assert.equal(await verifyPassword("different-password", hash), false);
});

test("verifyPassword returns false for malformed hash", async () => {
  assert.equal(await verifyPassword("any", "not-a-hash"), false);
  assert.equal(await verifyPassword("any", ""), false);
  assert.equal(await verifyPassword("any", null), false);
});

test("createAccessToken/verifyAuthToken roundtrip carries subject, role and session id", async () => {
  const user = { id: "11111111-1111-1111-1111-111111111111", role: "admin" };
  const token = await createAccessToken(user, { sessionId: "sess-123" });
  const payload = await verifyAuthToken(token);

  assert.equal(payload.sub, user.id);
  assert.equal(payload.role, "admin");
  assert.equal(payload.typ, "access");
  assert.equal(payload.sid, "sess-123");
});

test("createAccessToken expires roughly ACCESS_TOKEN_TTL_SECONDS after issue", async () => {
  const token = await createAccessToken(
    { id: "11111111-1111-1111-1111-111111111111", role: "user" },
    {}
  );
  const payload = await verifyAuthToken(token);

  assert.equal(payload.exp - payload.iat, ACCESS_TOKEN_TTL_SECONDS);
});

test("verifyAuthToken returns null for a tampered token", async () => {
  const token = await createAccessToken(
    { id: "11111111-1111-1111-1111-111111111111", role: "user" },
    {}
  );

  const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
  assert.equal(await verifyAuthToken(tampered), null);
});

test("verifyAuthToken returns null for empty/garbage input", async () => {
  assert.equal(await verifyAuthToken(""), null);
  assert.equal(await verifyAuthToken(null), null);
  assert.equal(await verifyAuthToken("not.a.token"), null);
});

test("createOpaqueToken returns a long, base64url-style string", () => {
  const a = createOpaqueToken();
  const b = createOpaqueToken();

  assert.notEqual(a, b);
  assert.ok(a.length >= 32);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test("hashToken produces stable, hex-encoded SHA-256", () => {
  const a = hashToken("token");
  const b = hashToken("token");
  const c = hashToken("different");

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("date helpers add the expected offset", () => {
  const base = new Date("2026-01-01T00:00:00Z");

  assert.equal(addMinutes(base, 30).toISOString(), "2026-01-01T00:30:00.000Z");
  assert.equal(addHours(base, 2).toISOString(), "2026-01-01T02:00:00.000Z");
  assert.equal(addDays(base, 5).toISOString(), "2026-01-06T00:00:00.000Z");
});

test("sanitizeUser strips password_hash and renames snake_case fields", () => {
  const dbUser = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "user@example.com",
    full_name: "Demo User",
    role: "user",
    status: "active",
    password_hash: "scrypt:salt:key",
    email_verified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const safe = sanitizeUser(dbUser);

  assert.equal(safe.fullName, "Demo User");
  assert.ok(!("password_hash" in safe));
  assert.ok(!("full_name" in safe));
  assert.equal(safe.email, dbUser.email);
});

test("sanitizeUser returns null for falsy input", () => {
  assert.equal(sanitizeUser(null), null);
  assert.equal(sanitizeUser(undefined), null);
});
