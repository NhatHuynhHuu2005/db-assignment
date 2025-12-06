import React, { useState, useEffect } from 'react';
import { BrowserRouter, NavLink, Route, Routes, Navigate, Link } from 'react-router-dom';
import './styles/main.scss';
import './styles/Layout.scss';
import { ProductList } from './components/products/ProductList';
import { CustomerOrdersReport } from './components/reports/CustomerOrdersReport';
import { StoreInventoryReport } from './components/reports/StoreInventoryReport';
import { CartPage } from './components/cart/CartPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { type UserInfo, syncGuestCartToUser, clearGuestCart, CART_EVENT, getGuestCart, fetchCart } from './api/api'; //
import { EmployeeManager } from './components/admin/EmployeeManager';

// --- COMPONENT BUYER HOME ---
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

// --- COMPONENT NAVBAR (AppShell) ---
// SỬA LỖI 3: Cho phép user là null
const AppShell: React.FC<{ user: UserInfo | null, onLogout: () => void }> = ({ user, onLogout }) => {
  // State lưu số lượng
  const [cartCount, setCartCount] = useState(0);

  // Hàm tính toán số lượng (Logic: Cộng dồn Quantity của từng món)
  const updateCount = async () => {
    let count = 0;
    if (user && user.role === 'buyer') {
      try {
        // Nếu là User: Gọi API lấy giỏ hàng về đếm
        const items = await fetchCart(user.id);
        count = items.reduce((sum, item) => sum + item.Quantity, 0);
      } catch (e) { console.error(e); }
    } else {
      // Nếu là Guest: Lấy từ LocalStorage đếm
      const items = getGuestCart();
      count = items.reduce((sum, item) => sum + item.Quantity, 0);
    }
    setCartCount(count);
  };

  // useEffect để lắng nghe sự kiện
  useEffect(() => {
    // 1. Chạy ngay lần đầu vào trang
    updateCount();

    // 2. Lắng nghe sự kiện thay đổi giỏ hàng
    window.addEventListener(CART_EVENT, updateCount);

    // 3. Dọn dẹp khi component bị hủy
    return () => {
      window.removeEventListener(CART_EVENT, updateCount);
    };
  }, [user]); // Chạy lại khi user thay đổi (login/logout)

  return (
    <div className="app-root">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="app-header__logo">UNIQLO MINI</div>
          <nav className="app-header__nav">
            
            {/* Menu chung cho Khách & Buyer */}
            <NavLink to="/homepage" className={({isActive}) => isActive ? "active" : ""}>Trang chủ</NavLink> 
            <NavLink to="/shop" className={({isActive}) => isActive ? "active" : ""}>Sản phẩm</NavLink>
            <NavLink to="/cart" className={({isActive}) => isActive ? "active" : ""} style={{position: 'relative'}}>
              Giỏ hàng
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </NavLink>

            {/* Menu riêng cho User đã đăng nhập */}
            {user && user.role === 'buyer' && (
              <NavLink to="/my-orders" className={({isActive}) => isActive ? "active" : ""}>Đơn hàng</NavLink>
            )}

            {/* Menu cho Admin/Seller */}
            {user && user.role === 'seller' && (
              <>
                <NavLink to="/products" className={({isActive}) => isActive ? "active" : ""}>QL Sản phẩm</NavLink>
                <NavLink to="/reports/customer-orders" className={({isActive}) => isActive ? "active" : ""}>QL Đơn hàng</NavLink>
                <NavLink to="/reports/store-inventory" className={({isActive}) => isActive ? "active" : ""}>QL Tồn kho</NavLink>
              </>
            )}
            {user && user.role === 'seller' && user.dbRole === 'Admin' && (
              <NavLink to="/admin/employees" className={({isActive}) => isActive ? "active" : ""}>
                ★ Quản lý Nhân Sự
              </NavLink>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {user ? (
            <>
              <div className="user-info">
                <div className="name">{user.name}</div>
                <div className="role">{user.dbRole}</div>
              </div>
              <button onClick={onLogout} className="btn-logout">
                Đăng xuất
              </button>
            </>
          ) : (
            // Header cho khách chưa đăng nhập
            <div style={{ display: 'flex', gap: 15 }}>
                <Link to="/login" style={{ textDecoration:'none', fontWeight:'bold', color:'#333' }}>Đăng nhập</Link>
                <Link to="/register" style={{ textDecoration:'none', fontWeight:'bold', color:'#e00000' }}>Đăng ký</Link>
             </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          {/* --- ROUTE CHO KHÁCH & BUYER --- */}
          <Route path="/homepage" element={<BuyerHome />} />
          <Route path="/shop" element={<ProductList role="buyer" userId={user?.id} />} />
          <Route path="/cart" element={<CartPage userId={user?.id} />} />
          
          {/* Chỉ User mới vào được trang My Orders */}
          {user && user.role === 'buyer' && (
              <Route path="/my-orders" element={<CustomerOrdersReport role="buyer" currentUserId={user.id} />} />
          )}

           {/* --- ROUTE CHO ADMIN --- */}
          {user && user.role === 'seller' && (
            <>
              <Route path="/products" element={<ProductList role="seller" userId={user.id} />} />
              <Route path="/reports/customer-orders" element={<CustomerOrdersReport role="seller" />} />
              <Route path="/reports/store-inventory" element={<StoreInventoryReport />} />
              <Route path="/admin/employees" element={<EmployeeManager />} />
              <Route path="/" element={<Navigate to="/products" />} />
            </>
          )}
          
          <Route path="*" element={<Navigate to="/homepage" />} />
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

    // SỬA LỖI 2: Thêm 'async'
    const handleLogin = async (userInfo: UserInfo) => {
        setUser(userInfo);
        localStorage.setItem('uniqlo_user', JSON.stringify(userInfo));

        // Đồng bộ giỏ hàng khi login
        if (userInfo.role === 'buyer') {
            await syncGuestCartToUser(userInfo.id);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('uniqlo_user');
        setUser(null);
        clearGuestCart();
        window.location.href = "/homepage"; 
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={ !user ? <LoginPage onLoginSuccess={handleLogin} /> : <Navigate to="/" /> } />
                <Route path="/register" element={ !user ? <RegisterPage /> : <Navigate to="/" /> } />
                
                {/* Luôn render AppShell để khách cũng thấy Header */}
                <Route path="/*" element={ <AppShell user={user} onLogout={handleLogout} /> } />
            </Routes>
        </BrowserRouter>
    );
};

export default App;