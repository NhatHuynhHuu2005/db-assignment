// FE/src/components/reports/CustomerOrdersReport.tsx
import React, { useState, useEffect } from 'react';
import { fetchCustomerOrdersReport, updateOrderStatus, type CustomerOrderRow } from '../../api/api';

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
    Processing: true,
    Shipping: true,
    Delivered: true,
    Cancelled: true
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
    <div className="card">
      <h2 className="card__title">
        {role === 'seller' ? 'Quản lý trạng thái đơn hàng' : 'Lịch sử mua hàng'}
      </h2>
      
      <div style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
        {/* Nếu là Seller thì hiện ô nhập, Buyer thì ẩn đi cho gọn */}
        {role === 'seller' && (
            <div className="form-row">
            <label>
                CustomerID (Nhập ID khách cần tra cứu)
                <input
                type="number"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                />
            </label>
            </div>
        )}

        <div style={{ margin: '10px 0', display: 'flex', gap: 15, flexWrap: 'wrap' }}>
            <span style={{fontWeight: 'bold'}}>Lọc theo trạng thái:</span>
            {(Object.keys(statusList) as Array<keyof typeof statusList>).map((st) => (
            <label key={st} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                type="checkbox"
                checked={statusList[st]}
                onChange={() => toggleStatus(st)}
                />
                {st}
            </label>
            ))}
        </div>
        <button className="btn btn--primary" onClick={handleFetch} disabled={loading}>
          {loading ? 'Đang tải...' : 'Xem dữ liệu'}
        </button>
      </div>

      {data.length === 0 ? (
        <div style={{color: '#666', fontStyle: 'italic'}}>Không có đơn hàng phù hợp hoặc chưa bấm Xem.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>OrderID</th>
              {role === 'seller' && <th>Khách hàng</th>}
              <th>Ngày đặt</th>
              <th>Trạng thái</th>
              <th>Mã vận đơn</th>
              <th>Địa chỉ giao</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.orderId}>
                <td>{row.orderId}</td>
                {role === 'seller' && (
                    <td style={{fontWeight:'bold', color: '#0056b3'}}>
                        {row.customerName || `ID: ${customerId}`}
                    </td>
                )}
                <td>{new Date(row.orderDate).toLocaleString('vi-VN')}</td>
                <td>
                    {role === 'seller' ? (
                        <select 
                            value={row.orderStatus}
                            onChange={(e) => handleChangeStatus(row.orderId, e.target.value)}
                            style={{ padding: '4px', borderRadius: '4px', borderColor: '#ddd'}}
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
                <td>{row.trackingCode || '---'}</td>
                <td>{row.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};