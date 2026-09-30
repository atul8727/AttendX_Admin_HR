import { useTranslation } from 'react-i18next'
import { FiX } from 'react-icons/fi'
import Button from './Button.jsx'

export default function Modal({ open, title, children, onClose, className = '' }) {
  const { t } = useTranslation()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-slate-950/55 p-3 sm:p-4">
      <div className={`hide-scrollbar max-h-[92vh] w-[min(100%,calc(100vw-1.5rem))] max-w-xl overflow-y-auto rounded-lg bg-app-surface p-4 shadow-soft sm:p-5 ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="min-w-0 pr-3 text-base font-bold text-app-text sm:text-lg">{title}</h2>
          <Button variant="ghost" icon={FiX} onClick={onClose} className="px-3" aria-label={t('common:actions.close')} />
        </div>
        {children}
      </div>
    </div>
  )
}