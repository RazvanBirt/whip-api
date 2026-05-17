// src/middleware/requireAdmin.ts

import { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/prisma";

export type AuthedRequest = Request & { user?: { id: string; email: string } };

export async function requireAdmin(
    req: AuthedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isAdmin: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (!user.isAdmin) {
            return res.status(403).json({
                message: "Admin access required",
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}