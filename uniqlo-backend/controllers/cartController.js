// BE/controllers/cartController.js
import { sql, getPool } from '../config/db.js';

const DEMO_STORE_ID = 10; // Mặc định lấy hàng từ Store 10 (UNIQLO Đồng Khởi)

// 1. Lấy thông tin giỏ hàng hiện tại
export const getCart = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.json([]);

    const pool = await getPool();
    // Lấy danh sách sản phẩm trong giỏ
    const result = await pool.request()
      .input('CustomerID', sql.Int, userId)
      .query(`
        SELECT 
          ci.CartID,
          ci.ProductID,
          ci.VariantID,
          ci.Quantity,
          p.ProductName,
          pv.Price,
          pv.Color,
          pv.Size,
          (SELECT TOP 1 ImageURL FROM ProductVariant_ImageURL WHERE ProductID = ci.ProductID AND VariantID = ci.VariantID) as Image
        FROM Cart c
        JOIN CartItem ci ON c.CartID = ci.CartID
        JOIN Product p ON ci.ProductID = p.ProductID
        JOIN ProductVariant pv ON ci.ProductID = pv.ProductID AND ci.VariantID = pv.VariantID
        WHERE c.CustomerID = @CustomerID
      `);
    
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Thêm vào giỏ hàng
export const addToCart = async (req, res) => {
  const { productId, variantId, quantity, userId } = req.body;
  // Mặc định variantId = 1 nếu FE không gửi lên (để test cho nhanh)
  const vId = variantId || 1; 
  const qty = quantity || 1;

  try {
    const pool = await getPool();
    
    // Bước A: Tìm xem khách này đã có Giỏ (Cart) chưa?
    let cartRes = await pool.request()
      .input('CustomerID', sql.Int, userId)
      .query('SELECT CartID FROM Cart WHERE CustomerID = @CustomerID');

    let cartId;
    
    if (cartRes.recordset.length === 0) {
      // Chưa có thì tạo mới
      const newCart = await pool.request()
        .input('CustomerID', sql.Int, userId)
        .query('INSERT INTO Cart (CustomerID) OUTPUT INSERTED.CartID VALUES (@CustomerID)');
      cartId = newCart.recordset[0].CartID;
    } else {
      cartId = cartRes.recordset[0].CartID;
    }

    // Bước B: Thêm sản phẩm vào CartItem (Nếu có rồi thì cộng dồn số lượng)
    await pool.request()
      .input('CartID', sql.Int, cartId)
      .input('ProductID', sql.Int, productId)
      .input('VariantID', sql.Int, vId)
      .input('Quantity', sql.Int, qty)
      .query(`
        MERGE CartItem AS target
        USING (SELECT @CartID, @ProductID, @VariantID) AS source (CartID, ProductID, VariantID)
        ON (target.CartID = source.CartID AND target.ProductID = source.ProductID AND target.VariantID = source.VariantID)
        WHEN MATCHED THEN
            UPDATE SET Quantity = target.Quantity + @Quantity
        WHEN NOT MATCHED THEN
            INSERT (CartID, ProductID, VariantID, Quantity)
            VALUES (@CartID, @ProductID, @VariantID, @Quantity);
      `);

    res.json({ message: 'Đã thêm vào giỏ hàng thành công!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi thêm giỏ hàng: ' + err.message });
  }
};

// 3. THANH TOÁN (Checkout) - Nghiệp vụ quan trọng nhất
export const checkout = async (req, res) => {
  const { userId, paymentMethod } = req.body;

  const validMethods = ['Cash', 'Banking'];
  const method = validMethods.includes(paymentMethod) ? paymentMethod : 'Cash';
  
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin(); // Bắt đầu giao dịch (Transaction)

    // A. Lấy CartID của khách
    const cartRes = await transaction.request()
      .input('CustomerID', sql.Int, userId)
      .query('SELECT CartID FROM Cart WHERE CustomerID = @CustomerID');
    
    if (cartRes.recordset.length === 0) throw new Error('Giỏ hàng trống!');
    const cartId = cartRes.recordset[0].CartID;

    // B. Tạo Đơn hàng (Order) mới
    // Generate OrderID ngẫu nhiên > 6000 để tránh trùng sample_data
    const newOrderId = Math.floor(Math.random() * 10000) + 6000;

    await transaction.request()
      .input('OrderID', sql.Int, newOrderId)
      .input('CustomerID', sql.Int, userId)
      .input('PaymentMethod', sql.NVarChar, method)
      .query(`
        INSERT INTO [Order] (
          OrderID, OrderDate, Status, Address, CustomerID, EmployeeID,
          PaymentMethod, PaymentStatus
        )
        VALUES (
          @OrderID, GETDATE(), 'Pending', N'Địa chỉ mặc định khách hàng', @CustomerID, NULL,
          @PaymentMethod, 'Unpaid'
        )
      `);

    // C. Chuyển dữ liệu từ CartItem -> OrderItem
    // Lưu ý: Phải lấy giá (Price) từ bảng ProductVariant tại thời điểm mua (Snapshot)
    await transaction.request()
      .input('CartID', sql.Int, cartId)
      .input('OrderID', sql.Int, newOrderId)
      .input('StoreID', sql.Int, DEMO_STORE_ID) 
      .query(`
        INSERT INTO OrderItem (OrderID, Quantity, PriceAtPurchase, ProductID, VariantID, StoreID, ShipmentID)
        SELECT 
          @OrderID,
          -- ĐÃ XÓA DÒNG ROW_NUMBER()...
          ci.Quantity,
          pv.Price,
          ci.ProductID,
          ci.VariantID,
          @StoreID,
          NULL
        FROM CartItem ci
        JOIN ProductVariant pv ON ci.ProductID = pv.ProductID AND ci.VariantID = pv.VariantID
        WHERE ci.CartID = @CartID
      `);
    const totalResult = await transaction.request()
        .input('OrderID', sql.Int, newOrderId)
        .query(`
            SELECT SUM(Quantity * PriceAtPurchase) as OrderTotal 
            FROM OrderItem 
            WHERE OrderID = @OrderID
        `);

    const orderTotal = totalResult.recordset[0].OrderTotal || 0;

    if (orderTotal > 0) {
        await transaction.request()
            .input('CustomerID', sql.Int, userId)
            .input('NewAmount', sql.Decimal(18, 0), orderTotal)
            .query(`
                UPDATE Customer 
                SET TotalSpent = ISNULL(TotalSpent, 0) + @NewAmount
                WHERE UserID = @CustomerID
            `);

        await transaction.request()
            .input('CustomerID_Tier', sql.Int, userId)
            .query(`
                UPDATE Customer
                SET MemberTier = CASE 
                    WHEN TotalSpent >= 50000000 THEN 'VIP'
                    WHEN TotalSpent >= 25000000 THEN 'Platinum'
                    WHEN TotalSpent >= 10000000 THEN 'Gold'
                    WHEN TotalSpent >= 5000000  THEN 'Silver'
                    WHEN TotalSpent >= 2000000  THEN 'Bronze'
                    ELSE 'New Member'
                END
                WHERE UserID = @CustomerID_Tier
            `);
    }

    // D. Làm sạch giỏ hàng (Xóa CartItem)
    await transaction.request()
      .input('CartID', sql.Int, cartId)
      .query('DELETE FROM CartItem WHERE CartID = @CartID');

    await transaction.commit(); // Lưu tất cả thay đổi
    
    res.json({ message: 'Đặt hàng thành công!', orderId: newOrderId });

  } catch (err) {
    await transaction.rollback(); // Nếu lỗi thì hoàn tác tất cả, không để dữ liệu rác
    console.error(err);
    res.status(500).json({ error: 'Lỗi thanh toán: ' + err.message });
  }
};

// 4. XÓA SẢN PHẨM KHỎI GIỎ (API Mới)
export const removeFromCart = async (req, res) => {
  const { userId, productId, variantId } = req.body;

  try {
    const pool = await getPool();

    // Tìm CartID của user
    const cartRes = await pool.request()
      .input('CustomerID', sql.Int, userId)
      .query('SELECT CartID FROM Cart WHERE CustomerID = @CustomerID');

    if (cartRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Giỏ hàng không tồn tại' });
    }

    const cartId = cartRes.recordset[0].CartID;

    // Xóa item khớp ProductID và VariantID
    await pool.request()
      .input('CartID', sql.Int, cartId)
      .input('ProductID', sql.Int, productId)
      .input('VariantID', sql.Int, variantId)
      .query(`
        DELETE FROM CartItem 
        WHERE CartID = @CartID 
          AND ProductID = @ProductID 
          AND VariantID = @VariantID
      `);

    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi xóa sản phẩm: ' + err.message });
  }
};