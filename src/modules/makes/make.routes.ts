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

router.post("/makes", requireAuth, createMake);
router.post("/makes/with-image", upload.single("image"), requireAuth, createMakeWithImage);
router.get("/makes", getMakes);
router.get("/makes/:id", getMake);
router.patch("/makes/:id", upload.single("image"), requireAuth, updateMake);
router.delete("/makes", requireAuth, deleteMakes);

export default router;
