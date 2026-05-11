import { Router } from "express";
import {
    createModel,
    updateModel,
    deleteModels,
    getModels,
    getModel,
    upsertFullModelCatalog,
} from "./model.controller";

const router = Router();

router.post("/", createModel);
router.get("/", getModels);
router.get("/:id", getModel);
router.patch("/:id", updateModel);
router.delete("/", deleteModels);

router.post('/catalog/models/full', upsertFullModelCatalog)

export default router;
