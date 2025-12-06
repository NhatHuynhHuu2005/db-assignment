USE UNIQLO_DB;
GO

-- 1. Kiểm tra Ràng buộc Disjoint và Total Participation cho Account
-- Ràng buộc: Account chỉ có thể là Customer HOẶC Employee (bao gồm Admin)
CREATE TRIGGER TRG_Account_Specialization
ON Account
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Ràng buộc Disjoint: Không thể vừa là Customer vừa là Employee
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN Customer c ON i.UserID = c.UserID
        INNER JOIN Employee e ON i.UserID = e.UserID
    )
    BEGIN
        RAISERROR(N'Lỗi: Một tài khoản không thể vừa là Khách hàng (Customer) vừa là Nhân viên (Employee/Admin)!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- Kiểm tra Role của Account phải khớp với bảng con
    IF EXISTS (
        SELECT 1 FROM inserted i INNER JOIN Customer c ON i.UserID = c.UserID WHERE i.Role != 'Customer'
    )
    BEGIN
        RAISERROR(N'Lỗi: Tài khoản liên kết với Customer phải có Role = ''Customer''!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    IF EXISTS (
        SELECT 1 FROM inserted i INNER JOIN Employee e ON i.UserID = e.UserID WHERE i.Role NOT IN ('Employee', 'Admin')
    )
    BEGIN
        RAISERROR(N'Lỗi: Tài khoản liên kết với Employee phải có Role = ''Employee'' hoặc ''Admin''!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

-- 2. Kiểm tra PromotionRule Percentage (Ràng buộc ngữ nghĩa: 0 <= Percentage <= 100)
CREATE TRIGGER TR_Check_PromotionRule_Percentage
ON PromotionRule
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE RuleType = 'Percentage' AND (RewardValue > 100 OR RewardValue < 0))
    BEGIN
        RAISERROR(N'Lỗi: Giá trị khuyến mãi phần trăm phải từ 0 đến 100.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

-- 3. Trigger kiểm tra tồn kho trước khi thêm CartItem (Ràng buộc ngữ nghĩa)
CREATE TRIGGER TRG_CartItem_CheckStock
ON CartItem
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Kiểm tra số lượng tồn kho (Quantity) trong Has_Stock
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN ProductVariant pv ON i.ProductID = pv.ProductID AND i.VariantID = pv.VariantID
        LEFT JOIN Has_Stock hs ON i.ProductID = hs.ProductID AND i.VariantID = hs.VariantID -- Giả sử chỉ cần tồn kho > 0 TỔNG THỂ
        GROUP BY i.ProductID, i.VariantID
        HAVING SUM(i.Quantity) > ISNULL(SUM(hs.Quantity), 0) -- Tổng Quantity trong giỏ > Tổng Quantity trong kho
    )
    BEGIN
        RAISERROR(N'Lỗi: Số lượng sản phẩm trong giỏ hàng vượt quá số lượng tồn kho hiện có.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

-- 4. Trigger tự động xóa Belongs_To khi xóa Category (Tự động hóa)
CREATE TRIGGER trg_DeleteCategory
ON Category
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DELETE BT
    FROM Belongs_To BT
    INNER JOIN deleted d
    ON BT.CategoryID = d.CategoryID;
    
    PRINT N'Các liên kết sản phẩm-thể loại bị xóa theo Category đã xóa.';
END;
GO

-- 5. Cập nhật thuộc tính dẫn xuất TotalStockQuantity của Store
CREATE TRIGGER TR_Update_Store_TotalStock
ON Has_Stock
AFTER INSERT, DELETE, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @AffectedStores TABLE (StoreID INT);
    
    -- Lấy ra StoreID bị tác động
    INSERT INTO @AffectedStores SELECT StoreID FROM inserted WHERE StoreID IS NOT NULL;
    INSERT INTO @AffectedStores SELECT StoreID FROM deleted WHERE StoreID IS NOT NULL
    EXCEPT
    SELECT StoreID FROM inserted;
    
    -- Cập nhật TotalStockQuantity
    UPDATE S
    SET S.TotalStockQuantity = ISNULL(T.SumQty, 0)
    FROM Store S
    LEFT JOIN (
        SELECT HS.StoreID, SUM(HS.Quantity) AS SumQty
        FROM Has_Stock HS
        WHERE HS.StoreID IN (SELECT StoreID FROM @AffectedStores)
        GROUP BY HS.StoreID
    ) AS T ON S.StoreID = T.StoreID
    WHERE S.StoreID IN (SELECT StoreID FROM @AffectedStores);
END
GO

-- =====================================================
-- TRIGGER CHO CHỨC NĂNG HỆ THỐNG (Audit, Cleanup)
-- =====================================================

-- 6. Trigger tự động ghi log khi INSERT vào Account
CREATE TRIGGER TRG_Account_Insert_Log
ON Account
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO AuditLog (ActionType, TargetEntity, TargetID, Details, UserID)
    SELECT 
        'INSERT',
        'Account',
        CAST(i.UserID AS NVARCHAR(50)),
        N'Tạo tài khoản mới: ' + i.UserName + N' với vai trò ' + i.Role,
        NULL
    FROM inserted i;
END;
GO

-- 7. Trigger tự động cập nhật LastUpdated của TemporaryCart
CREATE TRIGGER TRG_TempCartItem_UpdateCart
ON TempCartItem
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE tc
    SET LastUpdated = GETDATE()
    FROM TemporaryCart tc
    WHERE tc.TempCartID IN (
        SELECT DISTINCT TempCartID FROM inserted
        UNION
        SELECT DISTINCT TempCartID FROM deleted
    );
END;
GO

CREATE TRIGGER TRG_Deduct_Stock_On_Order
ON OrderItem
AFTER INSERT
AS
BEGIN
    -- Trừ tồn kho tại cửa hàng (Store) tương ứng
    UPDATE HS
    SET HS.Quantity = HS.Quantity - i.Quantity
    FROM Has_Stock HS
    JOIN inserted i ON HS.StoreID = i.StoreID 
        AND HS.ProductID = i.ProductID 
        AND HS.VariantID = i.VariantID;
END;
GO

CREATE TRIGGER TRG_Update_Customer_Ranking
ON [Order]
AFTER UPDATE
AS
BEGIN
    -- Chỉ xử lý khi trạng thái chuyển sang 'Delivered'
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON i.OrderID = d.OrderID 
               WHERE i.Status = 'Delivered' AND d.Status != 'Delivered')
    BEGIN
        DECLARE @TotalAmt DECIMAL(18, 2);
        DECLARE @CustID INT;

        -- Tính tổng tiền đơn hàng (đơn giản hóa: lấy từ OrderItem)
        SELECT @CustID = CustomerID FROM inserted;
        
        SELECT @TotalAmt = SUM(Quantity * PriceAtPurchase) 
        FROM OrderItem WHERE OrderID = (SELECT OrderID FROM inserted);

        -- Cộng dồn chi tiêu
        UPDATE Customer
        SET TotalSpent = TotalSpent + ISNULL(@TotalAmt, 0)
        WHERE UserID = @CustID;

        -- Cập nhật hạng thành viên (Ví dụ logic)
        UPDATE Customer
        SET MemberTier = CASE 
            WHEN TotalSpent >= 50000000 THEN 'VIP'
            WHEN TotalSpent >= 25000000 THEN 'Platinum'
            WHEN TotalSpent >= 10000000 THEN 'Gold'
            WHEN TotalSpent >= 5000000 THEN 'Silver'
            WHEN TotalSpent >= 2000000 THEN 'Bronze'
            ELSE MemberTier
        END
        WHERE UserID = @CustID;
    END
END;
GO