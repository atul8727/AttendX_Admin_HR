import { useTranslation } from 'react-i18next'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value ?? '-'}</p>
    </div>
  )
}

export default function WfhLocationDetailsModal({ employee, location, onClose, onEdit }) {
  const { t } = useTranslation('wfh')
  return (
    <Modal open title={t('details.title')} onClose={onClose} className="max-w-lg">
      {location ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label={t('details.employee')} value={employee.name || '-'} />
            <Detail label={t('details.locationName')} value={location.name || '-'} />
            <Detail label={t('details.latitude')} value={location.latitude ?? '-'} />
            <Detail label={t('details.longitude')} value={location.longitude ?? '-'} />
            <Detail label={t('details.radius')} value={location.radiusMeters == null ? '-' : t('details.meters', { value: location.radiusMeters })} />
            <Detail label={t('details.status')} value={location.status ? <Badge status={location.status} /> : '-'} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common:actions.close')}
            </Button>
            <Button type="button" onClick={onEdit}>
              {t('details.edit')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-app-muted">{t('details.none')}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common:actions.close')}
            </Button>
            <Button type="button" onClick={onEdit}>
              {t('details.setLocation')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}