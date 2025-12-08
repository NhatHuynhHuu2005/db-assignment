USE UNIQLO_DB;
GO

--Dữ liệu Account
INSERT INTO Account (Email, UserName, Role, Password, DoB) VALUES
('admin@uniqlo.com', 'admin_sys', 'Admin', 'Admin@123456', '1985-01-10'), 
('manager1@mail.com', 'manager_tran', 'Employee', 'Manager@123456', '1988-06-15'), 
('manager_hcm@mail.com', 'manager_hcm', 'Employee', 'Manager@123456', '1990-01-01'), 
('manager_hn@mail.com', 'manager_hn', 'Employee', 'Manager@123456', '1991-03-15'), 
('staff_kho_hcm@mail.com', 'staff_kho_hcm', 'Employee', 'Staff@123456', '1995-04-20'),
('staff_logistics@mail.com', 'staff_logistics', 'Employee', 'Staff@123456', '1996-08-25'), 
('staff_le@mail.com', 'staff_le', 'Employee', 'Staff@123456', '1995-04-20'), 
('staff_pham@mail.com', 'staff_pham', 'Employee', 'Staff@123456', '1996-08-25'), 
('nguyenvana@email.com', 'nguyenvana', 'Customer', 'Pass@123456', '1995-03-15'), 
('tranthib@email.com', 'tranthib', 'Customer', 'Pass@123456', '1998-07-22'),
('levanc@email.com', 'levanc', 'Customer', 'Pass@123456', '2000-11-08'), 
('phamthid@email.com', 'phamthid', 'Customer', 'Pass@123456', '1993-05-30'), 
('khach_a@mail.com', 'khach_a', 'Customer', 'Pass@123456', '1992-01-01'), 
('khach_b@mail.com', 'khach_b', 'Customer', 'Pass@123456', '1993-02-02'), 
('khach_c@mail.com', 'khach_c', 'Customer', 'Pass@123456', '1994-03-03'), 
('khach_d@mail.com', 'khach_d', 'Customer', 'Pass@123456', '1995-04-04'),
('khach_e@mail.com', 'khach_e', 'Customer', 'Pass@123456', '1996-05-05'); 

-- Dữ liệu User_PhoneNumber
INSERT INTO User_PhoneNumber (UserID, PhoneNumber) VALUES
(9, '0901234567'), (9, '0912345678'), 
(10, '0923456789'),
(11, '0934567890'),
(1, '0967890123'), 
(2, '0978901234'), 
(3, '0989012345'),
(4, '0990123456'),
(13, '0801234567'),
(14, '0812345678');

-- Dữ liệu Customer
INSERT INTO Customer (UserID, Street, Ward, District, City) VALUES
(9, N'123 Nguyễn Huệ', N'Phường Bến Nghé', N'Quận 1', N'TP. Hồ Chí Minh'),
(10, N'456 Lê Lợi', N'Phường Bến Thành', N'Quận 1', N'TP. Hồ Chí Minh'),
(11, N'789 Trần Hưng Đạo', N'Phường Cầu Ông Lãnh', N'Quận 1', N'TP. Hồ Chí Minh'),
(12, N'321 Võ Văn Tần', N'Phường 6', N'Quận 3', N'TP. Hồ Chí Minh'),
(13, N'123 Lê Lợi', N'Q1', N'TP.HCM', N'TP. Hồ Chí Minh'), 
(14, N'45 Cầu Giấy', N'Dịch Vọng', N'Cầu Giấy', N'Hà Nội'), 
(15, N'12 Nguyễn Văn Linh', N'Hòa Thuận', N'Hải Châu', N'Đà Nẵng'), 
(16, N'Khu phố 3', N'Long Bình', N'Biên Hòa', N'Đồng Nai'), 
(17, N'Số 5 Hùng Vương', N'Ninh Kiều', N'Ninh Kiều', N'Cần Thơ'); 

-- Dữ liệu Employee
INSERT INTO Employee (UserID, StartDate, Salary) VALUES
(1, '2020-01-15', 30000000.00),  
(2, '2021-03-20', 20000000.00), 
(3, '2020-01-01', 30000000),     
(4, '2021-03-15', 28000000),     
(5, '2022-06-01', 12000000),     
(6, '2023-01-01', 11000000),    
(7, '2022-05-10', 12000000.00),  
(8, '2022-08-15', 12000000.00);  

-- Dữ liệu Guest
INSERT INTO Guest (IP, SearchHistory, LastVisitTime, ViewedProduct) VALUES
('192.168.1.100', N'áo khoác, quần jean', '2025-11-20 10:30:00', '1001,1002'),
('192.168.1.101', N'váy nữ, giày', '2025-11-21 14:15:00', '1003,1004'),
('192.168.1.102', N'áo thun nam', '2025-11-22 09:45:00', '1005'),
('192.168.1.103', N'phụ kiện thời trang', '2025-11-22 16:20:00', '1006,1007'),
('192.168.1.104', N'quần short, áo polo', '2025-11-23 11:00:00', '1008,P009,P010');
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

-- Dữ liệu AuditLog 
INSERT INTO AuditLog (ActionType, TargetEntity, TargetID, Details, UserID, [Timestamp]) VALUES
('INSERT', 'Account', '9', N'Tạo tài khoản khách hàng mới', NULL, '2025-11-01 08:00:00'),
('LOGIN', 'Account', '9', N'Đăng nhập thành công', 9, '2025-11-20 10:30:00'),
('INSERT', 'Customer', '9', N'Thêm thông tin khách hàng', 9, '2025-11-20 10:32:00'),
('INSERT', 'Employee', '1', N'Thêm nhân viên mới', 1, '2025-11-01 09:00:00'),
('UPDATE', 'Employee', '7', N'Cập nhật lương nhân viên', 1, '2025-11-15 14:20:00'),
('LOGIN', 'Account', '10', N'Đăng nhập thành công', 10, '2025-11-21 14:15:00'),
('ORDER_PLACED', '[Order]', '5001', N'Đặt hàng thành công', 9, '2025-11-20 11:00:00'), 
('DELETE', 'TempCartItem', '1-2', N'Xóa sản phẩm khỏi giỏ hàng tạm', NULL, '2025-11-20 10:42:00'),
('UPDATE', 'Account', '11', N'Đổi mật khẩu', 11, '2025-11-22 15:30:00'),
('LOGOUT', 'Account', '9', N'Đăng xuất', 9, '2025-11-20 12:00:00');

-- =====================================================
-- 2. NHÓM SẢN PHẨM VÀ DANH MỤC
-- =====================================================

-- 2.1 Category 
SET IDENTITY_INSERT Category ON;
INSERT INTO Category(CategoryID, CategoryName, ParentCategoryID, EmployeeID) VALUES
(1, N'Nam', NULL, 3),
(2, N'Nữ', NULL, 4),
(3, N'Trẻ em', NULL, 4),
(4, N'Áo', 1, 3),
(5, N'Quần', 1, 3),
(6, N'Áo khoác', 1, 4),
(7, N'Áo Len/Áo Nỉ', 1, 3),
(8, N'Áo', 2, 4),
(9, N'Quần/Chân Váy', 2, 4),
(10, N'Đầm/Váy Liền', 2, 3),
(11, N'Phụ kiện', NULL, 4),
(12, N'Đồ lót/Đồ mặc trong', NULL, 3),
(13, N'Áo Giữ Nhiệt', 4, 3), 
(14, N'Chống Nắng', 6, 4); 
SET IDENTITY_INSERT Category OFF;

-- 2.2 Product 
SET IDENTITY_INSERT [Product] ON;
INSERT INTO [Product](ProductID, ProductName, Description, EmployeeID) VALUES
(1000, N'Áo Thun Cổ Tròn U (Cotton)', N'Áo thun cơ bản, 100% cotton', 3), 
(1001, N'Áo Khoác Parka Chống Nắng UV', N'Áo khoác nhẹ, chống tia UV', 4), 
(1002, N'Quần Jeans Nữ Ultra Stretch', N'Quần jeans co giãn tuyệt đối', 4), 
(1003, N'Áo Sơ Mi Nam Flannel Caro', N'Sơ mi giữ ấm, chất Flannel', 3), 
(1004, N'Đầm Rayon Họa Tiết Hoa Dài', N'Đầm maxi nữ, họa tiết hoa nhí', 3), 
(1005, N'Áo Polo Dry-EX Thoáng Khí', N'Áo polo thể thao, khô nhanh', 3), 
(1006, N'Váy Chân Váy Xếp Ly Chiffon', N'Váy nữ xếp ly, chất chiffon nhẹ', 4),
(1007, N'Áo Giữ Nhiệt HEATTECH Cổ Tròn', N'Áo giữ nhiệt cơ bản', 3),
(1008, N'Quần Kaki Ống Đứng Nam', N'Quần kaki dáng đứng, lịch sự', 4),
(1009, N'Áo Len Lông Cừu Cao Cấp', N'Áo len cashmere 100%', 3),
(1010, N'Túi Đeo Vai Mini Da Pu', N'Túi đeo vai nhỏ gọn, thời trang', 4),
(1011, N'Vớ Thể Thao Dry-Ex', N'Vớ/Tất thể thao, thấm hút tốt', 3),
(1012, N'Áo Bra Top Cotton', N'Áo lót có đệm ngực liền', 4),
(1013, N'Áo Khoác Puffer Siêu Nhẹ', N'Áo khoác phao giữ nhiệt, có túi đựng', 3),
(1014, N'Quần Short Nữ Vải Lanh', N'Quần short thoáng mát cho mùa hè', 4);
SET IDENTITY_INSERT [Product] OFF;

-- 2.3 ProductVariant 
INSERT INTO ProductVariant (ProductID, VariantID, Color, Size, Price) VALUES
-- 1000: Áo Thun U (3 variants)
(1000, 1, N'White', N'S', 299000.00), (1000, 2, N'White', N'M', 299000.00), (1000, 3, N'Black', N'M', 299000.00), 
-- 1001: Áo Khoác UV (3 variants)
(1001, 1, N'Navy', N'M', 799000.00), (1001, 2, N'Grey', N'L', 799000.00), (1001, 3, N'Pink', N'S', 799000.00),
-- 1002: Quần Jeans Nữ (2 variants)
(1002, 1, N'Blue', N'30', 999000.00), (1002, 2, N'Black', N'32', 999000.00),
-- 1003: Áo Sơ Mi Flannel (2 variants)
(1003, 1, N'Red Check', N'M', 499000.00), (1003, 2, N'Green Check', N'L', 499000.00),
-- 1004: Đầm Rayon (2 variants)
(1004, 1, N'Floral', N'S', 999000.00), (1004, 2, N'Floral', N'M', 999000.00),
-- 1005: Áo Polo Dry-EX (2 variants)
(1005, 1, N'White', N'L', 399000.00), (1005, 2, N'Navy', N'XL', 399000.00),
-- 1006: Váy Chân Váy (1 variant)
(1006, 1, N'Black', N'F', 799000.00),
-- 1007: HEATTECH (3 variants)
(1007, 1, N'Black', N'S', 249000.00), (1007, 2, N'Black', N'M', 249000.00), (1007, 3, N'White', N'M', 249000.00),
-- 1008: Quần Kaki (2 variants)
(1008, 1, N'Beige', N'32', 799000.00), (1008, 2, N'Black', N'34', 799000.00),
-- 1009: Áo Len (2 variants)
(1009, 1, N'Beige', N'L', 1999000.00), (1009, 2, N'Navy', N'XL', 1999000.00),
-- 1010: Túi (1 variant)
(1010, 1, N'Black', N'F', 499000.00),
-- 1011: Vớ (1 variant)
(1011, 1, N'Grey', N'F', 99000.00),
-- 1012: Áo Bra Top (1 variant)
(1012, 1, N'White', N'S', 399000.00),
-- 1013: Áo Khoác Puffer (2 variants)
(1013, 1, N'Red', N'M', 1499000.00), (1013, 2, N'Black', N'L', 1499000.00),
-- 1014: Quần Short Nữ (1 variant)
(1014, 1, N'Navy Stripe', N'M', 499000.00);

-- 2.4 ProductVariant_ImageURL 
INSERT INTO ProductVariant_ImageURL (ProductID, VariantID, ImageURL) VALUES
-- 1000: Áo Thun U (3 variants, 4 URLs)
(1000, 1, 'https://salt.tikicdn.com/ts/product/78/e1/af/03ad7e01c09124d42e8dfc1ee3778277.png'), 
(1000, 2, 'https://salt.tikicdn.com/ts/product/78/e1/af/03ad7e01c09124d42e8dfc1ee3778277.png'), 
(1000, 3, 'https://cavathanquoc.com/wp-content/uploads/2024/06/Ao-thun-tron-cotton-mau-den.jpg'), 
-- 1001: Áo Khoác UV (3 variants, 4 URLs)
(1001, 1, 'https://cdn.hstatic.net/products/200000867385/20250405_pzlsyvkyxr_9d77a2feb7974be9b4debf85cec1b67a.jpeg'), 
(1001, 2, 'https://product.hstatic.net/200000867385/product/20250405_liyf5hns7h_d7eada3f0f5140f69052898fb900d9ff.jpeg'),
(1001, 3, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJ5DPWz223DdLapbAIfHo3Wo-f6FTrjIFApw&s'),
-- 1002: Quần Jeans Nữ (2 variants, 3 URLs)
(1002, 1, 'https://product.hstatic.net/200000642007/product/50ins_3fdpr0134_2_668949aed8e8438baa16247c35c4ad63_5fb573f006d8426ea083ab7ac52c2d39_master.jpg'), 
(1002, 2, 'https://product.hstatic.net/200000471735/product/wqj002k5-2-g02__2__0f64f8d2a6eb4e298e748a45639f3b93.jpg'), 
-- 1003: Áo Sơ Mi Flannel (2 variants, 2 URLs)
(1003, 1, 'https://pos.nvncdn.com/492284-9176/ps/20221117_zM139PWUVZ47FPKctXTC2pNn.jpg?v=1673503235'),
(1003, 2, 'https://product.hstatic.net/1000321125/product/cd_0401-07258_copy_bdc400385857430eb6eddba9f7c8ef3a_master.jpg'), 
-- 1004: Đầm Rayon (2 variants, 2 URLs)
(1004, 1, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStDlPGESzom8v7Gdx3_FQ2HppTYaW3qWdLmg&s'),
(1004, 2, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStDlPGESzom8v7Gdx3_FQ2HppTYaW3qWdLmg&s'), 
-- 1005: Áo Polo Dry-EX (2 variants, 2 URLs)
(1005, 1, 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/472668/item/goods_01_472668_3x4.jpg?width=494'),
(1005, 2, 'https://product.hstatic.net/200000018520/product/600bb3f8d96842da9a005ab735086fed_7cc6f1c0de644ce8bc7f88239f5927b5_grande.jpg'), 
-- 1006: Váy Chân Váy (1 variant, 1 URL)
(1006, 1, 'https://cdn.kkfashion.vn/17104-large_default/chan-vay-xep-ly-dang-dai-mau-den-cv04-22.jpg'),
-- 1007: HEATTECH (3 variants, 3 URLs)
(1007, 1, 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/460407/item/goods_09_460407_3x4.jpg?width=494'),
(1007, 2, 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/460407/item/goods_09_460407_3x4.jpg?width=494'), 
(1007, 3, 'https://shopmebi.com/wp-content/uploads/2020/11/ao-giu-nhiet-nam-co-lo-ultra-warm-mau-trang_00_420942.jpg'), 
-- 1008: Quần Kaki (2 variants, 2 URLs)
(1008, 1, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQstLhXCahKnf-JUk_QjIUCDTRNH4e_NVD_QQ&s'),
(1008, 2, 'https://pos.nvncdn.com/492284-9176/ps/20210205_JEYzfC7HcmW1e2W8SDH1OqOV.png?v=1674788167'),
-- 1009: Áo Len (2 variants, 2 URLs)
(1009, 1, 'https://4menshop.com/images/thumbs/2024/10/ao-len-tay-dai-co-v-soc-det-van-thung-form-regular-al013-mau-trang-kem-18731.jpg'),
(1009, 2, 'https://linhvnxk.com/wp-content/uploads/2018/10/ao-len-nam-co-tim-uniqlo-navy.jpg'),
-- 1010: Túi (1 variant, 1 URL)
(1010, 1, 'https://www.vascara.com/uploads/cms_productmedia/2023/August/31/tui-tote-over-size-gap-nep---tot-0131---mau-den__71575__1693430025-medium@2x.jpg'), 
-- 1011: Vớ (1 variant, 1 URL)
(1011, 1, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTG-fv1FTcu85ZAhdSgEj5ijbaO06J4OEb-Ow&s'), 
-- 1012: Áo Bra Top (1 variant, 1 URL)
(1012, 1, 'https://dolotkhonggong.vn/images/products/5-1744104619-1744141772.png'), 
-- 1013: Áo Khoác Puffer (2 variants, 2 URLs)
(1013, 1, 'https://pos.nvncdn.com/3d26e0-79464/ps/Ao-Jacket-nu-3L-dang-ngan-251JWS3012-FY2502-4.jpg?v=1763516863'),
(1013, 2, 'https://product.hstatic.net/200000690725/product/54181158158_3ac5a402de_c_32ee0fdcc08e41c5bd9bb338d437d792_master.jpg'),
-- 1014: Quần Short Nữ (1 variant, 1 URL)
(1014, 1, 'https://product.hstatic.net/200000805635/product/dscf0617_9e6911d153324385b4cdf7cfb7957ab2.jpg');

-- 2.5 Belongs_To 
INSERT INTO Belongs_To(ProductID, CategoryID) VALUES
(1000, 4), (1000, 1), (1005, 4), (1005, 1), (1007, 13), (1007, 4), (1007, 1), (1003, 4), (1003, 1), 
(1009, 7), (1009, 1), (1001, 14), (1001, 6), (1001, 1), (1013, 6), (1013, 1), (1008, 5), (1008, 1),
(1002, 9), (1002, 2), (1004, 10), (1004, 2), (1006, 9), (1006, 2), (1014, 9), (1014, 2), 
(1010, 11), (1011, 11), (1012, 12), (1012, 2); 

-- 2.6 TempCartItem 
INSERT INTO TempCartItem (TempCartID, Quantity, ProductID, VariantID, AddedAt) VALUES
(1, 2, 1000, 1, '2025-11-20 10:35:00'), 
(1, 1, 1002, 1, '2025-11-20 10:40:00'),
(2, 3, 1004, 2, '2025-11-21 14:20:00'),
(3, 1, 1005, 1, '2025-11-22 09:50:00'),
(4, 2, 1001, 3, '2025-11-22 16:25:00'),
(5, 1, 1000, 3, '2025-11-23 11:05:00'),
(5, 2, 1003, 2, '2025-11-23 11:10:00');
GO

-- =====================================================
-- 3. NHÓM CỬA HÀNG, KHO VÀ VẬN CHUYỂN
-- =====================================================

-- Dữ liệu Store
INSERT INTO Store (StoreID, StoreName, Address, EmployeeID) VALUES
(10, N'UNIQLO Đồng Khởi', N'35 Lê Thánh Tôn, Q1, TP.HCM', 3),
(13, N'UNIQLO Vincom Bà Triệu', N'191 Bà Triệu, Hà Nội', 4),
(15, N'Kho Tổng Miền Nam', N'KCN Sóng Thần, Bình Dương', 5),
(16, N'Kho Tổng Miền Bắc', N'KCN Thăng Long, Hà Nội', 5);

-- Dữ liệu ShippingUni
INSERT INTO ShippingUnit (UnitID, UnitName, EmployeeID) VALUES
(1, N'Giao Hàng Tiết Kiệm', 6),
(2, N'Viettel Post', 6),
(3, N'GrabExpress', 6),
(4, N'Ahamove', 6);

-- Dữ liệu Has_Stock
INSERT INTO Has_Stock (StoreID, ProductID, VariantID, Quantity) VALUES
-- 1000: Áo Thun U (Variant 1, 2, 3)
(15, 1000, 1, 498),  
(15, 1000, 2, 500),  
(10, 1000, 3, 50),   
-- 1001: Áo Khoác UV (Variant 1, 2, 3)
(15, 1001, 1, 199),  
(16, 1001, 2, 10),   
(13, 1001, 3, 3),   
-- 1002: Quần Jeans Nữ (Variant 1, 2)
(15, 1002, 1, 298),  
(10, 1002, 2, 10),   
-- 1003: Áo Sơ Mi Flannel (Variant 1, 2)
(16, 1003, 1, 150),  
(16, 1003, 2, 50),   
-- 1004: Đầm Rayon (Variant 1, 2)
(10, 1004, 1, 15),   
(15, 1004, 2, 100),  
-- 1005: Áo Polo Dry-EX (Variant 1, 2)
(13, 1005, 1, 2),    
(15, 1005, 2, 50),   
-- 1006: Váy Chân Váy (Variant 1)
(10, 1006, 1, 25),   
-- 1007: HEATTECH (Variant 1, 3)
(16, 1007, 1, 998),  
(16, 1007, 3, 500),  
-- 1008: Quần Kaki (Variant 1)
(15, 1008, 1, 150),  
-- 1009: Áo Len (Variant 1)
(16, 1009, 1, 50),   
-- 1010: Túi Đeo Vai (Variant 1)
(10, 1010, 1, 5),    
-- 1011: Vớ (Variant 1)
(16, 1011, 1, 200),  
-- 1012: Áo Bra Top (Variant 1)
(15, 1012, 1, 50),   
-- 1013: Áo Khoác Puffer (Variant 1, 2)
(15, 1013, 1, 80),   
(16, 1013, 2, 50),   
-- 1014: Quần Short Nữ (Variant 1)
(15, 1014, 1, 100);  
GO

-- =====================================================
-- 4. NHÓM KHUYẾN MÃI
-- =====================================================

-- Dữ liệu Promotion 
INSERT INTO Promotion (PromoID, PromoName, StartDate, EndDate, EmployeeID) VALUES
(1, N'Khai Trương Cửa Hàng Mới', '2024-01-01', '2024-01-07', 3),
(2, N'Chào Hè Sôi Động 2025', '2025-06-01', '2025-06-30', 3),
(3, N'Back To School - Tựu Trường', '2025-08-15', '2025-09-05', 3),
(4, N'Black Friday Siêu Sale', '2025-11-25', '2025-11-30', 4),
(5, N'Cyber Monday Online', '2025-12-02', '2025-12-02', 4);

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
(2, 1, 1000, 1), (2, 1, 1000, 2), 
(3, 1, 1005, 1), 
(4, 1, 1001, 1), (4, 1, 1001, 2), 
(4, 1, 1002, 1);
GO

-- =====================================================
-- 5. NHÓM GIỎ HÀNG, ĐƠN HÀNG VÀ VẬN CHUYỂN
-- =====================================================

-- Dữ liệu Cart 
INSERT INTO Cart (CustomerID, LastUpdated) VALUES
(9, GETDATE()), 
(10, GETDATE()), 
(11, GETDATE()), 
(12, GETDATE()), 
(13, GETDATE()); 

-- Dữ liệu CartItem 
INSERT INTO CartItem (CartID, Quantity, ProductID, VariantID) VALUES
(1, 1, 1000, 1), 
(1, 2, 1007, 1), 
(2, 1, 1002, 1), 
(3, 3, 1004, 1),
(4, 1, 1003, 1); 

-- Dữ liệu Order 
INSERT INTO [Order] (OrderID, OrderDate, CustomerID, Address, EmployeeID, Status) VALUES
(5001, '2025-10-01', 9, N'123 Lê Lợi, Q1, TP.HCM', 7, N'Delivered'),
(5002, '2025-10-02', 14, N'45 Cầu Giấy, Hà Nội', 7, N'Delivered'),
(5003, '2025-11-10', 10, N'456 Lê Lợi, Q1, TP. Hồ Chí Minh', 8, N'Shipping'),
(5004, '2025-11-25', 9, N'123 Nguyễn Huệ, Q1, TP. Hồ Chí Minh', 8, N'Pending');

-- Dữ liệu Shipment 
INSERT INTO Shipment (ShipmentID, TrackingCode, Status, DeliveryDate, OrderID, UnitID) VALUES
(1, 'VN00000001', N'Delivered', '2025-10-03', 5001, 3), 
(2, 'VN00000002', N'Delivered', '2025-10-05', 5002, 1), 
(3, 'VN00000003', N'Shipping', NULL, 5003, 2), 
(4, 'VN00000004', N'Pending', NULL, 5004, 4); 

-- Dữ liệu OrderItem 
INSERT INTO OrderItem (OrderID, Quantity, PriceAtPurchase, ProductID, VariantID, StoreID, ShipmentID, PromoID, RuleID) VALUES
(5001, 1, 299000.00, 1000, 1, 10, 1, 2, 1), 
(5001, 1, 799000.00, 1001, 1, 15, 1, NULL, NULL),
(5002, 2, 249000.00, 1007, 1, 16, 2, NULL, NULL),
(5003, 1, 999000.00, 1002, 1, 15, 3, NULL, NULL),
(5004, 1, 999000.00 * 0.5, 1002, 1, 10, 4, 4, 1);

-- Dữ liệu Review 
INSERT INTO Review (CustomerID, ProductID, Content, Rating) VALUES
(9, 1000, N'Áo chất lượng tốt, mặc vừa vặn.', 5),
(14, 1007, N'Giữ nhiệt hiệu quả, sẽ mua lại.', 4),
(10, 1004, N'Đầm đẹp, màu sắc như hình.', 5),
(11, 1005, N'Áo polo mặc mát, nhanh khô.', 4),
(13, 1001, N'Áo khoác chống nắng rất tốt.', 5);