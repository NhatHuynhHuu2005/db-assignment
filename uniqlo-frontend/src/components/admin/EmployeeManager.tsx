// FE/src/components/admin/EmployeeManager.tsx
import React, { useEffect, useState } from "react";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
} from "../../api/api";
import { Toast } from "../common/Toast";
import "../../styles/Components.scss";

// Giá trị mặc định
const defaultEmptyEmployee = {
  UserID: 0,
  UserName: "",
  Email: "",
  Role: "Employee",
  Salary: 5000000,
  StartDate: new Date().toISOString().split("T")[0],
  Password: "",
};

export const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [formData, setFormData] = useState(defaultEmptyEmployee);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Load Data từ API
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      const sortedData = data.sort((a: any, b: any) => a.UserID - b.UserID);
      setEmployees(sortedData);
    } catch (err) {
      console.error(err);
      setToast({ msg: "Lỗi tải danh sách nhân viên", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNew = () => {
    setModalMode("ADD");
    setFormData(defaultEmptyEmployee);
    setIsModalOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setModalMode("EDIT");
    const formattedDate = emp.StartDate
      ? new Date(emp.StartDate).toISOString().split("T")[0]
      : "";

    setFormData({
      UserID: emp.UserID,
      UserName: emp.UserName,
      Email: emp.Email,
      Role: emp.Role,
      Salary: emp.Salary,
      StartDate: formattedDate,
      Password: "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.UserName || !formData.Email) {
      setToast({ msg: "Vui lòng nhập Tên đăng nhập và Email!", type: "error" });
      return;
    }

    try {
      if (modalMode === "ADD") {
        await createEmployee({
          username: formData.UserName,
          email: formData.Email,
          password: formData.Password || "123456",
          role: formData.Role,
          salary: formData.Salary,
          startDate: formData.StartDate,
        });
        setToast({ msg: "Thêm nhân viên thành công!", type: "success" });
      } else {
        await updateEmployee(formData.UserID, {
          email: formData.Email,
          role: formData.Role,
          salary: formData.Salary,
        });
        setToast({ msg: "Cập nhật thành công!", type: "success" });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      setToast({ msg: "Lỗi: " + errorMsg, type: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      return;
    }

    try {
      await deleteEmployee(id);
      setToast({ msg: "Đã xóa nhân viên thành công.", type: "success" });
      setEmployees((prev) => prev.filter((e) => e.UserID !== id));
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || "Lỗi không xác định";
      setToast({ msg: `KHÔNG THỂ XÓA: ${msg}`, type: "error" });
    }
  };

  const getRoleClass = (role: string) =>
    role === "Admin"
      ? "status-badge status-cancelled"
      : "status-badge status-processing";

  return (
    <div style={{ padding: "30px" }}>
      {/* --- 3. Hiển thị Toast nếu có --- */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h1 style={{ color: "#e00000", margin: 0 }}>Quản lý Nhân sự</h1>
        <button className="btn-add-new" onClick={handleAddNew}>
          + Thêm nhân viên
        </button>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', color: '#666'}}>Đang tải dữ liệu...</div>
      ) : (
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Lương</th>
                <th>Ngày vào làm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.UserID}>
                  <td>#{emp.UserID}</td>
                  <td style={{ fontWeight: 700 }}>{emp.UserName}</td>
                  <td>{emp.Email}</td>
                  <td>
                    <span className={getRoleClass(emp.Role)}>{emp.Role}</span>
                  </td>
                  <td style={{ fontWeight: "bold" }}>
                    {Number(emp.Salary).toLocaleString()} ₫
                  </td>
                  <td>{new Date(emp.StartDate).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditClick(emp)}
                      title="Sửa"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(emp.UserID)}
                      title="Xóa"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {modalMode === "ADD" ? "Thêm nhân viên mới" : "Sửa nhân viên"}
            </h2>

            <div style={{ display: "flex", gap: "20px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tên đăng nhập *</label>
                <input
                  type="text"
                  value={formData.UserName}
                  disabled={modalMode === "EDIT"} 
                  onChange={(e) =>
                    setFormData({ ...formData, UserName: e.target.value })
                  }
                />
              </div>
              <div className="form-group" style={{ width: "150px" }}>
                <label>Vai trò</label>
                <select
                  value={formData.Role}
                  onChange={(e) =>
                    setFormData({ ...formData, Role: e.target.value })
                  }
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            {modalMode === "ADD" && (
              <div className="form-group">
                <label>Mật khẩu khởi tạo</label>
                <input
                  type="password"
                  value={formData.Password}
                  placeholder="Mặc định: 123456"
                  onChange={(e) =>
                    setFormData({ ...formData, Password: e.target.value })
                  }
                />
              </div>
            )}

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) =>
                  setFormData({ ...formData, Email: e.target.value })
                }
              />
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Lương cơ bản</label>
                <input
                  type="number"
                  value={formData.Salary}
                  onChange={(e) =>
                    setFormData({ ...formData, Salary: Number(e.target.value) })
                  }
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Ngày vào làm</label>
                <input
                  type="date"
                  value={formData.StartDate}
                  onChange={(e) =>
                    setFormData({ ...formData, StartDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={handleSave}>
                Lưu
              </button>
              <button
                className="btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};