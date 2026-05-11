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
// TODO : fix to /catalog/full
router.post('/catalog/models/full', upsertFullModelCatalog)

export default router;
