// BE/controllers/reportController.js
import { sql, getPool } from '../config/db.js';

export const getCustomerOrdersReport = async (req, res) => {
  try {
    const customerId = req.query.customerId ? Number(req.query.customerId) : 0;
    const statusList = req.query.statusList; // 'Pending,Shipping'

    if (!customerId || !statusList) {
      return res.status(400).json({
        error: 'customerId và statusList là bắt buộc'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    request
      .input('CustomerID', sql.Int, customerId)
      .input('StatusList', sql.NVarChar(sql.MAX), statusList);

    const result = await request.execute('sp_Get_Customer_Pending_Orders');

    const rows = result.recordset.map((r) => ({
      orderId: r.OrderID,
      orderDate: r.OrderDate,
      orderStatus: r.OrderStatus,
      trackingCode: r.TrackingCode,
      unitName: r.UnitName,
      address: r.Address,
      customerName: r.UserName
    }));

    res.json(rows);
  } catch (err) {
    console.error('getCustomerOrdersReport error:', err);
    res.status(400).json({
      error: err.message || 'Failed to fetch customer orders report'
    });
  }
};

export const getStoreInventoryReport = async (req, res) => {
  try {
    const minTotalItems = Number(req.query.minTotalItems);
    const storeNameKeyword = req.query.storeNameKeyword || null;

    if (Number.isNaN(minTotalItems)) {
      return res.status(400).json({
        error: 'minTotalItems là bắt buộc và phải là số'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    request
      .input('MinTotalItems', sql.Int, minTotalItems)
      .input('StoreNameKeyword', sql.NVarChar(100), storeNameKeyword);

    const result = await request.execute('sp_Report_Store_Inventory_HighVolume');

    const rows = result.recordset.map((r) => ({
      storeName: r.StoreName,
      address: r.Address,
      skuCount: r.SKU_Count,
      totalItems: r.TotalItems
    }));

    res.json(rows);
  } catch (err) {
    console.error('getStoreInventoryReport error:', err);
    res.status(400).json({
      error: err.message || 'Failed to fetch store inventory report'
    });
  }
};

export const getStoreLowStockReport = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);
    let threshold = req.query.threshold
      ? Number(req.query.threshold)
      : null;

    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({
        error: 'storeId là bắt buộc'
      });
    }

    if (threshold !== null && Number.isNaN(threshold)) {
      return res.status(400).json({
        error: 'threshold phải là số'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    request
      .input('StoreID', sql.Int, storeId)
      .input('Threshold', sql.Int, threshold);

    const result = await request.query(`
      SELECT * 
      FROM dbo.fn_Get_Low_Stock_Products_ByStore(@StoreID, @Threshold);
    `);

    const rows = result.recordset.map((r) => ({
      productName: r.ProductName,
      variantInfo: r.VariantInfo,
      qty: r.Qty,
      note: r.Note
    }));

    res.json(rows);
  } catch (err) {
    console.error('getStoreLowStockReport error:', err);
    res.status(400).json({
      error: err.message || 'Failed to fetch low stock report'
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // status mới: 'Shipping', 'Delivered', 'Cancelled'

    if (!orderId || !status) {
      return res.status(400).json({ error: 'Thiếu orderId hoặc status' });
    }

    const pool = await getPool();
    // Cập nhật trạng thái trong bảng Order
    await pool.request()
      .input('OrderID', sql.Int, orderId)
      .input('Status', sql.NVarChar(50), status)
      .query(`UPDATE [Order] SET Status = @Status WHERE OrderID = @OrderID`);

    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: err.message });
  }
};