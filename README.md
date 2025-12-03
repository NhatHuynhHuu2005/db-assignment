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
3. Mở file script tạo bảng tại: `uniqlo-backend/database/create.sql`.
4. Bấm **Execute (F5)** để tạo các bảng.
5. Mở file script tạo trigger tại: `uniqlo-backend/database/trigger.sql` và chạy.
6. Mở file `uniqlo-backend/database/sample_data.sql` và chạy để thêm dữ liệu mẫu.
7. (Tùy chọn) Mở file `uniqlo-backend/database/procedure.sql` để thêm các thủ tục.

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

2. Cài đặt các thư viện:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường:
> - Copy file `.env.example` thành file `.env`
> - Mở file `.env` và điền mật khẩu SQL Server của bạn vào:
   ```bash
   PORT=5000
   DB_SERVER=127.0.0.1
   DB_USER=sa
   DB_PASSWORD=DIEN_MAT_KHAU_CUA_BAN_VAO_DAY
   DB_NAME=UNIQLO_DB
   ```

4. Khởi động server:
   ```bash
   npm run dev
   ```
   *Nếu thấy thông báo `✅ Connected to SQL Server successfully!` là thành công.*

### Bước 3: Cài đặt và Chạy Frontend
Frontend sẽ chạy tại cổng `5173`.

1. Mở một terminal MỚI (giữ nguyên terminal backend), di chuyển vào thư mục frontend:
   ```bash
   cd uniqlo-frontend
   ```

2. Cài đặt thư viện:
   ```bash
   npm install
   ```

3. Khởi động giao diện:
   ```bash
   npm run dev
   ```

4. Truy cập trình duyệt tại địa chỉ hiển thị