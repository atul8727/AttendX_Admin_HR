import { useTranslation } from 'react-i18next'
import { FiEdit, FiExternalLink, FiMapPin } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { useFormatters } from '../../../lib/format.js'
import OfficeMapPicker from './OfficeMapPicker.jsx'
import { formatCoordinate, getMapsUrl, getWeekdayLabel } from '../officeUtils.js'

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value ?? '-'}</p>
    </div>
  )
}

export default function OfficeDetailsModal({ office, onClose, onEdit }) {
  const { t } = useTranslation('offices')
  const fmt = useFormatters()
  const hasCoordinates = office.latitude !== null && office.longitude !== null

  // Backend se kharab/khaali date aaye to Intl RangeError deta hai, isliye pehle check karte hain.
  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : fmt.dateTime(date)
  }

  return (
    <Modal open title={t('details.title')} onClose={onClose} className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-app-surface text-primary shadow-soft">
            <FiMapPin className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-black text-app-text">{office.name}</h3>
            <p className="text-sm font-semibold text-app-muted">{t('details.officeId', { id: office.id })}</p>
          </div>
          {hasCoordinates && (
            <a
              href={getMapsUrl(office.latitude, office.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-app-surface px-3 py-2 text-sm font-bold text-primary shadow-soft hover:underline"
            >
              {t('details.openInMaps')} <FiExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {hasCoordinates && <OfficeMapPicker latitude={office.latitude} longitude={office.longitude} radius={office.allowedRadius} readOnly height={240} />}

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label={t('details.latitude')} value={formatCoordinate(office.latitude)} />
          <DetailItem label={t('details.longitude')} value={formatCoordinate(office.longitude)} />
          <DetailItem label={t('details.allowedRadius')} value={t('units.metersLong', { value: office.allowedRadius })} />
          <DetailItem label={t('details.maxGpsAccuracy')} value={t('units.metersLong', { value: office.maxGpsAccuracy })} />
          <DetailItem label={t('details.weeklyOff')} value={getWeekdayLabel(office.weeklyOff, t)} />
          <DetailItem label={t('details.timezone')} value={office.timezone} />
          <DetailItem label={t('details.createdAt')} value={formatDateTime(office.createdAt)} />
          <DetailItem label={t('details.updatedAt')} value={formatDateTime(office.updatedAt)} />
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            {t('common:actions.close')}
          </Button>
          <Button type="button" variant="info" icon={FiEdit} onClick={() => onEdit(office)} className="w-full sm:w-auto">
            {t('details.edit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}