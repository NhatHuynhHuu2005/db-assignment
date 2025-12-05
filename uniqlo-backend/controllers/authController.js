// BE/controllers/authController.js
import { sql, getPool } from '../config/db.js';

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await getPool();
    
    // 1. Kiểm tra username và password (đang lưu plain text trong sample_data)
    // Lưu ý: Thực tế nên dùng bcrypt để hash password, nhưng bài này ta làm đơn giản.
    const result = await pool.request()
      .input('UserName', sql.VarChar, username)
      .input('Password', sql.VarChar, password)
      .query(`
        SELECT UserID, UserName, Role, Email 
        FROM Account 
        WHERE (UserName = @UserName OR Email = @UserName) AND Password = @Password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }

    const user = result.recordset[0];

    // 2. Mapping Role của DB sang Role của Frontend
    // DB: 'Customer' -> FE: 'buyer'
    // DB: 'Admin', 'Employee' -> FE: 'seller'
    let feRole = 'buyer';
    if (user.Role === 'Admin' || user.Role === 'Employee') {
      feRole = 'seller';
    }

    res.json({
      success: true,
      user: {
        id: user.UserID,
        name: user.UserName,
        email: user.Email,
        dbRole: user.Role,
        role: feRole // Role dùng cho logic Frontend
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
};