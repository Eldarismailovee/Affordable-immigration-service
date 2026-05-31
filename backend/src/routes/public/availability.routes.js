import { Router } from "express";
import {
  getPublicAvailabilityController,
  getPublicResponsibleAttorneyController,
} from "../../controllers/public-availability.controller.js";

const router = Router();

router.get("/availability", getPublicAvailabilityController);
router.get("/responsible-attorney", getPublicResponsibleAttorneyController);

export default router;
