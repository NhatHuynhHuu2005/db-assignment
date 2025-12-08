// BE/controllers/promotionController.js
import { sql, getPool } from '../config/db.js';

// 1. LẤY DANH SÁCH (Giữ nguyên cái cũ của bạn)
export const getPromotions = async (req, res) => {
  /* ... Giữ nguyên code getPromotions cũ ở câu trả lời trước ... */
  try {
    const { search } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT p.PromoID, p.PromoName, p.StartDate, p.EndDate, pr.RuleType, pr.RewardValue,
        (SELECT COUNT(*) FROM Applied a WHERE a.PromoID = p.PromoID) as AppliedCount
      FROM Promotion p
      LEFT JOIN PromotionRule pr ON p.PromoID = pr.PromoID
    `;
    if (search) {
        query += ` WHERE p.PromoName LIKE @Search`;
        request.input('Search', sql.NVarChar(100), `%${search}%`);
    }
    query += ` ORDER BY p.EndDate DESC`;
    const result = await request.query(query);
    const promotions = result.recordset.map(row => ({
        id: row.PromoID,
        name: row.PromoName,
        startDate: row.StartDate,
        endDate: row.EndDate,
        ruleType: row.RuleType,
        rewardValue: row.RewardValue,
        appliedCount: row.AppliedCount
    }));
    res.json(promotions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. LẤY CHI TIẾT (GET /:id)
export const getPromotionById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        
        // Lấy thông tin Promotion và các Rule đi kèm
        const result = await pool.request()
            .input('PromoID', sql.Int, id)
            .query(`
                SELECT 
                    p.PromoID, p.PromoName, p.StartDate, p.EndDate, p.EmployeeID,
                    pr.RuleID, pr.RuleType, pr.RewardValue
                FROM Promotion p
                LEFT JOIN PromotionRule pr ON p.PromoID = pr.PromoID
                WHERE p.PromoID = @PromoID
            `);

        if (result.recordset.length === 0) return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });

        const firstRow = result.recordset[0];
        
        // Gom nhóm các Rule (nếu 1 promo có nhiều rule)
        const rules = result.recordset
            .filter(r => r.RuleID !== null)
            .map(r => ({
                ruleId: r.RuleID,
                ruleType: r.RuleType,
                rewardValue: r.RewardValue
            }));

        const promotion = {
            id: firstRow.PromoID,
            name: firstRow.PromoName,
            startDate: firstRow.StartDate,
            endDate: firstRow.EndDate,
            employeeId: firstRow.EmployeeID,
            rules: rules
        };

        res.json(promotion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. TẠO MỚI (POST /)
export const createPromotion = async (req, res) => {
    const { name, startDate, endDate, employeeId, rules } = req.body;
    // rules là mảng: [{ type: 'Percentage', value: 10 }]

    if (!name || !startDate || !endDate) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // A. Tính ID mới (Vì DB không tự tăng)
        const idResult = await request.query(`SELECT ISNULL(MAX(PromoID), 0) + 1 AS NewID FROM Promotion`);
        const newPromoId = idResult.recordset[0].NewID;

        // B. Insert Promotion
        request.input('PromoID', sql.Int, newPromoId);
        request.input('Name', sql.NVarChar(100), name);
        request.input('Start', sql.DateTime, startDate);
        request.input('End', sql.DateTime, endDate);
        request.input('EmpID', sql.Int, employeeId || 1); // Mặc định Admin ID 1 nếu thiếu

        await request.query(`
            INSERT INTO Promotion (PromoID, PromoName, StartDate, EndDate, EmployeeID)
            VALUES (@PromoID, @Name, @Start, @End, @EmpID)
        `);

        // C. Insert Rules (Nếu có)
        if (rules && rules.length > 0) {
            let ruleId = 1;
            for (const r of rules) {
                const reqRule = new sql.Request(transaction);
                reqRule.input('PromoID', sql.Int, newPromoId);
                reqRule.input('RuleID', sql.Int, ruleId);
                reqRule.input('Type', sql.NVarChar(50), r.type); // Percentage, FixedAmount...
                reqRule.input('Value', sql.Decimal(15, 2), r.value);

                await reqRule.query(`
                    INSERT INTO PromotionRule (PromoID, RuleID, RuleType, RewardValue)
                    VALUES (@PromoID, @RuleID, @Type, @Value)
                `);
                ruleId++;
            }
        }

        await transaction.commit();
        res.status(201).json({ message: 'Tạo khuyến mãi thành công', id: newPromoId });

    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// 4. CẬP NHẬT (PUT /:id)
export const updatePromotion = async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate, rules } = req.body;

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // A. Update thông tin chính
        request.input('PromoID', sql.Int, id);
        request.input('Name', sql.NVarChar(100), name);
        request.input('Start', sql.DateTime, startDate);
        request.input('End', sql.DateTime, endDate);

        await request.query(`
            UPDATE Promotion 
            SET PromoName = @Name, StartDate = @Start, EndDate = @End
            WHERE PromoID = @PromoID
        `);

        // B. Update Rules (Cách đơn giản nhất: Xóa hết cũ -> Thêm mới)
        // Lưu ý: Việc xóa Rule có thể ảnh hưởng bảng Applied (Cascading Delete)
        // Trong create.sql: PromotionRule ON DELETE CASCADE khi xóa Promotion, 
        // nhưng Applied references PromotionRule. Cần cẩn thận.
        
        // Xóa Rules cũ của Promo này
        const reqDel = new sql.Request(transaction);
        reqDel.input('PromoID', sql.Int, id);
        
        // Trước khi xóa Rule, phải xóa Applied liên quan đến Rule đó (Vì SQL không tự cascade từ Rule -> Applied trong create.sql của bạn)
        // Tuy nhiên, để đơn giản và an toàn, ta giả định update Rules chỉ thay đổi Type/Value của RuleID 1
        // Nếu muốn làm triệt để:
        await reqDel.query(`DELETE FROM Applied WHERE PromoID = @PromoID`); // Reset sản phẩm áp dụng (nếu muốn logic chặt)
        await reqDel.query(`DELETE FROM PromotionRule WHERE PromoID = @PromoID`);

        // Insert lại Rules mới
        if (rules && rules.length > 0) {
            let ruleId = 1;
            for (const r of rules) {
                const reqRule = new sql.Request(transaction);
                reqRule.input('PromoID', sql.Int, id);
                reqRule.input('RuleID', sql.Int, ruleId);
                reqRule.input('Type', sql.NVarChar(50), r.type);
                reqRule.input('Value', sql.Decimal(15, 2), r.value);

                await reqRule.query(`
                    INSERT INTO PromotionRule (PromoID, RuleID, RuleType, RewardValue)
                    VALUES (@PromoID, @RuleID, @Type, @Value)
                `);
                ruleId++;
            }
        }

        await transaction.commit();
        res.json({ message: 'Cập nhật thành công' });

    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// 5. XÓA (DELETE /:id)
export const deletePromotion = async (req, res) => {
    const { id } = req.params;
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('PromoID', sql.Int, id);

        // B1: Xóa trong bảng Applied trước (Liên kết sản phẩm)
        await request.query(`DELETE FROM Applied WHERE PromoID = @PromoID`);

        // B2: Xóa Promotion (Rule sẽ tự mất do ON DELETE CASCADE trong create.sql)
        await request.query(`DELETE FROM Promotion WHERE PromoID = @PromoID`);

        await transaction.commit();
        res.json({ message: 'Đã xóa chương trình khuyến mãi' });

    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
};

export const validateVoucher = async (req, res) => {
    const { code } = req.body; // Nhận mã từ Frontend gửi lên

    if (!code) return res.status(400).json({ error: 'Vui lòng nhập mã voucher' });

    try {
        const pool = await getPool();
        // Tìm khuyến mãi khớp VoucherCode
        const result = await pool.request()
            .input('Code', sql.VarChar(20), code)
            .query(`
                SELECT 
                    p.PromoID, p.PromoName, p.StartDate, p.EndDate,
                    pr.RuleType, pr.RewardValue
                FROM Promotion p
                JOIN PromotionRule pr ON p.PromoID = pr.PromoID
                WHERE p.VoucherCode = @Code
            `);

        // 1. Kiểm tra tồn tại
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Mã giảm giá không tồn tại.' });
        }

        const promo = result.recordset[0];
        const now = new Date();

        // 2. Kiểm tra thời hạn
        if (now < new Date(promo.StartDate)) {
            return res.status(400).json({ error: 'Mã giảm giá chưa đến đợt áp dụng.' });
        }
        if (now > new Date(promo.EndDate)) {
            return res.status(400).json({ error: 'Mã giảm giá đã hết hạn.' });
        }

        // 3. Nếu OK -> Trả về thông tin để Frontend trừ tiền
        res.json({
            valid: true,
            promoId: promo.PromoID,
            name: promo.PromoName,
            ruleType: promo.RuleType,
            rewardValue: promo.RewardValue
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server khi kiểm tra mã.' });
    }
};