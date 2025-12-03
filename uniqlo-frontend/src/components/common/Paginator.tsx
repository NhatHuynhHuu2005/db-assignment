// FE/src/components/common/Paginator.tsx
import React from 'react';

interface PaginatorProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export const Paginator: React.FC<PaginatorProps> = ({
  page,
  pageSize,
  total,
  onChange
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="paginator">
      <span>
        Trang {page} / {totalPages}
      </span>
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ←
      </button>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        →
      </button>
    </div>
  );
};
