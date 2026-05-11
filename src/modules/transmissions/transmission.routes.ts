import { Router } from "express";
import {
    createTransmission,
    updateTransmission,
    deleteTransmissions,
    getTransmissions,
    getTransmission,
} from "./transmission.controller";

const router = Router();

router.post("/", createTransmission);
router.get("/", getTransmissions);
router.get("/:id", getTransmission);
router.patch("/:id", updateTransmission);
router.delete("/", deleteTransmissions);

export default router;
