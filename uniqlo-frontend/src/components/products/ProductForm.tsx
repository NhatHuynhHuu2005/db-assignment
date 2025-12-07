import React, { useState, useEffect } from 'react';
// 1. Xóa 'Product' khỏi import để hết lỗi unused
import type { ProductPayload, VariantPayload } from '../../api/api';

interface ProductFormProps {
  // Dùng any để linh hoạt nhận cả Product thường lẫn ProductDetail (có variants)
  initial?: any; 
  onSubmit: (payload: ProductPayload, id?: number) => Promise<void>;
  onCancel: () => void;
}

// --- DỮ LIỆU DANH MỤC ---
// --- DỮ LIỆU DANH MỤC (Đã đồng bộ khớp với SQL Server) ---
const CATEGORIES = [
  // Cấp 1
  { id: 1, name: 'Nam', parentId: null },
  { id: 2, name: 'Nữ', parentId: null },
  { id: 3, name: 'Trẻ em', parentId: null },
  
  // Cấp 2 - NAM (Parent 1)
  { id: 4, name: 'Áo', parentId: 1 },
  { id: 5, name: 'Quần', parentId: 1 },
  { id: 6, name: 'Áo khoác', parentId: 1 },
  { id: 7, name: 'Áo len/Áo nỉ', parentId: 1 }, // <--- Sửa ID từ 8 thành 7

  // Cấp 2 - NỮ (Parent 2)
  { id: 8, name: 'Áo', parentId: 2 },           // <--- ID 8 là Áo nữ
  { id: 9, name: 'Quần/Chân váy', parentId: 2 },
  { id: 10, name: 'Đầm/Váy liền', parentId: 2 },

  // Cấp 2 - Chung
  { id: 11, name: 'Phụ kiện', parentId: null },
  { id: 12, name: 'Đồ lót/Đồ mặc trong', parentId: null },

  // Cấp 3 (Con của Áo và Áo khoác Nam) - Kiểm tra lại ID trong SQL nếu có
  { id: 13, name: 'Áo giữ nhiệt', parentId: 4}, 
  { id: 14, name: 'Chống nắng', parentId: 6 }   // Sửa parentId thành 6 (Áo khoác Nam) cho đúng logic
];
export const ProductForm: React.FC<ProductFormProps> = ({
  initial,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState<number>(3);
  const [description, setDescription] = useState('');
  
  // State danh sách biến thể (Màu/Size/Giá)
  const [variants, setVariants] = useState<VariantPayload[]>([
      { color: '', size: '', price: 0 }
  ]);

  // State danh mục
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTabId, setActiveTabId] = useState<number>(1); 

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- LOGIC: Khởi tạo dữ liệu khi Edit ---
  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || '');
      setEmployeeId(initial.employeeId ?? 3);
      
      // Load variants: Nếu có thì load, không thì tạo dòng mặc định từ price cũ
      if (initial.variants && initial.variants.length > 0) {
          setVariants(initial.variants.map((v: any) => ({
              variantId: v.variantId,
              color: v.color,
              size: v.size,
              price: v.price
          })));
      } else {
          // Fallback cho data cũ
          setVariants([{ color: 'Mặc định', size: 'Free', price: initial.price || 0 }]);
      }
      
      if (initial.categoryId) {
         setSelectedCategoryId(initial.categoryId);
         // Logic tìm tab cha
         const currentCat = CATEGORIES.find(c => c.id === initial.categoryId);
         if (currentCat) {
             if (currentCat.parentId === null) {
                 setActiveTabId(currentCat.id);
             } else {
                 const parent = CATEGORIES.find(p => p.id === currentCat.parentId);
                 if (parent) {
                     if (parent.parentId === null) {
                         setActiveTabId(parent.id);
                     } else {
                         const grandParent = CATEGORIES.find(gp => gp.id === parent.parentId);
                         if (grandParent) setActiveTabId(grandParent.id);
                     }
                 }
             }
         }
      }
    }
  }, [initial?.id]);

  // --- HELPER: Lấy cây danh mục (Cha -> Con -> Cháu) ---
  const getFullCategoryHierarchy = (leafId: number | null): number[] => {
    if (!leafId) return [];
    const result: number[] = [leafId];
    let currentId = leafId;
    while (true) {
        const currentCat = CATEGORIES.find(c => c.id === currentId);
        if (!currentCat || !currentCat.parentId) break;
        result.unshift(currentCat.parentId);
        currentId = currentCat.parentId;
    }
    return result;
  };

  // --- LOGIC XỬ LÝ BIẾN THỂ (Thêm/Sửa/Xóa dòng) ---
  const addVariant = () => {
      setVariants([...variants, { color: '', size: '', price: 0 }]);
  };

  const removeVariant = (index: number) => {
      if (variants.length > 1) {
          const newVars = [...variants];
          newVars.splice(index, 1);
          setVariants(newVars);
      }
  };

  const updateVariant = (index: number, field: keyof VariantPayload, value: any) => {
      const newVars = [...variants];
      newVars[index] = { ...newVars[index], [field]: value };
      setVariants(newVars);
  };

  // --- SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Tên sản phẩm thiếu');
    if (!selectedCategoryId) return setError('Vui lòng chọn loại sản phẩm');

    // Validate Variants
    const validVariants = variants.filter(v => v.color && v.size && v.price >= 0);
    if (validVariants.length === 0) return setError('Vui lòng nhập ít nhất 1 phiên bản (Màu/Size/Giá)');

    setSubmitting(true);
    
    // 2. Fix lỗi 'categoryIds declared but never read': Sử dụng biến này ngay bên dưới
    const categoryIds = getFullCategoryHierarchy(selectedCategoryId);

    try {
      const payload: ProductPayload = {
        name: name.trim(), 
        description: description.trim(), 
        employeeId, 
        categoryIds: categoryIds, // <--- Đã dùng biến categoryIds
        variants: validVariants   // Gửi danh sách biến thể
      };

      await onSubmit(payload, initial?.id);
    } catch (err: any) {
      setError(err?.message || 'Lỗi lưu sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDER DANH MỤC ---
  const renderCategorySelection = () => {
    const parents = CATEGORIES.filter(c => c.parentId === null);
    const subCategories = CATEGORIES.filter(c => c.parentId === activeTabId);

    let activeLevel2Id: number | null = null;
    if (selectedCategoryId) {
        const selectedCat = CATEGORIES.find(c => c.id === selectedCategoryId);
        if (selectedCat) {
            if (selectedCat.parentId === activeTabId) {
                activeLevel2Id = selectedCat.id;
            } else {
                const parentOfSelected = CATEGORIES.find(p => p.id === selectedCat.parentId);
                if (parentOfSelected && parentOfSelected.parentId === activeTabId) {
                    activeLevel2Id = parentOfSelected.id;
                }
            }
        }
    }
    const level3Categories = activeLevel2Id 
        ? CATEGORIES.filter(c => c.parentId === activeLevel2Id)
        : [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* ROW 1: TABS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', background: '#f3f4f6', borderRadius: '6px', padding: '4px', width: 'fit-content', gap: '4px' }}>
          {parents.map(parent => (
            <button
              key={parent.id}
              type="button"
              onClick={() => { 
                  setActiveTabId(parent.id); 
                  const hasChildren = CATEGORIES.some(c => c.parentId === parent.id);
                  if (hasChildren) setSelectedCategoryId(null);
                  else setSelectedCategoryId(parent.id);
              }} 
              style={{
                padding: '6px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                background: activeTabId === parent.id ? '#fff' : 'transparent',
                color: activeTabId === parent.id ? '#e00000' : '#6b7280',
                boxShadow: activeTabId === parent.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {parent.name}
            </button>
          ))}
        </div>

        {/* ROW 2: CHIPS Cấp 2 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {subCategories.map(sub => {
            const isSelfSelected = selectedCategoryId === sub.id;
            const isChildSelected = activeLevel2Id === sub.id && !isSelfSelected; 
            const isHighlight = isSelfSelected || isChildSelected;
            return (
              <label key={sub.id} style={{ cursor: 'pointer', padding: '6px 16px', borderRadius: '20px', border: isHighlight ? '1px solid #e00000' : '1px solid #e5e7eb', background: isHighlight ? '#fff1f2' : '#fff', color: isHighlight ? '#e00000' : '#374151', fontSize: '0.85rem', fontWeight: isHighlight ? 600 : 500, transition: 'all 0.2s', userSelect: 'none', display: 'inline-block' }}>
                <input type="radio" name="category_lvl2" checked={isSelfSelected} onChange={() => setSelectedCategoryId(sub.id)} style={{ display: 'none' }} />
                {sub.name}
              </label>
            );
          })}
        </div>

        {/* ROW 3: CHIPS Cấp 3 */}
        {level3Categories.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', paddingLeft: '10px', borderLeft: '2px solid #e5e7eb', animation: 'fadeIn 0.3s ease' }}>
                <span style={{fontSize: '0.8rem', color:'#888', fontStyle:'italic'}}>Chi tiết:</span>
                {level3Categories.map(child => {
                    const isSelected = selectedCategoryId === child.id;
                    return (
                        <label key={child.id} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '6px', border: isSelected ? '1px solid #e00000' : '1px dashed #ccc', background: isSelected ? '#e00000' : '#fafafa', color: isSelected ? '#fff' : '#555', fontSize: '0.8rem', fontWeight: isSelected ? 600 : 400, userSelect: 'none' }}>
                            <input type="radio" name="category_lvl3" checked={isSelected} onChange={() => setSelectedCategoryId(child.id)} style={{ display: 'none' }} />
                            {child.name}
                        </label>
                    )
                })}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '24px', background:'#fff', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 className="card__title" style={{ marginBottom: '24px', color: '#111827', fontWeight: 700, fontSize: '1.25rem' }}>
        {initial ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        {/* Hàng 1: Tên & EmployeeID */}
        <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              Tên sản phẩm <span style={{color:'#ef4444'}}>*</span>
            </label>
            <input 
              className="form-control" 
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }}
              value={name} onChange={(e) => setName(e.target.value)} required 
              placeholder="Nhập tên sản phẩm..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              EmployeeID
            </label>
            <input 
              type="number" 
              className="form-control" 
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }}
              value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value) || 0)} min={1} 
            />
          </div>
        </div>

        {/* Hàng 2: DANH SÁCH BIẾN THỂ (Thay thế ô giá cũ) */}
        <div className="form-row" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px' }}>Danh sách phân loại hàng (Màu & Size) <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                {variants.map((varItem, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                        <input 
                            placeholder="Màu sắc (Vd: Đỏ)"
                            value={varItem.color}
                            onChange={e => updateVariant(index, 'color', e.target.value)}
                            style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        />
                        <input 
                            placeholder="Size (Vd: XL)"
                            value={varItem.size}
                            onChange={e => updateVariant(index, 'size', e.target.value)}
                            style={{ width: '80px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        />
                        <input 
                            type="number"
                            placeholder="Giá"
                            value={varItem.price}
                            onChange={e => updateVariant(index, 'price', Number(e.target.value))}
                            style={{ width: '120px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        />
                        {variants.length > 1 && (
                            <button type="button" onClick={() => removeVariant(index)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Xóa dòng này">
                                &times;
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addVariant} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                    + Thêm phân loại
                </button>
            </div>
        </div>

        {/* Hàng 3: PHÂN LOẠI (Fix lỗi 'renderCategorySelection is unused') */}
        <div className="form-row" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              Phân loại <span style={{color:'#ef4444'}}>*</span>
            </label>
            {/* 3. Gọi hàm renderCategorySelection tại đây */}
            {renderCategorySelection()}
        </div>

        {/* Hàng 4: Mô tả */}
        <div className="form-row" style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
            Mô tả
          </label>
          <textarea 
            rows={3} 
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
            value={description} onChange={(e) => setDescription(e.target.value)} 
            placeholder="Mô tả chi tiết sản phẩm..."
          />
        </div>

        {/* Buttons */}
        {error && <div style={{ color: '#dc2626', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="submit" 
            disabled={submitting} 
            style={{ 
              background: '#e00000', color: 'white', border: 'none', padding: '9px 24px', borderRadius: '6px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', fontSize: '0.95rem', boxShadow: '0 2px 5px rgba(224, 0, 0, 0.2)'
            }}
          >
            {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </button>
          
          <button 
            type="button" 
            onClick={onCancel} 
            style={{ 
              background: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '9px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' 
            }}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};