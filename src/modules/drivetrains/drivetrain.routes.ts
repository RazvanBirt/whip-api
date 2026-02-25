import { Router } from "express";
import {
    createDrivetrain,
    updateDrivetrain,
    deleteDrivetrains,
    getDrivetrains,
    getDrivetrain,
} from "./drivetrain.controller";

const router = Router();

router.post("/drivetrains", createDrivetrain);
router.get("/drivetrains", getDrivetrains);
router.get("/drivetrains/:id", getDrivetrain);
router.patch("/drivetrains/:id", updateDrivetrain);
router.delete("/drivetrains", deleteDrivetrains);

export default router;
