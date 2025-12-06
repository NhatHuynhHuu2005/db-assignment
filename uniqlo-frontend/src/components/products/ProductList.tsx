// // FE/src/components/products/ProductList.tsx
// import React, { useEffect, useMemo, useState } from 'react';
// import {
//   fetchProducts,
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   type Product,
//   addToCart
// } from '../../api/api';
// import { DataTable, type Column } from '../common/DataTable.js';
// import { Paginator } from '../common/Paginator.js';
// import { ProductForm } from './ProductForm.js';
// import '../../styles/Components.scss';

// // --- 1. COMPONENT CON: THẺ SẢN PHẨM (Dùng cho Khách Hàng) ---
// // Giúp mỗi sản phẩm có một ô nhập số lượng riêng
// const ProductCard: React.FC<{ product: Product; userId: number; }> = ({ product, userId }) => {
//     const [qty, setQty] = useState(1);

//     const handleBuy = async () => {
//         try {
//             await addToCart(product.id, qty, userId);
//             alert(`Đã thêm ${qty} sản phẩm vào giỏ!`);
//         } catch (e: any) {
//             console.error(e);
//             alert('Lỗi: ' + (e?.response?.data?.error || e.message));
//         }
//     };

//     return (
//         <div className="product-card">
//             <div>
//                 <h3 className="product-card__name">{product.name}</h3>
//                 <div className="product-card__price">
//                     {product.price ? product.price.toLocaleString('vi-VN') + ' ₫' : 'Liên hệ'}
//                 </div>
//                 <p className="product-card__desc">
//                     {product.description || 'Sản phẩm chất lượng cao từ Uniqlo Mini.'}
//                 </p>
//                 <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '16px' }}>
//                     #{product.categories?.join(', #') || 'general'}
//                 </div>
//             </div>

//             <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 'auto' }}>
//                 <div className="qty-control">
//                     <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
//                     <input 
//                         type="number" 
//                         value={qty} 
//                         onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
//                     />
//                     <button onClick={() => setQty(q => q + 1)}>+</button>
//                 </div>
                
//                 <button className="btn-buy" onClick={handleBuy}>
//                     <span>Thêm vào giỏ</span> 
//                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path><path d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
//                 </button>
//             </div>
//         </div>
//     );
// };

// // --- 2. COMPONENT CHÍNH: DANH SÁCH SẢN PHẨM ---
// interface ProductListProps {
//   role?: string;       
//   userId?: number;     
// }

// export const ProductList: React.FC<ProductListProps> = ({ role = 'buyer', userId = 9 }) => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState('');
//   const [error, setError] = useState<string | null>(null);
  
//   // State cho Admin
//   const [editing, setEditing] = useState<Product | null>(null);
//   const [showForm, setShowForm] = useState(false);

//   const [page, setPage] = useState(1);
//   const pageSize = 8; // Số sản phẩm trên 1 trang

//   const loadData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await fetchProducts(
//         search.trim() ? { search: search.trim() } : undefined
//       );
//       setProducts(data);
//     } catch (err: any) {
//       setError(err?.response?.data?.error || err?.message || 'Lỗi tải dữ liệu');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void loadData();
//   }, []);

//   const handleSearch = () => {
//     setPage(1);
//     void loadData();
//   };

//   // --- CÁC HÀM ADMIN ---
//   const handleAdd = () => { setEditing(null); setShowForm(true); };
//   const handleEdit = (p: Product) => { setEditing(p); setShowForm(true); };
//   const handleDelete = async (p: Product) => {
//     if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
//     try {
//       await deleteProduct(p.id);
//       await loadData();
//     } catch (err: any) {
//       alert('Không thể xóa sản phẩm');
//     }
//   };

//   const handleSubmitForm = async (payload: any, id?: number) => {
//     if (id) await updateProduct(id, payload);
//     else await createProduct(payload);
//     setShowForm(false);
//     setEditing(null);
//     await loadData();
//   };

//   // Phân trang
//   const pagedProducts = useMemo(() => {
//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;
//     return products.slice(start, end);
//   }, [products, page]);

//   // Cấu hình cột cho DataTable (Chỉ dùng cho ADMIN)
//   const adminColumns: Column<Product>[] = [
//       { key: 'id', header: 'ID', render: (row) => <span style={{fontWeight:'bold', color:'#888'}}>#{row.id}</span> },
//       { 
//           key: 'name', header: 'Tên sản phẩm', 
//           render: (row) => (
//               <div style={{fontWeight: 600, color: '#333'}}>{row.name}</div>
//           )
//       },
//       { 
//           key: 'price', header: 'Giá niêm yết', 
//           render: (row) => <span style={{color:'#e00000', fontWeight:'bold'}}>{row.price?.toLocaleString()} ₫</span> 
//       },
//       { 
//           key: 'categories', header: 'Danh mục', 
//           render: (row) => (
//             // Biến danh mục thành các thẻ nhỏ (Tag)
//             <div style={{display:'flex', gap: 5, flexWrap:'wrap'}}>
//                 {row.categories?.map(c => (
//                     <span key={c} style={{background:'#f5f5f5', padding:'4px 8px', borderRadius: 4, fontSize:'0.75rem', color:'#666'}}>
//                         {c}
//                     </span>
//                 ))}
//             </div>
//           ) 
//       },
//       {
//         key: 'actions', header: 'Thao tác',
//         render: (row) => (
//           <div style={{ display: 'flex', alignItems: 'center' }}>
//             {/* Nút Sửa */}
//             <button className="action-btn edit" onClick={() => handleEdit(row)} title="Sửa">
//                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
//             </button>
            
//             {/* Nút Xóa */}
//             <button className="action-btn delete" onClick={() => handleDelete(row)} title="Xóa">
//                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
//             </button>
//           </div>
//         )
//       }
//   ];

//   return (
//     <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 50 }}>
//       {/* Header & Nút Thêm Mới */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
//         <h2 style={{ fontSize: '1.8rem', color: '#333', margin: 0, fontWeight: 800 }}>
//           {role === 'seller' ? '📦 Quản lý kho hàng' : '🛍️ Sản phẩm nổi bật'}
//         </h2>
        
//         {role === 'seller' && (
//             <button className="btn-add-new" onClick={handleAdd}>
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
//                 Thêm sản phẩm
//             </button>
//         )}
//       </div>

//       {/* Thanh tìm kiếm */}
//       <div style={{ marginBottom: 25, display: 'flex', justifyContent: role === 'seller' ? 'flex-start' : 'center' }}>
//           <div className="search-wrapper">
//             <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Tìm kiếm theo tên, mã sản phẩm..."
//                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//             />
//             <button className="btn-search" onClick={handleSearch}>
//                 {loading ? '...' : 'Tìm kiếm'}
//             </button>
//           </div>
//       </div>

//       {error && <div className="error-msg">{error}</div>}
      
//       {loading ? (
//         <div style={{textAlign: 'center', padding: 50, color: '#999'}}>Đang tải dữ liệu...</div>
//       ) : (
//         <>
//           {role === 'seller' ? (
//               // --- GIAO DIỆN ADMIN (Bảng xịn) ---
//               <div className="card" style={{borderRadius: 16, padding: 0, border:'none', overflow: 'hidden', boxShadow:'0 5px 20px rgba(0,0,0,0.05)'}}>
//                   <DataTable<Product> 
//                     columns={adminColumns} 
//                     data={pagedProducts} 
//                     keyField="id" 
//                     emptyMessage="Kho hàng đang trống."
//                   />
//               </div>
//           ) : (
//               // --- GIAO DIỆN KHÁCH HÀNG (Lưới) ---
//               <div className="product-grid">
//                   {pagedProducts.map(p => (
//                       <ProductCard key={p.id} product={p} userId={userId} />
//                   ))}
//                   {pagedProducts.length === 0 && <div style={{width:'100%', textAlign:'center'}}>Không tìm thấy sản phẩm.</div>}
//               </div>
//           )}
          
//           {/* Phân trang */}
//           <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
//               <Paginator page={page} pageSize={pageSize} total={products.length} onChange={setPage} />
//           </div>
//         </>
//       )}

//       {showForm && (
//         <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100}}>
//              <div style={{minWidth: 500, animation: 'fadeIn 0.3s'}}>
//                 <ProductForm initial={editing} onSubmit={handleSubmitForm} onCancel={() => setShowForm(false)} />
//              </div>
//         </div>
//       )}
//     </div>
//   );
// };




// FE/src/components/products/ProductList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  addToCart
} from '../../api/api';
import { DataTable, type Column } from '../common/DataTable.js';
import { Paginator } from '../common/Paginator.js';
import { ProductForm } from './ProductForm.js';
import '../../styles/Components.scss';

// --- BẢNG ÁNH XẠ HÌNH ẢNH (Mapping) ---
const PRODUCT_IMAGES: Record<string, string> = {
    'Áo Giữ Nhiệt HEATTECH': 'Áo Giữ Nhiệt HEATTECH.jpg',
    'Áo Polo Dry-EX Thoáng Khí': 'Áo Polo Dry-EX Thoáng Khí.jpg',
    'Đầm Rayon Họa Tiết Hoa': 'Đầm Rayon Họa Tiết Hoa.webp',
    'Quần Jeans Ultra Stretch': 'Quần Jeans Ultra Stretch.webp',
    'Áo Khoác Chống Nắng UV Cut': 'Áo Khoác Chống Nắng UV Cut.jpg',
    'Áo Sơ Mi Flannel Caro': 'Áo Sơ Mi Flannel Caro.jpg',
    'Áo Thun Cổ Tròn Uniqlo U': 'Áo Thun Cổ Tròn Uniqlo U.avif'
};

// --- 1. COMPONENT CON: THẺ SẢN PHẨM (Dùng cho Khách Hàng) ---
const ProductCard: React.FC<{ product: Product; userId: number; }> = ({ product, userId }) => {
    const [qty, setQty] = useState(1);

    const handleBuy = async () => {
        try {
            await addToCart(product.id, qty, userId);
            alert(`Đã thêm ${qty} sản phẩm vào giỏ!`);
        } catch (e: any) {
            console.error(e);
            alert('Lỗi: ' + (e?.response?.data?.error || e.message));
        }
    };

    // Lấy đường dẫn ảnh
    const imageName = PRODUCT_IMAGES[product.name];
    const imageUrl = imageName ? `/images/${imageName}` : 'https://placehold.co/300x400?text=No+Image';

    return (
        <div className="product-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* --- PHẦN HÌNH ẢNH ĐÃ CHỈNH SỬA TỈ LỆ --- */}
            <div style={{ 
                width: '100%', 
                // Tăng chiều cao lên 320px để phù hợp với ảnh dáng đứng (portrait)
                height: '320px', 
                marginBottom: '15px', 
                borderRadius: '8px', 
                overflow: 'hidden',
                backgroundColor: '#f5f5f5',
                position: 'relative' // Để giữ vị trí
            }}>
                <img 
                    src={imageUrl} 
                    alt={product.name} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        // QUAN TRỌNG: Neo ảnh lên phía trên để không bị cắt đầu người mẫu
                        objectPosition: 'top center',
                        display: 'block',
                        transition: 'transform 0.3s ease'
                    }} 
                    onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/300x400?text=Image+Error';
                    }}
                    // Hiệu ứng zoom nhẹ khi di chuột (tùy chọn)
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
            </div>

            <div style={{ flex: 1 }}>
                <h3 className="product-card__name" style={{ fontSize: '1.1rem', marginBottom: '8px', lineHeight: '1.4' }}>{product.name}</h3>
                <div className="product-card__price" style={{ color: '#e00000', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    {product.price ? product.price.toLocaleString('vi-VN') + ' ₫' : 'Liên hệ'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '16px' }}>
                    #{product.categories?.join(', #') || 'general'}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <div className="qty-control">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                    <input 
                        type="number" 
                        value={qty} 
                        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    />
                    <button onClick={() => setQty(q => q + 1)}>+</button>
                </div>
                
                <button className="btn-buy" onClick={handleBuy} style={{ flex: 1 }}>
                    <span>Thêm vào giỏ</span> 
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path><path d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
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
      { key: 'id', header: 'ID', render: (row) => <span style={{fontWeight:'bold', color:'#888'}}>#{row.id}</span> },
      { 
          key: 'name', header: 'Tên sản phẩm', 
          render: (row) => (
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <img 
                    src={PRODUCT_IMAGES[row.name] ? `/images/${PRODUCT_IMAGES[row.name]}` : 'https://placehold.co/50'} 
                    alt="" 
                    style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}}
                  />
                  <div style={{fontWeight: 600, color: '#333'}}>{row.name}</div>
              </div>
          )
      },
      { 
          key: 'price', header: 'Giá niêm yết', 
          render: (row) => <span style={{color:'#e00000', fontWeight:'bold'}}>{row.price?.toLocaleString()} ₫</span> 
      },
      { 
          key: 'categories', header: 'Danh mục', 
          render: (row) => (
            <div style={{display:'flex', gap: 5, flexWrap:'wrap'}}>
                {row.categories?.map(c => (
                    <span key={c} style={{background:'#f5f5f5', padding:'4px 8px', borderRadius: 4, fontSize:'0.75rem', color:'#666'}}>
                        {c}
                    </span>
                ))}
            </div>
          ) 
      },
      {
        key: 'actions', header: 'Thao tác',
        render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="action-btn edit" onClick={() => handleEdit(row)} title="Sửa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button className="action-btn delete" onClick={() => handleDelete(row)} title="Xóa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        )
      }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 50 }}>
      {/* Header & Nút Thêm Mới */}
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

      {/* Thanh tìm kiếm */}
      <div style={{ marginBottom: 25, display: 'flex', justifyContent: role === 'seller' ? 'flex-start' : 'center' }}>
          <div className="search-wrapper">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên, mã sản phẩm..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}>
                {loading ? '...' : 'Tìm kiếm'}
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
                  <DataTable<Product> 
                    columns={adminColumns} 
                    data={pagedProducts} 
                    keyField="id" 
                    emptyMessage="Kho hàng đang trống."
                  />
              </div>
          ) : (
              <div className="product-grid">
                  {pagedProducts.map(p => (
                      <ProductCard key={p.id} product={p} userId={userId} />
                  ))}
                  {pagedProducts.length === 0 && <div style={{width:'100%', textAlign:'center'}}>Không tìm thấy sản phẩm.</div>}
              </div>
          )}
          
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
              <Paginator page={page} pageSize={pageSize} total={products.length} onChange={setPage} />
          </div>
        </>
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