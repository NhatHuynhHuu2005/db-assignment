USE master;
GO

-- Xóa database cũ nếu tồn tại
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'UNIQLO_DB')
BEGIN
    ALTER DATABASE UNIQLO_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE UNIQLO_DB;
END
GO

-- Tạo database mới
CREATE DATABASE UNIQLO_DB;
GO

USE UNIQLO_DB;
GO

-- =====================================================
-- 1. NHÓM NGƯỜI DÙNG, KHÁCH VÀ AUDIT
-- =====================================================

-- 1.1 Account (Lớp cha)
CREATE TABLE Account (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Email VARCHAR(255) NOT NULL UNIQUE,
    UserName VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL, -- Thực tế nên dùng PasswordHash và độ dài lớn hơn
    Role VARCHAR(50) NOT NULL,
    DoB DATE NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Account_Role CHECK (Role IN ('Customer', 'Employee', 'Admin')),
    CONSTRAINT CHK_Account_Age CHECK (DATEDIFF(YEAR, DoB, GETDATE()) >= 18),
    CONSTRAINT CHK_Account_Email CHECK (Email LIKE '%@%.%'),
    CONSTRAINT CHK_Account_Password CHECK (LEN(Password) >= 8)
);
GO

-- 1.2 User_PhoneNumber (Thuộc tính đa trị)
CREATE TABLE User_PhoneNumber (
    UserID INT NOT NULL,
    PhoneNumber VARCHAR(20) NOT NULL,
    PRIMARY KEY (UserID, PhoneNumber),
    FOREIGN KEY (UserID) REFERENCES Account(UserID) ON DELETE CASCADE,
    -- Cho phép 10 hoặc 11 chữ số bắt đầu bằng số 0 (hoặc mở rộng hơn)
    CONSTRAINT CHK_PhoneNumber CHECK (PhoneNumber LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' 
                                      OR PhoneNumber LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);
GO

-- 1.3 Customer (Lớp con)
CREATE TABLE Customer (
    UserID INT PRIMARY KEY,
    Street VARCHAR(255),
    Ward VARCHAR(100),
    District VARCHAR(100),
    City VARCHAR(100),
    FOREIGN KEY (UserID) REFERENCES Account(UserID) ON DELETE CASCADE
);
GO

-- 1.4 Employee (Lớp con) - Đã thêm thuộc tính dẫn xuất PermissionCount từ Nhóm 2
CREATE TABLE Employee (
    UserID INT PRIMARY KEY,
    StartDate DATE NOT NULL DEFAULT GETDATE(),
    Salary DECIMAL(18,2) NOT NULL,
    -- PermissionCount INT NOT NULL DEFAULT 0, -- Thuộc tính dẫn xuất này không phù hợp với Employee
    CONSTRAINT FK_Employee_Account FOREIGN KEY (UserID) REFERENCES Account(UserID) ON DELETE CASCADE,
    CONSTRAINT CHK_Employee_Salary CHECK (Salary > 0),
    CONSTRAINT CHK_Employee_StartDate CHECK (StartDate <= GETDATE())
);
GO

-- 1.5 Guest
CREATE TABLE Guest (
    IP NVARCHAR(45) PRIMARY KEY,
    SearchHistory NVARCHAR(MAX),
    LastVisitTime DATETIME DEFAULT GETDATE(),
    ViewedProduct NVARCHAR(MAX),
    
    CONSTRAINT CHK_Guest_IP CHECK (
        IP LIKE '[0-9]%.%[0-9]%.%[0-9]%.%[0-9]%' OR
        IP LIKE '%:%' -- IPv6
    )
);
GO

-- 1.6 Convert_to
CREATE TABLE Convert_to (
    UserID INT NOT NULL,
    GuestIP NVARCHAR(45) NOT NULL,
    ConvertedAt DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (UserID, GuestIP),
    FOREIGN KEY (UserID) REFERENCES Account(UserID) ON DELETE CASCADE,
    FOREIGN KEY (GuestIP) REFERENCES Guest(IP)
);
GO

-- 1.7 TemporaryCart
CREATE TABLE TemporaryCart (
    TempCartID INT PRIMARY KEY IDENTITY(1,1),
    GuestIP NVARCHAR(45) NOT NULL UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastUpdated DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (GuestIP) REFERENCES Guest(IP) ON DELETE CASCADE
);
GO

-- 1.8 TempCartItem
CREATE TABLE TempCartItem (
    TempCartItemID INT PRIMARY KEY IDENTITY(1,1),
    TempCartID INT NOT NULL,
    Quantity INT NOT NULL,
    ProductID INT NOT NULL,
    VariantID INT NOT NULL, 
    AddedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (TempCartID) REFERENCES TemporaryCart(TempCartID) ON DELETE CASCADE,
    CONSTRAINT CHK_TempCartItem_Quantity CHECK (Quantity > 0)
);
GO

-- 1.9 AuditLog
CREATE TABLE AuditLog (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    Timestamp DATETIME DEFAULT GETDATE(),
    ActionType NVARCHAR(50) NOT NULL CHECK (
        ActionType IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ORDER_PLACED', 'ORDER_CANCELLED')
    ),
    TargetEntity NVARCHAR(100) NOT NULL,
    TargetID NVARCHAR(50),
    Details NVARCHAR(MAX),
    UserID INT,
    
    FOREIGN KEY (UserID) REFERENCES Account(UserID) ON DELETE SET NULL
);
GO

-- =====================================================
-- 2. NHÓM SẢN PHẨM VÀ DANH MỤC
-- =====================================================
-- 2.1 Product
CREATE TABLE [Product] (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    EmployeeID INT, -- Người phụ trách sản phẩm
    CONSTRAINT FK_Product_Employee FOREIGN KEY (EmployeeID)
        REFERENCES Employee(UserID)
);
GO

-- 2.2 ProductVariant (Thực thể yếu, đã gộp)
CREATE TABLE ProductVariant (
    ProductID INT,
    VariantID INT,
    Color NVARCHAR(50) NOT NULL,
    Size NVARCHAR(50) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (ProductID, VariantID),
    CONSTRAINT CHK_Variant_Price CHECK (Price > 0),
    CONSTRAINT FK_Variant_Product FOREIGN KEY (ProductID)
        REFERENCES [Product](ProductID) ON DELETE CASCADE
);
GO

-- 2.3 ProductVariant_ImageURL (Thuộc tính đa trị)
CREATE TABLE ProductVariant_ImageURL (
    ProductID INT,
    VariantID INT,
    ImageURL NVARCHAR(200),
    PRIMARY KEY (ProductID, VariantID, ImageURL),
    CONSTRAINT FK_ImageURL_Variant FOREIGN KEY (ProductID, VariantID)
        REFERENCES ProductVariant(ProductID, VariantID) ON DELETE CASCADE
);
GO

-- 2.4 Category
CREATE TABLE Category (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL,
    ParentCategoryID INT NULL,
    EmployeeID INT, -- Người quản lý danh mục
    CONSTRAINT FK_Category_Parent FOREIGN KEY (ParentCategoryID)
        REFERENCES Category(CategoryID),
    CONSTRAINT FK_Category_Employee FOREIGN KEY (EmployeeID)
        REFERENCES Employee(UserID)
);
GO

-- 2.5 Belongs_To (Mối liên kết N:M giữa Product và Category)
CREATE TABLE Belongs_To (
    ProductID INT,
    CategoryID INT,
    PRIMARY KEY (ProductID, CategoryID),
    CONSTRAINT FK_Belong_Product FOREIGN KEY (ProductID) REFERENCES [Product](ProductID),
    CONSTRAINT FK_Belong_Category FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID)
);
GO

-- =====================================================
-- 3. NHÓM CỬA HÀNG, KHO VÀ VẬN CHUYỂN
-- =====================================================

-- 3.1 Store
CREATE TABLE Store (
    StoreID INT PRIMARY KEY,
    StoreName NVARCHAR(100) NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    EmployeeID INT NOT NULL, -- Quản lý cửa hàng
    TotalStockQuantity INT DEFAULT 0, -- Thuộc tính dẫn xuất
    FOREIGN KEY (EmployeeID) REFERENCES Employee(UserID)
);
GO

-- 3.2 Has_Stock (Tồn kho)
CREATE TABLE Has_Stock (
    StoreID INT,
    ProductID INT,
    VariantID INT,
    Quantity INT NOT NULL DEFAULT 0,
    PRIMARY KEY (StoreID, ProductID, VariantID),
    CONSTRAINT CK_Stock_Quantity CHECK (Quantity >= 0),
    FOREIGN KEY (StoreID) REFERENCES Store(StoreID),
    FOREIGN KEY (ProductID, VariantID) REFERENCES ProductVariant(ProductID, VariantID)
);
GO

-- 3.3 ShippingUnit
CREATE TABLE ShippingUnit (
    UnitID INT PRIMARY KEY,
    UnitName NVARCHAR(100) NOT NULL,
    EmployeeID INT NOT NULL, -- Người quản lý/phụ trách
    FOREIGN KEY (EmployeeID) REFERENCES Employee(UserID)
);
GO

-- =====================================================
-- 4. NHÓM KHUYẾN MÃI
-- =====================================================

-- 4.1 Promotion
CREATE TABLE Promotion (
    PromoID INT PRIMARY KEY,
    PromoName NVARCHAR(100) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    EmployeeID INT NOT NULL, -- Người tạo/quản lý khuyến mãi
    CONSTRAINT CK_Promotion_Dates CHECK (StartDate <= EndDate),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(UserID)
);
GO

-- 4.2 PromotionRule (Thực thể yếu)
CREATE TABLE PromotionRule (
    PromoID INT,
    RuleID INT,
    RuleType NVARCHAR(50) NOT NULL, -- 'Percentage', 'FixedAmount', 'Buy1Get1'
    RewardValue DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (PromoID, RuleID),
    FOREIGN KEY (PromoID) REFERENCES Promotion(PromoID) ON DELETE CASCADE
);
GO

-- 4.3 Applied (Liên kết giữa PromotionRule và ProductVariant)
CREATE TABLE Applied (
    PromoID INT,
    RuleID INT,
    ProductID INT,
    VariantID INT,
    PRIMARY KEY (PromoID, RuleID, ProductID, VariantID),
    FOREIGN KEY (PromoID, RuleID) REFERENCES PromotionRule(PromoID, RuleID),
    FOREIGN KEY (ProductID, VariantID) REFERENCES ProductVariant(ProductID, VariantID)
);
GO

-- =====================================================
-- 5. NHÓM GIỎ HÀNG, ĐƠN HÀNG VÀ VẬN CHUYỂN
-- =====================================================

-- 5.1 Cart (Giỏ hàng Customer)
CREATE TABLE Cart (
    CartID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL UNIQUE, -- Ràng buộc: Mỗi Customer chỉ có một Cart
    LastUpdated DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (CustomerID) REFERENCES Customer(UserID) ON DELETE CASCADE
);
GO

-- 5.2 CartItem (Thực thể yếu)
CREATE TABLE CartItem (
    CartItemID INT PRIMARY KEY IDENTITY(1,1), -- Sửa: Làm khóa chính tự tăng
    CartID INT NOT NULL,
    Quantity INT NOT NULL,
    ProductID INT NOT NULL,
    VariantID INT NOT NULL,
    
    FOREIGN KEY (CartID) REFERENCES Cart(CartID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID, VariantID) REFERENCES ProductVariant(ProductID, VariantID),
    
    CONSTRAINT CHK_CartItem_Quantity CHECK (Quantity > 0)
);
GO

-- 5.3 Order
CREATE TABLE [Order] (
    OrderID INT PRIMARY KEY,
    OrderDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(50) NOT NULL DEFAULT N'Pending', -- Pending, Processing, Shipping, Delivered, Cancelled
    Address NVARCHAR(255),
    CustomerID INT NOT NULL,
    EmployeeID INT, -- Nhân viên xử lý đơn hàng (có thể NULL lúc mới tạo)
    
    FOREIGN KEY (CustomerID) REFERENCES Customer(UserID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(UserID)
);
GO

-- 5.4 Shipment
CREATE TABLE Shipment (
    ShipmentID INT PRIMARY KEY,
    TrackingCode VARCHAR(50) NOT NULL UNIQUE,
    Status NVARCHAR(50) DEFAULT N'Pending',
    DeliveryDate DATETIME,
    OrderID INT NOT NULL UNIQUE,
    UnitID INT NOT NULL,
    
    FOREIGN KEY (OrderID) REFERENCES [Order](OrderID),
    FOREIGN KEY (UnitID) REFERENCES ShippingUnit(UnitID)
);
GO

-- 5.5 OrderItem (Chi tiết đơn hàng - Thực thể yếu)
CREATE TABLE OrderItem (
    OrderItemID INT PRIMARY KEY IDENTITY(1,1), -- Sửa: Làm khóa chính tự tăng
    OrderID INT NOT NULL,
    Quantity INT NOT NULL,
    PriceAtPurchase DECIMAL(18,2) NOT NULL,
    ProductID INT NOT NULL,
    VariantID INT NOT NULL,
    StoreID INT NOT NULL,
    ShipmentID INT,
    PromoID INT,
    RuleID INT,
    
    FOREIGN KEY (OrderID) REFERENCES [Order](OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID, VariantID) REFERENCES ProductVariant(ProductID, VariantID),
    FOREIGN KEY (StoreID) REFERENCES Store(StoreID),
    FOREIGN KEY (ShipmentID) REFERENCES Shipment(ShipmentID),
    FOREIGN KEY (PromoID, RuleID) REFERENCES PromotionRule(PromoID, RuleID),
    
    CONSTRAINT CHK_OrderItem_Quantity CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderItem_PriceAtPurchase CHECK (PriceAtPurchase > 0)
);
GO

-- 5.6 Review (Đánh giá)
CREATE TABLE Review (
    ReviewID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL,
    ProductID INT NOT NULL,
    Content NVARCHAR(MAX),
    Rating INT NOT NULL,
    ReviewDate DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (CustomerID) REFERENCES Customer(UserID),
    FOREIGN KEY (ProductID) REFERENCES [Product](ProductID),
    
    -- Ràng buộc ngữ nghĩa: Mỗi khách hàng chỉ đánh giá 1 sản phẩm 1 lần
    CONSTRAINT UNQ_Customer_Product_Review UNIQUE (CustomerID, ProductID),
    CONSTRAINT CHK_Review_Rating CHECK (Rating >= 1 AND Rating <= 5)
);
GO

-- =====================================================
-- 6. NHÓM HỆ THỐNG QUẢN TRỊ (Phần mở rộng từ Nhóm 2)
-- =====================================================
-- Thêm cột tích lũy chi tiêu và hạng thành viên
ALTER TABLE Customer ADD TotalSpent DECIMAL(18, 2) DEFAULT 0;
ALTER TABLE Customer ADD MemberTier VARCHAR(20) DEFAULT 'New Member'; -- Bronze, Silver, Gold, Platinum, VIP

-- Thêm phương thức thanh toán cho đơn hàng
ALTER TABLE [Order] ADD PaymentMethod NVARCHAR(50); -- 'Cash', 'Transfer'
ALTER TABLE [Order] ADD PaymentStatus NVARCHAR(50) DEFAULT 'Unpaid';

ALTER TABLE [Order] ADD ShippingFee DECIMAL(18,2) DEFAULT 0;
ALTER TABLE [Order] ADD UnitID INT; -- Để biết khách chọn ship nào