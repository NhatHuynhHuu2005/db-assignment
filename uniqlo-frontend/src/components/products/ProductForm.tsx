import React, { useState, useEffect } from 'react';
import type { ProductPayload } from '../../api/api';
// 1. IMPORT TOAST
import { Toast } from '../common/Toast'; 

interface ProductFormProps {
  initial?: any; 
  onSubmit: (payload: ProductPayload, id?: number) => Promise<void>;
  onCancel: () => void;
}

// --- DỮ LIỆU DANH MỤC ---
const CATEGORIES = [
  { id: 1, name: 'Nam', parentId: null },
  { id: 2, name: 'Nữ', parentId: null },
  { id: 3, name: 'Trẻ em', parentId: null },
  
  { id: 4, name: 'Áo', parentId: 1 },
  { id: 5, name: 'Quần', parentId: 1 },
  { id: 6, name: 'Áo khoác', parentId: 1 },
  { id: 7, name: 'Áo len/Áo nỉ', parentId: 1 },

  { id: 8, name: 'Áo', parentId: 2 },
  { id: 9, name: 'Quần/Chân váy', parentId: 2 },
  { id: 10, name: 'Đầm/Váy liền', parentId: 2 },

  { id: 11, name: 'Phụ kiện', parentId: null },
  { id: 12, name: 'Đồ lót/Đồ mặc trong', parentId: null },

  { id: 13, name: 'Áo giữ nhiệt', parentId: 4}, 
  { id: 14, name: 'Chống nắng', parentId: 6 }
];

export const ProductForm: React.FC<ProductFormProps> = ({
  initial,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState<number>(3);
  const [description, setDescription] = useState('');
  
  const [variants, setVariants] = useState<any[]>([
      { color: '', size: '', price: 0, imageUrl: '' }
  ]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTabId, setActiveTabId] = useState<number>(1); 

  const [submitting, setSubmitting] = useState(false);
  
  // 2. THAY THẾ STATE ERROR BẰNG TOAST
  // const [error, setError] = useState<string | null>(null); <--- BỎ DÒNG NÀY
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // --- LOGIC: Khởi tạo dữ liệu khi Edit ---
  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || '');
      setEmployeeId(initial.employeeId ?? 3);
      
      if (initial.variants && initial.variants.length > 0) {
          setVariants(initial.variants.map((v: any) => ({
              variantId: v.variantId,
              color: v.color,
              size: v.size,
              price: v.price,
              imageUrl: (v.images && v.images.length > 0) ? v.images[0] : ''
          })));
      } else {
          setVariants([{ color: 'Mặc định', size: 'Free', price: initial.price || 0, imageUrl: '' }]);
      }
      
      let targetCatId: number | null = null;
      if (initial.categories && Array.isArray(initial.categories) && initial.categories.length > 0) {
          const found = initial.categories.find((c: any) => CATEGORIES.some(local => local.id === c.id));
          if (found) targetCatId = found.id;
      } else if (initial.categoryId) {
          targetCatId = initial.categoryId;
      }

      if (targetCatId) {
         setSelectedCategoryId(targetCatId);
         const currentCat = CATEGORIES.find(c => c.id === targetCatId);
         if (currentCat) {
             if (currentCat.parentId === null) {
                 setActiveTabId(currentCat.id);
             } else {
                 const parent = CATEGORIES.find(p => p.id === currentCat.parentId);
                 if (parent) {
                     if (parent.parentId === null) setActiveTabId(parent.id);
                     else {
                         const grandParent = CATEGORIES.find(gp => gp.id === parent.parentId);
                         if (grandParent) setActiveTabId(grandParent.id);
                     }
                 }
             }
         }
      }
    }
  }, [initial?.id]);

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

  const addVariant = () => {
      setVariants([...variants, { color: '', size: '', price: 0, imageUrl: '' }]);
  };

  const removeVariant = (index: number) => {
      if (variants.length > 1) {
          const newVars = [...variants];
          newVars.splice(index, 1);
          setVariants(newVars);
      }
  };

  const updateVariant = (index: number, field: string, value: any) => {
      const newVars = [...variants];
      newVars[index] = { ...newVars[index], [field]: value };
      setVariants(newVars);
  };

  // --- SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 3. VALIDATE VÀ HIỆN TOAST
    if (!name.trim()) {
        setToast({ msg: 'Vui lòng nhập tên sản phẩm!', type: 'error' });
        return;
    }
    if (!selectedCategoryId) {
        setToast({ msg: 'Vui lòng chọn danh mục sản phẩm!', type: 'error' });
        return;
    }

    const validVariants = variants.filter(v => v.color && v.size && v.price >= 0);
    if (validVariants.length === 0) {
        setToast({ msg: 'Cần ít nhất 1 dòng phân loại đầy đủ (Màu, Size, Giá)!', type: 'error' });
        return;
    }

    setSubmitting(true);
    const categoryIds = getFullCategoryHierarchy(selectedCategoryId);

    try {
      const payload: ProductPayload = {
        name: name.trim(), 
        description: description.trim(), 
        employeeId, 
        categoryIds: categoryIds,
        variants: variants.map(v => ({
            ...v,
            price: Number(v.price)
        }))
      };

      await onSubmit(payload, initial?.id);
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 400) {
          setToast({ msg: "Đã có sản phẩm trùng tên trong danh sách!", type: 'error' });
      } 

      else {
          const errorMsg = err?.response?.data?.error || err.message || 'Lỗi hệ thống';
          setToast({ msg: "Lỗi: " + errorMsg, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* 4. HIỂN THỊ TOAST */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <h3 className="card__title" style={{ marginBottom: '24px', color: '#111827', fontWeight: 700, fontSize: '1.25rem' }}>
        {initial ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              Tên sản phẩm <span style={{color:'#ef4444'}}>*</span>
            </label>
            <input 
              className="form-control" 
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }}
              value={name} onChange={(e) => setName(e.target.value)}
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

        <div className="form-row" style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px' }}>
              Danh sách phân loại hàng (Màu, Size, Giá, Ảnh) <span style={{color:'#ef4444'}}>*</span>
          </label>
          
          <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              {/* 1. HIỆN CÁC PHÂN LOẠI (CŨ VÀ MỚI) */}
              {variants.map((varItem, index) => (
                  <div key={index} style={{ 
                      display: 'grid', 
                      // Chỉnh lại tỷ lệ cột cho đẹp
                      gridTemplateColumns: '1fr 0.8fr 1.2fr 2fr 40px',
                      gap: '10px', 
                      marginBottom: '10px', 
                      alignItems: 'center' 
                  }}>
                      <input 
                          placeholder="Màu (Vd: Đỏ)"
                          value={varItem.color}
                          onChange={e => updateVariant(index, 'color', e.target.value)}
                          className="form-control" // Nếu bạn có class css chung
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                      <input 
                          placeholder="Size"
                          value={varItem.size}
                          onChange={e => updateVariant(index, 'size', e.target.value)}
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                      <input 
                          type="number"
                          placeholder="Giá bán"
                          value={varItem.price}
                          onChange={e => updateVariant(index, 'price', Number(e.target.value))}
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                      
                      {/* Ô nhập ảnh + Preview nhỏ */}
                      <div style={{ position: 'relative' }}>
                          <input 
                              placeholder="Link ảnh (https://...)"
                              value={varItem.imageUrl}
                              onChange={e => updateVariant(index, 'imageUrl', e.target.value)}
                              style={{ width: '100%', padding: '8px 8px 8px 40px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                          <div style={{ 
                              position: 'absolute', left: 4, top: 4, width: 30, height: 30, 
                              borderRadius: 3, overflow: 'hidden', background: '#eee',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                              {varItem.imageUrl ? (
                                  <img src={varItem.imageUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} onError={e => e.currentTarget.style.display='none'} />
                              ) : <span style={{fontSize:12}}>📷</span>}
                          </div>
                      </div>

                      {/* 3. NÚT XOÁ (X) */}
                      {variants.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeVariant(index)} 
                            style={{ 
                                color: '#ef4444', border: 'none', background: '#fee2e2', 
                                width: '30px', height: '30px', borderRadius: '50%',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold'
                            }}
                            title="Xóa phân loại này"
                          >
                              &times;
                          </button>
                      )}
                  </div>
              ))}

              {/* 2. NÚT THÊM PHÂN LOẠI (NẰM DƯỚI) */}
              <button 
                type="button" 
                onClick={addVariant} 
                style={{ 
                    color: '#2563eb', background: 'transparent', border: '1px dashed #2563eb', 
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', marginTop: 10,
                    padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                  <span style={{fontSize: '1.2rem', lineHeight: 1}}>+</span> Thêm phân loại
              </button>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              Phân loại <span style={{color:'#ef4444'}}>*</span>
            </label>
            {renderCategorySelection()}
        </div>

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