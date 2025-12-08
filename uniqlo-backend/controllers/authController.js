// BE/controllers/authController.js
import { sql, getPool } from '../config/db.js';

// --- API 1: LẤY THÔNG TIN PROFILE ---
export const getProfile = async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log(`🔍 Đang lấy profile cho UserID: ${userId}`); // Log debug

    if (!userId) return res.status(400).json({ error: 'Thiếu UserID' });

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

    if (result.recordset.length === 0) {
      console.log('❌ Không tìm thấy User');
      return res.status(404).json({ error: 'User not found' });
    }

    const u = result.recordset[0];
    let feRole = (u.Role === 'Admin' || u.Role === 'Employee') ? 'seller' : 'buyer';

    // Xử lý địa chỉ an toàn (tránh lỗi null)
    const addressParts = [u.Street, u.Ward, u.District, u.City].filter(p => p && p.trim() !== '');
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Chưa cập nhật';

    // Xử lý ngày sinh an toàn
    const dob = u.DoB ? new Date(u.DoB).toISOString() : null;

    res.json({
      id: u.UserID,
      name: u.UserName,
      email: u.Email,
      dbRole: u.Role,
      role: feRole,
      totalSpent: u.TotalSpent || 0,
      memberTier: u.MemberTier || 'New Member',
      dob: dob,
      phone: u.Phone || '',
      address: fullAddress
    });

  } catch (err) {
    console.error('❌ Lỗi getProfile:', err); // In lỗi ra terminal
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// --- API 2: ĐĂNG NHẬP ---
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await getPool();
    
    const result = await pool.request()
      .input('UserName', sql.VarChar, username)
      .input('Password', sql.VarChar, password)
      .query(`
        SELECT 
            A.UserID, A.UserName, A.Role, A.Email, A.DoB,
            C.Street, C.Ward, C.District, C.City, C.TotalSpent, C.MemberTier,
            (SELECT TOP 1 PhoneNumber FROM User_PhoneNumber WHERE UserID = A.UserID) as Phone
        FROM Account A
        LEFT JOIN Customer C ON A.UserID = C.UserID
        WHERE (A.UserName = @UserName OR A.Email = @UserName) AND A.Password = @Password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }

    const u = result.recordset[0];
    let feRole = (u.Role === 'Admin' || u.Role === 'Employee') ? 'seller' : 'buyer';

    const addressParts = [u.Street, u.Ward, u.District, u.City].filter(p => p && p.trim() !== '');
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

    res.json({
      success: true,
      user: {
        id: u.UserID,
        name: u.UserName,
        email: u.Email,
        dbRole: u.Role,
        role: feRole,
        totalSpent: u.TotalSpent || 0, 
        memberTier: u.MemberTier || 'New Member',
        dob: u.DoB,
        phone: u.Phone || '',
        address: fullAddress
      }
    });

  } catch (err) {
    console.error('❌ Lỗi login:', err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
};

// --- API 3: ĐĂNG KÝ (Giữ nguyên logic cũ) ---
export const register = async (req, res) => {
    // ... (Giữ nguyên code register của bạn, hoặc copy lại nếu cần)
    // Để ngắn gọn mình không paste lại đoạn register trừ khi bạn yêu cầu
    const { username, password, email, phone, dob, role } = req.body; 
    const userRole = role || 'Customer';
    try {
        const pool = await getPool();
        const checkResult = await pool.request()
            .input('UserName', sql.VarChar, username)
            .input('Email', sql.VarChar, email)
            .query(`SELECT UserID FROM Account WHERE UserName = @UserName OR Email = @Email`);

        if (checkResult.recordset.length > 0) return res.status(409).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại.' });

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await transaction.request()
                .input('UserName', sql.VarChar, username)
                .input('Password', sql.VarChar, password)
                .input('Email', sql.VarChar, email)
                .input('Role', sql.VarChar, userRole) 
                .input('DOB', sql.Date, dob)
                .query(`INSERT INTO Account (UserName, Password, Role, Email, DoB) VALUES (@UserName, @Password, @Role, @Email, @DOB);`);

            const resultScopeID = await transaction.request().query('SELECT CONVERT(INT, SCOPE_IDENTITY()) AS UserIDValue');
            const newUserID = parseInt(resultScopeID.recordset[0].UserIDValue); 

            if (userRole === 'Customer') {
                await transaction.request().input('UserID', sql.Int, newUserID).query(`INSERT INTO Customer (UserID) VALUES (@UserID);`);
            }
            if (phone) { 
                await transaction.request().input('UserID', sql.Int, newUserID).input('PhoneNumber', sql.VarChar, phone).query(`INSERT INTO User_PhoneNumber (UserID, PhoneNumber) VALUES (@UserID, @PhoneNumber);`);
            }
            await transaction.commit();
            res.status(201).json({ message: 'Đăng ký thành công!' });
        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
        }
    } catch (err) {
        console.error("Lỗi Register:", err);
        res.status(500).json({ error: err.message });
    }
};

// --- API 4: CẬP NHẬT PROFILE (BẢN FIX LỖI 500) ---
export const updateProfile = async (req, res) => {
    console.log("📥 Nhận request Update Profile:", req.body); // Log dữ liệu nhận được

    let { userId, email, phone, street, ward, district, city } = req.body;
    let { dob } = req.body;

    // 1. Xử lý Date: Nếu rỗng thì null, nếu có thì giữ nguyên (SQL tự cast)
    if (!dob || dob.toString().trim() === '') {
        dob = null;
    }

    if (!userId) {
        console.error("❌ Thiếu UserID");
        return res.status(400).json({ error: 'Thiếu UserID' });
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 2. Cập nhật Account
        const reqAccount = new sql.Request(transaction);
        reqAccount.input('UserID', sql.Int, userId);
        reqAccount.input('Email', sql.VarChar, email);
        reqAccount.input('DoB', sql.Date, dob); 
        
        await reqAccount.query(`
            UPDATE Account 
            SET Email = @Email, DoB = @DoB
            WHERE UserID = @UserID
        `);

        // 3. Cập nhật Customer
        const reqCustomer = new sql.Request(transaction);
        reqCustomer.input('UserID', sql.Int, userId);
        reqCustomer.input('Street', sql.NVarChar(255), street || '');
        reqCustomer.input('Ward', sql.NVarChar(100), ward || '');
        reqCustomer.input('District', sql.NVarChar(100), district || '');
        reqCustomer.input('City', sql.NVarChar(100), city || '');

        // Upsert Customer (Có thì update, chưa thì insert)
        const checkCust = await new sql.Request(transaction)
            .query(`SELECT 1 FROM Customer WHERE UserID = ${userId}`);
        
        if (checkCust.recordset.length > 0) {
            await reqCustomer.query(`
                UPDATE Customer
                SET Street = @Street, Ward = @Ward, District = @District, City = @City
                WHERE UserID = @UserID
            `);
        } else {
            // Trường hợp user chưa có trong bảng Customer
            await reqCustomer.query(`
                INSERT INTO Customer (UserID, Street, Ward, District, City)
                VALUES (@UserID, @Street, @Ward, @District, @City)
            `);
        }

        // 4. Cập nhật Phone
        const reqPhoneDel = new sql.Request(transaction);
        reqPhoneDel.input('UserID', sql.Int, userId);
        await reqPhoneDel.query(`DELETE FROM User_PhoneNumber WHERE UserID = @UserID`);

        if (phone && phone.toString().trim() !== '') {
            const reqPhoneIns = new sql.Request(transaction);
            reqPhoneIns.input('UserID', sql.Int, userId);
            reqPhoneIns.input('PhoneNumber', sql.VarChar, phone);
            await reqPhoneIns.query(`
                INSERT INTO User_PhoneNumber (UserID, PhoneNumber)
                VALUES (@UserID, @PhoneNumber)
            `);
        }

        await transaction.commit();
        console.log("✅ Cập nhật thành công!");
        res.json({ success: true, message: 'Cập nhật thành công!' });

    } catch (err) {
        await transaction.rollback();
        console.error("❌ FATAL ERROR Update Profile:", err); // Log lỗi chi tiết
        res.status(500).json({ error: 'Lỗi cập nhật: ' + err.message });
    }
};