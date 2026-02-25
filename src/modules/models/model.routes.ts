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

router.post("/models", createModel);
router.get("/models", getModels);
router.get("/models/:id", getModel);
router.patch("/models/:id", updateModel);
router.delete("/models", deleteModels);

router.post('/catalog/models/full', upsertFullModelCatalog)

export default router;
