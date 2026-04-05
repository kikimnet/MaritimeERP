import { Router } from 'express';
import { authRoutes } from './auth';
import { fleetRoutes } from './fleet';
import { contractsRoutes } from './contracts';
import { crewRoutes } from './crew';
import { voyagesRoutes } from './voyages';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Maritime ERP API is running' });
});

router.use('/auth', authRoutes);
router.use('/fleet', fleetRoutes);
router.use('/contracts', contractsRoutes);
router.use('/crew', crewRoutes);
router.use('/voyages', voyagesRoutes);

export default router;
