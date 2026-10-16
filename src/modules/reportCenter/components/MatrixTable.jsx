import { classifyCell } from '../../../lib/matrixSheet.js'
import { TONE_STYLES } from '../matrixStyles.js'

export default function MatrixTable({ sheet, rows }) {
  const dayColumns = new Set(sheet.dayColumns)
  const firstDay = sheet.firstDayColumn

  function cellClass(index) {
    if (dayColumns.has(index)) return 'text-center'
    if (firstDay >= 0 && index > firstDay) return 'text-center font-bold' // totals (Present / Absent ...)
    return 'text-left'
  }

  return (
    <div className="max-h-[70vh] w-full overflow-auto rounded-xl border border-primary/10 print:max-h-none print:overflow-visible print:rounded-none print:border-black">
      <table className="w-full border-separate border-spacing-0 text-sm print:border-collapse print:text-[8px] print:leading-tight">
        <thead>
          <tr>
            {sheet.header.map((cell, index) => (
              <th
                key={index}
                className={`sticky top-0 z-10 whitespace-nowrap border-b border-primary/15 bg-app-surface px-2 py-2.5 text-xs font-extrabold uppercase tracking-wide text-app-muted print:static print:border print:border-black print:px-0.5 print:py-1 print:text-[8px] print:text-black ${cellClass(index)} ${index === 0 ? 'left-0 z-20 print:left-auto' : ''}`}
              >
                {cell}
              </th>
            ))}
          </tr>
          {sheet.subHeader && (
            <tr>
              {sheet.subHeader.map((cell, index) => (
                <th
                  key={index}
                  className={`sticky top-[2.6rem] z-10 border-b border-primary/10 bg-app-surface px-1 pb-2 text-[10px] font-semibold text-app-muted print:static print:border print:border-black print:px-0 print:py-0.5 print:text-[7px] print:text-black ${cellClass(index)} ${index === 0 ? 'left-0 z-20 print:left-auto' : ''}`}
                >
                  {cell}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isTotal = /^total/i.test(row.find(Boolean) || '')
            return (
              <tr key={rowIndex} className={`${isTotal ? 'bg-primary/5 font-extrabold' : 'hover:bg-primary/5'} print:break-inside-avoid`}>
                {row.map((cell, index) => {
                  const tone = dayColumns.has(index) ? classifyCell(cell) : null
                  const isFirst = index === 0
                  return (
                    <td
                      key={index}
                      className={`whitespace-nowrap border-b border-primary/10 px-1.5 py-1.5 text-app-text print:border print:border-black print:px-0.5 print:py-0.5 print:text-black ${cellClass(index)} ${
                        isFirst ? 'sticky left-0 z-[1] bg-app-surface font-bold print:static' : ''
                      }`}
                    >
                      {tone ? (
                        <span className={`inline-flex min-w-[1.6rem] items-center justify-center rounded-md px-1 py-0.5 text-xs font-bold print:min-w-0 print:px-0.5 print:text-[8px] ${TONE_STYLES[tone].chip}`}>
                          {cell}
                        </span>
                      ) : (
                        cell || <span className="text-app-muted/50">·</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}