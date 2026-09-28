import { API_BASE_URL, authorizedFetch } from '../store/apiSlice.js'

async function fetchBlob(url) {
  const response = await authorizedFetch(url)

  if (!response.ok) {
    let message = `Export failed (status ${response.status}).`
    try {
      const body = await response.json()
      message = body?.message || body?.error?.message || message
    } catch {
      // response file thi ya HTML error page, JSON nahi tha - default message hi rakho
    }
    throw new Error(message)
  }

  return response.blob()
}

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// GET {{base_url}}/admin/reports/export?year=&month=
// Poori company ka multi-sheet Excel workbook (Monthly Summary / Daily Attendance / Late Report / Leave Report)
export async function downloadCompanyExcelReport({ year, month }) {
  const url = `${API_BASE_URL}/admin/reports/export?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
  const blob = await fetchBlob(url)
  triggerDownload(blob, `attendance-report-${year}-${String(month).padStart(2, '0')}.xlsx`)
}

// Client-side generated Excel — sirf ek employee ka poora data (summary + daily/late/leave),
// already-fetched normalized data se banta hai, koi extra API call nahi lagti.
// Isko chalane ke liye "xlsx" (SheetJS) package chahiye: npm install xlsx
export async function downloadEmployeeExcelReport({ employee, year, month, summary, dailyRows = [], lateRows = [], leaveRows = [] }) {
  const XLSX = await import('xlsx')
  const monthLabel = `${year}-${String(month).padStart(2, '0')}`

  const summarySheet = XLSX.utils.json_to_sheet([
    {
      'Employee Code': employee.code,
      Name: employee.name,
      Department: employee.department || '',
      'Working Days': summary?.workingDays ?? '',
      'Present Days': summary?.presentDays ?? '',
      'Absent Days': summary?.absentDays ?? '',
      'Leave Days': summary?.leaveDays ?? '',
      'Holiday Days': summary?.holidayDays ?? '',
      'Late Count': summary?.lateCount ?? '',
      'Total Late Min': summary?.totalLateMinutes ?? '',
      'Early Count': summary?.earlyCount ?? '',
      'Total Early Min': summary?.totalEarlyMinutes ?? '',
      'Worked Hours': summary?.workedHours ?? ''
    }
  ])

  const lateSheet = XLSX.utils.json_to_sheet(
    lateRows.length
      ? lateRows.map((row) => ({
          Date: row.date,
          'Expected In': row.expectedLogin,
          'Actual In': row.checkIn ? new Date(row.checkIn).toLocaleString() : '',
          'Late Min': row.lateMinutes
        }))
      : [{ Date: '', 'Expected In': '', 'Actual In': '', 'Late Min': '' }]
  )

  const leaveSheet = XLSX.utils.json_to_sheet(
    leaveRows.length
      ? leaveRows.map((row) => ({
          'Leave Type': row.leaveTypeName,
          Start: row.startDate,
          End: row.endDate,
          Duration: row.durationType,
          Days: row.totalDays,
          Status: row.status,
          Reason: row.reason,
          'Rejection Reason': row.rejectionReason
        }))
      : [{ 'Leave Type': '', Start: '', End: '', Duration: '', Days: '', Status: '', Reason: '', 'Rejection Reason': '' }]
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  if (dailyRows.length) {
    const dailySheet = XLSX.utils.json_to_sheet(
      dailyRows.map((row) => ({
        Date: row.date,
        Status: row.status,
        'Check In': row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '',
        'Check Out': row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '',
        'Late Min': row.lateMinutes,
        'Early Min': row.earlyMinutes,
        'Worked Min': row.workedMinutes
      }))
    )
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Attendance')
  }

  XLSX.utils.book_append_sheet(workbook, lateSheet, 'Late Report')
  XLSX.utils.book_append_sheet(workbook, leaveSheet, 'Leave Report')

  XLSX.writeFile(workbook, `${employee.code}-report-${monthLabel}.xlsx`)
}