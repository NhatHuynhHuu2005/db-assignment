// BE/controllers/productController.js
import { sql, getPool } from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

function mapProductListRow(row) {
  let promoDetails = null;
  if (row.PromoInfo) {
      const [name, type, value] = row.PromoInfo.split('|');
      promoDetails = { name, type, value: Number(value) };
  }

  return {
    id: row.ProductID,
    name: row.ProductName,
    price: row.Price,
    finalPrice: row.FinalPrice,
    promoDetails: promoDetails,
    description: row.Description,
    employeeId: row.EmployeeID,
    // Xử lý danh mục (đã được nối chuỗi từ SQL)
    categories: row.Categories ? row.Categories.split(',').map((c) => c.trim()) : [],
    variantSummary: row.VariantSummary,
    imageUrl: row.ImageURL,
    categoryId: row.MainCategoryID
  };
}

export const getProducts = async (req, res) => {
  try {
    const { search, categoryId } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT 
        p.ProductID,
        p.ProductName,
        p.Description,
        p.EmployeeID,
        
        (SELECT MIN(Price) FROM ProductVariant WHERE ProductID = p.ProductID) as Price,

        (
            SELECT MIN(dbo.fn_Get_FinalPrice_WithPromotion(pv.ProductID, pv.VariantID, a.PromoID, a.RuleID))
            FROM ProductVariant pv
            LEFT JOIN Applied a ON pv.ProductID = a.ProductID AND pv.VariantID = a.VariantID
            LEFT JOIN Promotion prom ON a.PromoID = prom.PromoID
            WHERE pv.ProductID = p.ProductID
            AND (prom.PromoID IS NULL OR (prom.StartDate <= GETDATE() AND prom.EndDate >= GETDATE() AND prom.VoucherCode IS NULL))
        ) as FinalPrice,

        (
            SELECT TOP 1 CONCAT(prom.PromoName, '|', [rule].RuleType, '|', [rule].RewardValue)
            FROM ProductVariant pv
            JOIN Applied a ON pv.ProductID = a.ProductID AND pv.VariantID = a.VariantID
            JOIN Promotion prom ON a.PromoID = prom.PromoID
            JOIN PromotionRule [rule] ON a.PromoID = [rule].PromoID AND a.RuleID = [rule].RuleID
            WHERE pv.ProductID = p.ProductID
            AND prom.StartDate <= GETDATE() AND prom.EndDate >= GETDATE()
            ORDER BY [rule].RewardValue DESC
        ) as PromoInfo,

        (SELECT TOP 1 ImageURL FROM ProductVariant_ImageURL WHERE ProductID = p.ProductID) as ImageURL,

        -- 1. LẤY CHUỖI DANH MỤC (Vd: "Nam, Áo khoác")
        (
            SELECT STRING_AGG(c.CategoryName, ', ') 
            FROM Category c 
            JOIN Belongs_To bt ON c.CategoryID = bt.CategoryID 
            WHERE bt.ProductID = p.ProductID
        ) AS Categories,

        -- 2. LẤY CHUỖI PHÂN LOẠI (Vd: "Đỏ/XL, Xanh/M") -> Để hiện ra bảng
        (
            SELECT STRING_AGG(CONCAT(Color, '/', Size), ', ')
            FROM ProductVariant
            WHERE ProductID = p.ProductID
        ) AS VariantSummary,
        
        (SELECT TOP 1 CategoryID FROM Belongs_To WHERE ProductID = p.ProductID) as MainCategoryID

      FROM [Product] p
      LEFT JOIN Belongs_To bt ON p.ProductID = bt.ProductID
      LEFT JOIN Category c ON bt.CategoryID = c.CategoryID
    `;

    const conditions = [];
    if (search) {
      conditions.push('p.ProductName LIKE @Search');
      request.input('Search', sql.NVarChar(100), `%${search}%`);
    }
    if (categoryId) {
      conditions.push('c.CategoryID = @CategoryID');
      request.input('CategoryID', sql.Int, Number(categoryId));
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY p.ProductID, p.ProductName, p.Description, p.EmployeeID
      ORDER BY p.ProductID ASC;
    `;

    const result = await request.query(query);
    
    // Map dữ liệu
    const products = result.recordset.map(mapProductListRow);

    res.json(products);
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// 2. LẤY CHI TIẾT SẢN PHẨM (Đã sửa lỗi variantRows is not defined)
export const getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('ProductID', sql.Int, productId);

    // QUERY: Sử dụng OUTER APPLY để tránh lỗi "Multiple columns aggregated..."
    const result = await request.query(`
      -- 1. Thông tin product
      SELECT p.ProductID, p.ProductName, p.Description, p.EmployeeID
      FROM [Product] p
      WHERE p.ProductID = @ProductID;

      -- 2. Categories
      SELECT c.CategoryID, c.CategoryName
      FROM Category c
      INNER JOIN Belongs_To bt ON c.CategoryID = bt.CategoryID
      WHERE bt.ProductID = @ProductID;

      -- 3. Variants + ImageURL + PromotionPrice
      SELECT 
        pv.ProductID, pv.VariantID, pv.Color, pv.Size, pv.Price, i.ImageURL,
        (SELECT ISNULL(SUM(Quantity), 0) FROM Has_Stock WHERE ProductID = pv.ProductID AND VariantID = pv.VariantID) AS StockQuantity,
        
        -- Logic tính giá sau giảm (Dùng kết quả từ OUTER APPLY bên dưới)
        ISNULL(PromoCalc.DiscountPrice, pv.Price) AS PromotionPrice

      FROM ProductVariant pv
      LEFT JOIN ProductVariant_ImageURL i ON pv.ProductID = i.ProductID AND pv.VariantID = i.VariantID
      
      -- Kỹ thuật OUTER APPLY: Tìm giá tốt nhất cho từng dòng Variant
      OUTER APPLY (
          SELECT TOP 1 dbo.fn_Get_FinalPrice_WithPromotion(pv.ProductID, pv.VariantID, a.PromoID, a.RuleID) as DiscountPrice
          FROM Applied a
          JOIN Promotion prom ON a.PromoID = prom.PromoID
          WHERE a.ProductID = pv.ProductID AND a.VariantID = pv.VariantID
          AND prom.StartDate <= GETDATE() AND prom.EndDate >= GETDATE()
          ORDER BY DiscountPrice ASC -- Lấy giá thấp nhất (ưu đãi nhất)
      ) PromoCalc

      WHERE pv.ProductID = @ProductID;
    `);

    // QUAN TRỌNG: Phải có dòng này để lấy dữ liệu ra từ result
    const [productRows, categoryRows, variantRows] = result.recordsets;

    if (!productRows || productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const p = productRows[0];
    const categories = categoryRows.map((c) => ({
      id: c.CategoryID,
      name: c.CategoryName
    }));

    // Gom nhóm variants
    const variantMap = new Map();
    // Bây giờ biến variantRows đã được định nghĩa ở trên nên vòng lặp này sẽ chạy đúng
    for (const v of variantRows) {
      const key = `${v.ProductID}-${v.VariantID}`;
      if (!variantMap.has(key)) {
        variantMap.set(key, {
          productId: v.ProductID,
          variantId: v.VariantID,
          color: v.Color,
          size: v.Size,
          // Ưu tiên lấy giá khuyến mãi, nếu không có thì lấy giá gốc
          price: Number(v.PromotionPrice), 
          originalPrice: Number(v.Price), // Giá gốc để hiển thị gạch ngang (nếu cần)
          stockQuantity: Number(v.StockQuantity),
          images: []
        });
      }
      if (v.ImageURL) {
        variantMap.get(key).images.push(v.ImageURL);
      }
    }

    res.json({
      id: p.ProductID,
      name: p.ProductName,
      description: p.Description,
      employeeId: p.EmployeeID,
      categories,
      categoryId: categories.length > 0 ? categories[0].id : null,
      variants: Array.from(variantMap.values())
    });

  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ error: 'Failed to fetch product detail' });
  }
};

// 3. TẠO SẢN PHẨM
export const createProduct = async (req, res) => {
  try {
    const { productName, description, employeeId, variants, categoryIds, imageUrl } = req.body;

    if (!productName || !employeeId) return res.status(400).json({ error: 'Thiếu tên hoặc nhân viên' });
    if (!variants || variants.length === 0) return res.status(400).json({ error: 'Phải có ít nhất 1 biến thể' });

    const pool = await getPool();
    
    // --- BƯỚC 1: KIỂM TRA TRÙNG TÊN TRƯỚC KHI TẠO ---
    // (Kiểm tra nhẹ bên ngoài transaction cho nhanh)
    const checkNameRes = await pool.request()
        .input('CheckName', sql.NVarChar(100), productName)
        .query("SELECT ProductID FROM [Product] WHERE ProductName = @CheckName");

    if (checkNameRes.recordset.length > 0) {
        return res.status(400).json({ 
            error: `Sản phẩm có tên "${productName}" đã tồn tại. Vui lòng chọn "Sửa" sản phẩm cũ hoặc đặt tên khác.` 
        });
    }
    // ------------------------------------------------

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // B2: Tạo Product
      request.input('ProductName', sql.NVarChar(100), productName);
      request.input('Description', sql.NVarChar(sql.MAX), description || null);
      request.input('EmployeeID', sql.Int, Number(employeeId));

      const productResult = await request.query(`
        INSERT INTO [Product] (ProductName, Description, EmployeeID)
        OUTPUT INSERTED.ProductID
        VALUES (@ProductName, @Description, @EmployeeID);
      `);
      const newProductId = productResult.recordset[0].ProductID;

      // B3: Tạo Variants + Lưu Ảnh riêng từng Variant
      let vId = 1;
      for (const v of variants) {
          const reqVar = new sql.Request(transaction);
          reqVar.input('ProductID', sql.Int, newProductId);
          reqVar.input('VariantID', sql.Int, vId);
          reqVar.input('Color', sql.NVarChar(50), v.color);
          reqVar.input('Size', sql.NVarChar(50), v.size);
          reqVar.input('Price', sql.Decimal(10, 2), Number(v.price));
          
          await reqVar.query(`
            INSERT INTO ProductVariant (ProductID, VariantID, Color, Size, Price)
            VALUES (@ProductID, @VariantID, @Color, @Size, @Price)
          `);

          // Lưu ảnh cho variant này (nếu có)
          if (v.imageUrl && v.imageUrl.trim() !== "") {
             const reqImg = new sql.Request(transaction);
             reqImg.input('P_ID_Img', sql.Int, newProductId);
             reqImg.input('V_ID_Img', sql.Int, vId);
             reqImg.input('URL', sql.NVarChar(sql.MAX), v.imageUrl);
             
             await reqImg.query(`
                INSERT INTO ProductVariant_ImageURL (ProductID, VariantID, ImageURL)
                VALUES (@P_ID_Img, @V_ID_Img, @URL)
             `);
          }
          vId++;
      }

      // B4: Lưu Danh mục
      if (categoryIds && categoryIds.length > 0) {
         for (const catId of categoryIds) {
             const reqCat = new sql.Request(transaction);
             reqCat.input('ProductID', sql.Int, newProductId);
             reqCat.input('CategoryID', sql.Int, Number(catId));
             await reqCat.query(`INSERT INTO Belongs_To (ProductID, CategoryID) VALUES (@ProductID, @CategoryID)`);
         }
      }

      await transaction.commit();
      await logAudit('INSERT', 'Product', newProductId, `Tạo sản phẩm: ${productName}`, employeeId);
      res.status(201).json({ id: newProductId, message: "Tạo sản phẩm thành công" });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(400).json({ error: err.message });
  }
};

// 4. CẬP NHẬT SẢN PHẨM
export const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    // Nhận thêm imageUrl
    const { productName, description, employeeId, categoryIds, categoryId, variants, imageUrl } = req.body;

    let finalCategoryIds = [];
    if (categoryIds && Array.isArray(categoryIds)) {
        finalCategoryIds = categoryIds;
    } else if (categoryId) {
        finalCategoryIds = [Number(categoryId)];
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      
      // B1: Update Product Info
      request.input('ProductID', sql.Int, productId);
      request.input('ProductName', sql.NVarChar(100), productName);
      request.input('Description', sql.NVarChar(sql.MAX), description);
      request.input('EmployeeID', sql.Int, employeeId);
      await request.execute('sp_Update_Product');

      // --- LOGIC CẬP NHẬT ẢNH ---
      // Xóa ảnh cũ -> Lưu ảnh mới cho tất cả variant hiện có (Cách đơn giản nhất để đồng bộ)
      if (imageUrl !== undefined) { // Chỉ update nếu field này được gửi lên
          const reqDelImg = new sql.Request(transaction);
          reqDelImg.input('P_ID', sql.Int, productId);
          await reqDelImg.query("DELETE FROM ProductVariant_ImageURL WHERE ProductID = @P_ID");

          if (imageUrl && imageUrl.trim() !== "") {
              // Lấy tất cả VariantID hiện tại của Product
              const variantsResult = await new sql.Request(transaction)
                  .query(`SELECT VariantID FROM ProductVariant WHERE ProductID = ${productId}`);
              
              for (const row of variantsResult.recordset) {
                  const reqInsImg = new sql.Request(transaction);
                  reqInsImg.input('P_ID', sql.Int, productId);
                  reqInsImg.input('V_ID', sql.Int, row.VariantID);
                  reqInsImg.input('URL', sql.NVarChar(sql.MAX), imageUrl);
                  await reqInsImg.query(`
                      INSERT INTO ProductVariant_ImageURL (ProductID, VariantID, ImageURL) 
                      VALUES (@P_ID, @V_ID, @URL)
                  `);
              }
          }
      }
      // ---------------------------

      // B2: Xử lý Variants (Upsert)
      const maxIdResult = await new sql.Request(transaction).query(`SELECT ISNULL(MAX(VariantID), 0) as MaxID FROM ProductVariant WHERE ProductID = ${productId}`);
      let nextVariantId = maxIdResult.recordset[0].MaxID + 1;

      if (variants && variants.length > 0) {
        for (const v of variants) {
            const reqVar = new sql.Request(transaction);
            reqVar.input('ProductID', sql.Int, productId); // productId đã có từ trên
            reqVar.input('Color', sql.NVarChar(50), v.color);
            reqVar.input('Size', sql.NVarChar(50), v.size);
            reqVar.input('Price', sql.Decimal(10, 2), Number(v.price));

            let currentVariantId = v.variantId; // Nếu là update

            if (currentVariantId) {
                // UPDATE VARIANT CŨ
                reqVar.input('VariantID', sql.Int, currentVariantId);
                await reqVar.query(`
                    UPDATE ProductVariant 
                    SET Color = @Color, Size = @Size, Price = @Price 
                    WHERE ProductID = @ProductID AND VariantID = @VariantID
                `);
            } else {
                // INSERT VARIANT MỚI (Logic lấy ID tiếp theo)
                // (Giả sử bạn đã tính nextVariantId ở trên hoặc dùng logic identity tùy DB)
                // Ở đây tôi dùng logic nextVariantId như code cũ của bạn
                reqVar.input('VariantID', sql.Int, nextVariantId);
                await reqVar.query(`
                    INSERT INTO ProductVariant (ProductID, VariantID, Color, Size, Price)
                    VALUES (@ProductID, @VariantID, @Color, @Size, @Price)
                `);
                currentVariantId = nextVariantId;
                nextVariantId++;
            }

            // --- QUAN TRỌNG: LƯU ẢNH CHO VARIANT NÀY ---
            // Nếu người dùng nhập link ảnh cho biến thể này
            if (v.imageUrl && v.imageUrl.trim() !== "") {
                const reqImg = new sql.Request(transaction);
                reqImg.input('P_ID', sql.Int, productId);
                reqImg.input('V_ID', sql.Int, currentVariantId);
                reqImg.input('URL', sql.NVarChar(sql.MAX), v.imageUrl);

                // Xóa ảnh cũ của variant này (để tránh trùng lặp nếu update)
                await reqImg.query("DELETE FROM ProductVariant_ImageURL WHERE ProductID = @P_ID AND VariantID = @V_ID");
                
                // Thêm ảnh mới
                await reqImg.query(`
                    INSERT INTO ProductVariant_ImageURL (ProductID, VariantID, ImageURL)
                    VALUES (@P_ID, @V_ID, @URL)
                `);
            }
            // --------------------------------------------
        }
      }

      // B3: Update Categories
      if (finalCategoryIds.length > 0) {
        const requestDel = new sql.Request(transaction);
        requestDel.input('ProductID', sql.Int, productId);
        await requestDel.query('DELETE FROM Belongs_To WHERE ProductID = @ProductID');

        for (const catId of finalCategoryIds) {
           const requestCat = new sql.Request(transaction);
           requestCat.input('ProductID', sql.Int, productId);
           requestCat.input('CategoryID', sql.Int, Number(catId));
           await requestCat.query(`INSERT INTO Belongs_To (ProductID, CategoryID) VALUES (@ProductID, @CategoryID)`);
        }
      }

      await transaction.commit();
      await logAudit('UPDATE', 'Product', productId, `Cập nhật thông tin sản phẩm`, employeeId);
      res.json({ message: "Update thành công" });
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
  } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ error: err.message });
  }
};

// 5. XÓA SẢN PHẨM
export const deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('ProductID', sql.Int, productId);
    await request.execute('sp_Delete_Product');

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(400).json({ error: err.message || 'Failed to delete product' });
  }
};