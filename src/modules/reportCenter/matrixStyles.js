// Har status ka rang. print me variables light ho jaate hain, isliye yahi classes print me bhi chalti hain.
export const TONE_STYLES = {
  present: { chip: 'bg-success/15 text-success', bar: 'bg-success' },
  absent: { chip: 'bg-danger/15 text-danger', bar: 'bg-danger' },
  leave: { chip: 'bg-secondary/15 text-secondary', bar: 'bg-secondary' },
  late: { chip: 'bg-warning/20 text-warning', bar: 'bg-warning' },
  halfday: { chip: 'bg-warning/10 text-warning', bar: 'bg-amber-300' },
  holiday: { chip: 'bg-teal/15 text-teal', bar: 'bg-teal' },
  weekend: { chip: 'bg-app-muted/10 text-app-muted', bar: 'bg-slate-400' },
  wfh: { chip: 'bg-info/15 text-info', bar: 'bg-info' }
}

export function rowMatches(row, sheet, query) {
  const text = query.trim().toLowerCase()
  if (!text) return true
  const limit = sheet.firstDayColumn > 0 ? sheet.firstDayColumn : row.length
  return row.slice(0, limit).some((cell) => cell.toLowerCase().includes(text))
}