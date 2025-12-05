import React, { useState, useEffect } from 'react';
import { BrowserRouter, NavLink, Route, Routes, Navigate, Link } from 'react-router-dom';
import './styles/main.scss';
import { ProductList } from './components/products/ProductList';
import { CustomerOrdersReport } from './components/reports/CustomerOrdersReport';
import { StoreInventoryReport } from './components/reports/StoreInventoryReport';
import { CartPage } from './components/cart/CartPage';
import { LoginPage } from './components/auth/LoginPage'; 
import { type UserInfo } from './api/api';

// --- COMPONENT MỚI: TRANG CHỦ KHÁCH HÀNG (Welcome Page) ---
const BuyerHome: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#e00000', marginBottom: '20px' }}>
          Welcome to UNIQLO MINI
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '30px' }}>
          Trải nghiệm phong cách tối giản, tinh tế và tiện dụng.
          <br />
          Hệ thống mua sắm trực tuyến dành riêng cho bạn.
        </p>
        
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800" 
          alt="Uniqlo Banner" 
          style={{ width: '100%', borderRadius: '8px', marginBottom: '30px', objectFit: 'cover', height: '300px' }}
        />

        <div>
          <Link 
            to="/shop" 
            className="btn btn--primary" 
            style={{ padding: '15px 30px', fontSize: '1.1rem', textDecoration: 'none' }}
          >
            Khám phá Sản phẩm ngay ➔
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT NAVBAR ---
const AppShell: React.FC<{ user: UserInfo, onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <div className="app-root">
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="app-header__logo">UNIQLO MINI</div>
          <nav className="app-header__nav">
            
            {/* 1. Menu cho Khách Hàng */}
            {user.role === 'buyer' && (
              <>
                {/* Trang chủ: Dẫn đến /homepage (Trang Welcome) */}
                <NavLink to="/homepage">Trang chủ</NavLink> 
                
                {/* Sản phẩm: Dẫn đến /shop (Danh sách sản phẩm) */}
                <NavLink to="/shop">Sản phẩm</NavLink>

                <NavLink to="/my-orders">Đơn hàng của tôi</NavLink>
                <NavLink to="/cart">Giỏ hàng</NavLink>
              </>
            )}

            {/* 2. Menu cho Admin */}
            {user.role === 'seller' && (
              <>
                <NavLink to="/products">QL Sản phẩm</NavLink>
                <NavLink to="/reports/customer-orders">QL Đơn hàng</NavLink>
                <NavLink to="/reports/store-inventory">QL Tồn kho</NavLink>
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold' }}>{user.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#f0f0f0' }}>{user.dbRole}</div>
          </div>
          
          <button 
            onClick={onLogout} 
            className="btn" 
            style={{ 
                backgroundColor: 'white', 
                color: '#e00000', 
                border: 'none', 
                fontWeight: 'bold',
                cursor: 'pointer'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="app-main">
        <Routes>
           {/* --- ROUTE CHO KHÁCH HÀNG --- */}
           {user.role === 'buyer' && (
             <>
               {/* 1. Route Trang Chủ (Welcome) */}
               <Route path="/homepage" element={<BuyerHome />} />

               {/* 2. Route Sản Phẩm (ProductList) */}
               <Route path="/shop" element={<ProductList role="buyer" userId={user.id} />} />
               
               <Route path="/cart" element={<CartPage userId={user.id} />} />
               <Route path="/my-orders" element={<CustomerOrdersReport role="buyer" currentUserId={user.id} />} />
               
               {/* Mặc định vào Homepage */}
               <Route path="/" element={<Navigate to="/homepage" />} />
             </>
           )}

           {/* --- ROUTE CHO ADMIN --- */}
           {user.role === 'seller' && (
             <>
               <Route path="/products" element={<ProductList role="seller" userId={user.id} />} />
               <Route path="/reports/customer-orders" element={<CustomerOrdersReport role="seller" />} />
               <Route path="/reports/store-inventory" element={<StoreInventoryReport />} />

               {/* Admin mặc định vào trang quản lý sản phẩm */}
               <Route path="/" element={<Navigate to="/products" />} />
             </>
           )}
           
           <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('uniqlo_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userInfo: UserInfo) => {
    setUser(userInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem('uniqlo_user');
    setUser(null);
    window.location.href = "/";
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <AppShell user={user} onLogout={handleLogout} />
    </BrowserRouter>
  );
};

export default App;