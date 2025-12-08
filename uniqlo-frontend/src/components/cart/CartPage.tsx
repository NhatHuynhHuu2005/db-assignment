import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { 
  fetchCart, 
  getGuestCart, 
  removeFromCart, 
  removeFromGuestCart, 
  type CartItemData,
  validateVoucher // Import hàm này
} from '../../api/api';
import { ConfirmModal } from '../common/ConfirmModal';
import { Toast } from '../common/Toast';
import '../../styles/Components.scss';

// CẤU HÌNH QUYỀN LỢI THÀNH VIÊN
const TIER_BENEFITS: Record<string, { rate: number; label: string; color: string }> = {
    'VIP':        { rate: 0.10, label: 'VIP (Giảm 10%)',      color: '#2d3436' },
    'Platinum':   { rate: 0.07, label: 'Platinum (Giảm 7%)', color: '#7f8c8d' },
    'Gold':       { rate: 0.05, label: 'Gold (Giảm 5%)',     color: '#f39c12' },
    'Silver':     { rate: 0.03, label: 'Silver (Giảm 3%)',   color: '#7f8c8d' },
    'Bronze':     { rate: 0.01, label: 'Bronze (Giảm 1%)',   color: '#d35400' },
    'New Member': { rate: 0.00, label: 'Thành viên mới',     color: '#0984e3' }
};

interface CartPageProps {
  userId?: number; 
  onPurchaseSuccess?: () => void;
  userTier?: string;
}

export const CartPage: React.FC<CartPageProps> = ({ userId, onPurchaseSuccess, userTier = 'New Member' }) => {
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // State thanh toán
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [shippingFee, setShippingFee] = useState(30000);
  const [shipUnitId, setShipUnitId] = useState(1);

  // --- STATE VOUCHER (ĐÃ SỬA) ---
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    type: 'Percentage' | 'FixedAmount' | 'Buy1Get1';
    value: number;
  } | null>(null);
  // ------------------------------

  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const loadCart = async () => {
    setLoading(true);
    if (userId) {
      try {
        const data = await fetchCart(userId);
        setCartItems(data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setCartItems(getGuestCart());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, [userId]);

  // --- HÀM XỬ LÝ VOUCHER (GỌI API) ---
  const handleApplyVoucher = async () => {
      if (!voucherCodeInput.trim()) return;
      setIsApplyingVoucher(true);
      setVoucherError('');

      try {
          const data = await validateVoucher(voucherCodeInput);
          
          if (data.valid) {
              setAppliedVoucher({ 
                  code: voucherCodeInput, 
                  type: data.ruleType, 
                  value: data.rewardValue 
              });
              setVoucherCodeInput('');
              setToast({ msg: `Áp dụng mã ${data.name} thành công!`, type: 'success' });
          }
      } catch (error: any) {
          const msg = error.response?.data?.error || 'Mã giảm giá không hợp lệ';
          setVoucherError(msg);
          setToast({ msg: msg, type: 'error' });
          setAppliedVoucher(null);
      } finally {
          setIsApplyingVoucher(false);
      }
  };

  const handleRemoveVoucher = () => {
      setAppliedVoucher(null);
      setVoucherCodeInput('');
      setToast({ msg: 'Đã gỡ bỏ mã giảm giá', type: 'success' });
  };
  // ------------------------------------

  const handleRemoveItem = (productId: number, variantId: number, productName: string) => {
    setConfirmModal({
        isOpen: true,
        title: 'Xóa sản phẩm?',
        message: `Bạn có chắc muốn xóa "${productName}" khỏi giỏ hàng?`,
        onConfirm: async () => {
            try {
                if (userId) await removeFromCart(userId, productId, variantId);
                else removeFromGuestCart(productId, variantId);
                
                setToast({ msg: `Đã xóa "${productName}"`, type: 'success' });
                await loadCart();
            } catch (err: any) {
                setToast({ msg: 'Lỗi: ' + err.message, type: 'error' });
            }
            closeConfirm();
        }
    });
  };

  // --- TÍNH TOÁN TIỀN ---
  const subTotal = cartItems.reduce((sum, item) => sum + ((item.Price || 0) * item.Quantity), 0);
  
  // Tính giảm giá Voucher
  let voucherDiscount = 0;
  if (appliedVoucher) {
      if (appliedVoucher.type === 'Percentage') {
          voucherDiscount = subTotal * (appliedVoucher.value / 100);
      } else if (appliedVoucher.type === 'FixedAmount') {
          voucherDiscount = appliedVoucher.value;
      }
      // Đảm bảo không giảm quá tổng tiền
      voucherDiscount = Math.min(voucherDiscount, subTotal);
  }

  // Tính giảm giá Thành viên
  const tierInfo = TIER_BENEFITS[userTier] || TIER_BENEFITS['New Member'];
  const memberDiscount = Math.round(subTotal * tierInfo.rate);

  // Tổng cuối
  const finalTotal = subTotal + shippingFee - voucherDiscount - memberDiscount;
  // ----------------------

  const handleCheckout = () => {
    if (!userId) {
        setConfirmModal({
            isOpen: true,
            title: 'Yêu cầu đăng nhập',
            message: 'Bạn cần đăng nhập để tích điểm và hưởng ưu đãi thành viên.',
            onConfirm: () => {
                navigate('/login');
                closeConfirm();
            }
        });
        return;
    }

    if (cartItems.length === 0) return;
    
    setConfirmModal({
        isOpen: true,
        title: 'Xác nhận đặt hàng',
        message: `Tổng thanh toán: ${Math.max(0, finalTotal).toLocaleString()}₫.`,
        onConfirm: async () => {
            try {
                const payload = {
                    userId,
                    paymentMethod,
                    shippingFee,
                    discountAmount: voucherDiscount + memberDiscount,
                    finalTotal,
                    shipUnitId,
                    // Có thể gửi thêm voucherCode để backend lưu lại
                    voucherCode: appliedVoucher?.code 
                };

                const res = await api.post('/cart/checkout', payload); 
                const orderId = res.data.orderId;

                setToast({ msg: `Đặt hàng thành công! Mã đơn: #${orderId}`, type: 'success' });
                await loadCart();
                setAppliedVoucher(null); // Reset voucher

                if (onPurchaseSuccess) {
                    onPurchaseSuccess(); 
                }
            } catch (err: any) {
                const errorMsg = err?.response?.data?.error || err.message;
                setToast({ msg: 'Lỗi: ' + errorMsg, type: 'error' });
            }
            closeConfirm();
        }
    });
  };

  if (loading && cartItems.length === 0) return <div style={{padding: 40, textAlign: 'center'}}>Đang tải giỏ hàng...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 50 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
        confirmLabel={userId ? "Đồng ý" : "Đăng nhập ngay"}
      />

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
            {/* BẢNG SẢN PHẨM */}
            <table className="data-table">
                <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th>Phân loại</th>
                    <th>Giá</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                    <th style={{width: 50}}></th>
                </tr>
                </thead>
                <tbody>
                {cartItems.map((item) => (
                    <tr key={item.CartID + '-' + item.ProductID + '-' + item.VariantID}>
                    <td>
                        <div style={{display:'flex', alignItems:'center', gap: 15}}>
                            <div style={{width: 50, height: 50, background:'#eee', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                                {item.Image ? <img src={item.Image} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="" /> : '👕'}
                            </div>
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
                            title="Xóa"
                            style={{background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 8}}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* KHUNG THANH TOÁN */}
            <div className="order-summary" style={{marginTop: 30, background: '#f9f9f9', padding: 25, borderRadius: 12}}>
                <div style={{display: 'flex', gap: 40, flexWrap: 'wrap'}}>
                    
                    {/* Cột Trái: Tùy chọn */}
                    <div style={{flex: 1, minWidth: 300}}>
                        <h4 style={{marginBottom: 15, borderBottom:'1px solid #ddd', paddingBottom: 10}}>Tùy chọn đơn hàng</h4>
                        
                        {/* Chọn Ship */}
                        <div style={{marginBottom: 15}}>
                             <label style={{fontWeight:'bold', display:'block', marginBottom: 5}}>Đơn vị vận chuyển:</label>
                             <select 
                                value={shipUnitId} 
                                onChange={(e) => {
                                    const id = Number(e.target.value);
                                    setShipUnitId(id);
                                    if(id===1) setShippingFee(30000);
                                    else if(id===3) setShippingFee(50000);
                                    else setShippingFee(40000);
                                }}
                                style={{padding: 10, borderRadius: 6, width: '100%', border: '1px solid #ccc'}}
                             >
                                 <option value={1}>Giao Hàng Tiết Kiệm (30.000₫)</option>
                                 <option value={2}>Viettel Post (40.000₫)</option>
                                 <option value={3}>GrabExpress (50.000₫)</option>
                             </select>
                        </div>

                        {/* Chọn Thanh toán */}
                        <div style={{marginBottom: 15}}>
                            <label style={{fontWeight:'bold', display:'block', marginBottom: 5}}>Thanh toán:</label>
                            <div style={{display: 'flex', gap: 15}}>
                                <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5}}>
                                    <input type="radio" name="payment" value="Cash" checked={paymentMethod === 'Cash'} onChange={e => setPaymentMethod(e.target.value)} />
                                    <span>Tiền mặt (COD)</span>
                                </label>
                                <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5}}>
                                    <input type="radio" name="payment" value="Banking" checked={paymentMethod === 'Banking'} onChange={e => setPaymentMethod(e.target.value)} />
                                    <span>Chuyển khoản</span>
                                </label>
                            </div>
                        </div>

                        {/* --- KHU VỰC NHẬP VOUCHER (ĐÃ SỬA VÀ DÙNG BIẾN ĐÚNG) --- */}
                        <label style={{fontWeight:'bold', display:'block', marginBottom: 5}}>Mã giảm giá / Voucher:</label>
                        <div style={{display:'flex', gap: 10}}>
                            <input 
                                placeholder="VD: SUMMER2025" 
                                value={voucherCodeInput}
                                onChange={e => setVoucherCodeInput(e.target.value.toUpperCase())}
                                disabled={!!appliedVoucher}
                                style={{padding: 10, border: '1px solid #ccc', borderRadius: 6, flex: 1, textTransform:'uppercase', fontWeight:'bold'}}
                            />
                            <button 
                                onClick={handleApplyVoucher} 
                                disabled={isApplyingVoucher || !!appliedVoucher}
                                style={{background: appliedVoucher ? '#00b894' : '#333', color: '#fff', border: 'none', padding: '0 20px', borderRadius: 6, cursor:'pointer', fontWeight: 600}}
                            >
                                {isApplyingVoucher ? '...' : (appliedVoucher ? 'Đã dùng' : 'Áp dụng')}
                            </button>
                        </div>
                        {/* Lỗi Voucher */}
                        {voucherError && <div style={{color:'#e00000', fontSize:'0.85rem', marginTop:5}}>{voucherError}</div>}
                        
                        {/* Thông báo Voucher Thành công */}
                        {appliedVoucher && (
                            <div style={{ marginTop: 10, background: '#dff9fb', padding: '8px 12px', borderRadius: 4, color: '#00b894', fontSize: '0.9rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span>
                                    🏷️ <b>{appliedVoucher.code}</b>: 
                                    {appliedVoucher.type === 'Percentage' ? ` Giảm ${appliedVoucher.value}%` : ` Giảm ${appliedVoucher.value.toLocaleString()}đ`}
                                </span>
                                <button onClick={handleRemoveVoucher} style={{background:'none', border:'none', color:'#e00000', cursor:'pointer', fontWeight:'bold'}}>✕ Bỏ</button>
                            </div>
                        )}
                        {/* ------------------------------------------------------- */}
                    </div>

                    {/* Cột Phải: Tính tiền */}
                    <div style={{flex: 1, minWidth: 300, background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                        
                        {/* HIỂN THỊ HẠNG THÀNH VIÊN */}
                        {userId && userTier !== 'New Member' && (
                            <div style={{
                                background: `${tierInfo.color}15`, 
                                border: `1px solid ${tierInfo.color}`,
                                borderRadius: 6, padding: '10px 15px', marginBottom: 20,
                                display: 'flex', alignItems: 'center', gap: 10
                            }}>
                                <span style={{fontSize: '24px'}}>👑</span>
                                <div>
                                    <div style={{fontSize: '0.85rem', color: '#666'}}>Hạng thành viên của bạn</div>
                                    <div style={{fontWeight: 'bold', color: tierInfo.color, fontSize: '1.1rem'}}>
                                        {tierInfo.label}
                                    </div>
                                </div>
                            </div>
                        )}

                        <h4 style={{marginBottom: 15, borderBottom:'1px solid #eee', paddingBottom: 10}}>Chi tiết thanh toán</h4>
                        
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10}}>
                            <span style={{color:'#666'}}>Tạm tính:</span>
                            <span style={{fontWeight:600}}>{subTotal.toLocaleString()} ₫</span>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10}}>
                            <span style={{color:'#666'}}>Phí vận chuyển:</span>
                            <span style={{fontWeight:600}}>+ {shippingFee.toLocaleString()} ₫</span>
                        </div>
                        
                        {/* Dòng giảm giá Voucher */}
                        {voucherDiscount > 0 && (
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10, color: 'green'}}>
                                <span>Voucher giảm giá:</span>
                                <span>- {voucherDiscount.toLocaleString()} ₫</span>
                            </div>
                        )}

                        {/* Dòng giảm giá Thành viên */}
                        {memberDiscount > 0 && (
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10}}>
                                <span style={{color:'#666'}}>Ưu đãi hạng Thành viên:</span>
                                <span style={{fontWeight:600}}>- {memberDiscount.toLocaleString()} ₫</span>
                            </div>
                        )}

                        <div style={{display:'flex', justifyContent:'space-between', marginTop: 20, fontSize: '1.4rem', fontWeight: 'bold', borderTop: '2px dashed #eee', paddingTop: 20}}>
                            <span>TỔNG CỘNG:</span>
                            <span style={{color: '#e00000'}}>{Math.max(0, finalTotal).toLocaleString()} ₫</span>
                        </div>

                        <div style={{marginTop: 25}}>
                             <button 
                                className="btn-checkout" 
                                onClick={handleCheckout}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {userId ? (
                                    <>
                                        <span>THANH TOÁN NGAY</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                                        <span>ĐĂNG NHẬP ĐỂ THANH TOÁN</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </>
        )}
      </div>
    </div>
  );
};