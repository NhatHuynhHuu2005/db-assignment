// FE/src/components/products/ProductList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  addToCart,
  addToGuestCart,
  type ProductDetail
} from '../../api/api';
import { DataTable, type Column } from '../common/DataTable.js';
import { Paginator } from '../common/Paginator.js';
import { ProductForm } from './ProductForm.js';
import { ProductVariantModal } from './ProductVariantModal';
import { Toast } from '../common/Toast.js';
import '../../styles/Components.scss';

// --- BẢNG ÁNH XẠ HÌNH ẢNH (GIỮ NGUYÊN ĐỂ ẢNH ĐẸP) ---
const PRODUCT_IMAGES: Record<string, string> = {
    'Áo Giữ Nhiệt HEATTECH Cổ Tròn': 'Áo Giữ Nhiệt HEATTECH.jpg',
    'Áo Polo Dry-EX Thoáng Khí': 'Áo Polo Dry-EX Thoáng Khí.jpg',
    'Đầm Rayon Họa Tiết Hoa Dài': 'Đầm Rayon Họa Tiết Hoa.webp',
    'Quần Jeans Nữ Ultra Stretch': 'Quần Jeans Ultra Stretch.webp',
    'Áo Khoác Parka Chống Nắng UV': 'Áo Khoác Chống Nắng UV Cut.jpg',
    'Áo Sơ Mi Nam Flannel Caro': 'Áo Sơ Mi Flannel Caro.jpg',
    'Áo Thun Cổ Tròn U (Cotton)': 'Áo Thun Cổ Tròn Uniqlo U.avif',
    'Váy Chân Váy Xếp Ly Chiffon': 'Váy Chân Váy Xếp Ly Chiffon.png',
    'Quần Kaki Ống Đứng Nam': 'Quần Kaki Ống Đứng Nam.jpg',
    'Áo Len Lông Cừu Cao Cấp': 'Áo Len Lông Cừu Cao Cấp.jpg',
    'Túi Đeo Vai Mini Da Pu': 'Túi Đeo Vai Mini Da Pu.avif',
    'Vớ Thể Thao Dry-Ex': 'Vớ Thể Thao Dry-Ex.webp',
    'Áo Bra Top Cotton': 'Áo Bra Top Cotton.avif',
    'Áo Khoác Puffer Siêu Nhẹ': 'Áo Khoác Puffer Siêu Nhẹ.webp',
    'Quần Short Nữ Vải Lanh': 'Quần Short Nữ Vải Lanh.jpg'
};

// --- 1. COMPONENT CON: THẺ SẢN PHẨM (GIỮ NGUYÊN UI ĐẸP CỦA BẠN) ---
const ProductCard: React.FC<{ product: Product; onOpenModal: (p: Product) => void }> = ({ product, onOpenModal }) => {
    
    // Logic lấy ảnh: Ưu tiên Mapping, nếu ko có thì lấy từ DB, cuối cùng là Placeholder
    const imageName = PRODUCT_IMAGES[product.name];
    const imageUrl = imageName ? `/images/${imageName}` : (product.imageUrl || 'https://placehold.co/300x400?text=No+Image');

    // --- LOGIC HIỂN THỊ BADGE KHUYẾN MÃI ---
    const renderPromoBadge = () => {
        if (!product.promoDetails) return null;
        
        const { type, value } = product.promoDetails;

        if (type === 'Buy1Get1') {
            return (
                <div style={{
                    position: 'absolute', top: 10, left: 10,
                    zIndex: 10, // Quan trọng: Đè lên ảnh khi hover
                    background: 'linear-gradient(45deg, #ff007f, #ff5e62)',
                    color: 'white', padding: '4px 8px', borderRadius: '4px',
                    fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    🎁 MUA 1 TẶNG 1
                </div>
            );
        }
        
        if (type === 'Percentage') {
            return (
                <div style={{
                    position: 'absolute', top: 10, right: 10,
                    zIndex: 10,
                    background: '#e00000', color: 'white',
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    <span>-{value}%</span>
                </div>
            );
        }

        if (type === 'FixedAmount') {
             return (
                <div style={{
                    position: 'absolute', top: 10, right: 10,
                    zIndex: 10,
                    background: '#e00000', color: 'white',
                    padding: '4px 8px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 'bold'
                }}>
                    -{value.toLocaleString()}₫
                </div>
            );
        }
    };

    return (
        <div className="product-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {renderPromoBadge()}

            <div style={{ width: '100%', height: '320px', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                <img 
                    src={imageUrl} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x400?text=No+Image'; }}
                />
            </div>

            <div style={{ flex: 1 }}>
                {product.promoDetails && (
                    <div style={{
                        display: 'inline-block', background: '#fff0f0', color: '#e00000', 
                        fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', marginBottom: 5,
                        border: '1px solid #ffcccc', fontWeight: 600
                    }}>
                        🔥 {product.promoDetails.name}
                    </div>
                )}

                <h3 className="product-card__name" style={{ fontSize: '1.1rem', marginBottom: '8px', lineHeight: '1.4' }}>{product.name}</h3>
                
                <div className="product-card__price" style={{ marginBottom: '8px' }}>
                    {product.finalPrice && product.price && product.finalPrice < product.price ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#e00000', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {product.finalPrice.toLocaleString('vi-VN')} ₫
                            </span>
                            <span style={{ color: '#999', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                                {product.price.toLocaleString('vi-VN')} ₫
                            </span>
                        </div>
                    ) : (
                        <span style={{ color: '#333', fontSize: '1.1rem', fontWeight: 'bold' }}>
                            {product.price ? product.price.toLocaleString('vi-VN') + ' ₫' : 'Liên hệ'}
                        </span>
                    )}
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '16px' }}>
                    #{product.categories?.join(', #') || 'NewArrival'}
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 15, display: 'flex', justifyContent: 'center' }}>
                <button className="btn-add-cart-mini" onClick={() => onOpenModal(product)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <span>Thêm vào giỏ</span>
                </button>
            </div>
        </div>
    );
};

// --- 2. COMPONENT CHÍNH ---
interface ProductListProps {
  role?: string;       
  userId?: number;     
}

export const ProductList: React.FC<ProductListProps> = ({ role = 'buyer', userId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

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

  const handleOpenModal = async (product: Product) => {
    try {
        const detail = await fetchProductById(product.id);
        setSelectedProductDetail(detail);
        setIsModalOpen(true);
    } catch (err) {
        setToast({ msg: 'Lỗi tải chi tiết sản phẩm!', type: 'error' });
    }
  };

  const handleConfirmAddToCart = async (variantId: number, color: string, size: string, price: number, qty: number) => {
      if (!selectedProductDetail) return;
      try {
          if (userId) {
              await addToCart(selectedProductDetail.id, variantId, qty, userId);
          } else {
              addToGuestCart(selectedProductDetail, variantId, color, size, price, qty);
          }
          setToast({ msg: `Đã thêm thành công ${qty} sản phẩm!`, type: 'success' });
          setIsModalOpen(false);
      } catch (e: any) {
          setToast({ msg: 'Lỗi: ' + e.message, type: 'error' });
      }
  };

  // --- CÁC HÀM ADMIN ---
  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = async (p: Product) => {
    try {
        const detail = await fetchProductById(p.id);
        setEditing(detail); 
        setShowForm(true);
    } catch (err: any) {
        setToast({ msg: "Không thể tải chi tiết sản phẩm: " + err.message, type: "error" });
    }
  };
  
  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setToast({ msg: "Đã xóa sản phẩm thành công", type: "success" });
      await loadData();
    } catch (err: any) {
      setToast({ msg: "Lỗi xóa: " + (err.response?.data?.error || err.message), type: "error" });
    }
  };

  // --- LẤY LOGIC SUBMIT THÔNG MINH TỪ FILE FINAL ---
  const handleSubmitForm = async (payload: any, id?: number) => {
    try {
        // Tự động gán EmployeeID từ người dùng đăng nhập nếu chưa có
        const finalPayload = {
            ...payload,
            employeeId: payload.employeeId || userId || 1, // Fallback 1 nếu lỗi
        };

        if (id) await updateProduct(id, finalPayload);
        else await createProduct(finalPayload);

        setShowForm(false);
        setEditing(null);
        setToast({ msg: id ? "Cập nhật thành công" : "Tạo mới thành công", type: "success" });
        await loadData();
    } catch (err: any) {
        alert("Lỗi lưu: " + err.message);
    }
  };

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return products.slice(start, end);
  }, [products, page]);

  // Cấu hình cột Admin (Dùng ảnh Mapping cho đẹp)
  const adminColumns: Column<Product>[] = [
      { key: 'id', header: 'ID', render: (row) => <span style={{fontWeight:'bold', color:'#888'}}>#{row.id}</span> },
      { 
          key: 'name', header: 'Tên sản phẩm', 
          render: (row) => (
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <img 
                    src={PRODUCT_IMAGES[row.name] ? `/images/${PRODUCT_IMAGES[row.name]}` : (row.imageUrl || 'https://placehold.co/50')} 
                    alt="" 
                    style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}}
                  />
                  <div style={{fontWeight: 600, color: '#333'}}>{row.name}</div>
              </div>
          )
      },
      { 
          key: 'variantSummary', header: 'Phân loại', 
          render: (row) => (
            <div style={{fontSize: '0.85rem', color: '#555', maxWidth: '200px'}}>
                {row.variantSummary || <span style={{fontStyle:'italic', color:'#999'}}>(Chưa có)</span>}
            </div>
          ) 
      },
      { 
          key: 'price', header: 'Giá', 
          render: (row) => <span style={{color:'#e00000', fontWeight:'bold'}}>{row.price?.toLocaleString()} ₫</span> 
      },
      {
        key: 'actions', header: 'Thao tác',
        render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button className="action-btn edit" onClick={() => handleEdit(row)} title="Sửa">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button className="action-btn delete" onClick={() => handleDelete(row)} title="Xóa">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        )
      }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 50 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h2 style={{ fontSize: '1.8rem', color: '#333', margin: 0, fontWeight: 800 }}>
          {role === 'seller' ? '📦 Quản lý kho hàng' : '🛍️ Sản phẩm nổi bật'}
        </h2>
        {role === 'seller' && (
            <button className="btn-add-new" onClick={handleAdd}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Thêm sản phẩm
            </button>
        )}
      </div>

      <div style={{ marginBottom: 25, display: 'flex', justifyContent: role === 'seller' ? 'flex-start' : 'center' }}>
          <div className="search-wrapper">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}>
                {loading ? '...' : 'Tìm'}
            </button>
          </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      
      {loading ? (
        <div style={{textAlign: 'center', padding: 50, color: '#999'}}>Đang tải dữ liệu...</div>
      ) : (
        <>
          {role === 'seller' ? (
              <div className="card" style={{borderRadius: 16, padding: 0, border:'none', overflow: 'hidden', boxShadow:'0 5px 20px rgba(0,0,0,0.05)'}}>
                  <DataTable<Product> columns={adminColumns} data={pagedProducts} keyField="id" emptyMessage="Kho hàng trống." />
              </div>
          ) : (
              <div className="product-grid">
                  {pagedProducts.map(p => (
                      <ProductCard key={p.id} product={p} onOpenModal={handleOpenModal} />
                  ))}
              </div>
          )}
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
              <Paginator page={page} pageSize={pageSize} total={products.length} onChange={setPage} />
          </div>
        </>
      )}

      {isModalOpen && selectedProductDetail && (
          <ProductVariantModal 
              product={selectedProductDetail} 
              onClose={() => setIsModalOpen(false)} 
              onConfirm={handleConfirmAddToCart}
              userId={userId} // <--- TRUYỀN USER ID VÀO ĐÂY
          />
      )}

      {showForm && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100}}>
            <div style={{minWidth: 500, animation: 'fadeIn 0.3s'}}>
                <ProductForm initial={editing} onSubmit={handleSubmitForm} onCancel={() => setShowForm(false)} />
            </div>
        </div>
      )}
    </div>
  );
};