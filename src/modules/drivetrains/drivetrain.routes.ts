import { Router } from "express";
import {
    createDrivetrain,
    updateDrivetrain,
    deleteDrivetrains,
    getDrivetrains,
    getDrivetrain,
} from "./drivetrain.controller";
import { requireAdmin } from "../auth/admin.middleware";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.post("/", requireAuth, requireAdmin, createDrivetrain);
router.get("/", getDrivetrains);
router.get("/:id", getDrivetrain);
router.patch("/:id", requireAuth, requireAdmin, updateDrivetrain);
router.delete("/", requireAuth, requireAdmin, deleteDrivetrains);

export default router;
