import { Router } from "express";
import {
    createEngine,
    updateEngine,
    deleteEngines,
    getEngines,
    getEngine,
} from "./engine.controller";
import { requireAdmin } from "../auth/admin.middleware";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.post("/", requireAuth, requireAdmin, createEngine);
router.get("/", getEngines);
router.get("/:id", getEngine);
router.patch("/:id", requireAuth, requireAdmin, updateEngine);
router.delete("/:id", requireAuth, requireAdmin, deleteEngines);

export default router;
