import express from 'express';
const router = express.Router();
import * as promotionController from '../controllers/promotionController.js';

// Base URL: /api/promotions


router.get('/', promotionController.getPromotions);
router.get('/:id', promotionController.getPromotionById);
router.post('/', promotionController.createPromotion);
router.put('/:id', promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);
router.post('/validate', promotionController.validateVoucher);

export default router;