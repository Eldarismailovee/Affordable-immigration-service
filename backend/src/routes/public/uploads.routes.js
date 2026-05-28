import { Router } from "express";
import { servePublicUploadedImageController } from "../../controllers/public-upload.controller.js";

const router = Router();

router.get("/images/:filename", servePublicUploadedImageController);

export default router;
