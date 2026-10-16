import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCalendar, FiDownload, FiMaximize2, FiPrinter, FiRefreshCw, FiSearch, FiUsers, FiX } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Select from '../../components/ui/Select.jsx'
import Table from '../../components/ui/Table.jsx'
import ReportPrintHeader from '../../components/reports/ReportPrintHeader.jsx'
import MatrixTable from './components/MatrixTable.jsx'
import { rowMatches, TONE_STYLES } from './matrixStyles.js'
import { downloadAttendanceMatrixExcel, fetchAttendanceMatrixExcel } from '../../services/reportExportService.js'
import { parseMatrixWorkbook, TONES } from '../../lib/matrixSheet.js'
import { summarizeRows } from '../../lib/matrixSummary.js'
import { printReport } from '../../lib/printReport.js'
import { useFormatters } from '../../lib/format.js'

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()
const YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - 4 + index)
const STAT_TONES = { present: 'success', absent: 'danger', leave: 'secondary', late: 'warning', halfday: 'warning', wfh: 'teal', weekend: 'info', holiday: 'teal' }
const STAT_ORDER = ['present', 'absent', 'leave', 'late', 'halfday', 'wfh', 'holiday', 'weekend']

// Tailwind dynamic class strip na ho, isliye full class names yahan likhe hain.
const ICON_TONE = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  secondary: 'bg-secondary/10 text-secondary',
  warning: 'bg-warning/15 text-warning',
  teal: 'bg-teal/10 text-teal'
}

// Matrix wide hota hai (31 din), isliye print hamesha landscape me.
function useLandscapePrint() {
  useEffect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-report-center-page', 'true')
    style.textContent = '@page { size: A4 landscape; margin: 8mm; }'
    document.head.appendChild(style)
    return () => style.remove()
  }, [])
}

function SearchBox({ value, onChange, placeholder, label }) {
  return (
    <div className="relative w-full md:w-72">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="min-h-10 w-full rounded-lg border border-primary/15 bg-app-bg pl-9 pr-9 text-app-text outline-none transition placeholder:text-app-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {value && (
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted" onClick={() => onChange('')} aria-label="Clear">
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function SheetTabs({ sheets, active, onChange }) {
  if (sheets.length < 2) return null
  return (
    <div className="hide-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-xl bg-primary/5 p-1">
      {sheets.map((item, index) => (
        <button
          key={item.name}
          type="button"
          onClick={() => onChange(index)}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition ${
            active === index ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'text-app-muted hover:bg-primary/10 hover:text-app-text'
          }`}
        >
          {item.name}
        </button>
      ))}
    </div>
  )
}

export default function ReportCenter() {
  const { t } = useTranslation('reportCenter')
  const formatters = useFormatters()
  useLandscapePrint()

  const [month, setMonth] = useState(NOW.getMonth() + 1)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ status: 'loading', buffer: null, error: '' })
  const [sheetIndex, setSheetIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [fullOpen, setFullOpen] = useState(false)

  useEffect(() => {
    const controller = new window.AbortController()
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    fetchAttendanceMatrixExcel({ month, year, signal: controller.signal })
      .then((buffer) => {
        setState({ status: 'ready', buffer, error: '' })
        setSheetIndex(0)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setState({ status: 'error', buffer: null, error: err?.message || t('states.errorTitle') })
      })
    return () => controller.abort()
  }, [month, year, reloadKey, t])

  const parsed = useMemo(() => {
    if (!state.buffer) return { sheets: [], error: '' }
    try {
      return { ...parseMatrixWorkbook(state.buffer), error: '' }
    } catch (err) {
      return { sheets: [], error: err?.message || t('states.errorTitle') }
    }
  }, [state.buffer, t])

  const sheet = parsed.sheets[sheetIndex] || parsed.sheets[0] || null
  const rows = useMemo(() => (sheet ? sheet.rows.filter((row) => rowMatches(row, sheet, query)) : []), [sheet, query])
  const summaryRows = useMemo(() => (sheet ? summarizeRows(sheet, rows) : []), [sheet, rows])

  // Full-screen sheet: Esc se band, peeche ka scroll lock
  useEffect(() => {
    if (!fullOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setFullOpen(false)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [fullOpen])

  const monthName = formatters.monthName(month - 1)
  const periodLabel = `${monthName} ${year}`
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: formatters.monthName(index) }))
  const yearOptions = YEARS.map((value) => ({ value, label: String(value) }))

  const handlePrint = useCallback(() => printReport(`${t('print.title')} ${periodLabel}`), [t, periodLabel])
  const handleDownload = useCallback(() => {
    if (state.buffer) downloadAttendanceMatrixExcel(state.buffer, { month, year })
  }, [state.buffer, month, year])

  const counts = sheet?.stats.counts || {}
  const totalEntries = TONES.reduce((sum, tone) => sum + (counts[tone] || 0), 0)
  const activeTones = TONES.filter((tone) => counts[tone] > 0)
  const statTones = STAT_ORDER.filter((tone) => counts[tone] > 0).slice(0, 5)
  const isLoading = state.status === 'loading'
  const errorMessage = state.status === 'error' ? state.error : parsed.error
  const ready = !isLoading && !errorMessage && sheet

  const summaryCards = sheet
    ? [
        { key: 'employees', label: t('stats.employees'), value: sheet.stats.employees, icon: FiUsers, tone: 'primary' },
        ...(sheet.stats.days > 0 ? [{ key: 'days', label: t('stats.days'), value: sheet.stats.days, icon: FiCalendar, tone: 'info' }] : []),
        ...statTones.map((tone) => ({ key: tone, label: t(`stats.${tone}`), value: formatters.number(counts[tone]), icon: FiCalendar, tone: STAT_TONES[tone] }))
      ]
    : []

  const summaryColumns = [
    {
      key: 'employee',
      header: t('summary.employee'),
      render: (row) => (
        <div>
          <p className="font-bold">{row.name}</p>
          {row.extra && <p className="text-xs text-app-muted">{row.extra}</p>}
        </div>
      )
    },
    ...activeTones.map((tone) => ({
      key: tone,
      header: t(`stats.${tone}`),
      render: (row) =>
        row.counts[tone] ? (
          <span className={`inline-flex min-w-[2rem] justify-center rounded-md px-2 py-0.5 text-xs font-bold ${TONE_STYLES[tone].chip}`}>{row.counts[tone]}</span>
        ) : (
          <span className="text-app-muted/50">·</span>
        )
    })),
    {
      key: 'percent',
      header: t('summary.attendance'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-gradient-to-r from-success to-teal" style={{ width: `${row.percent}%` }} />
          </div>
          <span className="text-xs font-bold">{row.percent}%</span>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* ================= SCREEN ================= */}
      <div className="space-y-5 print:hidden">
        {/* Title */}
        <div>
          <h1 className="text-xl font-black sm:text-2xl">{t('title')}</h1>
          <p className="max-w-3xl text-sm text-app-muted">{t('subtitle')}</p>
        </div>

        {/* Toolbar: filters left, Print + Download ek hi row me right */}
        <Card className="!p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <Select label={t('filters.month')} value={month} onChange={(event) => setMonth(Number(event.target.value))} options={monthOptions} className="w-40" />
              <Select label={t('filters.year')} value={year} onChange={(event) => setYear(Number(event.target.value))} options={yearOptions} className="w-28" />
              <Button variant="ghost" icon={FiRefreshCw} onClick={() => setReloadKey((key) => key + 1)} disabled={isLoading} aria-label={t('actions.refresh')} title={t('actions.refresh')} />
              <span className="hidden rounded-full bg-primary/10 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-primary sm:inline-flex">{periodLabel}</span>
            </div>

            <div className="flex flex-nowrap items-center gap-2">
              <Button variant="outline" icon={FiPrinter} onClick={handlePrint} disabled={!ready} className="whitespace-nowrap">
                {t('actions.print')}
              </Button>
              <Button icon={FiDownload} onClick={handleDownload} disabled={!state.buffer || isLoading} className="whitespace-nowrap">
                {t('actions.downloadExcel')}
              </Button>
            </div>
          </div>
        </Card>

        {isLoading && (
          <Card>
            <Loader />
            <p className="pb-4 text-center text-sm font-semibold text-app-muted">{t('states.loading')}</p>
          </Card>
        )}

        {!isLoading && errorMessage && (
          <Card className="space-y-3">
            <p className="font-black text-danger">{t('states.errorTitle')}</p>
            <p className="text-sm text-app-muted">{errorMessage}</p>
            <Button variant="outline" icon={FiRefreshCw} onClick={() => setReloadKey((key) => key + 1)}>
              {t('actions.retry')}
            </Button>
          </Card>
        )}

        {!isLoading && !errorMessage && !sheet && <EmptyState title={t('states.emptyTitle')} description={t('states.emptyDescription')} />}

        {ready && (
          <>
            {/* Summary cards: ek row, poori width, kam height */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr">
              {summaryCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.key} className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-app-surface px-4 py-3 shadow-soft">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ICON_TONE[card.tone]}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-app-muted">{card.label}</p>
                      <p className="text-xl font-black leading-tight text-app-text">{card.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Distribution */}
            {totalEntries > 0 && (
              <Card className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-black text-app-text">{t('distribution.title')}</p>
                  <p className="text-xs text-app-muted">{t('distribution.subtitle')}</p>
                </div>
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-primary/10">
                  {activeTones.map((tone) => (
                    <span key={tone} className={TONE_STYLES[tone].bar} style={{ width: `${(counts[tone] / totalEntries) * 100}%` }} title={`${t(`stats.${tone}`)}: ${counts[tone]}`} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="self-center text-xs font-black uppercase tracking-wide text-app-muted">{t('legend.title')}</span>
                  {activeTones.map((tone) => (
                    <span key={tone} className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-app-bg px-2.5 py-1 text-xs font-semibold text-app-text">
                      <span className={`h-2.5 w-2.5 rounded-full ${TONE_STYLES[tone].bar}`} />
                      {t(`stats.${tone}`)} · {formatters.number(counts[tone])} ({Math.round((counts[tone] / totalEntries) * 100)}%)
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Employee summary (Excel ki "Week Days · Thu · Fri..." title line yahan hide hai) */}
            <Card className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-black text-app-text">{t('summary.title')}</p>
                  <SheetTabs sheets={parsed.sheets} active={sheetIndex} onChange={setSheetIndex} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <SearchBox value={query} onChange={setQuery} placeholder={t('filters.searchPlaceholder')} label={t('filters.search')} />
                  <Button variant="outline" icon={FiMaximize2} onClick={() => setFullOpen(true)} className="whitespace-nowrap">
                    {t('actions.viewFull')}
                  </Button>
                </div>
              </div>

              {sheet.dayColumns.length > 0 ? (
                summaryRows.length ? <Table rows={summaryRows} columns={summaryColumns} /> : <EmptyState title={t('table.noMatch')} />
              ) : rows.length ? (
                <MatrixTable sheet={sheet} rows={rows} />
              ) : (
                <EmptyState title={t('table.noMatch')} />
              )}

              <p className="text-xs text-app-muted">{t('table.showing', { shown: rows.length, total: sheet.rows.length })}</p>
            </Card>
          </>
        )}
      </div>

      {/* ============ FULL SHEET (Excel jaisa, full-screen) ============ */}
      {fullOpen && sheet && (
        <div className="fixed inset-0 z-50 flex flex-col bg-app-bg print:hidden" role="dialog" aria-modal="true">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 bg-app-surface px-4 py-3">
            <div>
              <p className="font-black text-app-text">{t('full.title')}</p>
              <p className="text-xs text-app-muted">{periodLabel}</p>
            </div>
            <div className="flex flex-nowrap items-center gap-2">
              <Button variant="outline" icon={FiPrinter} onClick={handlePrint} className="whitespace-nowrap">
                {t('actions.print')}
              </Button>
              <Button icon={FiDownload} onClick={handleDownload} className="whitespace-nowrap">
                {t('actions.downloadExcel')}
              </Button>
              <Button variant="ghost" icon={FiX} onClick={() => setFullOpen(false)}>
                {t('actions.close')}
              </Button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-auto p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SheetTabs sheets={parsed.sheets} active={sheetIndex} onChange={setSheetIndex} />
              <SearchBox value={query} onChange={setQuery} placeholder={t('filters.searchPlaceholder')} label={t('filters.search')} />
            </div>
            {rows.length ? <MatrixTable sheet={sheet} rows={rows} /> : <EmptyState title={t('table.noMatch')} />}
            <p className="text-xs text-app-muted">{t('table.showing', { shown: rows.length, total: sheet.rows.length })}</p>
          </div>
        </div>
      )}

      {/* ============ PRINT (hamesha POORA data, saari sheets) ============ */}
      {ready && (
        <div className="hidden print:block">
          {parsed.sheets.map((item, index) => {
            const itemCounts = item.stats.counts
            const meta = [
              { label: t('print.period'), value: periodLabel },
              { label: t('print.employees'), value: item.stats.employees },
              parsed.sheets.length > 1 ? { label: t('print.sheet'), value: item.name } : null,
              ...TONES.filter((tone) => itemCounts[tone] > 0).map((tone) => ({ label: t(`stats.${tone}`), value: itemCounts[tone] }))
            ]
            return (
              <div key={item.name} style={index > 0 ? { breakBefore: 'page' } : undefined}>
                <ReportPrintHeader title={t('print.title')} subtitle={periodLabel} meta={meta} />
                <MatrixTable sheet={item} rows={item.rows} />
                <p className="mt-2 text-[9px] text-gray-500">{t('print.hint')}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}