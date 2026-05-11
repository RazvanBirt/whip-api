import { Router } from "express";
import {
    createDrivetrain,
    updateDrivetrain,
    deleteDrivetrains,
    getDrivetrains,
    getDrivetrain,
} from "./drivetrain.controller";

const router = Router();

router.post("/", createDrivetrain);
router.get("/", getDrivetrains);
router.get("/:id", getDrivetrain);
router.patch("/:id", updateDrivetrain);
router.delete("/", deleteDrivetrains);

export default router;
