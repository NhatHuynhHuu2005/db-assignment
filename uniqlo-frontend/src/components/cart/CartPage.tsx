import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCart, checkout, getGuestCart, removeFromCart, removeFromGuestCart, type CartItemData } from '../../api/api';
import '../../styles/Components.scss';

// 1. Khai báo Interface nhận userId
interface CartPageProps {
  userId?: number; 
}

// 2. Nhận userId vào props và destructure ra
export const CartPage: React.FC<CartPageProps> = ({ userId }) => {
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadCart = async () => {
    setLoading(true);
    if (userId) {
      // 1. Nếu đã đăng nhập: Gọi API
      try {
        const data = await fetchCart(userId);
        setCartItems(data);
      } catch (err) {
        console.error(err);
      }
    } else {
      // 2. Nếu là Khách: Lấy từ LocalStorage
      const data = getGuestCart();
      setCartItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, [userId]); // Chạy lại khi trạng thái đăng nhập thay đổi

  const handleRemoveItem = async (productId: number, variantId: number, productName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${productName}" khỏi giỏ hàng?`)) return;

    try {
      if (userId) {
        // Nếu là Member: Gọi API xóa DB
        await removeFromCart(userId, productId, variantId);
      } else {
        // Nếu là Guest: Xóa LocalStorage
        removeFromGuestCart(productId, variantId);
      }
      // Tải lại danh sách sau khi xóa
      await loadCart();
    } catch (err: any) {
      alert('Lỗi khi xóa sản phẩm: ' + err.message);
    }
  };

  const handleCheckout = async () => {
    // A. Kiểm tra đăng nhập
    if (!userId) {
      if (window.confirm('Bạn cần Đăng nhập để thanh toán. Đi đến trang đăng nhập ngay?')) {
        navigate('/login');
      }
      return;
    }

    // Logic thanh toán
    if (cartItems.length === 0) return;
    if (!window.confirm('Bạn có chắc chắn muốn đặt hàng?')) return;
    
    try {
      const res = await checkout(userId);
      alert(`Thanh toán thành công! Mã đơn: ${res.orderId}`);
      loadCart();
    } catch (err: any) {
      alert('Lỗi thanh toán: ' + err.message);
    }
  };

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);

  if (loading && cartItems.length === 0) return <div>Đang tải giỏ hàng...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', color: '#e00000', marginBottom: 20, textAlign: 'center' }}>
        🛒 Giỏ hàng của bạn
      </h2>
      
      <div className="card" style={{ borderRadius: 16, padding: 30, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                <div style={{fontSize: 60, marginBottom: 20}}>🛍️</div>
                <p>Giỏ hàng đang trống.</p>
                <p>Hãy quay lại cửa hàng để chọn vài món đồ ưng ý nhé!</p>
            </div>
        ) : (
            <>
            <table className="data-table">
                <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th>Phân loại</th>
                    <th>Giá</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                </tr>
                </thead>
                <tbody>
                {cartItems.map((item) => (
                    <tr key={item.CartID + '-' + item.ProductID}>
                    <td>
                        <div style={{display:'flex', alignItems:'center', gap: 15}}>
                            {/* Placeholder ảnh nếu không có */}
                            <div style={{width: 50, height: 50, background:'#eee', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center'}}>👕</div>
                            <div>
                                <div style={{fontWeight: 'bold'}}>{item.ProductName}</div>
                                <div style={{fontSize: '0.8rem', color:'#999'}}>Mã: {item.ProductID}</div>
                            </div>
                        </div>
                    </td>
                    <td><span style={{background:'#f5f5f5', padding:'4px 8px', borderRadius:4, fontSize:'0.85rem'}}>{item.Color} / {item.Size}</span></td>
                    <td>{item.Price.toLocaleString()} ₫</td>
                    <td style={{ textAlign: 'center', fontWeight:'bold' }}>{item.Quantity}</td>
                    <td style={{ fontWeight: 'bold', color: '#e00000' }}>
                        {(item.Price * item.Quantity).toLocaleString()} ₫
                    </td>
                    <td style={{textAlign: 'center'}}>
                        <button 
                            onClick={() => handleRemoveItem(item.ProductID, item.VariantID, item.ProductName)}
                            title="Xóa sản phẩm"
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', 
                                color: '#999', padding: 8, borderRadius: '50%',
                                transition: 'background 0.2s, color 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.color = 'red'; e.currentTarget.style.background = '#ffebee'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'none'; }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            
            <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, borderTop: '1px solid #eee', paddingTop: 20 }}>
                <div style={{ fontSize: '1.2rem' }}>
                    Tổng cộng: <strong style={{ color: '#e00000', fontSize: '1.5rem' }}>{totalPrice.toLocaleString()} ₫</strong>
                </div>
                <button 
                    className="btn-checkout" 
                    onClick={handleCheckout}
                    style={{ flex: 'none' }}
                >
                    {userId ? (
                        <>
                            <span>Thanh toán ngay</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                            <span>Đăng nhập để thanh toán</span>
                        </>
                    )}
                </button>
            </div>
            </>
        )}
      </div>
    </div>
  );
};