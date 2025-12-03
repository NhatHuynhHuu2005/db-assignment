// FE/src/components/reports/CustomerOrdersReport.tsx
import React, { useState } from 'react';
import {
  fetchCustomerOrdersReport,
  type CustomerOrderRow
} from '../../api/api';
import { DataTable, type Column } from '../common/DataTable';

const STATUS_OPTIONS = [
  'Pending',
  'Processing',
  'Shipping',
  'Delivered',
  'Cancelled'
];

export const CustomerOrdersReport: React.FC = () => {
  const [customerId, setCustomerId] = useState<number>(9);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'Pending',
    'Shipping'
  ]);
  const [rows, setRows] = useState<CustomerOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId || selectedStatuses.length === 0) {
      setError('CustomerID và ít nhất một trạng thái là bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchCustomerOrdersReport({
        customerId,
        statusList: selectedStatuses
      });
      setRows(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Không thể tải báo cáo đơn hàng'
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<CustomerOrderRow>[] = [
    { key: 'orderId', header: 'OrderID' },
    { key: 'orderDate', header: 'Ngày đặt' },
    { key: 'orderStatus', header: 'Trạng thái' },
    { key: 'trackingCode', header: 'Mã vận đơn' },
    { key: 'unitName', header: 'Đơn vị vận chuyển' },
    { key: 'address', header: 'Địa chỉ giao' }
  ];

  return (
    <div className="card">
      <h2 className="card__title">Báo cáo đơn hàng khách hàng</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            CustomerID
            <input
              type="number"
              value={customerId}
              onChange={(e) =>
                setCustomerId(Number(e.target.value) || 0)
              }
            />
          </label>
          <div>
            <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>
              Trạng thái đơn hàng
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUS_OPTIONS.map((s) => (
                <label key={s} style={{ fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(s)}
                    onChange={() => toggleStatus(s)}
                  />{' '}
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
        )}
        <button
          className="btn btn--primary"
          type="submit"
          disabled={loading}
        >
          Xem báo cáo
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <DataTable<CustomerOrderRow>
            columns={columns}
            data={rows}
            keyField="orderId"
            emptyMessage="Không có đơn hàng phù hợp"
          />
        )}
      </div>
    </div>
  );
};
