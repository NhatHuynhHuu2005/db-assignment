// FE/src/components/reports/CustomerOrdersReport.tsx
import React, { useState, useEffect } from 'react';
import { fetchCustomerOrdersReport, updateOrderStatus, type CustomerOrderRow } from '../../api/api';
import '../../styles/Components.scss';

// Nhận role từ App
interface Props {
  role?: 'buyer' | 'seller';
  currentUserId?: number;
}

// --- SỬA Ở ĐÂY: Thêm currentUserId vào ---
export const CustomerOrdersReport: React.FC<Props> = ({ role = 'buyer', currentUserId }) => {
  
  // Bây giờ biến currentUserId đã tồn tại để dùng ở đây
  const [customerId, setCustomerId] = useState(
      role === 'buyer' && currentUserId ? String(currentUserId) : '' 
  );

  useEffect(() => {
     if (role === 'buyer' && currentUserId) {
         setCustomerId(String(currentUserId));
     }
  }, [currentUserId, role]);

  const [statusList, setStatusList] = useState({
    Pending: true,
    Processing: false,
    Shipping: false,
    Delivered: true,
    Cancelled: false
  });
  const [data, setData] = useState<CustomerOrderRow[]>([]);
  const [loading, setLoading] = useState(false);

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
      setData(res);
    } catch (err) {
      // alert('Lỗi tải báo cáo'); // Có thể comment lại để đỡ phiền nếu chưa có dữ liệu
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải dữ liệu khi vào trang (nếu là buyer)
  useEffect(() => {
    if (role === 'buyer' && currentUserId) {
        void handleFetch();
    }
  }, [customerId]); // Khi customerId (tức là currentUserId) thay đổi thì load lại

  const handleChangeStatus = async (orderId: number, newStatus: string) => {
    if(!window.confirm(`Bạn muốn chuyển đơn ${orderId} sang trạng thái ${newStatus}?`)) return;
    try {
        await updateOrderStatus(orderId, newStatus);
        alert('Cập nhật thành công!');
        handleFetch(); 
    } catch(e) {
        alert('Cập nhật thất bại');
    }
  }

  const toggleStatus = (key: keyof typeof statusList) => {
    setStatusList((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 50 }}>
      {/* Tiêu đề trang */}
      <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: 20, fontWeight: 800 }}>
        {role === 'seller' ? '📋 Quản lý đơn hàng' : '📦 Lịch sử mua hàng'}
      </h2>
      
      {/* KHU VỰC BỘ LỌC (FILTER BAR) ĐÃ LÀM LẠI */}
      <div className="filter-bar">
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
        
        {/* Render các thẻ lọc (Chips) */}
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

        {/* Nút Lọc dữ liệu */}
        <button 
            className="btn-filter" 
            onClick={handleFetch} 
            disabled={loading}
        >
            {loading ? (
                <>Đang tải...</>
            ) : (
                <>
                    {/* Icon phễu lọc */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    Lọc kết quả
                </>
            )}
        </button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="card" style={{ borderRadius: 16, padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
          <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ paddingLeft: 25 }}>Mã đơn</th>
                  {role === 'seller' && <th>Khách hàng</th>}
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Vận đơn</th>
                  <th style={{ paddingRight: 25 }}>Địa chỉ</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                            Không tìm thấy đơn hàng nào phù hợp.
                        </td>
                    </tr>
                ) : (
                    data.map((row) => (
                    <tr key={row.orderId}>
                        <td style={{ fontWeight: 'bold', paddingLeft: 25 }}>#{row.orderId}</td>
                        
                        {role === 'seller' && (
                            <td style={{ color: '#0056b3', fontWeight: 500 }}>
                                {row.customerName || `ID: ${customerId}`}
                            </td>
                        )}
                        
                        <td>{new Date(row.orderDate).toLocaleDateString('vi-VN')}</td>
                        
                        <td>
                            {role === 'seller' ? (
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
                            ) : (
                                <span className={`status-badge status-${row.orderStatus.toLowerCase()}`}>
                                    {row.orderStatus}
                                </span>
                            )}
                        </td>
                        
                        <td style={{ fontFamily: 'monospace', color: '#555' }}>
                            {row.trackingCode || '---'}
                        </td>
                        
                        <td style={{ maxWidth: 250, paddingRight: 25 }} title={row.address}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {row.address}
                            </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
          </table>
      </div>
    </div>
  );
};