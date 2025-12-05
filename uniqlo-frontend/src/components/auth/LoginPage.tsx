// FE/src/components/auth/LoginPage.tsx
import React, { useState } from 'react';
import { login, type UserInfo } from '../../api/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserInfo) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    // ... (Giữ nguyên phần giao diện HTML/JSX bên dưới) ...
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', backgroundColor: '#f5f5f5'
    }}>
      <div className="card" style={{ width: '400px', padding: '2rem' }}>
         {/* ... (Code giao diện cũ giữ nguyên) ... */}
         <h1 style={{ textAlign: 'center', color: '#e00000', marginBottom: '1.5rem' }}>UNIQLO MINI</h1>
         <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>Đăng Nhập Hệ Thống</h3>
         <form onSubmit={handleSubmit}>
            {/* ... giữ nguyên các input ... */}
             <div className="form-row" style={{ flexDirection: 'column', gap: 5 }}>
                <label>Tên đăng nhập hoặc Email</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ví dụ: admin_sys hoặc nguyenvana"
                  required 
                  style={{ padding: '10px', width: '100%' }}
                />
              </div>
              
              <div className="form-row" style={{ flexDirection: 'column', gap: 5, marginTop: 15 }}>
                <label>Mật khẩu</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required 
                  style={{ padding: '10px', width: '100%' }}
                />
              </div>

              {error && <div style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{error}</div>}

              <button 
                type="submit" 
                className="btn btn--primary" 
                style={{ width: '100%', marginTop: '20px', padding: '12px', fontSize: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>
         </form>
         {/* ... */}
      </div>
    </div>
  );
};