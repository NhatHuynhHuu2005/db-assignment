// FE/src/components/common/DataTable.tsx
import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
}

function DataTableInner<T extends Record<string, any>>(
  props: DataTableProps<T>
) {
  const { columns, data, keyField, emptyMessage = 'Không có dữ liệu' } = props;

  if (!data || data.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={String(row[keyField])}>
            {columns.map((col) => (
              <td key={col.key}>
                {col.render ? col.render(row) : row[col.key] ?? ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Generic wrapper để TS đỡ phàn nàn
export function DataTable<T extends Record<string, any>>(
  props: DataTableProps<T>
) {
  return <DataTableInner {...props} />;
}
