import React, { useEffect, useState } from 'react';
import { fetchCart, checkout, type CartItemData } from '../../api/api';

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
    <div className="card">
      <h2 className="card__title">Giỏ hàng của bạn</h2>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Giỏ hàng đang trống. Hãy quay lại mua sắm nhé!
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
                <tr key={item.CartID + '-' + item.ProductID + '-' + item.VariantID}>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap: 10}}>
                        {item.Image && <img src={item.Image} alt="" style={{width: 40, height: 40, objectFit:'cover'}} />}
                        {item.ProductName}
                    </div>
                  </td>
                  <td>{item.Color} / {item.Size}</td>
                  <td>{item.Price.toLocaleString()} đ</td>
                  <td style={{ textAlign: 'center' }}>{item.Quantity}</td>
                  <td style={{ fontWeight: 'bold' }}>
                    {(item.Price * item.Quantity).toLocaleString()} đ
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr>
                 <td colSpan={4} style={{textAlign:'right', fontWeight:'bold', fontSize:'1.1rem'}}>Tổng cộng:</td>
                 <td style={{fontWeight:'bold', fontSize:'1.1rem', color:'#e00000'}}>
                    {totalPrice.toLocaleString()} đ
                 </td>
               </tr>
            </tfoot>
          </table>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button 
              className="btn btn--primary" 
              onClick={handleCheckout}
              style={{ padding: '12px 24px', fontSize: '1rem' }}
            >
              Thanh toán ngay
            </button>
          </div>
        </>
      )}
    </div>
  );
};