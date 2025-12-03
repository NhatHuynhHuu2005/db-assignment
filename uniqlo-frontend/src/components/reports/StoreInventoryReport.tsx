// FE/src/components/reports/StoreInventoryReport.tsx
import React, { useState } from 'react';
import {
  fetchStoreInventoryReport,
  fetchStoreLowStockReport,
  type StoreInventoryRow,
  type LowStockRow
} from '../../api/api';
import { DataTable, type Column } from '../common/DataTable';

export const StoreInventoryReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'high' | 'low'>('high');

  // Tab 1
  const [minTotalItems, setMinTotalItems] = useState<number>(500);
  const [storeNameKeyword, setStoreNameKeyword] = useState('');
  const [highRows, setHighRows] = useState<StoreInventoryRow[]>([]);

  // Tab 2
  const [storeId, setStoreId] = useState<number>(10);
  const [threshold, setThreshold] = useState<number>(50);
  const [lowRows, setLowRows] = useState<LowStockRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columnsHigh: Column<StoreInventoryRow>[] = [
    { key: 'storeName', header: 'Cửa hàng / Kho' },
    { key: 'address', header: 'Địa chỉ' },
    { key: 'skuCount', header: 'Số SKU' },
    { key: 'totalItems', header: 'Tổng số lượng' }
  ];

  const columnsLow: Column<LowStockRow>[] = [
    { key: 'productName', header: 'Sản phẩm' },
    { key: 'variantInfo', header: 'Biến thể' },
    { key: 'qty', header: 'Tồn kho' },
    { key: 'note', header: 'Ghi chú' }
  ];

  const handleLoadHigh = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchStoreInventoryReport({
        minTotalItems,
        storeNameKeyword: storeNameKeyword.trim() || undefined
      });
      setHighRows(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Không thể tải báo cáo tồn kho'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLow = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchStoreLowStockReport({
        storeId,
        threshold
      });
      setLowRows(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Không thể tải danh sách sắp hết hàng'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card__title">Báo cáo tồn kho</h2>

      <div className="tabs">
        <button
          className={
            'tabs__tab ' +
            (activeTab === 'high' ? 'tabs__tab--active' : '')
          }
          onClick={() => setActiveTab('high')}
        >
          Kho nhiều hàng
        </button>
        <button
          className={
            'tabs__tab ' +
            (activeTab === 'low' ? 'tabs__tab--active' : '')
          }
          onClick={() => setActiveTab('low')}
        >
          Sắp hết hàng
        </button>
      </div>

      {activeTab === 'high' && (
        <>
          <div className="form-row">
            <label>
              Min Total Items
              <input
                type="number"
                value={minTotalItems}
                onChange={(e) =>
                  setMinTotalItems(Number(e.target.value) || 0)
                }
              />
            </label>
            <label>
              Tên cửa hàng chứa
              <input
                value={storeNameKeyword}
                onChange={(e) =>
                  setStoreNameKeyword(e.target.value)
                }
                placeholder="VD: Kho, UNIQLO Đồng Khởi..."
              />
            </label>
          </div>
          {error && (
            <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
          )}
          <button
            className="btn btn--primary"
            onClick={handleLoadHigh}
            disabled={loading}
          >
            Xem báo cáo
          </button>
          <div style={{ marginTop: 16 }}>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <DataTable<StoreInventoryRow>
                columns={columnsHigh}
                data={highRows}
                keyField="storeName"
                emptyMessage="Không có cửa hàng nào thỏa điều kiện"
              />
            )}
          </div>
        </>
      )}

      {activeTab === 'low' && (
        <>
          <div className="form-row">
            <label>
              StoreID
              <input
                type="number"
                value={storeId}
                onChange={(e) =>
                  setStoreId(Number(e.target.value) || 0)
                }
              />
            </label>
            <label>
              Ngưỡng (Threshold)
              <input
                type="number"
                value={threshold}
                onChange={(e) =>
                  setThreshold(Number(e.target.value) || 0)
                }
              />
            </label>
          </div>
          {error && (
            <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
          )}
          <button
            className="btn btn--primary"
            onClick={handleLoadLow}
            disabled={loading}
          >
            Xem danh sách
          </button>
          <div style={{ marginTop: 16 }}>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <DataTable<LowStockRow>
                columns={columnsLow}
                data={lowRows}
                keyField="productName"
                emptyMessage="Không có mặt hàng sắp hết"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
