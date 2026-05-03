import { loginUser, registerUser } from "../services/auth.service.js";

export async function registerController(req, res, next) {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function meController(req, res) {
  res.json({ user: req.user || null });
}
