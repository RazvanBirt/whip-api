import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
    addCarToGarage,
    deleteGarageCar,
    getGarageCar,
    getMyGarage,
    updateGarageCar,
} from "./garage.controller";

const router = Router();

router.get("/", requireAuth, getMyGarage);
router.post("/", requireAuth, addCarToGarage);
router.get("/:id", requireAuth, getGarageCar);
router.patch("/:id", requireAuth, updateGarageCar);
router.delete("/:id", requireAuth, deleteGarageCar);

export default router;