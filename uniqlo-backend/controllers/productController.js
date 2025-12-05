// BE/controllers/productController.js
import { sql, getPool } from '../config/db.js';

// Helper: map record thành object FE-friendly
function mapProductListRow(row) {
  return {
    id: row.ProductID,
    name: row.ProductName,
    price: row.Price,
    description: row.Description,
    employeeId: row.EmployeeID,
    categories: row.Categories
      ? row.Categories.split(',').map((c) => c.trim())
      : []
  };
}

// 1. LẤY DANH SÁCH SẢN PHẨM (Đã sửa lỗi lặp & lỗi pv.Price)
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
        -- SỬA Ở ĐÂY: Dùng Subquery để lấy giá, KHÔNG dùng pv.Price
        (SELECT MIN(Price) FROM ProductVariant WHERE ProductID = p.ProductID) as Price,
        STRING_AGG(c.CategoryName, ', ') AS Categories
      FROM [Product] p
      LEFT JOIN Belongs_To bt ON p.ProductID = bt.ProductID
      LEFT JOIN Category c ON bt.CategoryID = c.CategoryID
      -- QUAN TRỌNG: Không JOIN ProductVariant ở đây nữa để tránh lặp dòng
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
    const products = result.recordset.map(mapProductListRow);

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
      SELECT 
        p.ProductID,
        p.ProductName,
        p.Description,
        p.EmployeeID
      FROM [Product] p
      WHERE p.ProductID = @ProductID;

      -- Categories
      SELECT 
        c.CategoryID,
        c.CategoryName
      FROM Category c
      INNER JOIN Belongs_To bt 
        ON c.CategoryID = bt.CategoryID
      WHERE bt.ProductID = @ProductID;

      -- Variants + ImageURL
      SELECT 
        pv.ProductID,
        pv.VariantID,
        pv.Color,
        pv.Size,
        pv.Price,
        i.ImageURL
      FROM ProductVariant pv
      LEFT JOIN ProductVariant_ImageURL i
        ON pv.ProductID = i.ProductID 
       AND pv.VariantID = i.VariantID
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
          images: []
        });
      }
      if (v.ImageURL) {
        variantMap.get(key).images.push(v.ImageURL);
      }
    }

    const variants = Array.from(variantMap.values());

    const product = {
      id: p.ProductID,
      name: p.ProductName,
      description: p.Description,
      employeeId: p.EmployeeID,
      categories,
      variants
    };

    res.json(product);
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ error: 'Failed to fetch product detail' });
  }
};

// 3. TẠO SẢN PHẨM
export const createProduct = async (req, res) => {
  try {
    const { productName, description, employeeId } = req.body;

    if (!productName || !employeeId) {
      return res.status(400).json({
        error: 'productName và employeeId là bắt buộc'
      });
    }

    const pool = await getPool();
    const request = pool.request();

    request
      .input('ProductName', sql.NVarChar(100), productName)
      .input('Description', sql.NVarChar(sql.MAX), description || null)
      .input('EmployeeID', sql.Int, Number(employeeId));

    const result = await request.query(`
      EXEC sp_Insert_Product 
        @ProductName = @ProductName,
        @Description = @Description,
        @EmployeeID = @EmployeeID;
      SELECT IDENT_CURRENT('Product') AS ProductID;
    `);

    const newId =
      (result.recordset && result.recordset[0] && result.recordset[0].ProductID) ||
      (result.recordsets &&
        result.recordsets[0] &&
        result.recordsets[0][0] &&
        result.recordsets[0][0].ProductID);

    if (!newId) {
      return res.status(201).json({
        message: 'Product created, but could not retrieve new ProductID'
      });
    }

    // Lấy lại thông tin để trả về
    const productResult = await pool
      .request()
      .input('ProductID', sql.Int, Number(newId))
      .query(`SELECT ProductID, ProductName, Description, EmployeeID FROM [Product] WHERE ProductID = @ProductID`);

    const p = productResult.recordset[0];

    res.status(201).json({
      id: p.ProductID,
      name: p.ProductName,
      description: p.Description,
      employeeId: p.EmployeeID
    });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(400).json({
      error: err.message || 'Failed to create product'
    });
  }
};

// 4. CẬP NHẬT SẢN PHẨM
export const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const { productName, description, employeeId } = req.body;
    const pool = await getPool();

    const request = pool.request();
    request
      .input('ProductID', sql.Int, productId)
      .input('ProductName', sql.NVarChar(100), productName ?? null)
      .input('Description', sql.NVarChar(sql.MAX), description ?? null)
      .input('EmployeeID', sql.Int, employeeId !== undefined ? Number(employeeId) : null);

    await request.execute('sp_Update_Product');

    const productResult = await pool
      .request()
      .input('ProductID', sql.Int, productId)
      .query(`SELECT ProductID, ProductName, Description, EmployeeID FROM [Product] WHERE ProductID = @ProductID`);

    if (productResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Product not found after update' });
    }

    const p = productResult.recordset[0];

    res.json({
      id: p.ProductID,
      name: p.ProductName,
      description: p.Description,
      employeeId: p.EmployeeID
    });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(400).json({
      error: err.message || 'Failed to update product'
    });
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
    res.status(400).json({
      error: err.message || 'Failed to delete product'
    });
  }
};