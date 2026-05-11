import { Router } from "express";
import {
    createBodyType,
    getBodyType,
    getBodyTypes,
    updateBodyType,
    deleteBodyTypes,
} from "./bodyTypes.controller";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.post("/", requireAuth, createBodyType);
router.get("/", getBodyTypes);
router.get("/:id", getBodyType);
router.patch("/:id", requireAuth, updateBodyType);
router.delete("/", requireAuth, deleteBodyTypes);

export default router;
