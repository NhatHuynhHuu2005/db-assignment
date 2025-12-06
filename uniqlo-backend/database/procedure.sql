USE UNIQLO_DB;
GO

-- 1. THỦ TỤC CHO CRUD CÓ VALIDATE 
-- Thêm, Sửa, Xóa dữ liệu vào bảng Product


-- 1.1. Thêm (INSERT) Product có Validation
CREATE PROCEDURE sp_Insert_Product
    @ProductName NVARCHAR(100),
    @Description NVARCHAR(MAX) = NULL,
    @EmployeeID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validation 1: Tên sản phẩm không được rỗng
        IF @ProductName IS NULL OR LTRIM(RTRIM(@ProductName)) = ''
            THROW 50001, N'Lỗi: Tên sản phẩm không được để trống.', 1;

        -- Validation 2: EmployeeID phải tồn tại và là Employee/Admin
        IF NOT EXISTS (SELECT 1 FROM Employee e JOIN Account a ON e.UserID = a.UserID WHERE e.UserID = @EmployeeID AND a.Role IN ('Employee', 'Admin'))
            THROW 50002, N'Lỗi: Người phụ trách (EmployeeID) không tồn tại hoặc không có vai trò hợp lệ (Employee/Admin).', 1;

        INSERT INTO [Product] (ProductName, Description, EmployeeID)
        VALUES (@ProductName, @Description, @EmployeeID);

        PRINT N'Thêm sản phẩm thành công. ProductID: ' + CAST(SCOPE_IDENTITY() AS NVARCHAR(10));
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 1.2. Cập nhật (UPDATE) Product có Validation
CREATE PROCEDURE sp_Update_Product
    @ProductID INT,
    @ProductName NVARCHAR(100) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @EmployeeID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validation 1: ProductID phải tồn tại
        IF NOT EXISTS (SELECT 1 FROM [Product] WHERE ProductID = @ProductID)
            THROW 50011, N'Lỗi: ProductID không tồn tại.', 1;

        -- Validation 2: Tên sản phẩm (nếu được cung cấp) không được rỗng
        IF @ProductName IS NOT NULL AND LTRIM(RTRIM(@ProductName)) = ''
            THROW 50012, N'Lỗi: Tên sản phẩm không được để trống.', 1;

        -- Validation 3: EmployeeID (nếu được cung cấp) phải tồn tại và là Employee/Admin
        IF @EmployeeID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Employee e JOIN Account a ON e.UserID = a.UserID WHERE e.UserID = @EmployeeID AND a.Role IN ('Employee', 'Admin'))
            THROW 50013, N'Lỗi: Người phụ trách (EmployeeID) không tồn tại hoặc không có vai trò hợp lệ (Employee/Admin).', 1;

        UPDATE [Product]
        SET
            ProductName = ISNULL(@ProductName, ProductName),
            Description = ISNULL(@Description, Description),
            EmployeeID = ISNULL(@EmployeeID, EmployeeID)
        WHERE ProductID = @ProductID;

        PRINT N'Cập nhật sản phẩm thành công.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 1.3. Xóa (DELETE) Product có Validation
CREATE PROCEDURE sp_Delete_Product
    @ProductID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validation: ProductID phải tồn tại
        IF NOT EXISTS (SELECT 1 FROM [Product] WHERE ProductID = @ProductID)
            THROW 50021, N'Lỗi: ProductID không tồn tại.', 1;

        -- Quy tắc xóa: Không được xóa nếu sản phẩm đã có trong bất kỳ OrderItem nào (nghiệp vụ: đảm bảo tính toàn vẹn lịch sử giao dịch)
        IF EXISTS (SELECT 1 FROM OrderItem WHERE ProductID = @ProductID)
            THROW 50022, N'Lỗi: Không thể xóa sản phẩm vì nó đã tồn tại trong các đơn hàng đã đặt (OrderItem).', 1;

        -- Xóa sản phẩm (DELETE CASCADE sẽ tự động xóa ProductVariant, ProductVariant_ImageURL, Belongs_To, Applied)
        DELETE FROM [Product] WHERE ProductID = @ProductID;

        PRINT N'Xóa sản phẩm thành công.';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 2. THỦ TỤC TRUY VẤN DỮ LIỆU (BTL2 - 2.3)

-- 2.1. Thủ tục 1: Truy vấn từ 2 bảng trở lên (Lấy thông tin đơn hàng đang Giao/Chờ xử lý của một Khách hàng)
CREATE PROCEDURE sp_Get_Customer_Pending_Orders
    @CustomerID INT = NULL,
    @StatusList NVARCHAR(MAX) -- Ví dụ: 'Pending,Shipping'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Kiểm tra CustomerID
    IF NOT EXISTS (SELECT 1 FROM Customer WHERE UserID = @CustomerID)
    BEGIN
        RAISERROR(N'Lỗi: CustomerID không tồn tại.', 16, 1);
        RETURN;
    END

    SELECT
        O.OrderID,
        O.OrderDate,
        O.Status AS OrderStatus,
        S.TrackingCode,
        SU.UnitName,
        O.Address,
        A.UserName,
        A.UserID
    FROM [Order] O
    INNER JOIN Account A ON O.CustomerID = A.UserID
    OUTER APPLY (
        SELECT TOP 1 sh.TrackingCode, sh.UnitID 
        FROM Shipment sh 
        WHERE sh.OrderID = O.OrderID
        ORDER BY sh.ShipmentID DESC
    ) S
    LEFT JOIN ShippingUnit SU ON S.UnitID = SU.UnitID
    WHERE
        (@CustomerID IS NULL OR @CustomerID = 0 OR O.CustomerID = @CustomerID)
        AND O.Status IN (SELECT TRIM(value) FROM STRING_SPLIT(@StatusList, ','))
    ORDER BY O.OrderDate DESC;
END;
GO

-- 2.2. Thủ tục 2: Truy vấn có Aggregate Function, GROUP BY, HAVING (Báo cáo tồn kho cao)
CREATE PROCEDURE sp_Report_Store_Inventory_HighVolume
    @MinTotalItems INT,
    @StoreNameKeyword NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        ST.StoreName,
        ST.Address,
        COUNT(HS.VariantID) AS SKU_Count,
        SUM(HS.Quantity) AS TotalItems -- Aggregate Function
    FROM Store ST
    INNER JOIN Has_Stock HS ON ST.StoreID = HS.StoreID
    WHERE
        (@StoreNameKeyword IS NULL OR ST.StoreName LIKE '%' + @StoreNameKeyword + '%') -- Mệnh đề WHERE (sử dụng tham số)
    GROUP BY ST.StoreName, ST.Address -- Mệnh đề GROUP BY
    HAVING SUM(HS.Quantity) > @MinTotalItems -- Mệnh đề HAVING (sử dụng tham số)
    ORDER BY TotalItems DESC; -- Mệnh đề ORDER BY
END;
GO

-- 3. HÀM (FUNCTIONS) (BTL2 - 2.4)

-- 3.1. Hàm: Tính phí ship dựa trên UnitID (Có IF)
CREATE FUNCTION fn_Calculate_Shipping_Fee (@UnitID INT)
RETURNS DECIMAL(15, 2) AS
BEGIN
    DECLARE @Fee DECIMAL(15, 2);
    
    -- Kiểm tra tham số đầu vào
    IF @UnitID IS NULL OR @UnitID <= 0
    BEGIN
        SET @Fee = 0;
    END
    -- Sử dụng IF để tính toán logic
    ELSE IF @UnitID = 1 SET @Fee = 30000; -- Giao Hàng Tiết Kiệm
    ELSE IF @UnitID = 3 SET @Fee = 50000; -- GrabExpress
    ELSE SET @Fee = 40000; -- Mặc định cho các đơn vị khác
    
    RETURN @Fee;
END;
GO

-- 3.2. Hàm: Lọc hàng sắp hết (Có CURSOR và IF)
CREATE FUNCTION fn_Get_Low_Stock_Products_ByStore (@StoreID INT, @Threshold INT)
RETURNS @ResultTable TABLE (
    ProductName NVARCHAR(100),
    VariantInfo NVARCHAR(100),
    Qty INT,
    Note NVARCHAR(50)
)
AS
BEGIN
    
    -- Kiểm tra tham số đầu vào
    IF @StoreID IS NULL OR NOT EXISTS (SELECT 1 FROM Store WHERE StoreID = @StoreID)
        RETURN;
        
    IF @Threshold IS NULL OR @Threshold < 0
        SET @Threshold = 10; -- Giá trị mặc định

    DECLARE @ProdName NVARCHAR(100), @Color NVARCHAR(50), @Size NVARCHAR(50), @Qty INT;
    
    -- Khai báo CURSOR
    DECLARE cur CURSOR FOR
        SELECT 
            P.ProductName, 
            PV.Color, 
            PV.Size, 
            HS.Quantity 
        FROM Has_Stock HS
        JOIN ProductVariant PV ON HS.ProductID = PV.ProductID AND HS.VariantID = PV.VariantID
        JOIN [Product] P ON PV.ProductID = P.ProductID
        WHERE HS.StoreID = @StoreID;
        
    OPEN cur; 
    FETCH NEXT FROM cur INTO @ProdName, @Color, @Size, @Qty;
    
    -- Vòng lặp LOOP
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Sử dụng IF để kiểm tra tính toán dữ liệu
        IF @Qty <= @Threshold
            INSERT INTO @ResultTable 
            VALUES (@ProdName, @Color + '/' + @Size, @Qty, N'Cần nhập gấp');
            
        FETCH NEXT FROM cur INTO @ProdName, @Color, @Size, @Qty;
    END
    
    CLOSE cur; 
    DEALLOCATE cur;
    
    RETURN;
END;
GO

-- =====================================================
-- CÂU LỆNH MINH HỌA GỌI HÀM VÀ THỦ TỤC
-- =====================================================

-- Minh họa gọi sp_Insert_Product (Thành công)
-- EXEC sp_Insert_Product @ProductName = N'Quần Vải Dáng Rộng', @EmployeeID = 3;

-- Minh họa gọi sp_Update_Product (Thành công)
-- EXEC sp_Update_Product @ProductID = 1007, @ProductName = N'Áo Giữ Nhiệt HEATTECH Pro';

-- Minh họa gọi sp_Delete_Product (Thất bại vì nằm trong OrderItem)
-- EXEC sp_Delete_Product @ProductID = 1000; 

-- Minh họa gọi sp_Get_Customer_Pending_Orders
-- EXEC sp_Get_Customer_Pending_Orders @CustomerID = 9, @StatusList = 'Pending,Shipping'; 

-- Minh họa gọi sp_Report_Store_Inventory_HighVolume
-- EXEC sp_Report_Store_Inventory_HighVolume @MinTotalItems = 500, @StoreNameKeyword = 'Kho'; 

-- Minh họa gọi fn_Calculate_Shipping_Fee
-- SELECT dbo.fn_Calculate_Shipping_Fee(3) AS GrabExpressFee;

-- Minh họa gọi fn_Get_Low_Stock_Products_ByStore
-- SELECT * FROM dbo.fn_Get_Low_Stock_Products_ByStore(10, 50); -- Cửa hàng Đồng Khởi, Threshold 50
-- SELECT * FROM dbo.fn_Get_Low_Stock_Products_ByStore(13, 5); -- Cửa hàng Bà Triệu, Threshold 5

-- Thủ tục thêm, sửa, xoá nhân viên

CREATE PROCEDURE sp_Create_Employee
    @UserName VARCHAR(100),
    @Email VARCHAR(255),
    @Password VARCHAR(255),
    @Role VARCHAR(50),      -- 'Admin' hoặc 'Employee'
    @DoB DATE,
    @Salary DECIMAL(18,2),
    @StartDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Thêm vào bảng Account trước để lấy UserID
        INSERT INTO Account (UserName, Email, Password, Role, DoB)
        VALUES (@UserName, @Email, @Password, @Role, @DoB);

        -- Lấy ID vừa tạo
        DECLARE @NewUserID INT = SCOPE_IDENTITY();

        -- 2. Thêm vào bảng Employee
        INSERT INTO Employee (UserID, Salary, StartDate)
        VALUES (@NewUserID, @Salary, @StartDate);

        COMMIT TRANSACTION;
        PRINT N'Thêm nhân viên thành công. ID: ' + CAST(@NewUserID AS NVARCHAR(10));
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW; -- Báo lỗi ra cho Backend biết
    END CATCH
END;
GO

CREATE PROCEDURE sp_Update_Employee
    @UserID INT,
    @Email VARCHAR(255) = NULL,
    @Role VARCHAR(50) = NULL,
    @Salary DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Cập nhật bảng Account (Nếu có truyền tham số)
        IF @Email IS NOT NULL OR @Role IS NOT NULL
        BEGIN
            UPDATE Account
            SET 
                Email = ISNULL(@Email, Email),
                Role = ISNULL(@Role, Role)
            WHERE UserID = @UserID;
        END

        -- 2. Cập nhật bảng Employee (Nếu có truyền lương)
        IF @Salary IS NOT NULL
        BEGIN
            UPDATE Employee
            SET Salary = @Salary
            WHERE UserID = @UserID;
        END

        COMMIT TRANSACTION;
        PRINT N'Cập nhật nhân viên thành công.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_Delete_Employee
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Kiểm tra xem ID này có phải là Employee không
        IF NOT EXISTS (SELECT 1 FROM Employee WHERE UserID = @UserID)
            THROW 50001, N'Người dùng này không phải là nhân viên hoặc không tồn tại.', 1;

        BEGIN TRANSACTION;

        -- Bước 1: Gỡ bỏ trách nhiệm của nhân viên này khỏi các bảng liên quan (Set NULL)
        -- (Để tránh lỗi khóa ngoại FK khi xóa)
        
        -- Cập nhật Product: Ai phụ trách sản phẩm này -> Set NULL
        UPDATE Product SET EmployeeID = NULL WHERE EmployeeID = @UserID;
        
        -- Cập nhật Store: Ai quản lý kho -> Set NULL (Hoặc gán cho Admin mặc định khác nếu muốn)
        -- Lưu ý: Store.EmployeeID là NOT NULL trong create.sql, nên bước này cần cẩn thận.
        -- Nếu Store bắt buộc phải có người quản lý, bạn KHÔNG THỂ xóa nhân viên này trừ khi gán Store cho người khác trước.
        -- Ở đây tôi giả định logic đơn giản là xóa Account.

        -- Bước 2: Xóa trong bảng Account
        -- Nhờ ON DELETE CASCADE cấu hình trong create.sql, 
        -- nó sẽ tự động xóa dòng tương ứng trong bảng Employee.
        DELETE FROM Account WHERE UserID = @UserID;

        COMMIT TRANSACTION;
        PRINT N'Xóa nhân viên thành công.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        -- Bắt lỗi cụ thể nếu dính khóa ngoại (ví dụ Store bắt buộc có người quản lý)
        IF ERROR_NUMBER() = 547 
            PRINT N'Lỗi: Không thể xóa nhân viên này vì họ đang đứng tên quản lý Cửa hàng hoặc Đơn vị vận chuyển (Dữ liệu bắt buộc). Hãy chuyển quyền quản lý trước.';
        ELSE
            THROW;
    END CATCH
END;
GO

-- Thủ tục: Chuyển đổi giỏ hàng từ Khách vãng lai (IP) sang Khách hàng thành viên (User)
CREATE PROCEDURE sp_Merge_Guest_Cart_To_User
    @GuestIP NVARCHAR(45),
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Kiểm tra xem IP này có giỏ hàng tạm không
        DECLARE @TempCartID INT;
        SELECT @TempCartID = TempCartID FROM TemporaryCart WHERE GuestIP = @GuestIP;

        IF @TempCartID IS NULL
        BEGIN
            -- Không có giỏ tạm thì không cần làm gì, nhưng vẫn ghi nhận Convert
            INSERT INTO Convert_to (UserID, GuestIP) VALUES (@UserID, @GuestIP);
            COMMIT TRANSACTION;
            RETURN;
        END

        -- 2. Đảm bảo User đã có Giỏ hàng thật (Nếu chưa thì tạo)
        DECLARE @UserCartID INT;
        SELECT @UserCartID = CartID FROM Cart WHERE CustomerID = @UserID;

        IF @UserCartID IS NULL
        BEGIN
            INSERT INTO Cart (CustomerID) VALUES (@UserID);
            SET @UserCartID = SCOPE_IDENTITY();
        END

        -- 3. GỘP DỮ LIỆU (Logic khó nhất)
        -- Duyệt qua từng món trong TempCartItem
        -- Nếu món đó đã có trong Cart thật -> Cộng dồn số lượng
        -- Nếu chưa có -> Thêm mới vào Cart thật

        MERGE CartItem AS Target
        USING (SELECT ProductID, VariantID, Quantity FROM TempCartItem WHERE TempCartID = @TempCartID) AS Source
        ON (Target.CartID = @UserCartID AND Target.ProductID = Source.ProductID AND Target.VariantID = Source.VariantID)
        
        -- Nếu đã tồn tại món này rồi thì cộng thêm số lượng
        WHEN MATCHED THEN
            UPDATE SET Target.Quantity = Target.Quantity + Source.Quantity
            
        -- Nếu chưa tồn tại thì thêm mới
        WHEN NOT MATCHED THEN
            INSERT (CartID, Quantity, ProductID, VariantID)
            VALUES (@UserCartID, Source.Quantity, Source.ProductID, Source.VariantID);

        -- 4. Ghi nhận lịch sử chuyển đổi (Convert_to)
        IF NOT EXISTS (SELECT 1 FROM Convert_to WHERE UserID = @UserID AND GuestIP = @GuestIP)
        BEGIN
            INSERT INTO Convert_to (UserID, GuestIP) VALUES (@UserID, @GuestIP);
        END

        -- 5. Dọn dẹp: Xóa giỏ hàng tạm sau khi đã chuyển xong
        DELETE FROM TempCartItem WHERE TempCartID = @TempCartID;
        DELETE FROM TemporaryCart WHERE TempCartID = @TempCartID;

        COMMIT TRANSACTION;
        PRINT N'Đã đồng bộ giỏ hàng thành công!';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO