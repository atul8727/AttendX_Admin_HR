import { useTranslation } from 'react-i18next'
import EmptyState from './EmptyState.jsx'

export default function Table({ columns, rows, onRowClick, minWidth = 'min-w-[900px]' }) {
  const { t } = useTranslation()

  if (!rows?.length) return <EmptyState title={t('common:table.noRecords')} />

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-primary/15 bg-app-surface shadow-soft ring-1 ring-black/5 dark:border-white/10 dark:ring-white/5 print:overflow-visible print:rounded-none print:border-black print:shadow-none print:ring-0">
      <div className="hide-scrollbar w-full overflow-x-auto overscroll-x-contain print:overflow-visible">
        <table className={`w-full ${minWidth} table-auto text-start text-sm print:min-w-0 print:text-xs`}>
          <thead className="border-b border-primary/10 bg-primary/[0.04] text-xs font-bold uppercase tracking-wider text-app-muted dark:border-white/10 dark:bg-white/[0.03] print:border-b-2 print:border-black print:bg-white print:text-black">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-4 py-3.5 text-left font-bold print:border print:border-black print:px-2 print:py-1 ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 dark:divide-white/5 print:divide-black">
            {rows.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-150 ${
                  idx % 2 === 1 ? 'bg-primary/[0.015] dark:bg-white/[0.015]' : 'bg-transparent'
                } hover:bg-primary/[0.05] dark:hover:bg-white/[0.04] print:hover:bg-transparent ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3.5 align-middle text-app-text print:border print:border-black print:px-2 print:py-1 print:text-black ${column.cellClassName || ''}`}
                  >
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
