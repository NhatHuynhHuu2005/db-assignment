// BE/routes/reportRoutes.js
import express from 'express';
const router = express.Router();
import * as reportController from '../controllers/reportController.js';

// /api/reports
router.get('/customer-orders', reportController.getCustomerOrdersReport);
router.get('/store-inventory', reportController.getStoreInventoryReport);
router.get('/store-low-stock', reportController.getStoreLowStockReport);

router.put('/orders/:orderId/status', reportController.updateOrderStatus);

export default router;
