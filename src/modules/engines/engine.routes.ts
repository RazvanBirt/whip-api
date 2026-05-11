import { Router } from "express";
import {
    createEngine,
    updateEngine,
    deleteEngines,
    getEngines,
    getEngine,
} from "./engine.controller";

const router = Router();

router.post("/", createEngine);
router.get("/", getEngines);
router.get("/:id", getEngine);
router.patch("/:id", updateEngine);
router.delete("/", deleteEngines);

export default router;
