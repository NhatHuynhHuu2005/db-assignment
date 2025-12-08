import { sql, getPool } from '../config/db.js';

// 1. Lấy danh sách nhân viên
export const getEmployees = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                E.UserID, 
                A.UserName, 
                A.Email, 
                A.Role, 
                E.Salary, 
                E.StartDate,
                (SELECT TOP 1 PhoneNumber FROM User_PhoneNumber WHERE UserID = E.UserID) as Phone
            FROM Employee E
            JOIN Account A ON E.UserID = A.UserID
            ORDER BY E.UserID ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi lấy danh sách nhân viên' });
    }
};

// 2. Tạo nhân viên mới (Gọi Procedure)
export const createEmployee = async (req, res) => {
    const { username, email, password, role, salary, startDate } = req.body;
    
    // Mặc định ngày sinh giả định nếu form không nhập (để thỏa mãn constraint > 18 tuổi)
    const defaultDob = '1990-01-01'; 

    try {
        const pool = await getPool();
        const request = pool.request();
        
        request.input('UserName', sql.VarChar, username);
        request.input('Email', sql.VarChar, email);
        request.input('Password', sql.VarChar, password || '123456'); // Pass mặc định
        request.input('Role', sql.VarChar, role);
        request.input('DoB', sql.Date, defaultDob);
        request.input('Salary', sql.Decimal(18, 2), salary);
        request.input('StartDate', sql.Date, startDate || new Date());

        await request.execute('sp_Create_Employee');
        
        res.json({ message: 'Tạo nhân viên thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// 3. Cập nhật nhân viên (Gọi Procedure)
export const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { email, role, salary } = req.body;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('UserID', sql.Int, id);
        request.input('Email', sql.VarChar, email);
        request.input('Role', sql.VarChar, role);
        request.input('Salary', sql.Decimal(18, 2), salary);

        await request.execute('sp_Update_Employee');

        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// 4. Xóa nhân viên (Gọi Procedure)
export const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        await pool.request()
            .input('UserID', sql.Int, id)
            .execute('sp_Delete_Employee');
            
        res.json({ message: 'Xóa nhân viên thành công' });
    } catch (err) {
        console.error(err);
        // Xử lý lỗi FK (547) trả về message dễ hiểu
        if (err.number === 547) {
            return res.status(400).json({ error: 'Không thể xóa: Nhân viên này đang quản lý Cửa hàng hoặc Đơn vị vận chuyển.' });
        }
        res.status(500).json({ error: err.message });
    }
};