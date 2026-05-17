import { Router } from "express";
import {
    createBodyType,
    getBodyType,
    getBodyTypes,
    updateBodyType,
    deleteBodyTypes,
} from "./bodyTypes.controller";
import { requireAuth } from "../auth/auth.middleware";
import { requireAdmin } from "../auth/admin.middleware";

const router = Router();

router.post("/", requireAuth, requireAdmin, createBodyType);
router.get("/", getBodyTypes);
router.get("/:id", getBodyType);
router.patch("/:id", requireAuth, requireAdmin, updateBodyType);
router.delete("/", requireAuth, requireAdmin, deleteBodyTypes);

export default router;
