import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAdmin,
  assertCanDeleteUser,
  assertCanRemoveAdminRole,
  isAdmin,
  isRemovingAdminRole,
  parseUserRole,
} from "../../src/domain/user.policy.js";

const ADMIN = { id: "admin-1", role: "admin" };
const USER = { id: "user-1", role: "user" };

test("isAdmin and assertAdmin enforce admin-only actions", () => {
  assert.equal(isAdmin(ADMIN), true);
  assert.equal(isAdmin(USER), false);
  assert.equal(assertAdmin(ADMIN), ADMIN);

  assert.throws(() => assertAdmin(null), {
    name: "AppError",
    statusCode: 401,
    code: "AUTHENTICATION_REQUIRED",
  });

  assert.throws(() => assertAdmin(USER), {
    name: "AppError",
    statusCode: 403,
    code: "INSUFFICIENT_PERMISSIONS",
  });
});

test("parseUserRole validates roles through domain validators", () => {
  assert.equal(parseUserRole("admin"), "admin");
  assert.equal(parseUserRole("user"), "user");
  assert.equal(parseUserRole("attorney"), "attorney");

  assert.throws(() => parseUserRole("superadmin"), {
    name: "AppError",
    statusCode: 400,
    code: "INVALID_ROLE",
  });
});

test("last active admin policy protects against removing the only admin", () => {
  assert.equal(isRemovingAdminRole(ADMIN, "user"), true);
  assert.equal(isRemovingAdminRole(ADMIN, "admin"), false);
  assert.equal(isRemovingAdminRole(USER, "user"), false);

  assert.throws(
    () => assertCanRemoveAdminRole({ user: ADMIN, nextRole: "user", activeAdminCount: 1 }),
    {
      name: "AppError",
      statusCode: 400,
      code: "LAST_ACTIVE_ADMIN",
    }
  );

  assert.doesNotThrow(() =>
    assertCanRemoveAdminRole({ user: ADMIN, nextRole: "user", activeAdminCount: 2 })
  );
});

test("delete user policy protects the last active admin", () => {
  assert.throws(() => assertCanDeleteUser({ user: ADMIN, activeAdminCount: 1 }), {
    name: "AppError",
    statusCode: 400,
    code: "LAST_ACTIVE_ADMIN",
  });

  assert.doesNotThrow(() => assertCanDeleteUser({ user: ADMIN, activeAdminCount: 2 }));
  assert.doesNotThrow(() => assertCanDeleteUser({ user: USER, activeAdminCount: 1 }));
});
