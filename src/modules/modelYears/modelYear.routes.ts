import { Router } from "express";
import {
    createModelYear,
    getModelYear,
    addEnginesToModelYear,
    removeEnginesFromModelYear,
    addTransmissionsToModelYear,
    removeTransmissionsFromModelYear,
    addDrivetrainsToModelYear,
    removeDrivetrainsFromModelYear,
} from "./modelYear.controller";
import { requireAdmin } from "../auth/admin.middleware";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.post("/model-years", requireAuth, requireAdmin, createModelYear);
router.get("/model-years/:id", getModelYear);

router.post("/model-years/:id/engines", requireAuth, requireAdmin, addEnginesToModelYear);
router.delete("/model-years/:id/engines", requireAuth, requireAdmin, removeEnginesFromModelYear);

router.post("/model-years/:id/transmissions", requireAuth, requireAdmin, addTransmissionsToModelYear);
router.delete("/model-years/:id/transmissions", requireAuth, requireAdmin, removeTransmissionsFromModelYear);

router.post("/model-years/:id/drivetrains", requireAuth, requireAdmin, addDrivetrainsToModelYear);
router.delete("/model-years/:id/drivetrains", requireAuth, requireAdmin, removeDrivetrainsFromModelYear);

export default router;
