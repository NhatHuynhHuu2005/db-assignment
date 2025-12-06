import React, { useState } from 'react';

// Giả lập dữ liệu sản phẩm lấy từ DB
const MOCK_PRODUCTS = [
  { id: 1000, name: 'Áo Thun Cổ Tròn Uniqlo U', price: 299000, img: 'https://image.uniqlo.com/UQ/ST3/vn/imagesgoods/455359/item/vngoods_00_455359.jpg?width=320' },
  { id: 1007, name: 'Áo Giữ Nhiệt HEATTECH', price: 249000, img: 'https://image.uniqlo.com/UQ/ST3/vn/imagesgoods/461159/item/vngoods_09_461159.jpg?width=320' },
  { id: 1002, name: 'Quần Jeans Ultra Stretch', price: 999000, img: 'https://image.uniqlo.com/UQ/ST3/vn/imagesgoods/460714/item/vngoods_69_460714.jpg?width=320' },
];

export const GuestHome: React.FC = () => {
  // State giả lập User
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // State giả lập Giỏ hàng (Lưu ở Frontend để test UI, thực tế sẽ lưu vào bảng TemporaryCart qua API)
  const [cartCount, setCartCount] = useState(0);

  // 1. Giả lập hành động: Khách (Guest) thêm vào giỏ
  const handleAddToCart = (productName: string) => {
    // A. Nếu chưa đăng nhập: 
    // -> Gọi API tạo TemporaryCartItem gắn với IP (hoặc GuestID trong localStorage)
    if (!isLoggedIn) {
        console.log(`[GUEST ACTION] IP 192.168.1.xxx đang thêm "${productName}" vào Giỏ Tạm.`);
        alert(`Đã thêm "${productName}" vào giỏ hàng tạm (Chưa đăng nhập)!`);
    } 
    // B. Nếu đã đăng nhập:
    // -> Gọi API tạo CartItem gắn với UserID
    else {
        console.log(`[USER ACTION] User ${currentUser} đang thêm "${productName}" vào Giỏ Thật.`);
        alert(`Đã thêm "${productName}" vào giỏ hàng của ${currentUser}!`);
    }
    setCartCount(prev => prev + 1);
  };

  // 2. Giả lập hành động: Đăng nhập & Merge Cart
  const handleLogin = () => {
    const username = prompt("Nhập tên đăng nhập (ví dụ: nguyenvana):", "nguyenvana");
    if (username) {
        // --- ĐÂY LÀ CHỖ GỌI THỦ TỤC sp_Merge_Guest_Cart_To_User ---
        console.log("--> Đang gọi API Login...");
        console.log(`--> Backend thực thi: EXEC sp_Merge_Guest_Cart_To_User @GuestIP='...', @UserID=...`);
        
        setIsLoggedIn(true);
        setCurrentUser(username);
        alert(`Đăng nhập thành công! Hệ thống đang đồng bộ giỏ hàng tạm của bạn sang tài khoản ${username}...`);
    }
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCartCount(0); // Reset UI demo
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header trạng thái */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            {isLoggedIn ? (
                <span style={{ color: 'green', fontWeight: 'bold' }}>Xin chào, {currentUser} (Thành viên)</span>
            ) : (
                <span style={{ color: '#666' }}>Bạn đang xem với tư cách: <b style={{color:'#e00000'}}>Khách vãng lai (Guest)</b></span>
            )}
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
                🛒 Giỏ hàng
                {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: '#e00000', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>
                        {cartCount}
                    </span>
                )}
            </div>
            {isLoggedIn ? (
                <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Đăng xuất</button>
            ) : (
                <button onClick={handleLogin} style={{ padding: '8px 16px', background: '#e00000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Đăng nhập để đồng bộ giỏ
                </button>
            )}
        </div>
      </div>

      {/* Danh sách sản phẩm demo */}
      <h2 style={{ marginBottom: '20px' }}>Sản phẩm nổi bật</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {MOCK_PRODUCTS.map(p => (
            <div key={p.id} className="card" style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' }}>
                <img src={p.img} alt={p.name} style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1rem', height: '40px', overflow: 'hidden' }}>{p.name}</h3>
                <p style={{ color: '#e00000', fontWeight: 'bold', fontSize: '1.1rem', margin: '10px 0' }}>
                    {p.price.toLocaleString()} ₫
                </p>
                <button 
                    onClick={() => handleAddToCart(p.name)}
                    style={{ width: '100%', padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Thêm vào giỏ
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};