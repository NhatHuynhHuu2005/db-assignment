import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, NavLink, Route, Routes, Navigate, Link } from 'react-router-dom';
import './styles/main.scss';
import './styles/layout.scss';
import { ProductList } from './components/products/ProductList';
import { CustomerOrdersReport } from './components/reports/CustomerOrdersReport';
import { StoreInventoryReport } from './components/reports/StoreInventoryReport';
import { CartPage } from './components/cart/CartPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { type UserInfo, syncGuestCartToUser, clearGuestCart, CART_EVENT, getGuestCart, fetchCart, fetchUserProfile } from './api/api'; //
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

// --- COMPONENT: MEMBER RANK BADGE (Thanh kinh nghiệm) ---
const MemberRankBadge: React.FC<{ user: UserInfo }> = ({ user }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const [isClosing, setIsClosing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Cấu hình màu sắc (dùng biến CSS variable cho linh hoạt)
  const TIERS = [
  // 1. New Member: Xanh biển tươi (Fresh Blue)
  { name: 'New Member', threshold: 0,        color: '#0984e3', shadow: 'rgba(9, 132, 227, 0.5)' },
  
  // 2. Bronze: Màu Đồng đất nung (Burnt Orange/Bronze) - Nhìn đậm đà
  { name: 'Bronze',     threshold: 2000000,  color: '#d35400', shadow: 'rgba(211, 84, 0, 0.6)' },
  
  // 3. Silver: Màu Bạc ánh kim (Metallic Silver)
  { name: 'Silver',     threshold: 5000000,  color: '#95a5a6', shadow: 'rgba(149, 165, 166, 0.6)' },
  
  // 4. Gold: Màu Vàng Hoàng Kim (Vivid Gold)
  { name: 'Gold',       threshold: 10000000, color: '#f1c40f', shadow: 'rgba(241, 196, 15, 0.6)' },
  
  // 5. Platinum: Màu Bạch kim sáng (Lighter Gray/Platinum)
  { name: 'Platinum',   threshold: 25000000, color: '#dfe6e9', shadow: 'rgba(223, 230, 233, 0.6)' },
  
  // 6. VIP: Màu Đen quyền lực (Luxury Black)
  { name: 'VIP',        threshold: 50000000, color: '#2d3436', shadow: 'rgba(0, 0, 0, 0.8)' }
];

  const currentSpent = user.totalSpent || 0;
  // Tìm hạng hiện tại
  const currentTier = [...TIERS].reverse().find(t => currentSpent >= t.threshold) || TIERS[0];
  const nextTierIndex = TIERS.findIndex(t => t.name === currentTier.name) + 1;
  const nextTier = TIERS[nextTierIndex];

  // Tính %
  let progress = 100;
  if (nextTier) {
    const range = nextTier.threshold - currentTier.threshold;
    const gained = currentSpent - currentTier.threshold;
    progress = Math.min(100, Math.max(0, (gained / range) * 100));
  }

  // Set style động cho biến CSS
  const dynamicStyle = {
    '--rank-color': currentTier.color,
    '--rank-shadow': currentTier.shadow
  } as React.CSSProperties;

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Ngăn sự kiện click nổi bọt
    
    if (showTooltip && !isClosing) {
        setIsClosing(true); // Kích hoạt animation .closing trong SCSS
        
        // Xóa timeout cũ nếu có để tránh lỗi
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Chờ 200ms (bằng thời gian animation popOut) rồi mới ẩn thật
        timeoutRef.current = setTimeout(() => {
            setShowTooltip(false);
            setIsClosing(false); // Reset trạng thái
            timeoutRef.current = null;
        }, 200); 
    }
  };

  // Hàm xử lý Bật/Tắt khi click vào Badge
  const handleToggle = () => {
      if (showTooltip) {
          handleClose();
      } else {
          setShowTooltip(true);
      }
  };

  // Cleanup timeout khi component bị hủy để tránh memory leak
  useEffect(() => {
      return () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
  }, []);

  return (
    <div 
      className="rank-badge-container" 
      style={dynamicStyle}
      onClick={handleToggle}
    >
      {/* 1. COMPACT BADGE (HIỂN THỊ TRÊN NAVBAR) - Đơn giản hóa */}
      <div className="rank-label">
        <div className="icon-box">
          {/* Tự động đổi icon dựa trên level */}
          {currentTier.name === 'VIP' || currentTier.name === 'Platinum' ? '💎' : '👑'}
        </div>
        <div className="info-box">
          <span className="rank-title">Rank</span>
          <span className="rank-name">{currentTier.name}</span>
        </div>
      </div>

      {/* 2. EXP POPOVER (CHI TIẾT) */}
      {(showTooltip || isClosing) && (
        <div className={`rank-popover ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popover-header">
            <div className="tier-icon-large">
              {currentTier.name === 'VIP' || currentTier.name === 'Platinum' ? '💎' : '👑'}
            </div>
            <div className="tier-details">
              <div className="label">Current Rank</div>
              <div className="value" style={{color: currentTier.color}}>{currentTier.name}</div>
            </div>
          </div>
          
          <div className="xp-section">
            <div className="xp-stats">
              <span className="current">{currentSpent.toLocaleString()} đ</span>
              <span>{nextTier ? nextTier.threshold.toLocaleString() : 'MAX'} đ</span>
            </div>
            
            <div className="xp-track">
              {/* Thanh màu gradient tím hồng */}
              <div className="xp-fill" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="xp-next-milestone">
              {nextTier ? (
                <>Mua thêm <strong>{(nextTier.threshold - currentSpent).toLocaleString()} đ</strong> để lên hạng {nextTier.name}</>
              ) : (
                <span style={{color: '#00b894'}}>Bạn đã đạt cấp độ tối thượng!</span>
              )}
            </div>
          </div>

          <div 
            onClick={handleClose}
            style={{
              position: 'absolute', top: 10, right: 10, 
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', zIndex: 10,
              width: 24, height: 24, textAlign:'center', lineHeight:'24px',
              fontSize: '18px', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
           >
            ×
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT NAVBAR (AppShell) ---
// SỬA LỖI 3: Cho phép user là null
const AppShell: React.FC<{ user: UserInfo | null, onLogout: () => void, onRefreshUser: () => void }> = ({ user, onLogout, onRefreshUser }) => {
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

  // Helper xác định quyền
  const isCustomerOrGuest = !user || user.dbRole === 'Customer';
  const isStaffOrAdmin = user && (user.dbRole === 'Employee' || user.dbRole === 'Admin');
  const isAdmin = user && user.dbRole === 'Admin';

  return (
    <div className="app-root">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="app-header__logo">UNIQLO MINI</div>
          <nav className="app-header__nav">
            
            {/* --- NHÓM 1: MENU CHO KHÁCH & CUSTOMER --- */}
            {isCustomerOrGuest && (
              <>
                <NavLink to="/homepage" className={({isActive}) => isActive ? "active" : ""}>Trang chủ</NavLink> 
                <NavLink to="/shop" className={({isActive}) => isActive ? "active" : ""}>Sản phẩm</NavLink>
                
                <NavLink to="/cart" className={({isActive}) => isActive ? "active" : ""} style={{position: 'relative'}}>
                  Giỏ hàng
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </NavLink>

                {/* Chỉ Customer đã đăng nhập mới thấy Đơn hàng */}
                {user && (
                  <NavLink to="/my-orders" className={({isActive}) => isActive ? "active" : ""}>Đơn hàng</NavLink>
                )}
              </>
            )}

            {/* --- NHÓM 2: MENU CHO NHÂN VIÊN & ADMIN --- */}
            {isStaffOrAdmin && (
              <>
                <NavLink to="/products" className={({isActive}) => isActive ? "active" : ""}>QL Sản phẩm</NavLink>
                <NavLink to="/reports/customer-orders" className={({isActive}) => isActive ? "active" : ""}>QL Đơn hàng</NavLink>
                <NavLink to="/reports/store-inventory" className={({isActive}) => isActive ? "active" : ""}>QL Tồn kho</NavLink>
              </>
            )}

            {/* --- NHÓM 3: MENU RIÊNG CHO ADMIN --- */}
            {isAdmin && (
              <NavLink 
                to="/admin/employees" 
                className={({isActive}) => isActive ? "active" : ""}
              >
                ★ Quản lý Nhân Sự
              </NavLink>
            )}

          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {user ? (
            <>
              {user.role === 'buyer' && <MemberRankBadge user={user} />}
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
          <Route path="/cart" element={<CartPage userId={user?.id} onPurchaseSuccess={onRefreshUser} userTier={user?.memberTier} />} />
          
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

    const handleRefreshUser = async () => {
        if (user) {
            try {
                // Gọi API lấy thông tin mới nhất (tiền, rank)
                const updatedUser = await fetchUserProfile(user.id);
                setUser(updatedUser);
                // Cập nhật luôn vào localStorage để F5 không bị mất
                localStorage.setItem('uniqlo_user', JSON.stringify(updatedUser)); 
            } catch (e) {
                console.error("Lỗi cập nhật user:", e);
            }
        }
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={ !user ? <LoginPage onLoginSuccess={handleLogin} /> : <Navigate to="/" /> } />
                <Route path="/register" element={ !user ? <RegisterPage /> : <Navigate to="/" /> } />
                
                {/* Luôn render AppShell để khách cũng thấy Header */}
                <Route path="/*" element={ <AppShell user={user} onLogout={handleLogout} onRefreshUser={handleRefreshUser} /> } />
            </Routes>
        </BrowserRouter>
    );
};

export default App;