import { useTranslation } from 'react-i18next'
import { FiClock, FiEdit, FiExternalLink, FiEye, FiMapPin, FiTarget, FiTrash2, FiCrosshair } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import { formatCoordinate, getMapsUrl, getWeekdayLabel } from '../officeUtils.js'

function MiniStat({ icon, label, value }) {
  const Icon = icon
  return (
    <div className="rounded-xl border border-primary/10 bg-app-bg p-3">
      <div className="flex items-center gap-1.5 text-app-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <p className="truncate text-[11px] font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 truncate text-sm font-black text-app-text">{value}</p>
    </div>
  )
}

export default function OfficeCard({ office, onView, onEdit, onDelete }) {
  const { t } = useTranslation('offices')
  const hasCoordinates = office.latitude !== null && office.longitude !== null

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-primary/15 bg-app-surface shadow-soft ring-1 ring-white/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg dark:ring-white/5">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary" />

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
            <FiMapPin className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-black text-app-text" title={office.name}>
              {office.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-app-muted">
              <FiClock className="h-3 w-3 shrink-0" />
              {office.timezone}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat icon={FiTarget} label={t('card.geofence')} value={t('units.meters', { value: office.allowedRadius })} />
          <MiniStat icon={FiCrosshair} label={t('card.gpsAccuracy')} value={t('units.meters', { value: office.maxGpsAccuracy })} />
          <MiniStat icon={FiClock} label={t('card.weekOff')} value={getWeekdayLabel(office.weeklyOff, t, true)} />
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl bg-primary/5 px-3 py-2 text-xs">
          <span className="min-w-0 truncate font-semibold text-app-muted">
            {formatCoordinate(office.latitude)}, {formatCoordinate(office.longitude)}
          </span>
          {hasCoordinates && (
            <a
              href={getMapsUrl(office.latitude, office.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-bold text-primary hover:underline"
            >
              {t('card.map')} <FiExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button variant="outline" icon={FiEye} onClick={() => onView(office)} className="flex-1">
            {t('card.view')}
          </Button>
          <Button variant="info" icon={FiEdit} onClick={() => onEdit(office)} className="px-3" aria-label={t('card.editAria', { name: office.name })} />
          <Button variant="danger" icon={FiTrash2} onClick={() => onDelete(office)} className="px-3" aria-label={t('card.deleteAria', { name: office.name })} />
        </div>
      </div>
    </article>
  )
}