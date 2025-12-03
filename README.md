# UNIQLO Mini - Hệ thống Quản lý Bán hàng (Fullstack)

Dự án mô phỏng hệ thống quản lý bán hàng thời trang tối giản, bao gồm Frontend (ReactJS), Backend (Node.js/Express) và Database (SQL Server).

## 🛠 Công nghệ sử dụng
- **Frontend:** React (Vite), TypeScript, CSS/SCSS.
- **Backend:** Node.js, Express.js.
- **Database:** Microsoft SQL Server.
- **Thư viện khác:** Axios, MSSQL (Driver), Dotenv, Nodemon.

---

## ⚙️ Yêu cầu cài đặt (Prerequisites)
Trước khi chạy dự án, máy tính cần cài sẵn:
1. **Node.js** (Phiên bản v18 trở lên).
2. **Microsoft SQL Server** (Bản Express hoặc Developer).
3. **SQL Server Management Studio (SSMS)** để quản lý DB.
4. **Git**.

---

## 🚀 Hướng dẫn cài đặt và chạy (Step-by-Step)

### Bước 1: Cấu hình Database
1. Mở **SSMS** và đăng nhập vào SQL Server.
2. Tạo một Database mới tên là: `UNIQLO_DB`.
3. Mở file script tạo bảng tại: `uniqlo-backend/database/schema.sql`.
4. Bấm **Execute (F5)** để tạo các bảng.
5. (Tùy chọn) Mở file `uniqlo-backend/database/seed.sql` và chạy để thêm dữ liệu mẫu.

> **⚠️ Lưu ý quan trọng về SQL Server:**
> - Hãy đảm bảo **TCP/IP** đã được bật (Enable) trong *SQL Server Configuration Manager*.
> - Cổng mặc định phải là **1433**.
> - Nên bật chế độ đăng nhập *Mixed Mode* (SQL Server and Windows Authentication) và dùng tài khoản `sa`.

---

### Bước 2: Cài đặt và Chạy Backend
Backend sẽ chạy tại cổng `5000`.

1. Mở terminal, di chuyển vào thư mục backend:
   ```bash
   cd uniqlo-backend
   ```
