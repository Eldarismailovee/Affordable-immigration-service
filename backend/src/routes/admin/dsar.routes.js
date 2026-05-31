import { Router } from "express";
import {
  addDsarNoteController,
  applyDsarAnonymizationController,
  applyDsarCcpaOptOutController,
  applyDsarCorrectionController,
  applyDsarRestrictionController,
  generateDsarExportController,
  generateDsarPdfExportController,
  getAdminDsarController,
  listAdminDsarController,
  resolveDsarObjectionController,
  updateDsarLegalHoldController,
  updateDsarStatusController,
  verifyDsarIdentityController,
} from "../../controllers/admin-dsar.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  adminCcpaOptOutSchema,
  adminCorrectionActionSchema,
  adminIdentityVerificationSchema,
  adminLegalHoldSchema,
  adminNoteSchema,
  adminObjectionResolveSchema,
  adminStatusUpdateSchema,
  dsarRequestIdParamsSchema,
} from "../../schemas/dsar.schema.js";

const router = Router();
const adminOnly = requireRole("admin");
const staffRead = requireRole("admin", "attorney");

router.get("/", staffRead, listAdminDsarController);
router.get(
  "/:requestId",
  staffRead,
  validateRequest({ params: dsarRequestIdParamsSchema }),
  getAdminDsarController
);

router.patch(
  "/:requestId/identity",
  adminOnly,
  validateRequest({
    params: dsarRequestIdParamsSchema,
    body: adminIdentityVerificationSchema,
  }),
  verifyDsarIdentityController
);

router.post(
  "/:requestId/export",
  adminOnly,
  validateRequest({ params: dsarRequestIdParamsSchema }),
  generateDsarExportController
);

router.post(
  "/:requestId/export-pdf",
  adminOnly,
  validateRequest({ params: dsarRequestIdParamsSchema }),
  generateDsarPdfExportController
);

router.post(
  "/:requestId/correct",
  adminOnly,
  validateRequest({
    params: dsarRequestIdParamsSchema,
    body: adminCorrectionActionSchema,
  }),
  applyDsarCorrectionController
);

router.post(
  "/:requestId/anonymize",
  adminOnly,
  validateRequest({ params: dsarRequestIdParamsSchema }),
  applyDsarAnonymizationController
);

router.post(
  "/:requestId/restrict",
  adminOnly,
  validateRequest({ params: dsarRequestIdParamsSchema }),
  applyDsarRestrictionController
);

router.patch(
  "/:requestId/legal-hold",
  requireRole("admin", "attorney"),
  validateRequest({
    params: dsarRequestIdParamsSchema,
    body: adminLegalHoldSchema,
  }),
  updateDsarLegalHoldController
);

router.patch(
  "/:requestId/status",
  adminOnly,
  validateRequest({
    params: dsarRequestIdParamsSchema,
    body: adminStatusUpdateSchema,
  }),
  updateDsarStatusController
);

router.post(
  "/:requestId/notes",
  adminOnly,
  validateRequest({
    params: dsarRequestIdParamsSchema,
    body: adminNoteSchema,
  }),
  addDsarNoteController
);

router.post(
  "/:requestId/objection",
  adminOnly,
  validateRequest({
    params: dsarRequestIdParamsSchema,
    body: adminObjectionResolveSchema,
  }),
  resolveDsarObjectionController
);

router.post(
  "/:requestId/ccpa-opt-out",
  adminOnly,
  validateRequest({
    params: dsarRequestIdParamsSchema,
    body: adminCcpaOptOutSchema,
  }),
  applyDsarCcpaOptOutController
);

export default router;
