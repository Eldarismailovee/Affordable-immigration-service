import { Router } from "express";
import {
  uploadImageController,
  uploadImageMiddleware,
} from "../controllers/upload.controller.js";

const router = Router();

router.post("/image", uploadImageMiddleware, uploadImageController);

export default router;
