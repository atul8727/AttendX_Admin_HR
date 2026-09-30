import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiAlertTriangle } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { getApiErrorMessage } from '../../../lib/apiError.js'

// Office delete confirm modal. Backend error (jaise "Reassign employees to delete office") yahin dikhta hai.
// Backend ka message backend ki apni language me aata hai, wo translate nahi hota.
export default function DeleteOfficeModal({ office, onClose, onConfirm }) {
  const { t } = useTranslation('offices')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setDeleting(true)
    setError('')
    try {
      await onConfirm(office)
    } catch (err) {
      setError(getApiErrorMessage(err, t('delete.failed')))
      setDeleting(false)
    }
  }

  return (
    <Modal open title={t('delete.title')} onClose={deleting ? () => {} : onClose} className="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-danger/10 p-4">
          <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div className="min-w-0">
            <p className="break-words text-sm font-bold text-app-text">{t('delete.confirm', { name: office.name })}</p>
            <p className="mt-1 text-xs text-app-muted">{t('delete.hint')}</p>
          </div>
        </div>

        {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} disabled={deleting} className="w-full sm:w-auto">
            {t('common:actions.cancel')}
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={deleting} className="w-full sm:w-auto">
            {deleting ? t('delete.deleting') : t('delete.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}