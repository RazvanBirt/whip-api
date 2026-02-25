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

router.post("/body-types", requireAuth, createBodyType);
router.get("/body-types", getBodyTypes);
router.get("/body-types/:id", getBodyType);
router.patch("/body-types/:id", requireAuth, updateBodyType);
router.delete("/body-types", requireAuth, deleteBodyTypes);

export default router;
