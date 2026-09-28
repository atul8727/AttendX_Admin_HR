import { useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { getApiErrorMessage } from '../officeUtils.js'

// Office delete confirm modal. Backend error (jaise "Reassign employees to delete office") yahin dikhta hai.
export default function DeleteOfficeModal({ office, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setDeleting(true)
    setError('')
    try {
      await onConfirm(office)
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Office delete nahi ho paya. Dobara try karo.')
      setDeleting(false)
    }
  }

  return (
    <Modal open title="Delete Office" onClose={deleting ? () => {} : onClose} className="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-danger/10 p-4">
          <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-app-text">
              Kya aap <span className="break-words">{office.name}</span> delete karna chahte ho?
            </p>
            <p className="mt-1 text-xs text-app-muted">Agar is office mein employees assigned hain to pehle unhe kisi dusre branch mein reassign karo.</p>
          </div>
        </div>

        {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} disabled={deleting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={deleting} className="w-full sm:w-auto">
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}