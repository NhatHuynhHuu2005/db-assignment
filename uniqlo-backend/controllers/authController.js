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
    const { username, password, email, phone, dob, role } = req.body;

    console.log("📥 Register Request:", { username, email, phone, dob }); // Log để debug

    try {
        // 1. Validate cơ bản
        if (!username || !password || !email || !phone || !dob) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
        }

        // 2. Kết nối DB
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        // Bắt đầu Transaction
        await transaction.begin();

        try {
            // --- BƯỚC A: Thêm Account ---
            const requestAccount = new sql.Request(transaction);
            
            // Xử lý Date: Đảm bảo dob là chuỗi YYYY-MM-DD hợp lệ hoặc Object Date
            const birthDate = new Date(dob);
            
            const accountResult = await requestAccount
                .input('Email', sql.VarChar, email)
                .input('UserName', sql.VarChar, username)
                .input('Password', sql.VarChar, password)
                .input('Role', sql.VarChar, role || 'Customer')
                .input('DoB', sql.Date, birthDate) // Truyền Date object để mssql tự xử lý
                .query(`
                    INSERT INTO Account (Email, UserName, Password, Role, DoB) 
                    VALUES (@Email, @UserName, @Password, @Role, @DoB);
                    SELECT SCOPE_IDENTITY() AS UserID;
                `);
            
            const newUserID = accountResult.recordset[0].UserID;
            console.log("✅ Created Account ID:", newUserID);

            // --- BƯỚC B: Thêm Customer ---
            const requestCustomer = new sql.Request(transaction);
            await requestCustomer
                .input('UserID', sql.Int, newUserID)
                .query(`
                    INSERT INTO Customer (UserID, Street, Ward, District, City)
                    VALUES (@UserID, NULL, NULL, NULL, NULL)
                `);

            // --- BƯỚC C: Thêm SĐT ---
            const requestPhone = new sql.Request(transaction);
            await requestPhone
                .input('UserID', sql.Int, newUserID)
                .input('PhoneNumber', sql.VarChar, phone)
                .query(`
                    INSERT INTO User_PhoneNumber (UserID, PhoneNumber)
                    VALUES (@UserID, @PhoneNumber)
                `);

            // Commit transaction
            await transaction.commit();

            res.status(201).json({ 
                success: true, 
                message: 'Đăng ký thành công!',
                userId: newUserID 
            });

        } catch (err) {
            await transaction.rollback(); // Rollback nếu lỗi
            console.error('⚠️ SQL Error:', err); // In lỗi SQL chi tiết ra terminal

            // Xử lý lỗi trùng lặp (Unique Key)
            if (err.number === 2627) {
                // Kiểm tra xem trùng cái gì
                if (err.message.includes('Email')) {
                    return res.status(409).json({ error: 'Email này đã được sử dụng.' });
                }
                if (err.message.includes('UserName')) {
                    return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' });
                }
                return res.status(409).json({ error: 'Thông tin đăng ký (Email/User) bị trùng.' });
            }

            // Xử lý lỗi Check Constraint (Tuổi, SĐT...)
            if (err.number === 547) {
                if (err.message.includes('CHK_Account_Age')) {
                    return res.status(400).json({ error: 'Bạn phải đủ 18 tuổi.' });
                }
                if (err.message.includes('CHK_PhoneNumber')) {
                    return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });
                }
                return res.status(400).json({ error: 'Dữ liệu không thỏa mãn điều kiện hệ thống.' });
            }

            // Trả về lỗi cụ thể thay vì "Lỗi Server nội bộ"
            return res.status(400).json({ error: err.message });
        }

    } catch (error) {
        console.error('❌ System Error:', error);
        // Đây mới là chỗ sinh ra lỗi 500. Thường là do DB chưa connect được.
        res.status(500).json({ error: 'Lỗi kết nối Server. Vui lòng kiểm tra log Terminal.' });
    }
};