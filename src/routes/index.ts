import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes';
import makeRoutes from '../modules/makes/make.routes'
import modelRoutes from '../modules/models/model.routes'
import bodyTypesRoutes from '../modules/bodyTypes/bodyTypes.routes';
import engineRoutes from '../modules/engines/engine.routes';
import transmissionRoutes from '../modules/transmissions/transmission.routes';
import drivetrainRoutes from '../modules/drivetrains/drivetrain.routes';
import garageRoutes from '../modules/garage/garage.routes';

import userRoutes from '../modules/users/user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/makes', makeRoutes)
router.use('/models', modelRoutes)
router.use('/body-types', bodyTypesRoutes)
router.use('/engines', engineRoutes)
router.use('/transmissions', transmissionRoutes)
router.use('/drivetrains', drivetrainRoutes)
router.use('/garage', garageRoutes);
router.use('/users', userRoutes);
export default router;
