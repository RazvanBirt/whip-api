import { Router } from "express";
import { upload } from "../../middleware/upload";
import {
    createMake,
    getMake,
    getMakes,
    updateMake,
    deleteMakes,
    createMakeWithImage
} from "./make.controller";
import { requireAuth } from "../auth/auth.middleware";
import { requireAdmin } from "../auth/admin.middleware";

const router = Router();

router.post("/", requireAuth, requireAdmin, createMake);
router.post("/with-image", upload.single("image"), requireAuth, requireAdmin, createMakeWithImage);
router.get("/", getMakes);
router.get("/:id", getMake);
router.patch("/:id", upload.single("image"), requireAuth, requireAdmin, updateMake);
router.delete("/:id", requireAuth, requireAdmin, deleteMakes);

export default router;
