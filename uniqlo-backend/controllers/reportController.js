// BE/controllers/reportController.js
import { sql, getPool } from '../config/db.js';

function generateTrackingCode(prefix) {
    // Kết quả: GHTK-837291, VTP-123456...
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 số
    return `${prefix}-${randomNum}`;
}

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // Status mới (ví dụ: 'Shipping')

  // Map ID đơn vị vận chuyển sang Tiền tố mã vận đơn (cho đẹp)
  const CARRIER_PREFIX = {
      1: 'GHTK',  // Giao Hàng Tiết Kiệm
      2: 'VTP',   // Viettel Post
      3: 'GRAB',  // GrabExpress
      4: 'AHA'    // Ahamove
  };

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    
    // 1. Cập nhật trạng thái trong bảng [Order]
    request.input('OrderID', sql.Int, orderId);
    request.input('Status', sql.NVarChar(50), status);
    
    await request.query(`UPDATE [Order] SET Status = @Status WHERE OrderID = @OrderID`);

    // 2. NẾU TRẠNG THÁI LÀ "Shipping" -> SINH MÃ VẬN ĐƠN & TẠO SHIPMENT
    if (status === 'Shipping') {
        // A. Lấy UnitID từ đơn hàng để biết khách chọn ship nào
        const orderInfo = await new sql.Request(transaction)
            .query(`SELECT UnitID FROM [Order] WHERE OrderID = ${orderId}`);
        
        const unitId = orderInfo.recordset[0]?.UnitID || 1; // Mặc định 1 nếu lỗi
        
        // B. Sinh mã vận đơn giả lập
        const prefix = CARRIER_PREFIX[unitId] || 'UNI';
        const trackingCode = generateTrackingCode(prefix);

        // C. Kiểm tra xem đã có Shipment cho đơn này chưa (tránh tạo trùng)
        const checkShipment = await new sql.Request(transaction)
            .query(`SELECT ShipmentID FROM Shipment WHERE OrderID = ${orderId}`);

        if (checkShipment.recordset.length === 0) {
            // D. Tạo Shipment mới
            // ShipmentID trong DB của bạn không tự tăng (theo file create.sql), nên phải tự tạo ID hoặc sửa DB.
            // Ở đây mình dùng logic lấy Max ID + 1 cho đơn giản.
            const maxIdRes = await new sql.Request(transaction).query('SELECT MAX(ShipmentID) as MaxID FROM Shipment');
            const newShipmentId = (maxIdRes.recordset[0].MaxID || 0) + 1;

            const reqShip = new sql.Request(transaction);
            reqShip.input('ShipID', sql.Int, newShipmentId);
            reqShip.input('TrackCode', sql.VarChar(50), trackingCode);
            reqShip.input('O_ID', sql.Int, orderId);
            reqShip.input('U_ID', sql.Int, unitId);

            await reqShip.query(`
                INSERT INTO Shipment (ShipmentID, TrackingCode, Status, OrderID, UnitID)
                VALUES (@ShipID, @TrackCode, 'Shipping', @O_ID, @U_ID)
            `);
        }
    }
    
    // 3. NẾU TRẠNG THÁI LÀ "Delivered" -> CẬP NHẬT NGÀY GIAO HÀNG
    if (status === 'Delivered') {
         await new sql.Request(transaction).query(`
            UPDATE Shipment 
            SET Status = 'Delivered', DeliveryDate = GETDATE() 
            WHERE OrderID = ${orderId}
         `);
    }

    await transaction.commit();
    res.json({ message: `Cập nhật đơn hàng ${orderId} sang ${status} thành công!` });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái đơn hàng' });
  }
};

export const getCustomerOrdersReport = async (req, res) => {
  try {
    const { customerId, statusList } = req.query; 
    // statusList có thể là mảng ['Pending', 'Shipping'...]

    const pool = await getPool();
    const request = pool.request();

    let sqlQuery = `
      SELECT 
        o.OrderID as orderId,
        o.OrderDate as orderDate,
        o.Status as orderStatus,
        o.Address as address,
        s.TrackingCode as trackingCode,
        a.UserName as customerName,

        o.ShippingFee as shippingFee, 
        o.DiscountAmount as discountAmount,
        o.TotalAmount as totalAmount,
        
        (
            SELECT 
                p.ProductName,
                pv.Color,
                pv.Size,
                oi.Quantity,
                oi.PriceAtPurchase,
                pv.Price as OriginalPrice,
                oi.ProductID,
                (SELECT TOP 1 ImageURL FROM ProductVariant_ImageURL WHERE ProductID = pv.ProductID AND VariantID = pv.VariantID) as ImageURL
            FROM OrderItem oi
            JOIN ProductVariant pv ON oi.ProductID = pv.ProductID AND oi.VariantID = pv.VariantID
            JOIN Product p ON oi.ProductID = p.ProductID
            WHERE oi.OrderID = o.OrderID
            FOR JSON PATH
        ) AS itemsJson

      FROM [Order] o
      LEFT JOIN Account a ON o.CustomerID = a.UserID
      LEFT JOIN Shipment s ON o.OrderID = s.OrderID
      WHERE 1=1
    `;

    if (customerId) {
        sqlQuery += ` AND o.CustomerID = @CustomerID`;
        request.input('CustomerID', sql.Int, customerId);
    }

    if (statusList && statusList.length > 0) {
        // Xử lý statusList (nếu là mảng hoặc chuỗi)
        const statuses = Array.isArray(statusList) ? statusList : [statusList];
        const statusString = statuses.map(s => `'${s}'`).join(',');
        sqlQuery += ` AND o.Status IN (${statusString})`;
    }

    sqlQuery += ` ORDER BY o.OrderDate DESC`;

    const result = await request.query(sqlQuery);
    
    // Parse JSON string thành Object cho Frontend dùng
    const finalData = result.recordset.map(row => ({
        ...row,
        items: row.itemsJson ? JSON.parse(row.itemsJson) : []
    }));

    res.json(finalData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải báo cáo' });
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