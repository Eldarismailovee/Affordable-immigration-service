import pool from "../db/pool.js";
import { sanitizeUser, verifyAuthToken } from "../utils/auth.js";

function getBearerToken(req) {
  const header = req.get("authorization") || "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = getBearerToken(req);
    const payload = token ? verifyAuthToken(token) : null;

    if (!payload?.sub) {
      return next();
    }

    const { rows } = await pool.query(
      `
      SELECT id, email, full_name, role, status, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [payload.sub]
    );

    const user = rows[0];

    if (user?.status === "active") {
      req.user = sanitizeUser(user);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Insufficient permissions",
      });
    }

    next();
  };
}

export async function requireLeadAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const leadId = req.params.leadId;
    const { rows } = await pool.query(
      `
      SELECT user_id
      FROM leads
      WHERE id = $1
      LIMIT 1
      `,
      [leadId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        message: "You do not have access to this lead",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
