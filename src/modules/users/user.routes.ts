import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware";

import {
    getMyTheme,
    updateMyTheme,
} from "./user.controller";

const router = Router();

router.get("/theme", requireAuth, getMyTheme);
router.patch("/theme", requireAuth, updateMyTheme);

export default router;