// FE/src/components/products/ProductList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product
} from '../../api/api';
import { DataTable, type Column } from '../common/DataTable.js';
import { Paginator } from '../common/Paginator.js';
import { ProductForm } from './ProductForm.js';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(
        search.trim() ? { search: search.trim() } : undefined
      );
      setProducts(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Không thể tải danh sách sản phẩm'
      );
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

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      await loadData();
    } catch (err: any) {
      alert(
        err?.response?.data?.error ||
          err?.message ||
          'Không thể xóa sản phẩm'
      );
    }
  };

  const handleSubmitForm = async (payload: any, id?: number) => {
    if (id) {
      await updateProduct(id, payload);
    } else {
      await createProduct(payload);
    }
    setShowForm(false);
    setEditing(null);
    await loadData();
  };

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return products.slice(start, end);
  }, [products, page]);

  const columns: Column<Product>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Tên sản phẩm' },
    {
      key: 'categories',
      header: 'Danh mục',
      render: (row) => row.categories?.join(', ')
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--outline"
            onClick={() => handleEdit(row)}
          >
            Sửa
          </button>
          <button
            className="btn btn--primary"
            onClick={() => handleDelete(row)}
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="card">
        <h2 className="card__title">Quản lý sản phẩm</h2>
        <div className="form-row">
          <label>
            Tìm kiếm theo tên
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập tên sản phẩm..."
            />
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button
              className="btn btn--outline"
              onClick={handleSearch}
              disabled={loading}
            >
              Tìm kiếm
            </button>
            <button
              className="btn btn--primary"
              onClick={handleAdd}
            >
              Thêm mới
            </button>
          </div>
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
        )}
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <>
            <DataTable<Product>
              columns={columns}
              data={pagedProducts}
              keyField="id"
              emptyMessage="Chưa có sản phẩm"
            />
            <Paginator
              page={page}
              pageSize={pageSize}
              total={products.length}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {showForm && (
        <ProductForm
          initial={editing}
          onSubmit={handleSubmitForm}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};
