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

const router = Router();

router.post("/", requireAuth, createMake);
router.post("/with-image", upload.single("image"), requireAuth, createMakeWithImage);
router.get("/", getMakes);
router.get("/:id", getMake);
router.patch("/:id", upload.single("image"), requireAuth, updateMake);
router.delete("/", requireAuth, deleteMakes);

export default router;
