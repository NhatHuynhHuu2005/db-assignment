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
          
          -- Lấy giá Gốc (để tham khảo)
          pv.Price as OriginalPrice,
          
          -- TÍNH GIÁ BÁN THỰC TẾ (SỬA LỖI AGGREGATE BẰNG OUTER APPLY)
          ISNULL(PromoCalc.DiscountPrice, pv.Price) AS Price, 

          pv.Color,
          pv.Size,
          (SELECT TOP 1 ImageURL FROM ProductVariant_ImageURL WHERE ProductID = ci.ProductID AND VariantID = ci.VariantID) as Image
        FROM Cart c
        JOIN CartItem ci ON c.CartID = ci.CartID
        JOIN Product p ON ci.ProductID = p.ProductID
        JOIN ProductVariant pv ON ci.ProductID = pv.ProductID AND ci.VariantID = pv.VariantID
        
        -- Kỹ thuật OUTER APPLY
        OUTER APPLY (
            SELECT TOP 1 dbo.fn_Get_FinalPrice_WithPromotion(ci.ProductID, ci.VariantID, a.PromoID, a.RuleID) as DiscountPrice
            FROM Applied a
            JOIN Promotion prom ON a.PromoID = prom.PromoID
            WHERE a.ProductID = ci.ProductID AND a.VariantID = ci.VariantID
            AND prom.StartDate <= GETDATE() AND prom.EndDate >= GETDATE()
            ORDER BY DiscountPrice ASC
        ) PromoCalc

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
    // Nhận đủ các tham số
    const { userId, address, unitId, paymentMethod, shippingFee, discountAmount, finalTotal } = req.body;

    if (!userId || !address || !unitId) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        
        // --- SỬA ĐỔI TỪ ĐÂY: TẠO REQUEST RIÊNG CHO TỪNG BƯỚC ---

        // A. Lấy giỏ hàng hiện tại (Dùng reqCart)
        const reqCart = new sql.Request(transaction); 
        const cartRes = await reqCart.input('UserID', sql.Int, userId)
            .query(`SELECT CartID FROM Cart WHERE CustomerID = @UserID`);
        
        if (cartRes.recordset.length === 0) throw new Error('Không tìm thấy giỏ hàng');
        const cartId = cartRes.recordset[0].CartID;

        // B. Lấy các item trong giỏ (Dùng reqItems)
        const reqItems = new sql.Request(transaction);
        const itemsRes = await reqItems.input('CartID', sql.Int, cartId)
            .query(`
                SELECT 
                    ci.*, 
                    pv.Price as OriginalPrice, -- Lấy giá gốc để tham khảo
                    
                    -- TÍNH GIÁ KHUYẾN MÃI (QUAN TRỌNG: Logic này tìm giá thấp nhất đang áp dụng)
                    ISNULL(
                        (
                            SELECT TOP 1 dbo.fn_Get_FinalPrice_WithPromotion(pv.ProductID, pv.VariantID, a.PromoID, a.RuleID)
                            FROM Applied a
                            JOIN Promotion prom ON a.PromoID = prom.PromoID
                            WHERE a.ProductID = pv.ProductID AND a.VariantID = pv.VariantID
                            AND prom.StartDate <= GETDATE() AND prom.EndDate >= GETDATE()
                            ORDER BY dbo.fn_Get_FinalPrice_WithPromotion(pv.ProductID, pv.VariantID, a.PromoID, a.RuleID) ASC
                        ),
                        pv.Price -- Nếu không có khuyến mãi thì lấy giá gốc
                    ) as FinalPrice

                FROM CartItem ci
                JOIN ProductVariant pv ON ci.ProductID = pv.ProductID AND ci.VariantID = pv.VariantID
                WHERE ci.CartID = @CartID
            `);
        
        const items = itemsRes.recordset;
        if (items.length === 0) throw new Error('Giỏ hàng trống');

        // C. Tạo Đơn Hàng (Dùng reqOrder - QUAN TRỌNG)
        const newOrderId = Math.floor(Math.random() * 1000000); 
        const reqOrder = new sql.Request(transaction); // <--- TẠO MỚI ĐỂ KHÔNG BỊ TRÙNG UserID

        reqOrder.input('NewOrderID', sql.Int, newOrderId);
        reqOrder.input('UserID', sql.Int, userId); // Bây giờ khai báo lại UserID ở đây là OK vì là request mới
        reqOrder.input('Address', sql.NVarChar(255), address);
        reqOrder.input('UnitID', sql.Int, Number(unitId));
        reqOrder.input('PaymentMethod', sql.NVarChar(50), paymentMethod || 'COD');
        
        // Các loại tiền
        reqOrder.input('ShippingFee', sql.Decimal(18, 2), shippingFee || 0);
        reqOrder.input('DiscountAmount', sql.Decimal(18, 2), discountAmount || 0);
        reqOrder.input('TotalAmount', sql.Decimal(18, 2), finalTotal || 0);

        await reqOrder.query(`
            INSERT INTO [Order] (OrderID, CustomerID, Address, Status, OrderDate, UnitID, PaymentMethod, ShippingFee, DiscountAmount, TotalAmount)
            VALUES (@NewOrderID, @UserID, @Address, 'Pending', GETDATE(), @UnitID, @PaymentMethod, @ShippingFee, @DiscountAmount, @TotalAmount)
        `);

        // D. Chuyển CartItem sang OrderItem & Trừ kho
        for (const item of items) {
            // Tìm kho (ReqStockCheck)
            const reqStockCheck = new sql.Request(transaction);
            const stockRes = await reqStockCheck
                .input('P_ID', sql.Int, item.ProductID)
                .input('V_ID', sql.Int, item.VariantID)
                .input('Qty', sql.Int, item.Quantity)
                .query(`
                    SELECT TOP 1 StoreID, Quantity FROM Has_Stock 
                    WHERE ProductID = @P_ID AND VariantID = @V_ID AND Quantity >= @Qty
                `);

            let storeId = 10; 
            if (stockRes.recordset.length > 0) {
                storeId = stockRes.recordset[0].StoreID;
                
                // Trừ kho (ReqUpdateStock)
                const reqUpdateStock = new sql.Request(transaction);
                await reqUpdateStock
                    .input('Qty', sql.Int, item.Quantity)
                    .input('S_ID', sql.Int, storeId)
                    .input('P_ID', sql.Int, item.ProductID)
                    .input('V_ID', sql.Int, item.VariantID)
                    .query(`
                        UPDATE Has_Stock SET Quantity = Quantity - @Qty 
                        WHERE StoreID = @S_ID AND ProductID = @P_ID AND VariantID = @V_ID
                    `);
            }

            // Insert OrderItem (ReqInsertItem)
            const reqInsertItem = new sql.Request(transaction);
            await reqInsertItem
                .input('O_ID', sql.Int, newOrderId)
                .input('Qty', sql.Int, item.Quantity)
                .input('Price', sql.Decimal(18,2), item.FinalPrice) 
                
                .input('P_ID', sql.Int, item.ProductID)
                .input('V_ID', sql.Int, item.VariantID)
                .input('S_ID', sql.Int, storeId)
                .query(`
                    INSERT INTO OrderItem (OrderID, Quantity, PriceAtPurchase, ProductID, VariantID, StoreID)
                    VALUES (@O_ID, @Qty, @Price, @P_ID, @V_ID, @S_ID)
                `);
        }

        // E. Xóa giỏ hàng cũ (ReqDeleteCart)
        const reqDeleteCart = new sql.Request(transaction);
        await reqDeleteCart.input('CartID', sql.Int, cartId)
            .query(`DELETE FROM CartItem WHERE CartID = @CartID`);

        await transaction.commit();
        res.json({ message: 'Đặt hàng thành công!', orderId: newOrderId });

    } catch (err) {
        await transaction.rollback();
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

export const getShippingUnits = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT UnitID, UnitName FROM ShippingUnit');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi lấy danh sách vận chuyển' });
    }
};