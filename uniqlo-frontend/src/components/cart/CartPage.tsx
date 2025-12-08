import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  fetchCart, 
  getGuestCart, 
  removeFromCart, 
  removeFromGuestCart, 
  type CartItemData,
  validateVoucher,
  fetchShippingUnits, 
  checkoutCart,       
  type ShippingUnit
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

// CẤU HÌNH PHÍ SHIP TẠM THỜI
const SHIPPING_FEES: Record<number, number> = {
    1: 30000, 
    2: 40000, 
    3: 50000, 
    4: 35000  
};

interface CartPageProps {
  userId?: number; 
  onPurchaseSuccess?: () => void;
  userTier?: string;
  userAddress?: string;
}

// --- MODAL THANH TOÁN CHI TIẾT ---
const DetailedCheckoutModal: React.FC<{
  isOpen: boolean;
  items: CartItemData[];
  subTotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  initialAddress: string;
  paymentMethod: string;
  shippingUnitName: string; 
  onConfirm: (finalAddress: string) => void;
  onCancel: () => void;
}> = ({
  isOpen, items, subTotal, shippingFee, discount, total, 
  initialAddress, paymentMethod, shippingUnitName, onConfirm, onCancel
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setAddress(initialAddress || "");
  }, [initialAddress, isOpen]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 600, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.25rem' }}>Xác nhận đơn hàng</h2>
          <button onClick={onCancel} style={{ border: 'none', background: 'none', fontSize: 28, cursor: 'pointer', color: '#999', lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ padding: '25px' }}>
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 20, border: "1px solid #f0f0f0", borderRadius: 8, padding: 10 }}>
            {items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: idx === items.length - 1 ? "none" : "1px dashed #eee" }}>
                <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 45, height: 45, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
                    {item.Image ? <img src={item.Image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : "👕"}
                    </div>
                    <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: '#333' }}>{item.ProductName}</div>
                    <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 2 }}>{item.Color} / {item.Size} • SL: <strong>{item.Quantity}</strong></div>
                    </div>
                </div>
                <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: '#333' }}>{(item.Price * item.Quantity).toLocaleString()} ₫</div>
                </div>
            ))}
            </div>

            <div style={{display: 'flex', gap: 15, marginBottom: 20}}>
                <div style={{flex: 1, background: '#fff', border: '1px solid #e00000', padding: 12, borderRadius: 8, fontSize: '0.9rem'}}>
                    <div style={{fontWeight: 'bold', color: '#e00000', marginBottom: 8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span>📍 Địa chỉ nhận hàng</span>
                        {!isEditing && <button onClick={() => setIsEditing(true)} style={{background:'none', border:'none', color:'#0984e3', cursor:'pointer', fontSize:'0.85rem', fontWeight:600}}>✏️ Sửa</button>}
                    </div>
                    {isEditing ? (
                        <div>
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} style={{width: '100%', padding: 8, border:'1px solid #ccc', borderRadius: 4, resize: 'vertical'}} placeholder="Nhập địa chỉ..." />
                            <div style={{marginTop: 8, textAlign:'right'}}><button onClick={() => setIsEditing(false)} style={{padding: '4px 10px', border:'none', background:'#e00000', color:'#fff', borderRadius: 4, cursor:'pointer'}}>Lưu</button></div>
                        </div>
                    ) : <div style={{color: '#333'}}>{address || <i style={{color:'#999'}}>Chưa có địa chỉ</i>}</div>}
                </div>
                <div style={{flex: 1, background: '#fff', border: '1px solid #eee', padding: 12, borderRadius: 8, fontSize: '0.9rem'}}>
                    <div style={{fontWeight: 'bold', color: '#333', marginBottom: 5}}>🚚 Vận chuyển & Thanh toán</div>
                    <div style={{color: '#555', marginTop: 5}}>ĐVVC: <b>{shippingUnitName}</b></div>
                    <div style={{color: '#555', marginTop: 5}}>TT: {paymentMethod === 'Banking' ? 'Chuyển khoản' : 'COD'}</div>
                </div>
            </div>

            <div style={{ background: "#f9f9f9", padding: 20, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span>Tạm tính:</span><span>{subTotal.toLocaleString()} ₫</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span>Phí vận chuyển:</span><span>{shippingFee.toLocaleString()} ₫</span></div>
                {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, color: "green" }}><span>Giảm giá:</span><span>- {discount.toLocaleString()} ₫</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "1.3rem", color: "#e00000", marginTop: 10, paddingTop: 10, borderTop: "1px dashed #ddd" }}>
                    <span>TỔNG THANH TOÁN:</span><span>{Math.max(0, total).toLocaleString()} ₫</span>
                </div>
            </div>

            <button onClick={() => onConfirm(address)} className="btn-checkout" disabled={!address.trim()} style={{ width: "100%", marginTop: 20, height: 50, fontSize: '1rem', justifyContent:'center', background: !address.trim() ? '#ccc' : undefined }}>XÁC NHẬN ĐẶT HÀNG</button>
        </div>
      </div>
    </div>
  );
};

export const CartPage: React.FC<CartPageProps> = ({ userId, onPurchaseSuccess, userTier = 'New Member', userAddress = '' }) => {
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [showCheckoutDetail, setShowCheckoutDetail] = useState(false);

  // State thanh toán & Vận chuyển
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [shippingUnits, setShippingUnits] = useState<ShippingUnit[]>([]);
  const [shipUnitId, setShipUnitId] = useState(1);
  const [shippingFee, setShippingFee] = useState(30000);

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; type: string; value: number; name?: string; } | null>(null);

  const closeConfirm = () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));

  // Load Cart & Shipping Units
  useEffect(() => {
    loadCart();
    
    fetchShippingUnits().then(units => {
        setShippingUnits(units);
        if (units.length > 0) {
            setShipUnitId(units[0].UnitID);
            setShippingFee(SHIPPING_FEES[units[0].UnitID] || 30000);
        }
    });
  }, [userId]);

  const loadCart = async () => {
    setLoading(true);
    if (userId) {
      try {
        const data = await fetchCart(userId);
        setCartItems(data);
      } catch (err) { console.error(err); }
    } else {
      setCartItems(getGuestCart());
    }
    setLoading(false);
  };

  const handleApplyVoucher = async () => {
      if (!voucherCodeInput.trim()) return;
      setIsApplyingVoucher(true);
      setVoucherError('');
      try {
          const data = await validateVoucher(voucherCodeInput);
          if (data.valid) {
              setAppliedVoucher({ code: voucherCodeInput, type: data.ruleType, value: data.rewardValue, name: data.name });
              setVoucherCodeInput('');
              setToast({ msg: `Áp dụng mã ${data.name} thành công!`, type: 'success' });
          }
      } catch (error: any) {
          const msg = error.response?.data?.error || 'Mã giảm giá không hợp lệ';
          setVoucherError(msg);
          setAppliedVoucher(null);
      } finally { setIsApplyingVoucher(false); }
  };

  const handleRemoveItem = (productId: number, variantId: number, productName: string) => {
    setConfirmModal({
        isOpen: true, title: 'Xóa sản phẩm?', message: `Bạn có chắc muốn xóa "${productName}"?`,
        onConfirm: async () => {
            try {
                if (userId) await removeFromCart(userId, productId, variantId);
                else removeFromGuestCart(productId, variantId);
                setToast({ msg: `Đã xóa "${productName}"`, type: 'success' });
                await loadCart();
            } catch (err: any) { setToast({ msg: err.message, type: 'error' }); }
            closeConfirm();
        }
    });
  };

  // Tính toán
  const subTotal = cartItems.reduce((sum, item) => sum + ((item.Price || 0) * item.Quantity), 0);
  
  let voucherDiscount = 0;
  if (appliedVoucher) {
      if (appliedVoucher.type === 'Percentage') voucherDiscount = subTotal * (appliedVoucher.value / 100);
      else if (appliedVoucher.type === 'FixedAmount') voucherDiscount = appliedVoucher.value;
      voucherDiscount = Math.min(voucherDiscount, subTotal);
  }

  const tierInfo = TIER_BENEFITS[userTier] || TIER_BENEFITS['New Member'];
  const memberDiscount = Math.round(subTotal * tierInfo.rate);
  const totalDiscount = voucherDiscount + memberDiscount;
  const finalTotal = subTotal + shippingFee - totalDiscount;

  const handlePreCheckout = () => {
    if (!userId) {
        setConfirmModal({
            isOpen: true, title: 'Yêu cầu đăng nhập', message: 'Bạn cần đăng nhập để thanh toán.',
            onConfirm: () => { navigate('/login'); closeConfirm(); }
        });
        return;
    }
    if (cartItems.length === 0) return;
    setShowCheckoutDetail(true);
  };

  // --- HÀM ĐÃ SỬA LỖI ---
  const handleConfirmOrder = async (finalAddress: string) => {
    // 1. Kiểm tra nếu userId không tồn tại thì dừng lại
    // Điều này giúp TypeScript hiểu userId bên dưới chắc chắn là number
    if (!userId) {
        setToast({ msg: 'Vui lòng đăng nhập lại.', type: 'error' });
        return;
    }

    try {
        const payload = {
            userId, // Giờ TypeScript đã OK vì userId được đảm bảo là number
            paymentMethod,
            shippingFee,
            discountAmount: totalDiscount,
            finalTotal,
            unitId: shipUnitId, 
            voucherCode: appliedVoucher?.code,
            address: finalAddress 
        };

        const res = await checkoutCart(payload);
        
        setToast({ msg: `Đặt hàng thành công! Mã đơn: #${res.orderId}`, type: 'success' });
        await loadCart();
        setAppliedVoucher(null);
        setShowCheckoutDetail(false);
        if (onPurchaseSuccess) onPurchaseSuccess();
    } catch (err: any) {
        setToast({ msg: 'Lỗi: ' + (err?.response?.data?.error || err.message), type: 'error' });
    }
  };

  if (loading && cartItems.length === 0) return <div style={{padding: 40, textAlign: 'center'}}>Đang tải giỏ hàng...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 50 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={closeConfirm} confirmLabel={userId ? "Đồng ý" : "Đăng nhập ngay"} />

      <DetailedCheckoutModal 
        isOpen={showCheckoutDetail} items={cartItems} subTotal={subTotal} shippingFee={shippingFee} discount={totalDiscount} total={finalTotal}
        initialAddress={userAddress} paymentMethod={paymentMethod}
        shippingUnitName={shippingUnits.find(u => u.UnitID === shipUnitId)?.UnitName || 'Vận chuyển'}
        onConfirm={handleConfirmOrder} onCancel={() => setShowCheckoutDetail(false)}
      />

      <h2 style={{ fontSize: '2rem', color: '#e00000', marginBottom: 20, textAlign: 'center' }}>🛒 Giỏ hàng của bạn</h2>
      
      <div className="card" style={{ borderRadius: 16, padding: 30, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                <div style={{fontSize: 60, marginBottom: 20}}>🛍️</div>
                <p>Giỏ hàng đang trống.</p>
                <Link to="/shop" style={{ color: "#e00000", fontWeight: "bold", textDecoration: 'none' }}>Khám phá sản phẩm ngay</Link>
            </div>
        ) : (
            <>
            <table className="data-table">
                <thead><tr><th>Sản phẩm</th><th>Phân loại</th><th>Giá</th><th>SL</th><th>Thành tiền</th><th style={{width: 50}}></th></tr></thead>
                <tbody>
                {cartItems.map((item) => (
                    <tr key={item.CartID + '-' + item.ProductID + '-' + item.VariantID}>
                    <td>
                        <div style={{display:'flex', alignItems:'center', gap: 15}}>
                            <div style={{width: 50, height: 50, background:'#eee', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                                {item.Image ? <img src={item.Image} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="" /> : '👕'}
                            </div>
                            <div><div style={{fontWeight: 'bold'}}>{item.ProductName}</div><div style={{fontSize: '0.8rem', color:'#999'}}>#{item.ProductID}</div></div>
                        </div>
                    </td>
                    <td><span style={{background:'#f5f5f5', padding:'4px 8px', borderRadius:4, fontSize:'0.85rem'}}>{item.Color} / {item.Size}</span></td>
                    <td>{item.Price.toLocaleString()} ₫</td>
                    <td style={{ textAlign: 'center', fontWeight:'bold' }}>{item.Quantity}</td>
                    <td style={{ fontWeight: 'bold', color: '#e00000' }}>{(item.Price * item.Quantity).toLocaleString()} ₫</td>
                    <td style={{textAlign: 'center'}}><button onClick={() => handleRemoveItem(item.ProductID, item.VariantID, item.ProductName)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 8}}>&times;</button></td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="order-summary" style={{marginTop: 30, background: '#f9f9f9', padding: 25, borderRadius: 12}}>
                <div style={{display: 'flex', gap: 40, flexWrap: 'wrap'}}>
                    <div style={{flex: 1, minWidth: 300}}>
                        <h4 style={{marginBottom: 15, borderBottom:'1px solid #ddd', paddingBottom: 10}}>Tùy chọn đơn hàng</h4>
                        
                        <div style={{marginBottom: 15}}>
                             <label style={{fontWeight:'bold', display:'block', marginBottom: 5}}>Đơn vị vận chuyển:</label>
                             {shippingUnits.length > 0 ? (
                                 <select 
                                    value={shipUnitId} 
                                    onChange={(e) => {
                                        const id = Number(e.target.value);
                                        setShipUnitId(id);
                                        setShippingFee(SHIPPING_FEES[id] || 30000);
                                    }}
                                    style={{padding: 10, borderRadius: 6, width: '100%', border: '1px solid #ccc'}}
                                 >
                                     {shippingUnits.map(unit => (
                                         <option key={unit.UnitID} value={unit.UnitID}>
                                             {unit.UnitName} ({SHIPPING_FEES[unit.UnitID]?.toLocaleString() || '30.000'}₫)
                                         </option>
                                     ))}
                                 </select>
                             ) : <div>Đang tải đơn vị vận chuyển...</div>}
                        </div>

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

                        <label style={{fontWeight:'bold', display:'block', marginBottom: 5}}>Mã giảm giá / Voucher:</label>
                        <div style={{display:'flex', gap: 10}}>
                            <input placeholder="VD: SUMMER2025" value={voucherCodeInput} onChange={e => setVoucherCodeInput(e.target.value.toUpperCase())} disabled={!!appliedVoucher} style={{padding: 10, border: '1px solid #ccc', borderRadius: 6, flex: 1, textTransform:'uppercase', fontWeight:'bold'}} />
                            <button onClick={handleApplyVoucher} disabled={isApplyingVoucher || !!appliedVoucher} style={{background: appliedVoucher ? '#00b894' : '#333', color: '#fff', border: 'none', padding: '0 20px', borderRadius: 6, cursor:'pointer', fontWeight: 600}}>
                                {isApplyingVoucher ? '...' : (appliedVoucher ? 'Đã dùng' : 'Áp dụng')}
                            </button>
                        </div>
                        {voucherError && <div style={{color:'#e00000', fontSize:'0.85rem', marginTop:5}}>{voucherError}</div>}
                        {appliedVoucher && (
                            <div style={{ marginTop: 10, background: '#dff9fb', padding: '8px 12px', borderRadius: 4, color: '#00b894', fontSize: '0.9rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span>🏷️ <b>{appliedVoucher.code}</b>: {appliedVoucher.type === 'Percentage' ? ` Giảm ${appliedVoucher.value}%` : ` Giảm ${appliedVoucher.value.toLocaleString()}đ`}</span>
                                <button onClick={() => { setAppliedVoucher(null); setVoucherCodeInput(''); }} style={{background:'none', border:'none', color:'#e00000', cursor:'pointer', fontWeight:'bold'}}>✕ Bỏ</button>
                            </div>
                        )}
                    </div>

                    <div style={{flex: 1, minWidth: 300, background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                        {userId && userTier !== 'New Member' && (
                            <div style={{background: `${tierInfo.color}15`, border: `1px solid ${tierInfo.color}`, borderRadius: 6, padding: '10px 15px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10}}>
                                <span style={{fontSize: '24px'}}>👑</span>
                                <div><div style={{fontSize: '0.85rem', color: '#666'}}>Hạng thành viên</div><div style={{fontWeight: 'bold', color: tierInfo.color, fontSize: '1.1rem'}}>{tierInfo.label}</div></div>
                            </div>
                        )}
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10}}><span style={{color:'#666'}}>Tạm tính:</span><span style={{fontWeight:600}}>{subTotal.toLocaleString()} ₫</span></div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10}}><span style={{color:'#666'}}>Phí vận chuyển:</span><span style={{fontWeight:600}}>+ {shippingFee.toLocaleString()} ₫</span></div>
                        {voucherDiscount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10, color: 'green'}}><span>Voucher giảm giá:</span><span>- {voucherDiscount.toLocaleString()} ₫</span></div>}
                        {memberDiscount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom: 10}}><span style={{color:'#666'}}>Ưu đãi hạng Thành viên:</span><span style={{fontWeight:600}}>- {memberDiscount.toLocaleString()} ₫</span></div>}
                        <div style={{display:'flex', justifyContent:'space-between', marginTop: 20, fontSize: '1.4rem', fontWeight: 'bold', borderTop: '2px dashed #eee', paddingTop: 20}}><span>TỔNG CỘNG:</span><span style={{color: '#e00000'}}>{Math.max(0, finalTotal).toLocaleString()} ₫</span></div>
                        
                        <div style={{marginTop: 25}}>
                             <button className="btn-checkout" onClick={handlePreCheckout} style={{ width: '100%', justifyContent: 'center' }}>
                                {userId ? <span>THANH TOÁN NGAY</span> : <span>ĐĂNG NHẬP ĐỂ THANH TOÁN</span>}
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