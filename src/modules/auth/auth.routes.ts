import { Router } from "express";
import {
    changePasswordController,
    forgotPasswordController,
    login,
    logout,
    refresh,
    register,
    resetPasswordController,
} from "./auth.controller";
import { requireAuth } from "./auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

router.post("/change-password", requireAuth, changePasswordController);

export default router;
