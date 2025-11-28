interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedId?: string;
  getRowId?: (row: T) => string;
}

export default function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedId,
  getRowId
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => {
            const rowId = getRowId ? getRowId(row) : idx.toString();
            const isSelected = selectedId === rowId;

            return (
              <tr
                key={rowId}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  ${isSelected ? 'bg-blue-50' : ''}
                  transition-colors
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-sm text-gray-900">
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
