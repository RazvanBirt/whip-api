import { Router } from "express";
import {
    createTransmission,
    updateTransmission,
    deleteTransmissions,
    getTransmissions,
    getTransmission,
} from "./transmission.controller";
import { requireAdmin } from "../auth/admin.middleware";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.post("/", requireAuth, requireAdmin, createTransmission);
router.get("/", getTransmissions);
router.get("/:id", getTransmission);
router.patch("/:id", requireAuth, requireAdmin, updateTransmission);
router.delete("/:id", requireAuth, requireAdmin, deleteTransmissions);

export default router;
