import { Router } from "express";
import { createCookieConsentLogController } from "../../controllers/cookie-consent.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { cookieConsentLogSchema } from "../../schemas/cookie-consent.schema.js";

const router = Router();

router.post("/", validateRequest(cookieConsentLogSchema), createCookieConsentLogController);

export default router;
