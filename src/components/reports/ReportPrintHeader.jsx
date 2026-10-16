import { COMPANY_INFO } from '../../constants/company.js'
import { useTranslation } from 'react-i18next'
import { useFormatters } from '../../lib/format.js'

export default function ReportPrintHeader({ title, subtitle, meta = [] }) {
  const { t } = useTranslation('reports')
  const fmt = useFormatters()
  const items = meta.filter((item) => item && item.value !== undefined && item.value !== null && item.value !== '')

  return (
    <div className="hidden print:mb-4 print:block">
      <div className="flex items-start justify-between gap-4 border-b-[3px] border-primary pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-black text-white">
            {COMPANY_INFO.name.slice(0, 1)}
          </span>
          <div>
            <h1 className="text-xl font-black leading-tight text-black">{COMPANY_INFO.name}</h1>
            <p className="text-[11px] text-gray-700">{t('common:company.tagline')}</p>
            <p className="text-[11px] text-gray-700">{t('common:company.address')}</p>
          </div>
        </div>
        <div className="text-right text-[11px] text-gray-700">
          <p className="text-base font-black uppercase tracking-wide text-primary">{title}</p>
          {subtitle && <p className="font-semibold text-black">{subtitle}</p>}
          <p>
            {t('print.generated')} {fmt.dateTime(new Date())}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 rounded-md bg-gray-100 px-3 py-1.5 text-[11px] text-gray-800">
          {items.map((item) => (
            <p key={item.label}>
              <span className="font-bold">{item.label}:</span> {item.value}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}