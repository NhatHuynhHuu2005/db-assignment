// BE/routes/authRoutes.js
import express from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register); 
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/profile/update', updateProfile);

export default router;