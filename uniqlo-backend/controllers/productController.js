// BE/controllers/productController.js
import { sql, getPool } from '../config/db.js';

// Helper: map record thành object FE-friendly
function mapProductListRow(row) {
  return {
    id: row.ProductID,
    name: row.ProductName,
    price: row.Price,
    description: row.Description,
    // Sửa lỗi logic: Nếu có EmployeeID thì trả về, không thì null
    employeeId: row.EmployeeID, 
    // categoryId: row.MainCategoryID, // Dòng này sẽ được xử lý ở hàm map bên dưới
    categories: row.Categories
      ? row.Categories.split(',').map((c) => c.trim())
      : [],
    variantSummary: row.VariantSummary
  };
}

// 1. LẤY DANH SÁCH SẢN PHẨM
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
        STRING_AGG(c.CategoryName, ', ') AS Categories,
        (
            SELECT STRING_AGG(CONCAT(Color, '/', Size), ', ') 
            FROM ProductVariant 
            WHERE ProductID = p.ProductID
        ) AS VariantSummary,
        MAX(bt.CategoryID) as MainCategoryID
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
      ORDER BY p.ProductID DESC;
    `;

    const result = await request.query(query);
    
    // Map dữ liệu: kết hợp Helper và thêm trường categoryId
    const products = result.recordset.map(row => ({
        ...mapProductListRow(row),     // Dấu ... dùng để copy các trường từ hàm helper
        categoryId: row.MainCategoryID // Bổ sung field này để Form Edit tự động tick chọn danh mục
    }));

    res.json(products);
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// 2. LẤY CHI TIẾT SẢN PHẨM
export const getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('ProductID', sql.Int, productId);

    const result = await request.query(`
      -- Thông tin product
      SELECT p.ProductID, p.ProductName, p.Description, p.EmployeeID
      FROM [Product] p
      WHERE p.ProductID = @ProductID;

      -- Categories
      SELECT c.CategoryID, c.CategoryName
      FROM Category c
      INNER JOIN Belongs_To bt ON c.CategoryID = bt.CategoryID
      WHERE bt.ProductID = @ProductID;

      -- Variants + ImageURL
      SELECT 
        pv.ProductID, pv.VariantID, pv.Color, pv.Size, pv.Price, i.ImageURL,
        (SELECT ISNULL(SUM(Quantity), 0) FROM Has_Stock WHERE ProductID = pv.ProductID AND VariantID = pv.VariantID) AS StockQuantity
      FROM ProductVariant pv
      LEFT JOIN ProductVariant_ImageURL i ON pv.ProductID = i.ProductID AND pv.VariantID = i.VariantID
      WHERE pv.ProductID = @ProductID;
    `);

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
    for (const v of variantRows) {
      const key = `${v.ProductID}-${v.VariantID}`;
      if (!variantMap.has(key)) {
        variantMap.set(key, {
          productId: v.ProductID,
          variantId: v.VariantID,
          color: v.Color,
          size: v.Size,
          price: Number(v.Price),
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
      categoryId: categories.length > 0 ? categories[0].id : null, // Trả về 1 ID để binding vào Form
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
    const { productName, description, employeeId, variants, categoryIds } = req.body;

    // --- LOGIC XỬ LÝ MẢNG CATEGORY ---
    if (!productName || !employeeId) return res.status(400).json({ error: 'Thiếu tên hoặc nhân viên' });
    if (!variants || variants.length === 0) return res.status(400).json({ error: 'Phải có ít nhất 1 biến thể (Màu, Size, ...)' });

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // BƯỚC 1: Tạo Product
      request.input('ProductName', sql.NVarChar(100), productName);
      request.input('Description', sql.NVarChar(sql.MAX), description || null);
      request.input('EmployeeID', sql.Int, Number(employeeId));

      const productResult = await request.query(`
        INSERT INTO [Product] (ProductName, Description, EmployeeID)
        OUTPUT INSERTED.ProductID
        VALUES (@ProductName, @Description, @EmployeeID);
      `);
      const newProductId = productResult.recordset[0].ProductID;

      // BƯỚC 2: Tạo Variant mặc định (để lưu Giá)
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
          vId++;
      }

      // BƯỚC 3: Lưu Danh mục (Hỗ trợ nhiều danh mục)
      if (categoryIds && categoryIds.length > 0) {
         for (const catId of categoryIds) {
             const reqCat = new sql.Request(transaction);
             reqCat.input('ProductID', sql.Int, newProductId);
             reqCat.input('CategoryID', sql.Int, Number(catId));
             await reqCat.query(`INSERT INTO Belongs_To (ProductID, CategoryID) VALUES (@ProductID, @CategoryID)`);
         }
      }

      await transaction.commit();
      res.status(201).json({ id: newProductId, message: "Tạo thành công" });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(400).json({ error: err.message || 'Failed to create product' });
  }
};

// 4. CẬP NHẬT SẢN PHẨM
export const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    // Lấy thêm categoryId để fallback nếu client gửi format cũ
    const { productName, description, employeeId, categoryIds, categoryId, variants } = req.body;

    // --- FIX LỖI: ĐỊNH NGHĨA BIẾN finalCategoryIds ---
    let finalCategoryIds = [];
    if (categoryIds && Array.isArray(categoryIds)) {
        finalCategoryIds = categoryIds;
    } else if (categoryId) {
        finalCategoryIds = [Number(categoryId)];
    }
    // --------------------------------------------------

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

      // B2: Xử lý Variants (Upsert: Có ID thì Update, Chưa có thì Insert)
      // Lấy Max VariantID hiện tại
      const maxIdResult = await new sql.Request(transaction).query(`SELECT ISNULL(MAX(VariantID), 0) as MaxID FROM ProductVariant WHERE ProductID = ${productId}`);
      let nextVariantId = maxIdResult.recordset[0].MaxID + 1;

      if (variants && variants.length > 0) {
        for (const v of variants) {
            const reqVar = new sql.Request(transaction);
            reqVar.input('ProductID', sql.Int, productId);
            reqVar.input('Color', sql.NVarChar(50), v.color);
            reqVar.input('Size', sql.NVarChar(50), v.size);
            reqVar.input('Price', sql.Decimal(10, 2), Number(v.price));

            if (v.variantId) {
                // UPDATE
                reqVar.input('VariantID', sql.Int, v.variantId);
                await reqVar.query(`
                    UPDATE ProductVariant 
                    SET Color = @Color, Size = @Size, Price = @Price 
                    WHERE ProductID = @ProductID AND VariantID = @VariantID
                `);
            } else {
                // INSERT NEW
                reqVar.input('VariantID', sql.Int, nextVariantId);
                await reqVar.query(`
                    INSERT INTO ProductVariant (ProductID, VariantID, Color, Size, Price)
                    VALUES (@ProductID, @VariantID, @Color, @Size, @Price)
                `);
                nextVariantId++;
            }
        }
      }

      // B3: Update Categories (Dùng finalCategoryIds đã định nghĩa ở trên)
      if (finalCategoryIds.length > 0) {
        const requestDel = new sql.Request(transaction);
        requestDel.input('ProductID', sql.Int, productId);
        // Xóa danh mục cũ
        await requestDel.query('DELETE FROM Belongs_To WHERE ProductID = @ProductID');

        // Thêm danh mục mới
        for (const catId of finalCategoryIds) {
           const requestCat = new sql.Request(transaction);
           requestCat.input('ProductID', sql.Int, productId);
           requestCat.input('CategoryID', sql.Int, Number(catId));
           await requestCat.query(`INSERT INTO Belongs_To (ProductID, CategoryID) VALUES (@ProductID, @CategoryID)`);
        }
      }

      await transaction.commit();
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