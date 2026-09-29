import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'

function Detail({ label, value }) {
  return <div className="rounded-lg border border-primary/10 bg-app-bg p-3"><p className="text-xs font-bold uppercase tracking-wide text-app-muted">{label}</p><p className="mt-1 break-words text-sm font-semibold text-app-text">{value ?? '-'}</p></div>
}

export default function WfhLocationDetailsModal({ employee, location, onClose, onEdit }) {
  return (
    <Modal open title="WFH Location Details" onClose={onClose} className="max-w-lg">
      {location ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Detail label="Employee" value={employee.name || '-'} /><Detail label="Location Name" value={location.name || '-'} /><Detail label="Latitude" value={location.latitude ?? '-'} /><Detail label="Longitude" value={location.longitude ?? '-'} /><Detail label="Radius" value={location.radiusMeters == null ? '-' : `${location.radiusMeters} m`} /><Detail label="Status" value={location.status || '-'} /></div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Close</Button><Button type="button" onClick={onEdit}>Edit</Button></div></div> : <div className="space-y-4"><p className="text-sm text-app-muted">No WFH location is assigned to this employee.</p><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Close</Button><Button type="button" onClick={onEdit}>Set Location</Button></div></div>}
    </Modal>
  )
}
