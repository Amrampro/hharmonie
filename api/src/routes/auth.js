// api/src/routes/auth.js
import express from 'express';
import { signup, login, getProfile, updateProfile, updatePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

router.put("/password", authenticateToken, updatePassword);

export default router;
