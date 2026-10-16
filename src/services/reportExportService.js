import { API_BASE_URL, authorizedFetch } from '../store/apiSlice.js'

async function readError(response) {
  let message = `Export failed (status ${response.status}).`
  try {
    const body = await response.json()
    message = body?.message || body?.error?.message || message
  } catch {
    // response file thi ya HTML error page, JSON nahi tha - default message hi rakho
  }
  return message
}

async function fetchBlob(url) {
  const response = await authorizedFetch(url)
  if (!response.ok) throw new Error(await readError(response))
  return response.blob()
}

export function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// GET /admin/reports/export?year=2026&month=10  (backend ka Monthly Workbook)
export async function downloadCompanyExcelReport({ year, month }) {
  const url = `${API_BASE_URL}/admin/reports/export?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
  const blob = await fetchBlob(url)
  triggerDownload(blob, `attendance-report-${year}-${String(month).padStart(2, '0')}.xlsx`)
}

// GET /admin/reports/export-matrix?month=&year=  (Report Center isi ko use karta hai)
export async function fetchAttendanceMatrixExcel({ month, year, signal }) {
  const url = `${API_BASE_URL}/admin/reports/export-matrix?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
  const response = await authorizedFetch(url, { signal })
  if (!response.ok) throw new Error(await readError(response))
  return response.arrayBuffer()
}

export function downloadAttendanceMatrixExcel(buffer, { month, year }) {
  const blob = new window.Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  triggerDownload(blob, `attendance-matrix-${year}-${String(month).padStart(2, '0')}.xlsx`)
}

/* ------------------- Client-side Excel (xlsx / SheetJS) ------------------- */

function uniqueSheetName(name, used) {
  const base = String(name || 'Sheet').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Sheet'
  let candidate = base
  let counter = 2
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base} ${counter}`
    counter += 1
  }
  used.add(candidate.toLowerCase())
  return candidate
}

// sheets: [{ name, title, subtitle, headers: [], rows: [[]], emptyText }]
// Har sheet: title + period (merged) -> khali line -> header -> data. Column width auto.
export async function downloadWorkbook({ filename, sheets }) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const used = new Set()

  sheets.forEach((sheet) => {
    const headers = sheet.headers || []
    const width = Math.max(headers.length, 1)
    const rows = (sheet.rows || []).map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : cell)))
    const body = rows.length ? rows : [[sheet.emptyText || '-']]

    const worksheet = XLSX.utils.aoa_to_sheet([[sheet.title || ''], [sheet.subtitle || ''], [], headers, ...body])

    worksheet['!cols'] = headers.map((header, column) => {
      const longest = rows.reduce((max, row) => Math.max(max, String(row[column] ?? '').length), String(header).length)
      return { wch: Math.min(42, Math.max(10, longest + 2)) }
    })
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: width - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: width - 1 } }
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, uniqueSheetName(sheet.name || sheet.title, used))
  })

  XLSX.writeFile(workbook, filename)
}

export function downloadTableExcel({ title, subtitle, headers, rows, filename, emptyText }) {
  return downloadWorkbook({
    filename: filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
    sheets: [{ name: title, title, subtitle, headers, rows, emptyText }]
  })
}