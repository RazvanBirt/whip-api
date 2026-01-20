import { Router } from 'express';

import authMiddleware from '../middleware/auth.middleware';

import authRoutes from '../modules/auth/auth.routes';


const router = Router();

router.use('/auth', authRoutes);
export default router;
