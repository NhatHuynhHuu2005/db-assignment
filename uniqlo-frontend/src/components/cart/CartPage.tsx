import React, { useEffect, useState } from 'react';
import { fetchCart, checkout, type CartItemData } from '../../api/api';
import '../../styles/Components.scss';

// 1. Khai báo Interface nhận userId
interface CartPageProps {
  userId: number; 
}

// 2. Nhận userId vào props và destructure ra
export const CartPage: React.FC<CartPageProps> = ({ userId }) => {
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm tải giỏ hàng (cần userId)
  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await fetchCart(userId); // Truyền userId vào API
      setCartItems(data);
      setError(null);
    } catch (err: any) {
      setError('Lỗi tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại khi userId thay đổi (VD: Đổi tài khoản)
  useEffect(() => {
    if (userId) {
      void loadCart();
    }
  }, [userId]);

  // Hàm thanh toán (cần userId)
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!window.confirm('Bạn có chắc chắn muốn đặt hàng?')) return;
    
    try {
      const res = await checkout(userId); // Truyền userId vào API
      alert(`Thanh toán thành công! Mã đơn: ${res.orderId}`);
      void loadCart(); // Tải lại giỏ hàng (sẽ trống)
    } catch (err: any) {
      alert('Lỗi thanh toán: ' + (err?.response?.data?.error || err.message));
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
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                <div style={{fontSize: 60, marginBottom: 20}}>🛍️</div>
                <p>Giỏ hàng đang trống trơn.</p>
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
                    </tr>
                ))}
                </tbody>
            </table>
            
            <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, borderTop: '1px solid #eee', paddingTop: 20 }}>
                <div style={{ fontSize: '1.2rem' }}>
                    Tổng cộng: <strong style={{ color: '#e00000', fontSize: '1.5rem' }}>{totalPrice.toLocaleString()} ₫</strong>
                </div>
                <button 
                    className="btn-buy" 
                    onClick={handleCheckout}
                    style={{ padding: '12px 40px', fontSize: '1.1rem', flex: 'none' }}
                >
                    Thanh toán ngay
                </button>
            </div>
            </>
        )}
      </div>
    </div>
  );
};