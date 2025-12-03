USE UNIQLO_DB;
GO


-- 1. NHÓM NGƯỜI DÙNG, KHÁCH VÀ AUDIT

-- Dữ liệu Account (17 tài khoản: 1 Admin, 7 Employee, 9 Customer)
-- ID tự tăng từ 1
INSERT INTO Account (Email, UserName, Role, Password, DoB) VALUES
('admin@uniqlo.com', 'admin_sys', 'Admin', 'Admin@123456', '1985-01-10'), -- ID: 1
('manager1@mail.com', 'manager_tran', 'Employee', 'Manager@123456', '1988-06-15'), -- ID: 2 (Quản lý)
('manager_hcm@mail.com', 'manager_hcm', 'Employee', 'Manager@123456', '1990-01-01'), -- ID: 3 (Employee/Người phụ trách sản phẩm 10)
('manager_hn@mail.com', 'manager_hn', 'Employee', 'Manager@123456', '1991-03-15'), -- ID: 4 (Employee/Người phụ trách sản phẩm 11)
('staff_kho_hcm@mail.com', 'staff_kho_hcm', 'Employee', 'Staff@123456', '1995-04-20'), -- ID: 5 (Employee/Kho miền Nam 12)
('staff_logistics@mail.com', 'staff_logistics', 'Employee', 'Staff@123456', '1996-08-25'), -- ID: 6 (Employee/Vận chuyển 14)
('staff_le@mail.com', 'staff_le', 'Employee', 'Staff@123456', '1995-04-20'), -- ID: 7 (Employee)
('staff_pham@mail.com', 'staff_pham', 'Employee', 'Staff@123456', '1996-08-25'), -- ID: 8 (Employee)
('nguyenvana@email.com', 'nguyenvana', 'Customer', 'Pass@123456', '1995-03-15'), -- ID: 9
('tranthib@email.com', 'tranthib', 'Customer', 'Pass@123456', '1998-07-22'), -- ID: 10
('levanc@email.com', 'levanc', 'Customer', 'Pass@123456', '2000-11-08'), -- ID: 11
('phamthid@email.com', 'phamthid', 'Customer', 'Pass@123456', '1993-05-30'), -- ID: 12
('khach_a@mail.com', 'khach_a', 'Customer', 'Pass@123456', '1992-01-01'), -- ID: 13
('khach_b@mail.com', 'khach_b', 'Customer', 'Pass@123456', '1993-02-02'), -- ID: 14
('khach_c@mail.com', 'khach_c', 'Customer', 'Pass@123456', '1994-03-03'), -- ID: 15
('khach_d@mail.com', 'khach_d', 'Customer', 'Pass@123456', '1995-04-04'), -- ID: 16
('khach_e@mail.com', 'khach_e', 'Customer', 'Pass@123456', '1996-05-05'); -- ID: 17

-- Dữ liệu User_PhoneNumber
INSERT INTO User_PhoneNumber (UserID, PhoneNumber) VALUES
(9, '0901234567'), (9, '0912345678'), -- Customer 9 có 2 số
(10, '0923456789'),
(11, '0934567890'),
(1, '0967890123'), -- Admin
(2, '0978901234'), -- Manager
(3, '0989012345'),
(4, '0990123456'),
(13, '0801234567'),
(14, '0812345678');

-- Dữ liệu Customer
INSERT INTO Customer (UserID, Street, Ward, District, City) VALUES
(9, '123 Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh'),
(10, '456 Lê Lợi', 'Phường Bến Thành', 'Quận 1', 'TP. Hồ Chí Minh'),
(11, '789 Trần Hưng Đạo', 'Phường Cầu Ông Lãnh', 'Quận 1', 'TP. Hồ Chí Minh'),
(12, '321 Võ Văn Tần', 'Phường 6', 'Quận 3', 'TP. Hồ Chí Minh'),
(13, '123 Lê Lợi', 'Q1', 'TP.HCM', 'TP. Hồ Chí Minh'), -- khach_a
(14, '45 Cầu Giấy', 'Dịch Vọng', 'Cầu Giấy', 'Hà Nội'), -- khach_b
(15, '12 Nguyễn Văn Linh', 'Hòa Thuận', 'Hải Châu', 'Đà Nẵng'), -- khach_c
(16, 'Khu phố 3', 'Long Bình', 'Biên Hòa', 'Đồng Nai'), -- khach_d
(17, 'Số 5 Hùng Vương', 'Ninh Kiều', 'Ninh Kiều', 'Cần Thơ'); -- khach_e

-- Dữ liệu Employee
INSERT INTO Employee (UserID, StartDate, Salary) VALUES
(1, '2020-01-15', 30000000.00),  -- Admin
(2, '2021-03-20', 20000000.00),  -- Manager 1
(3, '2020-01-01', 30000000),     -- Manager HCM / Emp phụ trách sản phẩm
(4, '2021-03-15', 28000000),     -- Manager HN / Emp phụ trách sản phẩm
(5, '2022-06-01', 12000000),     -- Staff Kho / Emp phụ trách kho
(6, '2023-01-01', 11000000),     -- Staff Logistics / Emp phụ trách vận chuyển
(7, '2022-05-10', 12000000.00),  -- Staff 1
(8, '2022-08-15', 12000000.00);  -- Staff 2

-- Dữ liệu Guest
INSERT INTO Guest (IP, SearchHistory, LastVisitTime, ViewedProduct) VALUES
('192.168.1.100', 'áo khoác, quần jean', '2025-11-20 10:30:00', 'P001,P002'),
('192.168.1.101', 'váy nữ, giày', '2025-11-21 14:15:00', 'P003,P004'),
('192.168.1.102', 'áo thun nam', '2025-11-22 09:45:00', 'P005'),
('192.168.1.103', 'phụ kiện thời trang', '2025-11-22 16:20:00', 'P006,P007'),
('192.168.1.104', 'quần short, áo polo', '2025-11-23 11:00:00', 'P008,P009,P010');

-- Dữ liệu Convert_to
INSERT INTO Convert_to (UserID, GuestIP, ConvertedAt) VALUES
(9, '192.168.1.100', '2025-11-20 10:45:00'),
(10, '192.168.1.101', '2025-11-21 14:30:00'),
(11, '192.168.1.102', '2025-11-22 10:00:00');

-- Dữ liệu TemporaryCart
INSERT INTO TemporaryCart (GuestIP, CreatedAt, LastUpdated) VALUES
('192.168.1.100', '2025-11-20 10:30:00', '2025-11-20 10:40:00'),
('192.168.1.101', '2025-11-21 14:15:00', '2025-11-21 14:25:00'),
('192.168.1.102', '2025-11-22 09:45:00', '2025-11-22 09:55:00'),
('192.168.1.103', '2025-11-22 16:20:00', '2025-11-22 16:30:00'),
('192.168.1.104', '2025-11-23 11:00:00', '2025-11-23 11:10:00');

-- Dữ liệu AuditLog (Đã ánh xạ UserID)
INSERT INTO AuditLog (ActionType, TargetEntity, TargetID, Details, UserID, [Timestamp]) VALUES
('INSERT', 'Account', '9', N'Tạo tài khoản khách hàng mới', NULL, '2025-11-01 08:00:00'),
('LOGIN', 'Account', '9', N'Đăng nhập thành công', 9, '2025-11-20 10:30:00'),
('INSERT', 'Customer', '9', N'Thêm thông tin khách hàng', 9, '2025-11-20 10:32:00'),
('INSERT', 'Employee', '1', N'Thêm nhân viên mới', 1, '2025-11-01 09:00:00'),
('UPDATE', 'Employee', '7', N'Cập nhật lương nhân viên', 1, '2025-11-15 14:20:00'),
('LOGIN', 'Account', '10', N'Đăng nhập thành công', 10, '2025-11-21 14:15:00'),
('ORDER_PLACED', 'Order', '1', N'Đặt hàng thành công', 9, '2025-11-20 11:00:00'),
('DELETE', 'TempCartItem', '1-2', N'Xóa sản phẩm khỏi giỏ hàng tạm', NULL, '2025-11-20 10:42:00'),
('UPDATE', 'Account', '11', N'Đổi mật khẩu', 11, '2025-11-22 15:30:00'),
('LOGOUT', 'Account', '9', N'Đăng xuất', 9, '2025-11-20 12:00:00');

-- 2. NHÓM SẢN PHẨM VÀ DANH MỤC (Tất cả ProductID/CategoryID tự tăng)

-- Dữ liệu Product
SET IDENTITY_INSERT [Product] ON; -- Bật Identity Insert để cố định ID
INSERT INTO [Product](ProductID, ProductName, Description, EmployeeID) VALUES
(1000, N'Áo Thun Cổ Tròn Uniqlo U', N'Áo thun nam chất liệu cotton mềm mại', 3), -- ID: 1000 (Từ Nhóm 4)
(1001, N'Áo Khoác Chống Nắng UV Cut', N'Áo khoác giữ ấm, phong cách thể thao', 3), -- ID: 1001 (Từ Nhóm 4)
(1002, N'Quần Jeans Ultra Stretch', N'Quần jeans nữ co giãn, phù hợp mọi dáng', 4), -- ID: 1002 (Từ Nhóm 4)
(1003, N'Áo Sơ Mi Flannel Caro', N'Áo sơ mi nam thanh lịch, màu trắng', 4), -- ID: 1003 (Từ Nhóm 4)
(1004, N'Đầm Rayon Họa Tiết Hoa', N'Đầm maxi nữ họa tiết hoa nhí', 3), -- ID: 1004 (Từ Nhóm 4)
(1005, N'Áo Polo Dry-EX Thoáng Khí', N'Áo polo thể thao thoáng khí', 3), -- ID: 1005 (Từ Nhóm 4)
(1007, N'Áo Giữ Nhiệt HEATTECH', N'Áo giữ nhiệt mùa đông', 3); -- ID: 1007 (Từ Nhóm 4)
SET IDENTITY_INSERT [Product] OFF;

-- Dữ liệu ProductVariant
INSERT INTO ProductVariant (ProductID, VariantID, Color, Size, Price) VALUES
(1000, 1, N'White', N'S', 299000), (1000, 2, N'White', N'M', 299000), (1000, 3, N'White', N'L', 299000),
(1000, 4, N'Black', N'M', 299000), (1000, 5, N'Black', N'L', 299000),
(1001, 1, N'Navy', N'M', 799000), (1001, 2, N'Grey', N'L', 799000), (1001, 3, N'Pink', N'S', 799000),
(1002, 1, N'Blue', N'30', 999000), (1002, 2, N'Blue', N'32', 999000), (1002, 3, N'Black', N'30', 999000),
(1003, 1, N'Red Check', N'M', 499000), (1003, 2, N'Green', N'L', 499000),
(1004, 1, N'Floral', N'S', 999000), (1004, 2, N'Floral', N'M', 999000),
(1005, 1, N'White', N'L', 399000), (1005, 2, N'Navy', N'XL', 399000),
(1007, 1, N'Black', N'S', 249000), (1007, 2, N'Black', N'M', 249000);

-- Dữ liệu TempCartItem (ProductID/VariantID phải tồn tại)
INSERT INTO TempCartItem (TempCartID, TempCartItemID, Quantity, ProductID, VariantID, AddedAt) VALUES
(1, 1, 2, 1000, 1, '2025-11-20 10:35:00'),
(1, 2, 1, 1002, 1, '2025-11-20 10:40:00'),
(2, 1, 3, 1004, 2, '2025-11-21 14:20:00'),
(3, 1, 1, 1005, 1, '2025-11-22 09:50:00'),
(4, 1, 2, 1001, 3, '2025-11-22 16:25:00'),
(5, 1, 1, 1000, 4, '2025-11-23 11:05:00'),
(5, 2, 2, 1003, 2, '2025-11-23 11:10:00');

-- Dữ liệu ProductVariant_ImageURL
INSERT INTO ProductVariant_ImageURL(ProductID, VariantID, ImageURL) VALUES
(1000,1,'https://example.com/ao_thun_white_s.jpg'),
(1000,2,'https://example.com/ao_thun_white_m.jpg'),
(1002,1,'https://example.com/quan_jeans_blue_30.jpg'),
(1002,3,'https://example.com/quan_jeans_black_30.jpg'),
(1004,1,'https://example.com/dam_floral_s.jpg'),
(1007,1,'https://example.com/heattech_black_s.jpg');

-- Dữ liệu Category
SET IDENTITY_INSERT Category ON;
INSERT INTO Category(CategoryID, CategoryName, ParentCategoryID, EmployeeID) VALUES
(1, N'Nam', NULL, 3),
(2, N'Nữ', NULL, 4),
(3, N'Áo', 1, 3),
(4, N'Quần', 1, 3),
(5, N'Váy/Đầm', 2, 4),
(6, N'Áo khoác', 1, 4);
SET IDENTITY_INSERT Category OFF;

-- Dữ liệu Belongs_To
INSERT INTO Belongs_To(ProductID, CategoryID) VALUES
(1000, 3), (1000, 1), -- Áo thun thuộc Áo & Nam
(1002, 4), (1002, 2), -- Quần jeans thuộc Quần & Nữ
(1004, 5), (1004, 2), -- Đầm thuộc Váy/Đầm & Nữ
(1001, 6), (1001, 1), -- Áo khoác thuộc Áo khoác & Nam
(1003, 3), (1003, 1), -- Áo sơ mi thuộc Áo & Nam
(1005, 3), (1005, 1), -- Áo Polo thuộc Áo & Nam
(1007, 3), (1007, 1); -- Áo giữ nhiệt thuộc Áo & Nam

-- 3. NHÓM CỬA HÀNG, KHO VÀ VẬN CHUYỂN


-- Dữ liệu Store
INSERT INTO Store (StoreID, StoreName, Address, EmployeeID) VALUES
(10, N'UNIQLO Đồng Khởi', N'35 Lê Thánh Tôn, Q1, TP.HCM', 3),
(13, N'UNIQLO Vincom Bà Triệu', N'191 Bà Triệu, Hà Nội', 4),
(15, N'Kho Tổng Miền Nam', N'KCN Sóng Thần, Bình Dương', 5),
(16, N'Kho Tổng Miền Bắc', N'KCN Thăng Long, Hà Nội', 5);

-- Dữ liệu ShippingUnit
INSERT INTO ShippingUnit (UnitID, UnitName, EmployeeID) VALUES
(1, N'Giao Hàng Tiết Kiệm', 6),
(2, N'Viettel Post', 6),
(3, N'GrabExpress', 6),
(4, N'Ahamove', 6);

-- Dữ liệu Has_Stock
INSERT INTO Has_Stock (StoreID, ProductID, VariantID, Quantity) VALUES
-- Kho Miền Nam (15)
(15, 1000, 1, 500), (15, 1000, 2, 500), (15, 1001, 1, 200), (15, 1002, 1, 300),
-- Kho Miền Bắc (16)
(16, 1000, 1, 400), (16, 1003, 1, 150), (16, 1007, 1, 1000),
-- Cửa hàng Đồng Khởi (10)
(10, 1000, 1, 50), (10, 1000, 2, 40), (10, 1004, 1, 15),
-- Cửa hàng Bà Triệu (13)
(13, 1000, 1, 5), (13, 1001, 1, 3), (13, 1005, 1, 2);

-- 4. NHÓM KHUYẾN MÃI

-- Dữ liệu Promotion
INSERT INTO Promotion (PromoID, PromoName, StartDate, EndDate, EmployeeID) VALUES
(1, N'Khai Trương Cửa Hàng Mới', '2024-01-01', '2024-01-07', 3),
(2, N'Chào Hè Sôi Động 2025', '2025-06-01', '2025-06-30', 3),
(3, N'Back To School - Tựu Trường', '2025-08-15', '2025-09-05', 3),
(4, N'Black Friday Siêu Sale', '2025-11-25', '2025-11-30', 4), -- Đã qua
(5, N'Cyber Monday Online', '2025-12-02', '2025-12-02', 4); -- Đã qua

-- Dữ liệu PromotionRule
INSERT INTO PromotionRule (PromoID, RuleID, RuleType, RewardValue) VALUES
(1, 1, 'Percentage', 10.00),
(2, 1, 'FixedAmount', 50000),
(3, 1, 'Buy1Get1', 0),
(4, 1, 'Percentage', 50.00),
(4, 2, 'Percentage', 20.00),
(5, 1, 'Percentage', 15.00);

-- Dữ liệu Applied
INSERT INTO Applied (PromoID, RuleID, ProductID, VariantID) VALUES
(2, 1, 1000, 1), (2, 1, 1000, 2), -- Áo thun áp dụng KM Hè
(3, 1, 1005, 1), -- Áo Polo mua 1 tặng 1
(4, 1, 1001, 1), (4, 1, 1001, 2), -- Áo khoác giảm 50% Black Friday
(4, 1, 1002, 1); -- Quần Jeans giảm 50%

-- 5. NHÓM GIỎ HÀNG, ĐƠN HÀNG VÀ VẬN CHUYỂN

-- Dữ liệu Cart (cho 5 khách hàng)
INSERT INTO Cart (CustomerID, LastUpdated) VALUES
(9, GETDATE()), -- Khách 9
(10, GETDATE()), -- Khách 10
(11, GETDATE()), -- Khách 11
(12, GETDATE()), -- Khách 12
(13, GETDATE()); -- Khách 13

-- Dữ liệu CartItem
INSERT INTO CartItem (CartID, CartItemID, Quantity, ProductID, VariantID) VALUES
(1, 1, 1, 1000, 1), -- Khách 9: 1 Áo thun S White
(1, 2, 2, 1007, 1), -- Khách 9: 2 Áo giữ nhiệt S Black
(2, 1, 1, 1002, 1), -- Khách 10: 1 Quần Jeans 30 Blue
(3, 1, 3, 1004, 1); -- Khách 11: 3 Đầm Floral S

-- Dữ liệu Order (4 đơn hàng)
INSERT INTO [Order] (OrderID, OrderDate, CustomerID, Address, EmployeeID, Status) VALUES
(5001, '2025-10-01', 9, N'123 Lê Lợi, Q1, TP.HCM', 7, N'Delivered'),
(5002, '2025-10-02', 14, N'45 Cầu Giấy, Hà Nội', 7, N'Delivered'),
(5003, '2025-11-10', 10, N'456 Lê Lợi, Q1, TP. Hồ Chí Minh', 8, N'Shipping'),
(5004, '2025-11-25', 9, N'123 Nguyễn Huệ, Q1, TP. Hồ Chí Minh', 8, N'Pending');

-- Dữ liệu Shipment
INSERT INTO Shipment (ShipmentID, TrackingCode, Status, DeliveryDate, OrderID, UnitID) VALUES
(1, 'VN00000001', N'Delivered', '2025-10-03', 5001, 3), -- Order 5001
(2, 'VN00000002', N'Delivered', '2025-10-05', 5002, 1), -- Order 5002
(3, 'VN00000003', N'Shipping', NULL, 5003, 2), -- Order 5003
(4, 'VN00000004', N'Pending', NULL, 5004, 4); -- Order 5004

-- Dữ liệu OrderItem
INSERT INTO OrderItem (OrderID, OrderItemID, Quantity, PriceAtPurchase, ProductID, VariantID, StoreID, ShipmentID, PromoID, RuleID) VALUES
-- Order 5001 (Đã giao)
(5001, 1, 1, 299000.00, 1000, 1, 10, 1, 2, 1), -- Áo thun S White (áp dụng KM2)
(5001, 2, 1, 799000.00, 1001, 1, 15, 1, NULL, NULL), -- Áo khoác M Navy
-- Order 5002 (Đã giao)
(5002, 1, 2, 249000.00, 1007, 1, 16, 2, NULL, NULL), -- Áo giữ nhiệt S Black
-- Order 5003 (Đang giao)
(5003, 1, 1, 999000.00, 1002, 1, 15, 3, NULL, NULL), -- Quần Jeans 30 Blue
-- Order 5004 (Pending)
(5004, 1, 1, 999000.00 * 0.5, 1002, 1, 10, 4, 4, 1); -- Quần Jeans 30 Blue (áp dụng Black Friday)

-- Dữ liệu Review
INSERT INTO Review (CustomerID, ProductID, Content, Rating) VALUES
(9, 1000, N'Áo chất lượng tốt, mặc vừa vặn.', 5),
(14, 1007, N'Giữ nhiệt hiệu quả, sẽ mua lại.', 4);