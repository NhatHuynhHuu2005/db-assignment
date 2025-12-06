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

export const register = async (req, res) => {
  // Lấy dữ liệu từ body request (chứa phone và dob)
  const { username, password, email, phone, dob, role } = req.body; 

  // Mặc định vai trò là 'Customer' nếu không được chỉ định
  const userRole = role || 'Customer';

  try {
    const pool = await getPool();

    // 1. Kiểm tra trùng lặp (UNIQUE constraint check)
    const checkResult = await pool.request()
        .input('UserName', sql.VarChar, username)
        .input('Email', sql.VarChar, email)
        .query(`
          SELECT UserID FROM Account WHERE UserName = @UserName OR Email = @Email
        `);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại.' });
    }

    // 2. Thực hiện Transaction (đảm bảo các lệnh INSERT là nguyên tử)
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 2a. INSERT vào bảng Account (Lớp cha)
      // KHÔNG bao gồm 'Phone' vì nó là thuộc tính đa trị, được lưu ở bảng riêng
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
      // Dùng CONVERT(INT, ...) để đảm bảo Node.js nhận về số nguyên.
      const resultScopeID = await transaction.request()
          .query('SELECT CONVERT(INT, SCOPE_IDENTITY()) AS UserIDValue');
          
      const newUserID = parseInt(resultScopeID.recordset[0].UserIDValue); 
      
      // Kiểm tra giá trị ID (Khắc phục lỗi SCOPE_IDENTITY() không hợp lệ)
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
      
      // *LƯU Ý: Nếu Role là 'Employee' hoặc 'Admin', bạn cần thêm INSERT vào bảng Employee ở đây.*
      // Hiện tại, ta chỉ xử lý Customer.

      // 2d. INSERT số điện thoại vào bảng User_PhoneNumber (Thuộc tính đa trị)
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
      
      // Trả về thành công
      res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });

    } catch (transactionError) {
      // Nếu có lỗi, rollback (hủy bỏ) các thay đổi
      await transaction.rollback();
      
      // In ra lỗi chi tiết hơn nếu có thể
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