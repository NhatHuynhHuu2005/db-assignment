import React, { useState, useEffect } from 'react';
import type { ProductPayload, Product } from '../../api/api';

interface ExtendedProduct extends Product {
  price?: number;
  categoryId?: number;
}

interface ProductFormProps {
  initial?: ExtendedProduct | null;
  onSubmit: (payload: ProductPayload & { price: number; categoryId: number }, id?: number) => Promise<void>;
  onCancel: () => void;
}

// Dữ liệu danh mục
const CATEGORIES = [
  { id: 1, name: 'Nam', parentId: null },
  { id: 2, name: 'Nữ', parentId: null },
  { id: 3, name: 'Áo', parentId: 1 },
  { id: 4, name: 'Quần', parentId: 1 },
  { id: 5, name: 'Váy/Đầm', parentId: 2 },
  { id: 6, name: 'Áo khoác', parentId: 1 },
];

export const ProductForm: React.FC<ProductFormProps> = ({
  initial,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTabId, setActiveTabId] = useState<number>(1); // 1=Nam, 2=Nữ

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || '');
      setEmployeeId(initial.employeeId ?? 3);
      setPrice(initial.price || 0);
      setSelectedCategoryId(initial.categoryId || null);
      if (initial.categoryId) {
         const cat = CATEGORIES.find(c => c.id === initial.categoryId);
         if (cat && cat.parentId) setActiveTabId(cat.parentId);
      }
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Tên sản phẩm thiếu');
    if (price < 0) return setError('Giá không được âm');
    if (!selectedCategoryId) return setError('Vui lòng chọn loại sản phẩm');

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), employeeId, price, categoryId: selectedCategoryId }, initial?.id);
    } catch (err: any) {
      setError(err?.message || 'Lỗi lưu sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategorySelection = () => {
    const parents = CATEGORIES.filter(c => c.parentId === null);
    const activeSubCategories = CATEGORIES.filter(c => c.parentId === activeTabId);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* 1. Tabs Giới Tính (Segmented Control) */}
        <div style={{ 
          display: 'flex', 
          background: '#f3f4f6', 
          borderRadius: '6px', 
          padding: '3px', 
          width: 'fit-content' 
        }}>
          {parents.map(parent => (
            <button
              key={parent.id}
              type="button"
              onClick={() => setActiveTabId(parent.id)}
              style={{
                padding: '5px 20px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                // Tab Active: Trắng + Bóng đổ
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

        {/* 2. Chips Loại sản phẩm (Đã bỏ dấu chấm) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {activeSubCategories.map(sub => {
            const isSelected = selectedCategoryId === sub.id;
            return (
              <label 
                key={sub.id} 
                style={{ 
                  cursor: 'pointer',
                  padding: '6px 16px', // Tăng padding ngang xíu cho đẹp
                  borderRadius: '20px', // Bo tròn kiểu viên thuốc
                  border: isSelected ? '1px solid #e00000' : '1px solid #e5e7eb',
                  background: isSelected ? '#fff1f2' : '#fff', // Nền hồng nhạt khi chọn
                  color: isSelected ? '#e00000' : '#374151',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'all 0.2s',
                  userSelect: 'none',
                  display: 'inline-block'
                }}
              >
                <input 
                  type="radio"
                  name="category"
                  checked={isSelected}
                  onChange={() => setSelectedCategoryId(sub.id)}
                  style={{ display: 'none' }} 
                />
                {sub.name}
              </label>
            );
          })}
          
          {activeSubCategories.length === 0 && (
            <span style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic', paddingLeft: '5px' }}>
              Chưa có mục con
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
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

        {/* Hàng 2: Giá & Phân loại (Được đặt cạnh nhau) */}
        <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
          <div style={{ width: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              Giá niêm yết (VNĐ) <span style={{color:'#ef4444'}}>*</span>
            </label>
            <input 
              type="number" 
              className="form-control" 
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }}
              value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} placeholder="0"
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              Phân loại <span style={{color:'#ef4444'}}>*</span>
            </label>
            {renderCategorySelection()}
          </div>
        </div>

        {/* Hàng 3: Mô tả */}
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
              background: '#e00000', 
              color: 'white', 
              border: 'none', 
              padding: '9px 24px', 
              borderRadius: '6px', 
              fontWeight: 600, 
              cursor: submitting ? 'wait' : 'pointer', 
              fontSize: '0.95rem',
              boxShadow: '0 2px 5px rgba(224, 0, 0, 0.2)'
            }}
          >
            {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </button>
          
          <button 
            type="button" 
            onClick={onCancel} 
            style={{ 
              background: 'white', 
              color: '#374151', 
              border: '1px solid #d1d5db', 
              padding: '9px 24px', 
              borderRadius: '6px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontSize: '0.95rem' 
            }}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};