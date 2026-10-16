import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiDownload, FiPrinter } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import Card from '../../../components/ui/Card.jsx'
import EmptyState from '../../../components/ui/EmptyState.jsx'
import Loader from '../../../components/ui/Loader.jsx'
import StatCard from '../../../components/ui/StatCard.jsx'
import Table from '../../../components/ui/Table.jsx'
import ReportPrintHeader from '../../../components/reports/ReportPrintHeader.jsx'
import { getApiErrorMessage } from '../../../lib/apiError.js'
import { printReport } from '../../../lib/printReport.js'
import { downloadTableExcel } from '../../../services/reportExportService.js'


function toTableColumn({ excel, excelOnly, screenOnly, ...column }) {
  return column
}

export default function ReportTab({
  title,
  subtitle,
  filename,
  meta = [],
  stats = [],
  columns,
  rows,
  isLoading,
  isFetching,
  error,
  toolbar,
  pageSize = 15,
  emptyText
}) {
  const { t } = useTranslation('reports')
  const [page, setPage] = useState(1)
  const [excelBusy, setExcelBusy] = useState(false)
  const [excelError, setExcelError] = useState('')

  useEffect(() => {
    setPage(1)
  }, [rows.length, title, subtitle])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, totalPages)
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize)

  const tableColumns = columns.filter((column) => !column.excelOnly).map(toTableColumn)
  const excelColumns = columns.filter((column) => !column.screenOnly && column.excel)

  async function handleExcel() {
    setExcelBusy(true)
    setExcelError('')
    try {
      await downloadTableExcel({
        title,
        subtitle,
        filename,
        headers: excelColumns.map((column) => column.header),
        rows: rows.map((row) => excelColumns.map((column) => column.excel(row))),
        emptyText
      })
    } catch (err) {
      setExcelError(err?.message || t('errors.exportFailed'))
    } finally {
      setExcelBusy(false)
    }
  }

  const hasRows = rows.length > 0

  return (
    <Card className="space-y-4">
      <ReportPrintHeader title={title} subtitle={subtitle} meta={[{ label: t('print.records'), value: rows.length }, ...meta]} />

      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>{toolbar}</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={FiPrinter} onClick={() => printReport(`${title} ${subtitle}`)} disabled={isLoading || !hasRows}>
            {t('actions.print')}
          </Button>
          <Button icon={FiDownload} onClick={handleExcel} disabled={isLoading || !hasRows || excelBusy}>
            {excelBusy ? t('actions.preparing') : t('actions.downloadExcel')}
          </Button>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="print-avoid-break grid grid-cols-2 gap-3 lg:grid-cols-4 print:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} icon={stat.icon} meta={stat.meta} />
          ))}
        </div>
      )}

      {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger print:hidden">{getApiErrorMessage(error)}</p>}
      {excelError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger print:hidden">{excelError}</p>}
      {isFetching && !isLoading && <p className="text-sm font-semibold text-app-muted print:hidden">{t('actions.refreshing')}</p>}

      {isLoading ? (
        <Loader />
      ) : !hasRows ? (
        <EmptyState title={emptyText} />
      ) : (
        <>
          {/* Screen: current page */}
          <div className="print:hidden">
            <Table rows={pageRows} columns={tableColumns} />
          </div>
          {/* Print: poora data */}
          <div className="hidden print:block">
            <Table rows={rows} columns={tableColumns} />
          </div>
        </>
      )}

      {hasRows && (
        <div className="flex flex-col gap-3 text-sm text-app-muted print:hidden sm:flex-row sm:items-center sm:justify-between">
          <span>{t('common:pagination.summary', { page: current, totalPages, shown: pageRows.length, total: rows.length })}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              {t('common:actions.previous')}
            </Button>
            <Button variant="outline" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
              {t('common:actions.next')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}