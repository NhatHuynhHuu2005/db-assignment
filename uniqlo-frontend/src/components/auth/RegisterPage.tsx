import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/api';
import '../../styles/Components.scss'; // Import style chung
import './LoginPage.scss'; // Tái sử dụng style Glassmorphism của Login

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- VALIDATION THEO SQL CONSTRAINTS ---

    // 1. Password khớp nhau
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    // 2. Độ dài Password (CHK_Account_Password: >= 8)
    if (formData.password.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự.');
        return;
    }

    // 3. Tuổi >= 18 (CHK_Account_Age)
    const birthDate = new Date(formData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age < 18) {
        setError('Xin lỗi, bạn phải đủ 18 tuổi để đăng ký thành viên.');
        return;
    }

    // 4. Số điện thoại (CHK_PhoneNumber: 10-11 số)
    if (!/^[0-9]{10,11}$/.test(formData.phone)) {
        setError('Số điện thoại phải bao gồm 10 hoặc 11 chữ số.');
        return;
    }

    setLoading(true);

    try {
      // Gọi API đăng ký
      await register({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        password: formData.password
      });
      
      alert('Đăng ký thành công! Vui lòng đăng nhập.');

      localStorage.removeItem('token'); 
      localStorage.removeItem('user'); 
      localStorage.removeItem('accessToken');
      
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      // Hiển thị lỗi từ Backend (VD: "Username đã tồn tại")
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: 500 }}>
         {/* Logo Branding */}
         <h1 className="brand-title">UNIQLO MINI</h1>
         <p className="login-subtitle">Đăng ký thành viên mới</p>

         {error && <div className="error-msg">⚠️ {error}</div>}

         <form onSubmit={handleSubmit}>
              {/* Hàng 1: Username & Phone */}
              <div style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Tên đăng nhập</label>
                    <input 
                      name="username"
                      type="text" 
                      className="form-input"
                      placeholder="VD: nguyenvana"
                      required 
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Số điện thoại</label>
                    <input 
                      name="phone"
                      type="tel" 
                      className="form-input"
                      placeholder="09xx..."
                      required 
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
              </div>

              {/* Hàng 2: Email */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  name="email"
                  type="email" 
                  className="form-input"
                  placeholder="email@example.com"
                  required 
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Hàng 3: Ngày sinh */}
              <div className="form-group">
                <label className="form-label">Ngày sinh (Yêu cầu &ge; 18 tuổi)</label>
                <input 
                  name="dob"
                  type="date" 
                  className="form-input"
                  required 
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
              
              {/* Hàng 4: Mật khẩu */}
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div className="password-wrapper">
                  <input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    className="form-input"
                    placeholder="Tối thiểu 8 ký tự..."
                    required 
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button 
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nhập lại mật khẩu</label>
                <input 
                  name="confirmPassword"
                  type="password" 
                  className="form-input"
                  placeholder="Xác nhận mật khẩu"
                  required 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button 
                type="submit" 
                className="btn-login" 
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
              </button>
         </form>

         <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
            Đã có tài khoản? <Link to="/login" style={{ color: '#e00000', fontWeight: 'bold', textDecoration: 'none' }}>Đăng nhập</Link>
         </div>
      </div>
    </div>
  );
};