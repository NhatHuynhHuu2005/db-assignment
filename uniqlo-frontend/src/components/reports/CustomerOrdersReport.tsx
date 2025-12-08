import React, { useState, useEffect } from 'react';
import { fetchCustomerOrdersReport, updateOrderStatus, type CustomerOrderRow } from '../../api/api';
import { ReviewSection } from '../products/ReviewSection';
import '../../styles/Components.scss';

interface Props {
  role?: 'buyer' | 'seller';
  currentUserId?: number;
}

// Định nghĩa interface mở rộng để chứa items
interface ExtendedOrderRow extends CustomerOrderRow {
    items: Array<{
        ProductID: number;
        ProductName: string;
        Color: string;
        Size: string;
        Quantity: number;
        PriceAtPurchase: number;
        OriginalPrice: number;
        ImageURL: string;
    }>;
    shippingFee?: number;
    discountAmount?: number;
    totalAmount?: number;
}

export const CustomerOrdersReport: React.FC<Props> = ({ role = 'buyer', currentUserId }) => {
  // State customerId
  const [customerId, setCustomerId] = useState(
      role === 'buyer' && currentUserId ? String(currentUserId) : '' 
  );

  // Cập nhật customerId nếu props thay đổi (cho chắc chắn)
  useEffect(() => {
     if (role === 'buyer' && currentUserId) {
         setCustomerId(String(currentUserId));
     }
  }, [currentUserId, role]);

  const [statusList, setStatusList] = useState({
    Pending: true,
    Processing: true,
    Shipping: true,
    Delivered: true,
    Cancelled: false
  });
  
  const [data, setData] = useState<ExtendedOrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  // State quản lý Modal Review
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);

  const handleFetch = async () => {
    if (role === 'buyer' && !customerId) return;
    setLoading(true);
    try {
      const selectedStatuses = Object.entries(statusList)
        .filter(([_, checked]) => checked)
        .map(([key]) => key);

      const res = await fetchCustomerOrdersReport({
            customerId: customerId ? Number(customerId) : 0, 
            statusList: selectedStatuses
        });
      // Ép kiểu về ExtendedOrderRow vì BE đã trả về thêm items
      setData(res as any);
    } catch (err) {
       console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải dữ liệu khi vào trang (nếu là buyer)
  useEffect(() => {
    if (role === 'buyer' && currentUserId) {
        void handleFetch();
    }
  }, [customerId, role]); 

  const handleChangeStatus = async (orderId: number, newStatus: string) => {
    if(!window.confirm(`Bạn muốn chuyển đơn ${orderId} sang trạng thái ${newStatus}?`)) return;
    try {
        await updateOrderStatus(orderId, newStatus);
        handleFetch(); 
    } catch(e) {
        alert('Cập nhật thất bại');
    }
  }

  const toggleStatus = (key: keyof typeof statusList) => {
    setStatusList((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- RENDER GIAO DIỆN SELLER (Dạng Bảng) ---
  const renderSellerTable = () => (
      <div className="card" style={{ borderRadius: 16, padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
          <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ paddingLeft: 25 }}>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Vận đơn</th>
                  <th style={{ paddingRight: 25 }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign:'center', padding:30, color:'#999'}}>Không có dữ liệu</td></tr>
                ) : (
                    data.map((row) => (
                        <tr key={row.orderId}>
                            <td style={{ fontWeight: 'bold', paddingLeft: 25 }}>#{row.orderId}</td>
                            <td style={{ color: '#0056b3', fontWeight: 500 }}>{row.customerName || 'Khách vãng lai'}</td>
                            <td>{new Date(row.orderDate).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <select 
                                    className={`status-select ${row.orderStatus.toLowerCase()}`}
                                    value={row.orderStatus}
                                    onChange={(e) => handleChangeStatus(row.orderId, e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipping">Shipping</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </td>
                            <td style={{ fontFamily: 'monospace', color: '#555' }}>
                                {row.trackingCode || '---'}
                            </td>
                            <td style={{ paddingRight: 25 }}>
                                <span style={{fontSize:'0.85rem', color:'#666'}}>{row.items?.length || 0} sản phẩm</span>
                            </td>
                        </tr>
                    ))
                )}
              </tbody>
          </table>
      </div>
  );

  // --- RENDER GIAO DIỆN BUYER (Dạng Thẻ Card & Nút Đánh Giá) ---
  const renderBuyerHistory = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {data.length === 0 && <div style={{textAlign:'center', color:'#999', padding: 40}}>Bạn chưa có đơn hàng nào.</div>}
        
        {data.map(order => {
            const subTotal = order.items?.reduce((sum, item) => sum + (item.PriceAtPurchase * item.Quantity), 0) || 0;
            const finalTotal = order.totalAmount ?? (subTotal + (order.shippingFee || 0) - (order.discountAmount || 0));

            return (
                <div key={order.orderId} className="card" style={{ padding: 20, border: '1px solid #eee', borderRadius: 12, boxShadow:'0 2px 8px rgba(0,0,0,0.03)' }}>
                    {/* Header đơn hàng */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 10, marginBottom: 15 }}>
                        <div>
                            <span style={{ fontWeight: 700, marginRight: 10, fontSize: '1.1rem' }}>Đơn hàng #{order.orderId}</span>
                            <span style={{ color: '#888', fontSize: '0.9rem' }}>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className={`status-badge status-${order.orderStatus.toLowerCase()}`}>
                            {order.orderStatus.toUpperCase()}
                        </div>
                    </div>

                    {/* Danh sách sản phẩm trong đơn */}
                    <div>
                        {order.items && order.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 15, marginBottom: 15, alignItems: 'center' }}>
                                <div style={{ width: 70, height: 70, borderRadius: 6, border: '1px solid #eee', overflow: 'hidden', flexShrink: 0 }}>
                                    <img 
                                        src={item.ImageURL || 'https://placehold.co/70?text=No+Img'} 
                                        alt={item.ProductName} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        onError={(e) => e.currentTarget.src = 'https://placehold.co/70?text=Error'}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: '#333' }}>{item.ProductName}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>
                                        Phân loại: {item.Color} / {item.Size}
                                    </div>
                                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>x{item.Quantity}</span>
                                        
                                        {/* Nếu Giá mua < Giá gốc -> Hiện gạch ngang */}
                                        {item.OriginalPrice > item.PriceAtPurchase ? (
                                            <>
                                                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem' }}>
                                                    {item.OriginalPrice.toLocaleString()}₫
                                                </span>
                                                <span style={{ fontWeight: 'bold', color: '#e00000' }}>
                                                    {item.PriceAtPurchase.toLocaleString()}₫
                                                </span>
                                            </>
                                        ) : (
                                            // Nếu không giảm -> Hiện giá bình thường
                                            <span style={{ fontWeight: 'bold', color: '#333' }}>
                                                {item.PriceAtPurchase.toLocaleString()}₫
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* NÚT ĐÁNH GIÁ (Chỉ hiện khi Đã giao hàng) */}
                                {order.orderStatus === 'Delivered' && (
                                    <button 
                                        className="btn-outline-primary"
                                        onClick={() => setReviewProductId(item.ProductID)}
                                        style={{ 
                                            padding: '8px 16px', fontSize: '0.85rem', border: '1px solid #e00000', 
                                            color: '#e00000', background: '#fff', borderRadius: 6, cursor: 'pointer',
                                            fontWeight: 600, transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {e.currentTarget.style.background = '#fff1f2'}}
                                        onMouseOut={(e) => {e.currentTarget.style.background = '#fff'}}
                                    >
                                        ✍️ Đánh giá
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer - HIỂN THỊ CHI TIẾT TIỀN */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.9rem', color: '#666', marginBottom: 4 }}>
                            <span>Tổng tiền hàng:</span>
                            <span style={{ width: 100, textAlign: 'right' }}>{subTotal.toLocaleString()}₫</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.9rem', color: '#666', marginBottom: 4 }}>
                            <span>Phí vận chuyển:</span>
                            <span style={{ width: 100, textAlign: 'right' }}>+ {(order.shippingFee || 0).toLocaleString()}₫</span>
                        </div>

                        {(order.discountAmount || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.9rem', color: 'green', marginBottom: 4 }}>
                                <span>Giảm giá:</span>
                                <span style={{ width: 100, textAlign: 'right' }}>- {(order.discountAmount || 0).toLocaleString()}₫</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #eee' }}>
                            <div style={{fontSize:'0.9rem', color:'#666'}}>
                                {order.trackingCode ? `Vận đơn: ${order.trackingCode}` : ''}
                            </div>
                            <div>
                                <span style={{ color: '#333', fontSize: '1rem', marginRight: 10, fontWeight: 600 }}>Thành tiền:</span>
                                <strong style={{ fontSize: '1.4rem', color: '#e00000' }}>
                                    {finalTotal.toLocaleString()}₫
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );

  return (
    <div style={{ maxWidth: role === 'buyer' ? 800 : 1200, margin: '0 auto', paddingBottom: 50 }}>
      {/* Tiêu đề trang */}
      <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: 20, fontWeight: 800 }}>
        {role === 'seller' ? '📋 Quản lý đơn hàng' : '📦 Lịch sử mua hàng'}
      </h2>
      
      {/* KHU VỰC BỘ LỌC */}
      <div className="filter-bar">
        {/* --- ĐÂY LÀ CHỖ DÙNG setCustomerId --- */}
        {role === 'seller' && (
            <div style={{ marginRight: 15 }}>
                <input 
                    className="search-input"
                    placeholder="Nhập ID khách hàng..." 
                    value={customerId} 
                    onChange={e => setCustomerId(e.target.value)}
                />
            </div>
        )}
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
            {(Object.keys(statusList) as Array<keyof typeof statusList>).map((st) => (
                <div 
                    key={st} 
                    className={`filter-chip ${statusList[st] ? 'active' : ''}`}
                    onClick={() => toggleStatus(st)}
                >
                    {st}
                </div>
            ))}
        </div>

        <button 
            className="btn-filter" 
            onClick={handleFetch} 
            disabled={loading}
        >
            {loading ? 'Đang tải...' : (
                <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    Lọc kết quả
                </>
            )}
        </button>
      </div>

      {/* RENDER THEO ROLE */}
      {role === 'seller' ? renderSellerTable() : renderBuyerHistory()}

      {/* MODAL VIẾT ĐÁNH GIÁ (HIỆN KHI CÓ PRODUCT ID ĐƯỢC CHỌN) */}
      {reviewProductId && (
        <div className="modal-overlay" onClick={() => setReviewProductId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 0, overflow:'hidden' }}>
                <div style={{ padding: '15px 20px', borderBottom:'1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'#f9fafb' }}>
                    <h3 style={{ margin: 0, fontSize:'1.1rem' }}>Đánh giá sản phẩm</h3>
                    <button onClick={() => setReviewProductId(null)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color:'#888' }}>&times;</button>
                </div>
                
                <div style={{maxHeight:'80vh', overflowY:'auto'}}>
                    <ReviewSection 
                        productId={reviewProductId} 
                        userId={currentUserId}
                        // Sau khi review xong, đóng modal
                        onReviewSuccess={() => setReviewProductId(null)}
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};