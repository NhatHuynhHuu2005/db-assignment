// FE/src/components/auth/LoginPage.tsx
import React, { useState } from 'react';
import { login, type UserInfo } from '../../api/api';
import './LoginPage.scss';

interface LoginPageProps {
  onLoginSuccess: (user: UserInfo) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(username, password);
      // Lưu vào localStorage
      localStorage.setItem('uniqlo_user', JSON.stringify(user));
      
      // Gọi hàm cập nhật state ở App cha
      onLoginSuccess(user);

      // --- LOGIC MỚI: CHUYỂN HƯỚNG THEO ROLE ---
      if (user.role === 'seller') {
        // Nếu là Admin -> Vào trang quản lý sản phẩm
        window.location.href = "/products";
      } else {
        // Nếu là Khách -> Vào trang chủ (homepage)
        window.location.href = "/homepage";
      }

    } catch (err: any) {
      setError(err?.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
         {/* Logo Branding */}
         <h1 className="brand-title">UNIQLO MINI</h1>
         <p className="login-subtitle">Đăng nhập để trải nghiệm mua sắm tối giản</p>

         {/* Error Notification */}
         {error && <div className="error-msg">⚠️ {error}</div>}

         <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tên đăng nhập / Email</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ví dụ: admin_sys"
                  required 
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-input"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    required 
                  />
                  {/* Nút ẩn hiện mật khẩu (SVG Icon) */}
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

              <button 
                type="submit" 
                className="btn-login"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>
         </form>

         <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
            Chưa có tài khoản? <a href="#" style={{ color: '#e00000', fontWeight: 'bold', textDecoration: 'none' }}>Đăng ký ngay</a>
         </div>
      </div>
    </div>
  );
};