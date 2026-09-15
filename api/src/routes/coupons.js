import express from 'express';
import { validateCoupon } from '../controllers/couponsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/validate', authenticateToken, validateCoupon);

export default router;
