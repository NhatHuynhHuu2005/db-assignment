// FE/src/components/products/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import type { ProductPayload, Product } from '../../api/api';

interface ProductFormProps {
  initial?: Product | null;
  onSubmit: (payload: ProductPayload, id?: number) => Promise<void>;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initial,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState<number>(3); // default manager HCM từ sample_data
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || '');
      setEmployeeId(initial.employeeId ?? 3);
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tên sản phẩm không được để trống');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          name: name.trim(),
          description: description.trim(),
          employeeId
        },
        initial?.id
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Không thể lưu sản phẩm'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card__title">
        {initial ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            Tên sản phẩm
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            EmployeeID (người phụ trách)
            <input
              type="number"
              value={employeeId}
              onChange={(e) => setEmployeeId(Number(e.target.value) || 0)}
              min={1}
            />
          </label>
        </div>
        <div className="form-row">
          <label style={{ flex: 1 }}>
            Mô tả
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            className="btn btn--outline"
            type="button"
            onClick={onCancel}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};
