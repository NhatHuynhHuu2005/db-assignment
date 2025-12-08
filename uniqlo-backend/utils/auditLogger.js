import { sql, getPool } from '../config/db.js';

/**
 * Hàm ghi nhật ký hệ thống (Audit Log)
 * @param {string} actionType - Loại hành động (INSERT, UPDATE, DELETE, LOGIN, ORDER_PLACED...)
 * @param {string} targetEntity - Bảng/Đối tượng bị tác động (Product, Order, Account...)
 * @param {string|number} targetId - ID của đối tượng
 * @param {string} details - Mô tả chi tiết
 * @param {number|null} userId - ID người thực hiện (null nếu là system hoặc khách vãng lai)
 */
export const logAudit = async (actionType, targetEntity, targetId, details, userId = null) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input('ActionType', sql.NVarChar(50), actionType);
    request.input('TargetEntity', sql.NVarChar(100), targetEntity);
    request.input('TargetID', sql.NVarChar(50), String(targetId));
    request.input('Details', sql.NVarChar(sql.MAX), details);
    request.input('UserID', sql.Int, userId);

    await request.query(`
      INSERT INTO AuditLog (ActionType, TargetEntity, TargetID, Details, UserID, Timestamp)
      VALUES (@ActionType, @TargetEntity, @TargetID, @Details, @UserID, GETDATE())
    `);
    
    console.log(`[AUDIT] ${actionType} on ${targetEntity} #${targetId} logged.`);
  } catch (err) {
    // Không throw lỗi để tránh làm gián đoạn luồng chính, chỉ log ra console
    console.error('Lỗi ghi AuditLog:', err);
  }
};