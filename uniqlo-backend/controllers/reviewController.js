import { sql, getPool } from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js'; // Import hàm log vừa tạo

// 1. Lấy danh sách đánh giá của 1 sản phẩm
export const getProductReviews = async (req, res) => {
    try {
        const productId = req.params.productId;
        const pool = await getPool();
        
        // Join bảng Review với Account để lấy tên người đánh giá
        // Lưu ý: Trong DB của bạn Review.CustomerID trỏ tới Customer(UserID), 
        // và Customer(UserID) trỏ tới Account(UserID). Nên CustomerID chính là AccountID.
        const result = await pool.request()
            .input('ProductID', sql.Int, productId)
            .query(`
                SELECT 
                    r.ReviewID, 
                    r.Rating, 
                    r.Content, 
                    r.ReviewDate,
                    a.UserName, 
                    a.Role
                FROM Review r
                JOIN Account a ON r.CustomerID = a.UserID
                WHERE r.ProductID = @ProductID
                ORDER BY r.ReviewDate DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi lấy đánh giá' });
    }
};

// 2. Thêm đánh giá mới
export const addReview = async (req, res) => {
    try {
        const { productId, customerId, rating, content } = req.body;

        if (!customerId || !productId || !rating) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        const pool = await getPool();
        const request = pool.request();

        request.input('CustomerID', sql.Int, customerId);
        request.input('ProductID', sql.Int, productId);
        request.input('Rating', sql.Int, rating);
        request.input('Content', sql.NVarChar(sql.MAX), content);

        // Thực hiện Insert
        await request.query(`
            INSERT INTO Review (CustomerID, ProductID, Content, Rating, ReviewDate)
            VALUES (@CustomerID, @ProductID, @Content, @Rating, GETDATE())
        `);

        // --- GHI AUDIT LOG ---
        // Sau khi review thành công, ghi lại vào nhật ký
        await logAudit(
            'INSERT', 
            'Review', 
            `${productId}`, 
            `Khách hàng #${customerId} đánh giá ${rating} sao`, 
            customerId
        );

        res.status(201).json({ message: 'Đánh giá thành công!' });

    } catch (err) {
        // Bắt lỗi trùng lặp (UNIQUE constraint trong SQL)
        if (err.number === 2627 || err.number === 2601) {
            return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Lỗi server khi lưu đánh giá' });
    }
};