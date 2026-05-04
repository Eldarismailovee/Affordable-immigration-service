import { sanitizeUser, verifyAuthToken } from "../utils/auth.js";
import { ACTIVE_USER_STATUS, ADMIN_ROLE } from "../constants/domain.js";
import { getLeadById } from "../services/lead.service.js";
import { getUserById } from "../services/user.service.js";

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

    const user = await getUserById(payload.sub);

    if (user?.status === ACTIVE_USER_STATUS) {
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

    const lead = await getLeadById(req.params.leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (req.user.role === ADMIN_ROLE) {
      return next();
    }

    if (lead.user_id !== req.user.id) {
      return res.status(403).json({
        message: "You do not have access to this lead",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
