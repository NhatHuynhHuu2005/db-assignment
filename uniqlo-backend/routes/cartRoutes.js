// BE/routes/cartRoutes.js
import express from 'express';
const router = express.Router();
import * as cartController from '../controllers/cartController.js';

router.get('/', cartController.getCart);      // Xem giỏ
router.post('/add', cartController.addToCart); // Thêm vào giỏ
router.post('/checkout', cartController.checkout); // Đặt hàng
router.post('/remove', cartController.removeFromCart) // Xoá hàng;

export default router;