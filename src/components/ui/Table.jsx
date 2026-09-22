import EmptyState from './EmptyState.jsx'

export default function Table({ columns, rows, onRowClick }) {
  if (!rows?.length) return <EmptyState title="No records found" />
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-lg border border-primary/10 bg-app-surface">
      <div className="scrollbar-hide w-full overflow-x-auto">
        <table className="w-full min-w-[760px] table-auto text-left text-sm">
          <thead className="bg-primary/5 text-xs uppercase tracking-wide text-app-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-bold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer transition hover:bg-primary/5' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle text-app-text">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
