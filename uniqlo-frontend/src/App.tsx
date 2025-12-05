import React, { useState, useEffect } from 'react';
import { BrowserRouter, NavLink, Route, Routes, Navigate, Link } from 'react-router-dom';
import './styles/main.scss';
import './styles/Layout.scss'; // Import file SCSS mới
import { ProductList } from './components/products/ProductList';
import { CustomerOrdersReport } from './components/reports/CustomerOrdersReport';
import { StoreInventoryReport } from './components/reports/StoreInventoryReport';
import { CartPage } from './components/cart/CartPage';
import { LoginPage } from './components/auth/LoginPage'; 
import { type UserInfo } from './api/api';

// --- COMPONENT MỚI: TRANG CHỦ KHÁCH HÀNG (Đã tút lại) ---
const BuyerHome: React.FC = () => {
  return (
    <div className="home-container">
      <div className="welcome-card">
        <h1>Welcome to UNIQLO MINI</h1>
        <p>
          Trải nghiệm phong cách tối giản, tinh tế và tiện dụng.<br />
          Hệ thống mua sắm trực tuyến dành riêng cho bạn.
        </p>
        
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800" 
          alt="Uniqlo Banner" 
          className="banner-img"
        />

        <div>
          <Link to="/shop" className="btn-explore">
            Khám phá Sản phẩm ngay ➔
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT NAVBAR (Đã tút lại) ---
const AppShell: React.FC<{ user: UserInfo, onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <div className="app-root">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="app-header__logo">UNIQLO MINI</div>
          <nav className="app-header__nav">
            
            {/* Menu cho Khách Hàng */}
            {user.role === 'buyer' && (
              <>
                <NavLink to="/homepage" className={({isActive}) => isActive ? "active" : ""}>Trang chủ</NavLink> 
                <NavLink to="/shop" className={({isActive}) => isActive ? "active" : ""}>Sản phẩm</NavLink>
                <NavLink to="/my-orders" className={({isActive}) => isActive ? "active" : ""}>Đơn hàng</NavLink>
                <NavLink to="/cart" className={({isActive}) => isActive ? "active" : ""}>Giỏ hàng</NavLink>
              </>
            )}

            {/* Menu cho Admin */}
            {user.role === 'seller' && (
              <>
                <NavLink to="/products" className={({isActive}) => isActive ? "active" : ""}>QL Sản phẩm</NavLink>
                <NavLink to="/reports/customer-orders" className={({isActive}) => isActive ? "active" : ""}>QL Đơn hàng</NavLink>
                <NavLink to="/reports/store-inventory" className={({isActive}) => isActive ? "active" : ""}>QL Tồn kho</NavLink>
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="user-info">
            <div className="name">{user.name}</div>
            <div className="role">{user.dbRole}</div>
          </div>
          
          <button onClick={onLogout} className="btn-logout">
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="app-main">
        <Routes>
           {/* ... Giữ nguyên phần Routes như cũ ... */}
           {user.role === 'buyer' && (
             <>
               <Route path="/homepage" element={<BuyerHome />} />
               <Route path="/shop" element={<ProductList role="buyer" userId={user.id} />} />
               <Route path="/cart" element={<CartPage userId={user.id} />} />
               <Route path="/my-orders" element={<CustomerOrdersReport role="buyer" currentUserId={user.id} />} />
               <Route path="/" element={<Navigate to="/homepage" />} />
             </>
           )}

           {user.role === 'seller' && (
             <>
               <Route path="/products" element={<ProductList role="seller" userId={user.id} />} />
               <Route path="/reports/customer-orders" element={<CustomerOrdersReport role="seller" />} />
               <Route path="/reports/store-inventory" element={<StoreInventoryReport />} />
               <Route path="/" element={<Navigate to="/products" />} />
             </>
           )}
           
           <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

// ... Phần Main App giữ nguyên ...
const App: React.FC = () => {
    // ... (Code cũ giữ nguyên) ...
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