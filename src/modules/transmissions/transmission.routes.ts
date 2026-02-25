import { Router } from "express";
import {
    createTransmission,
    updateTransmission,
    deleteTransmissions,
    getTransmissions,
    getTransmission,
} from "./transmission.controller";

const router = Router();

router.post("/transmissions", createTransmission);
router.get("/transmissions", getTransmissions);
router.get("/transmissions/:id", getTransmission);
router.patch("/transmissions/:id", updateTransmission);
router.delete("/transmissions", deleteTransmissions);

export default router;
