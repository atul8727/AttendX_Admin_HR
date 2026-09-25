import { FiInbox } from 'react-icons/fi'

export default function EmptyState({ title = 'Nothing here yet', description = 'Try changing filters or adding a record.' }) {
  return (
    <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-primary/25 bg-app-surface p-5 text-center sm:min-h-48 sm:p-8">
      <div>
        <FiInbox className="mx-auto h-8 w-8 text-primary" />
        <h3 className="mt-3 font-bold text-app-text">{title}</h3>
        <p className="mt-1 text-sm text-app-muted">{description}</p>
      </div>
    </div>
  )
}
