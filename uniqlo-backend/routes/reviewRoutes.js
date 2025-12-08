// BE/routes/reviewRoutes.js
import express from 'express';
const router = express.Router();
import * as reviewController from '../controllers/reviewController.js';

// Base URL sẽ được mount tại '/api' trong server.js

// 1. Lấy danh sách đánh giá của sản phẩm
// URL thực tế: GET /api/products/:productId/reviews
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// 2. Gửi đánh giá mới
// URL thực tế: POST /api/reviews
router.post('/reviews', reviewController.addReview);

export default router;