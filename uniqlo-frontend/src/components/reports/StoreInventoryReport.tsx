// FE/src/components/reports/StoreInventoryReport.tsx
import React, { useState } from 'react';
import {
  fetchStoreInventoryReport,
  fetchStoreLowStockReport,
  type StoreInventoryRow,
  type LowStockRow
} from '../../api/api';
import { DataTable, type Column } from '../common/DataTable';
import '../../styles/Components.scss';

export const StoreInventoryReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'high' | 'low'>('high');

  // Tab 1: High Stock
  const [minTotalItems, setMinTotalItems] = useState<number>(500);
  const [storeNameKeyword, setStoreNameKeyword] = useState('');
  const [highRows, setHighRows] = useState<StoreInventoryRow[]>([]);

  // Tab 2: Low Stock
  const [storeId, setStoreId] = useState<number>(10);
  const [threshold, setThreshold] = useState<number>(50);
  const [lowRows, setLowRows] = useState<LowStockRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Định nghĩa cột cho bảng (Thêm chút style cho đẹp)
  const columnsHigh: Column<StoreInventoryRow>[] = [
    { key: 'storeName', header: 'Kho / Cửa hàng', render: (row) => <span style={{fontWeight:'bold', color:'#333'}}>{row.storeName}</span> },
    { key: 'address', header: 'Địa chỉ', render: (row) => <span style={{color:'#666'}}>{row.address}</span> },
    { key: 'skuCount', header: 'Số loại SKU', render: (row) => <span style={{background:'#e3f2fd', color:'#1565c0', padding:'4px 8px', borderRadius:4, fontWeight:'bold'}}>{row.skuCount}</span> },
    { key: 'totalItems', header: 'Tổng tồn kho', render: (row) => <span style={{color:'#e00000', fontWeight:'bold', fontSize:'1.1rem'}}>{row.totalItems.toLocaleString()}</span> }
  ];

  const columnsLow: Column<LowStockRow>[] = [
    { key: 'productName', header: 'Sản phẩm', render: (row) => <span style={{fontWeight:600}}>{row.productName}</span> },
    { key: 'variantInfo', header: 'Biến thể (Màu/Size)', render: (row) => <span style={{fontFamily:'monospace', background:'#f5f5f5', padding:'4px 6px', borderRadius:4}}>{row.variantInfo}</span> },
    { key: 'qty', header: 'Tồn kho', render: (row) => <span style={{color:'red', fontWeight:'bold'}}>{row.qty}</span> },
    { key: 'note', header: 'Trạng thái', render: (row) => <span style={{background:'#ffebee', color:'#c62828', padding:'4px 10px', borderRadius:20, fontSize:'0.85rem', fontWeight:'bold'}}>⚠️ {row.note}</span> }
  ];

  const handleLoadHigh = async () => {
    setError(null); setLoading(true);
    try {
      const data = await fetchStoreInventoryReport({ minTotalItems, storeNameKeyword: storeNameKeyword.trim() || undefined });
      setHighRows(data);
    } catch (err: any) { setError(err.message || 'Lỗi tải báo cáo'); } 
    finally { setLoading(false); }
  };

  const handleLoadLow = async () => {
    setError(null); setLoading(true);
    try {
      const data = await fetchStoreLowStockReport({ storeId, threshold });
      setLowRows(data);
    } catch (err: any) { setError(err.message || 'Lỗi tải báo cáo'); } 
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 50 }}>
      <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: 25, fontWeight: 800 }}>
        📊 Báo cáo tồn kho
      </h2>

      {/* THANH CHUYỂN TAB (Segmented Control) */}
      <div className="tab-segment">
        <button
          className={`tab-btn ${activeTab === 'high' ? 'active' : ''}`}
          onClick={() => setActiveTab('high')}
        >
          🏭 Kho nhiều hàng (High Stock)
        </button>
        <button
          className={`tab-btn ${activeTab === 'low' ? 'active' : ''}`}
          onClick={() => setActiveTab('low')}
        >
          📉 Sắp hết hàng (Low Stock)
        </button>
      </div>

      {/* NỘI DUNG TAB 1 */}
      {activeTab === 'high' && (
        <div className="card" style={{borderRadius: 16, padding: 30, border:'none', boxShadow:'0 5px 20px rgba(0,0,0,0.05)'}}>
          <div className="filter-bar" style={{marginBottom: 20}}>
            <div className="inventory-filter">
                <div style={{display:'flex', flexDirection:'column', gap: 5}}>
                    <label>Tổng tồn kho tối thiểu</label>
                    <input type="number" value={minTotalItems} onChange={(e) => setMinTotalItems(Number(e.target.value) || 0)} style={{width: 150}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap: 5}}>
                    <label>Tên kho / Cửa hàng</label>
                    <input value={storeNameKeyword} onChange={(e) => setStoreNameKeyword(e.target.value)} placeholder="Nhập tên kho..." style={{width: 250}} />
                </div>
                <button className="btn-filter" onClick={handleLoadHigh} disabled={loading} style={{marginTop: 22}}>
                    {loading ? 'Đang tải...' : 'Xem báo cáo'}
                </button>
            </div>
          </div>

          <DataTable<StoreInventoryRow> columns={columnsHigh} data={highRows} keyField="storeName" emptyMessage="Không tìm thấy kho nào thỏa điều kiện." />
        </div>
      )}

      {/* NỘI DUNG TAB 2 */}
      {activeTab === 'low' && (
        <div className="card" style={{borderRadius: 16, padding: 30, border:'none', boxShadow:'0 5px 20px rgba(0,0,0,0.05)'}}>
          <div className="filter-bar" style={{marginBottom: 20}}>
             <div className="inventory-filter">
                <div style={{display:'flex', flexDirection:'column', gap: 5}}>
                    <label>ID Cửa hàng</label>
                    <input type="number" value={storeId} onChange={(e) => setStoreId(Number(e.target.value) || 0)} style={{width: 120}} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap: 5}}>
                    <label>Ngưỡng báo động (Threshold)</label>
                    <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value) || 0)} style={{width: 120}} />
                </div>
                <button className="btn-filter" onClick={handleLoadLow} disabled={loading} style={{marginTop: 22}}>
                    {loading ? 'Đang tải...' : 'Quét sản phẩm'}
                </button>
            </div>
          </div>
          
          <DataTable<LowStockRow> columns={columnsLow} data={lowRows} keyField="variantInfo" emptyMessage="Tuyệt vời! Không có sản phẩm nào dưới ngưỡng này." />
        </div>
      )}

      {error && <div className="error-msg" style={{marginTop: 20}}>{error}</div>}
    </div>
  );
};