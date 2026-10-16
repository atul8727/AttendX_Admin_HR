import { classifyCell, TONES } from './matrixSheet.js'

const isNumeric = (value) => /^\d+$/.test(String(value || '').trim())

// sheet.rows (ya search se filter hui rows) -> har employee ka summary
export function summarizeRows(sheet, rows = sheet.rows) {
  if (!sheet.dayColumns.length) return []
  const identityLimit = sheet.firstDayColumn > 0 ? sheet.firstDayColumn : 1

  return rows
    .filter((row) => !/^total/i.test(row.find(Boolean) || ''))
    .map((row, index) => {
      const counts = Object.fromEntries(TONES.map((tone) => [tone, 0]))
      sheet.dayColumns.forEach((column) => {
        const tone = classifyCell(row[column])
        if (tone) counts[tone] += 1
      })

      const identity = row.slice(0, identityLimit).filter(Boolean)
      // Pehla number wala cell serial no. hota hai, use naam na samjho
      const nameIndex = Math.max(0, identity.findIndex((cell) => !isNumeric(cell)))
      const name = identity[nameIndex] || identity[0] || `#${index + 1}`
      const extra = identity.filter((_, i) => i !== nameIndex && !isNumeric(identity[i])).join(' · ')

      const attended = counts.present + counts.late + counts.wfh + counts.halfday
      const considered = attended + counts.absent + counts.leave
      const percent = considered ? Math.round((attended / considered) * 100) : 0

      return { id: `${name}-${index}`, name, extra, counts, percent }
    })
}