import { Router } from "express";
import {
    createModel,
    updateModel,
    deleteModels,
    getModels,
    getModel,
    upsertFullModelCatalog,
} from "./model.controller";
import { requireAdmin } from "../auth/admin.middleware";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.post("/", requireAuth, requireAdmin, createModel);
router.get("/", getModels);
router.get("/:id", getModel);
router.patch("/:id", requireAuth, requireAdmin, updateModel);
router.delete("/:id", requireAuth, requireAdmin, deleteModels);
// TODO : fix to /catalog/full
router.post('/catalog/models/full', requireAuth, requireAdmin, upsertFullModelCatalog)

export default router;
