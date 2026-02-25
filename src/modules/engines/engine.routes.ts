import { Router } from "express";
import {
    createEngine,
    updateEngine,
    deleteEngines,
    getEngines,
    getEngine,
} from "./engine.controller";

const router = Router();

router.post("/engines", createEngine);
router.get("/engines", getEngines);
router.get("/engines/:id", getEngine);
router.patch("/engines/:id", updateEngine);
router.delete("/engines", deleteEngines);

export default router;
