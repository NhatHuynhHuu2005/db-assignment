import React, { useEffect, useState } from 'react';
import '../../styles/Components.scss'; //

interface Employee {
    UserID: number;
    UserName: string;
    Email: string;
    Role: string;
    Salary: number;
    StartDate: string;
}

// Giá trị mặc định cho nhân viên mới
const defaultEmptyEmployee: Employee = {
    UserID: 0,
    UserName: '',
    Email: '',
    Role: 'Employee',
    Salary: 0,
    StartDate: new Date().toISOString().split('T')[0] // Ngày hiện tại
};

export const EmployeeManager: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    
    // State quản lý Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD'); // Chế độ Thêm hoặc Sửa
    const [currentEmp, setCurrentEmp] = useState<Employee>(defaultEmptyEmployee);

    // Load dữ liệu giả lập
    useEffect(() => {
        const mockData: Employee[] = [
            { UserID: 1, UserName: 'admin_sys', Email: 'admin@uniqlo.com', Role: 'Admin', Salary: 30000000, StartDate: '2020-01-15' },
            { UserID: 2, UserName: 'manager_tran', Email: 'manager1@mail.com', Role: 'Employee', Salary: 20000000, StartDate: '2021-03-20' },
            { UserID: 5, UserName: 'staff_kho_hcm', Email: 'staff_kho@mail.com', Role: 'Employee', Salary: 12000000, StartDate: '2022-06-01' },
            { UserID: 6, UserName: 'staff_logistics', Email: 'staff_log@mail.com', Role: 'Employee', Salary: 11000000, StartDate: '2023-01-01' },
        ];
        setEmployees(mockData);
    }, []);

    // --- LOGIC 1: Bấm nút THÊM ---
    const handleAddNew = () => {
        setModalMode('ADD');
        setCurrentEmp(defaultEmptyEmployee); // Reset form về rỗng
        setIsModalOpen(true); // Mở modal
    };

    // --- LOGIC 2: Bấm nút SỬA ---
    const handleEditClick = (emp: Employee) => {
        setModalMode('EDIT');
        setCurrentEmp({ ...emp }); // Copy dữ liệu vào form
        setIsModalOpen(true);
    };

    // --- LOGIC 3: Xử lý nhập liệu trong Modal ---
    const handleChange = (field: keyof Employee, value: string | number) => {
        setCurrentEmp(prev => ({ ...prev, [field]: value }));
    };

    // --- LOGIC 4: Bấm LƯU (Xử lý cho cả Thêm & Sửa) ---
    const handleSave = () => {
        // Validate cơ bản
        if (!currentEmp.UserName || !currentEmp.Email) {
            alert("Vui lòng nhập đầy đủ Tên đăng nhập và Email!");
            return;
        }

        if (modalMode === 'ADD') {
            // Logic THÊM MỚI
            const newId = Math.floor(Math.random() * 10000) + 100; // Tạo ID ngẫu nhiên
            const newEmployee = { ...currentEmp, UserID: newId };
            setEmployees([newEmployee, ...employees]); // Thêm vào đầu danh sách
        } else {
            // Logic CẬP NHẬT
            const updatedList = employees.map(e => 
                e.UserID === currentEmp.UserID ? currentEmp : e
            );
            setEmployees(updatedList);
        }

        setIsModalOpen(false); // Đóng modal
    };

    // Hàm xóa
    const handleDelete = (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
            setEmployees(employees.filter(e => e.UserID !== id));
        }
    };

    const getRoleClass = (role: string) => role === 'Admin' ? 'status-badge status-cancelled' : 'status-badge status-processing';

    return (
        <div style={{ padding: '30px' }}>
            {/* Header & Button Thêm */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h1 style={{ color: '#e00000', margin: 0 }}>Quản lý Nhân sự</h1>
                
                {/* Nút Thêm Mới đã gắn hàm handleAddNew */}
                <button className="btn-add-new" onClick={handleAddNew}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Thêm nhân viên
                </button>
            </div>
            
            {/* Bảng dữ liệu */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
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
                                <td><span className={getRoleClass(emp.Role)}>{emp.Role}</span></td>
                                <td style={{ fontWeight: 'bold' }}>{Number(emp.Salary).toLocaleString()} ₫</td>
                                <td>{new Date(emp.StartDate).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    <button className="action-btn edit" onClick={() => handleEditClick(emp)} title="Sửa">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDelete(emp.UserID)} title="Xóa">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL FORM (Dùng chung cho Thêm & Sửa) --- */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{modalMode === 'ADD' ? 'Thêm nhân viên mới' : 'Sửa nhân viên'}</h2>
                        
                        {/* Hàng 1: Tên đăng nhập & Vai trò */}
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Tên đăng nhập <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="text" 
                                    value={currentEmp.UserName}
                                    // Nếu đang Sửa thì không cho đổi tên đăng nhập (thường là quy tắc hệ thống)
                                    disabled={modalMode === 'EDIT'}
                                    onChange={(e) => handleChange('UserName', e.target.value)}
                                    placeholder="Ví dụ: staff_nguyen"
                                />
                            </div>
                            <div className="form-group" style={{ width: '150px' }}>
                                <label>Vai trò</label>
                                <select 
                                    value={currentEmp.Role} 
                                    onChange={(e) => handleChange('Role', e.target.value)}
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        {/* Hàng 2: Email */}
                        <div className="form-group">
                            <label>Email liên hệ <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="email" 
                                value={currentEmp.Email} 
                                onChange={(e) => handleChange('Email', e.target.value)}
                                placeholder="example@uniqlo.com"
                            />
                        </div>

                        {/* Hàng 3: Lương & Ngày vào làm (Bổ sung theo yêu cầu đầy đủ thông tin) */}
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Lương cơ bản (VND)</label>
                                <input 
                                    type="number" 
                                    value={currentEmp.Salary} 
                                    onChange={(e) => handleChange('Salary', Number(e.target.value))}
                                />
                            </div>
                            
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Ngày vào làm</label>
                                <input 
                                    type="date" 
                                    value={currentEmp.StartDate} 
                                    onChange={(e) => handleChange('StartDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Buttons Actions */}
                        <div className="modal-actions">
                            <button className="btn-save" onClick={handleSave}>
                                {modalMode === 'ADD' ? 'Tạo mới' : 'Lưu thay đổi'}
                            </button>
                            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};