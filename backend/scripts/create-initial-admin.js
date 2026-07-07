#!/usr/bin/env node
/**
 * One-time initial administrator provisioning.
 *
 * Usage:
 *   node scripts/create-initial-admin.js --email admin@example.com [--name "Admin Name"]
 *   printf '%s' "$SECRET" | npm run create-initial-admin -- --email admin@example.com --password-stdin
 *   npm run create-initial-admin -- --email admin@example.com --password-file /run/secrets/initial_admin_password
 *
 * Password is read from INITIAL_ADMIN_PASSWORD (preferred) or stdin (hidden prompt).
 * Never pass the password as a CLI argument.
 */
import { createInterface } from "readline/promises";
import { readFileSync } from "node:fs";
import { stdin as input, stdout as output } from "process";
import { ADMIN_ROLE } from "../src/constants/domain.js";
import { runMigrations } from "../src/db/migrate.js";
import { withTransaction } from "../src/db/transaction.js";
import { isUniqueViolation } from "../src/db/errors.js";
import { query } from "../src/db/query.js";
import {
  countActiveAdmins,
  createUser,
  findUserByEmail,
} from "../src/repositories/user.repository.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../src/constants/audit.js";
import { recordAuditEvent } from "../src/services/audit.service.js";
import { hashPassword } from "../src/utils/auth.js";
import { validatePrivilegedPassword } from "../src/utils/passwordPolicy.js";
import { logger } from "../src/lib/logger.js";

const ADVISORY_LOCK_KEY = 900_001;

function parseArgs(argv) {
  const args = {
    email: "",
    name: "System Administrator",
    passwordStdin: false,
    passwordFile: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--email") {
      args.email = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }

    if (token === "--name") {
      args.name = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }

    if (token === "--password-stdin") {
      args.passwordStdin = true;
      continue;
    }

    if (token === "--password-file") {
      args.passwordFile = String(argv[index + 1] || "").trim();
      index += 1;
    }
  }

  return args;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readPasswordFromStdin() {
  if (!input.isTTY) {
    throw new Error(
      "Set INITIAL_ADMIN_PASSWORD or run interactively to enter the password on stdin"
    );
  }

  const rl = createInterface({ input, output });
  const password = await rl.question("Administrator password: ");
  rl.close();
  return password;
}

async function readPasswordFromStdinPipe() {
  const chunks = [];

  for await (const chunk of input) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

async function resolvePassword({ passwordStdin, passwordFile }) {
  if (passwordFile) {
    return readFileSync(passwordFile, "utf8").replace(/\r?\n$/, "");
  }

  if (passwordStdin) {
    return readPasswordFromStdinPipe();
  }

  const envPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (envPassword) {
    return envPassword;
  }

  return readPasswordFromStdin();
}

async function provisionInitialAdmin({ email, fullName, password }) {
  const passwordCheck = validatePrivilegedPassword(password);

  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.message);
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);

  if (existing?.role === ADMIN_ROLE) {
    throw new Error(`Administrator already exists for email ${normalizedEmail}`);
  }

  if (existing) {
    throw new Error(
      `A non-admin user already exists for email ${normalizedEmail}; use a different email or promote via admin tooling`
    );
  }

  const passwordHash = await hashPassword(password);

  const created = await withTransaction(async (client) => {
    await query(client, "SELECT pg_advisory_xact_lock($1)", [ADVISORY_LOCK_KEY], {
      name: "admin_provision.lock",
    });

    const adminCount = await countActiveAdmins(client);

    if (adminCount > 0) {
      throw new Error("An active administrator already exists; aborting provisioning");
    }

    const duplicate = await findUserByEmail(normalizedEmail, client);

    if (duplicate) {
      throw new Error(`Email ${normalizedEmail} is already registered`);
    }

    return createUser(
      {
        email: normalizedEmail,
        passwordHash,
        fullName,
        role: ADMIN_ROLE,
      },
      client
    );
  });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.USER_ROLE_CHANGE,
    category: AUDIT_CATEGORIES.USER_ADMIN,
    action: "provision_initial_admin",
    result: AUDIT_RESULTS.SUCCESS,
    actorUserId: created.id,
    actorRole: ADMIN_ROLE,
    targetType: "user",
    targetId: created.id,
    metadata: {
      emailDomain: normalizedEmail.split("@")[1] ?? null,
      provisioning: "initial_admin_script",
    },
  });

  return created;
}

async function main() {
  const { email, name, passwordStdin, passwordFile } = parseArgs(process.argv.slice(2));

  if (!email) {
    console.error("Missing required --email argument");
    process.exitCode = 1;
    return;
  }

  if (!isValidEmail(email)) {
    console.error("Invalid --email value");
    process.exitCode = 1;
    return;
  }

  let password;

  try {
    password = await resolvePassword({ passwordStdin, passwordFile });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  if (process.env.NODE_ENV !== "test") {
    await runMigrations();
  }

  try {
    const user = await provisionInitialAdmin({
      email,
      fullName: name,
      password,
    });

    logger.info(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      "Initial administrator provisioned"
    );

    console.log(`Initial administrator created: ${user.email} (${user.id})`);
    console.log(
      "Email verification and MFA enrollment are required before this account can access admin APIs."
    );
  } catch (error) {
    logger.error({ err: error }, "Initial administrator provisioning failed");
    console.error(error.message);
    process.exitCode = 1;
  }
}

await main();
