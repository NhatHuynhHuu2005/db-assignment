// BE/routes/productRoutes.js
import express from 'express';
const router = express.Router();
import * as productController from '../controllers/productController.js';

// /api/products
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
