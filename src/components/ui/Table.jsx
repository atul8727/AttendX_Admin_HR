import { useTranslation } from 'react-i18next'
import EmptyState from './EmptyState.jsx'

export default function Table({ columns, rows, onRowClick }) {
  const { t } = useTranslation()

  if (!rows?.length) return <EmptyState title={t('common:table.noRecords')} />

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-lg border border-primary/10 bg-app-surface print:overflow-visible print:rounded-none print:border-black">
      <div className="hide-scrollbar w-full overflow-x-auto overscroll-x-contain print:overflow-visible">
        <table className="w-full min-w-[720px] table-auto text-start text-sm print:min-w-0 print:text-xs">
          <thead className="bg-primary/5 text-xs uppercase tracking-wide text-app-muted print:bg-white print:text-black">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`whitespace-nowrap px-3 py-3 text-left font-bold sm:px-4 print:border print:border-black print:px-2 print:py-1 ${column.headerClassName || ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 print:divide-black">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer transition hover:bg-primary/5 print:hover:bg-transparent' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-3 align-middle text-app-text sm:px-4 print:border print:border-black print:px-2 print:py-1 print:text-black ${column.cellClassName || ''}`}>
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
