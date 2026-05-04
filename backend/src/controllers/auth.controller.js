import { loginUser, registerUser } from "../services/auth.service.js";
import { authResponseSchema, meResponseSchema } from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export async function registerController(req, res, next) {
  try {
    const result = await registerUser(req.body);
    sendResponse(res, authResponseSchema, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const result = await loginUser(req.body);
    sendResponse(res, authResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export function meController(req, res) {
  sendResponse(res, meResponseSchema, { user: req.user || null });
}
