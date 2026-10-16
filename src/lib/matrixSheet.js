import * as XLSX from 'xlsx'

// export-matrix Excel (employee x din) ko screen/print ke liye table-data me badalta hai.
// Layout hard-code nahi hai: header row, day columns (1..31 ya 07/10/2026 jaisi dates)
// aur status codes (P / A / L / Sunday ...) apne aap pehchane jaate hain.

const WEEKDAY = /^(mon|tue|wed|thu|fri|sat|sun)/i
const TIME_LIKE = /^\d{1,2}:\d{2}/
const DATE_HEADER = /^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})$/

export const TONES = ['present', 'absent', 'leave', 'late', 'halfday', 'holiday', 'weekend', 'wfh']

const CODE_TO_TONE = {
  P: 'present', PRESENT: 'present', FD: 'present', 'FULL DAY': 'present', '✓': 'present', '✔': 'present',
  A: 'absent', AB: 'absent', ABSENT: 'absent', '✗': 'absent', '✘': 'absent',
  L: 'leave', LV: 'leave', LEAVE: 'leave', 'ON LEAVE': 'leave', CL: 'leave', SL: 'leave', PL: 'leave', EL: 'leave', ML: 'leave',
  LT: 'late', LATE: 'late',
  HD: 'halfday', 'HALF DAY': 'halfday', 'HALF-DAY': 'halfday', HALFDAY: 'halfday', FH: 'halfday', SH: 'halfday',
  H: 'holiday', HOL: 'holiday', HOLIDAY: 'holiday',
  W: 'weekend', WO: 'weekend', WK: 'weekend', OFF: 'weekend', WEEKEND: 'weekend', 'WEEK OFF': 'weekend',
  SUNDAY: 'weekend', SATURDAY: 'weekend', SUN: 'weekend', SAT: 'weekend',
  WFH: 'wfh'
}

// Cell ki value dekh kar uska tone batata hai. Pehchaan nahi hui to null (normal text).
export function classifyCell(value) {
  const text = String(value ?? '').trim().toUpperCase()
  if (!text || text === '-' || text === '—') return null
  if (CODE_TO_TONE[text]) return CODE_TO_TONE[text]
  if (TIME_LIKE.test(text)) return null
  const firstToken = text.split(/[\s(/,]/)[0]
  return CODE_TO_TONE[firstToken] || null
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function isDateHeader(value) {
  return DATE_HEADER.test(value)
}

function isDayNumber(value) {
  if (!/^\d{1,2}$/.test(value)) return false
  const day = Number(value)
  return day >= 1 && day <= 31
}

export function parseSheetRows(name, aoa) {
  const grid = (aoa || []).map((row) => (row || []).map(clean))
  const hasValue = (row) => row.some(Boolean)

  const width = grid.reduce((max, row) => {
    let last = -1
    row.forEach((cell, index) => { if (cell) last = index })
    return Math.max(max, last + 1)
  }, 0)
  if (!width) return null

  const rows = grid.map((row) => Array.from({ length: width }, (_, index) => row[index] || ''))

  // Header = shuruaati rows me sabse zyada bhari hui row (title row me 1-2 hi cells hote hain).
  let headerIndex = 0
  let best = -1
  rows.slice(0, 15).forEach((row, index) => {
    const count = row.filter(Boolean).length
    if (count > best) { best = count; headerIndex = index }
  })

  const title = rows.slice(0, headerIndex).filter(hasValue).map((row) => row.filter(Boolean).join('  ·  '))
  const header = rows[headerIndex]

  let bodyStart = headerIndex + 1
  let subHeader = null
  const next = rows[bodyStart]
  if (next) {
    const filled = next.filter(Boolean)
    if (filled.length >= 3 && filled.filter((cell) => WEEKDAY.test(cell)).length >= filled.length * 0.6) {
      subHeader = next
      bodyStart += 1
    }
  }

  const body = rows.slice(bodyStart).filter(hasValue)

  // Pehle date-wale headers (07/10/2026) dekho; na mile to 1..31 numbers.
  const dateColumns = header.map((cell, index) => (isDateHeader(cell) ? index : -1)).filter((index) => index >= 0)
  const numberColumns = header.map((cell, index) => (isDayNumber(cell) ? index : -1)).filter((index) => index >= 0)
  const dayColumns = dateColumns.length >= 5 ? dateColumns : numberColumns
  const hasDays = dayColumns.length >= 5
  const firstDayColumn = hasDays ? dayColumns[0] : -1

  const counts = Object.fromEntries(TONES.map((tone) => [tone, 0]))
  let employees = 0
  if (hasDays) {
    body.forEach((row) => {
      const firstCell = row.find(Boolean) || ''
      if (/^total/i.test(firstCell)) return
      employees += 1
      dayColumns.forEach((index) => {
        const tone = classifyCell(row[index])
        if (tone) counts[tone] += 1
      })
    })
  } else {
    employees = body.length
  }

  return { name, title, header, subHeader, rows: body, dayColumns, firstDayColumn, stats: { employees, counts, days: dayColumns.length } }
}

// Excel file (ArrayBuffer) -> { sheets: [parsed sheets] }
export function parseMatrixWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheets = workbook.SheetNames.map((name) => {
    const aoa = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: false, blankrows: false })
    return parseSheetRows(name, aoa)
  }).filter(Boolean)
  return { sheets }
}