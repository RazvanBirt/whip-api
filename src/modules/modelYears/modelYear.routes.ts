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

const router = Router();

router.post("/model-years", createModelYear);
router.get("/model-years/:id", getModelYear);

router.post("/model-years/:id/engines", addEnginesToModelYear);
router.delete("/model-years/:id/engines", removeEnginesFromModelYear);

router.post("/model-years/:id/transmissions", addTransmissionsToModelYear);
router.delete("/model-years/:id/transmissions", removeTransmissionsFromModelYear);

router.post("/model-years/:id/drivetrains", addDrivetrainsToModelYear);
router.delete("/model-years/:id/drivetrains", removeDrivetrainsFromModelYear);

export default router;
