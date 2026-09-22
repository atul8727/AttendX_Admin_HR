import { FiX } from 'react-icons/fi'
import Button from './Button.jsx'

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className="w-full max-w-xl rounded-lg bg-app-surface p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">{title}</h2>
          <Button variant="ghost" icon={FiX} onClick={onClose} className="px-3" aria-label="Close" />
        </div>
        {children}
      </div>
    </div>
  )
}
