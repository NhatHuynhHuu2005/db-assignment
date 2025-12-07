// BE/controllers/authController.js
import { sql, getPool } from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.query.userId; // Gửi userId lên để check
    const pool = await getPool();
    
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query(`
        SELECT 
            A.UserID, A.UserName, A.Email, A.Role, A.DoB,
            C.Street, C.Ward, C.District, C.City, C.TotalSpent, C.MemberTier,
            (SELECT TOP 1 PhoneNumber FROM User_PhoneNumber WHERE UserID = A.UserID) as Phone
        FROM Account A
        LEFT JOIN Customer C ON A.UserID = C.UserID
        WHERE A.UserID = @UserID
      `);

    if (result.recordset.length === 0) return res.status(404).json({ error: 'User not found' });

    const u = result.recordset[0];
    let feRole = (u.Role === 'Admin' || u.Role === 'Employee') ? 'seller' : 'buyer';

    // Tạo chuỗi địa chỉ đầy đủ
    const fullAddress = [u.Street, u.Ward, u.District, u.City]
        .filter(part => part) // Lọc bỏ giá trị null/rỗng
        .join(', ');

    res.json({
        id: user.UserID,
        name: user.UserName,
        email: user.Email,
        dbRole: user.Role,
        role: feRole,
        totalSpent: user.TotalSpent || 0,       // Quan trọng: Lấy số tiền mới nhất
        memberTier: user.MemberTier || 'New Member',
        dob: u.DoB,
        phone: u.Phone || '',
        address: fullAddress || 'Chưa cập nhật'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await getPool();
    
    // 1. Kiểm tra username và password
    const result = await pool.request()
      .input('UserName', sql.VarChar, username)
      .input('Password', sql.VarChar, password)
      .query(`
        SELECT 
            A.UserID, A.UserName, A.Role, A.Email,
            C.TotalSpent, C.MemberTier
        FROM Account A
        LEFT JOIN Customer C ON A.UserID = C.UserID
        WHERE (A.UserName = @UserName OR A.Email = @UserName) AND A.Password = @Password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }

    const user = result.recordset[0];

    // 2. Mapping Role
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
        role: feRole,
        // --- THÊM DÒNG DƯỚI ---
        totalSpent: user.TotalSpent || 0, 
        memberTier: user.MemberTier || 'New Member'
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
};

export const register = async (req, res) => {
  // Lấy dữ liệu từ body request
  const { username, password, email, phone, dob, role } = req.body; 

  // Mặc định vai trò là 'Customer' nếu không được chỉ định
  const userRole = role || 'Customer';

  try {
    const pool = await getPool();

    // 1. Kiểm tra trùng lặp
    const checkResult = await pool.request()
        .input('UserName', sql.VarChar, username)
        .input('Email', sql.VarChar, email)
        .query(`
          SELECT UserID FROM Account WHERE UserName = @UserName OR Email = @Email
        `);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại.' });
    }

    // 2. Thực hiện Transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 2a. INSERT vào bảng Account
      await transaction.request()
          .input('UserName', sql.VarChar, username)
          .input('Password', sql.VarChar, password)
          .input('Email', sql.VarChar, email)
          .input('Role', sql.VarChar, userRole) 
          .input('DOB', sql.Date, dob)
          .query(`
            INSERT INTO Account (UserName, Password, Role, Email, DoB) 
            VALUES (@UserName, @Password, @Role, @Email, @DOB);
          `);

      // 2b. Lấy UserID vừa tạo bằng SCOPE_IDENTITY()
      const resultScopeID = await transaction.request()
          .query('SELECT CONVERT(INT, SCOPE_IDENTITY()) AS UserIDValue');
          
      const newUserID = parseInt(resultScopeID.recordset[0].UserIDValue); 
      
      if (isNaN(newUserID) || newUserID === 0) {
          throw new Error('Lỗi truy vấn ID: Lệnh INSERT Account bị từ chối.'); 
      }

      // 2c. INSERT vào bảng Customer nếu Role là 'Customer'
      if (userRole === 'Customer') {
          await transaction.request()
              .input('UserID', sql.Int, newUserID) 
              .query(`
                INSERT INTO Customer (UserID) 
                VALUES (@UserID);
              `);
      }

      // 2d. INSERT số điện thoại vào bảng User_PhoneNumber
      if (phone) { 
          await transaction.request()
              .input('UserID', sql.Int, newUserID)
              .input('PhoneNumber', sql.VarChar, phone)
              .query(`
                INSERT INTO User_PhoneNumber (UserID, PhoneNumber) 
                VALUES (@UserID, @PhoneNumber);
              `);
      }
      
      // Hoàn tất Transaction
      await transaction.commit();
      
      res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });

    } catch (transactionError) {
      await transaction.rollback();
      
      let errorMessage = transactionError.message;
      if (transactionError.originalError && transactionError.originalError.info) {
          errorMessage = transactionError.originalError.info.message;
      }
      
      console.error("Lỗi Đăng ký (Transaction):", errorMessage);
      res.status(500).json({ error: 'Đăng ký thất bại. Lỗi server: ' + errorMessage });
    }

  } catch (err) {
    console.error("Lỗi Đăng ký (Global):", err.message);
    res.status(500).json({ error: 'Đăng ký thất bại. Lỗi server: ' + err.message });
  }
};