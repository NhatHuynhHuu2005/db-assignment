// FE/src/components/products/ProductList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  addToCart // Import hàm này
} from '../../api/api';
import { DataTable, type Column } from '../common/DataTable.js';
import { Paginator } from '../common/Paginator.js';
import { ProductForm } from './ProductForm.js';

// --- 1. COMPONENT CON: THẺ SẢN PHẨM (Dùng cho Khách Hàng) ---
// Giúp mỗi sản phẩm có một ô nhập số lượng riêng
const ProductCard: React.FC<{ 
    product: Product; 
    userId: number; 
}> = ({ product, userId }) => {
    const [qty, setQty] = useState(1);

    const handleBuy = async () => {
        try {
            // Gọi API thêm vào giỏ với userId và số lượng
            await addToCart(product.id, qty, userId);
            alert(`Đã thêm ${qty} sản phẩm "${product.name}" vào giỏ!`);
        } catch (e: any) {
            console.error(e);
            alert('Lỗi thêm giỏ hàng: ' + (e?.response?.data?.error || e.message));
        }
    };

    return (
        <div className="product-card" style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
            <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{product.name}</h3>
                <div style={{ color: '#e00000', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '8px' }}>
                    {product.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) : 'Liên hệ'}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>
                    {product.description || 'Chưa có mô tả'}
                </p>
                <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '16px' }}>
                    Danh mục: {product.categories?.join(', ') || '---'}
                </div>
            </div>

            {/* Khu vực chọn số lượng và nút mua */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
                <button 
                    className="btn btn--sm" 
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ background: '#eee', color: '#333' }}
                >-</button>
                <input 
                    type="number" 
                    value={qty} 
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    style={{ width: '40px', textAlign: 'center', padding: '4px' }} 
                />
                <button 
                    className="btn btn--sm" 
                    onClick={() => setQty(q => q + 1)}
                    style={{ background: '#eee', color: '#333' }}
                >+</button>
                
                <button 
                    className="btn btn--primary" 
                    onClick={handleBuy}
                    style={{ flex: 1 }}
                >
                    Chọn mua 🛒
                </button>
            </div>
        </div>
    );
};

// --- 2. COMPONENT CHÍNH: DANH SÁCH SẢN PHẨM ---
interface ProductListProps {
  role?: string;       
  userId?: number;     
}

export const ProductList: React.FC<ProductListProps> = ({ role = 'buyer', userId = 9 }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // State cho Admin
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 8; // Số sản phẩm trên 1 trang

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(
        search.trim() ? { search: search.trim() } : undefined
      );
      setProducts(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSearch = () => {
    setPage(1);
    void loadData();
  };

  // --- CÁC HÀM ADMIN ---
  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (p: Product) => { setEditing(p); setShowForm(true); };
  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      await loadData();
    } catch (err: any) {
      alert('Không thể xóa sản phẩm');
    }
  };

  const handleSubmitForm = async (payload: any, id?: number) => {
    if (id) await updateProduct(id, payload);
    else await createProduct(payload);
    setShowForm(false);
    setEditing(null);
    await loadData();
  };

  // Phân trang
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return products.slice(start, end);
  }, [products, page]);

  // Cấu hình cột cho DataTable (Chỉ dùng cho ADMIN)
  const adminColumns: Column<Product>[] = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Tên sản phẩm' },
      { 
        key: 'price', header: 'Giá',
        render: (row) => row.price ? row.price.toLocaleString() + ' đ' : '-'
      },
      { key: 'categories', header: 'Danh mục', render: (row) => row.categories?.join(', ') },
      {
        key: 'actions', header: 'Thao tác',
        render: (row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--outline" onClick={() => handleEdit(row)}>Sửa</button>
            <button className="btn btn--primary" onClick={() => handleDelete(row)}>Xóa</button>
          </div>
        )
      }
  ];

  return (
    <div>
      <div className="card">
        <h2 className="card__title">
          {role === 'seller' ? 'Quản lý kho hàng (Admin)' : 'Danh sách sản phẩm'}
        </h2>
        
        {/* Thanh tìm kiếm */}
        <div className="form-row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              style={{ flex: 1, padding: '8px' }}
            />
            <button className="btn btn--outline" onClick={handleSearch} disabled={loading}>
              Tìm
            </button>
          </div>
          {role === 'seller' && (
            <button className="btn btn--primary" onClick={handleAdd} style={{ marginLeft: 16 }}>
              + Thêm mới
            </button>
          )}
        </div>

        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : (
          <>
            {/* LOGIC HIỂN THỊ KHÁC NHAU THEO ROLE */}
            
            {role === 'seller' ? (
                // ADMIN: Xem dạng Bảng (DataTable)
                <DataTable<Product>
                    columns={adminColumns}
                    data={pagedProducts}
                    keyField="id"
                    emptyMessage="Chưa có sản phẩm nào."
                />
            ) : (
                // BUYER: Xem dạng Lưới (Grid)
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                    gap: '20px' 
                }}>
                    {pagedProducts.map(p => (
                        <ProductCard 
                            key={p.id} 
                            product={p} 
                            userId={userId} 
                        />
                    ))}
                    {pagedProducts.length === 0 && <div>Không tìm thấy sản phẩm nào.</div>}
                </div>
            )}

            {/* Phân trang chung */}
            <div style={{ marginTop: 20 }}>
                <Paginator
                page={page}
                pageSize={pageSize}
                total={products.length}
                onChange={setPage}
                />
            </div>
          </>
        )}
      </div>

      {/* Form Admin */}
      {showForm && (
        <ProductForm
          initial={editing}
          onSubmit={handleSubmitForm}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
};