import { useState } from 'react'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getAuditLogs } from '../../services/auditService.js'

export default function AuditLog() {
  const { data, loading } = useFetch(getAuditLogs)
  const [selected, setSelected] = useState(null)
  if (loading) return <Loader />
  return <><Card><h1 className="mb-4 text-2xl font-black">Audit Log</h1><Table rows={data} onRowClick={setSelected} columns={[{ key: 'time', header: 'Time' }, { key: 'admin', header: 'Admin' }, { key: 'action', header: 'Action' }, { key: 'entity', header: 'Entity' }]} /></Card><Modal open={Boolean(selected)} title="Old / New Data Diff" onClose={() => setSelected(null)}>{selected && <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-danger/10 p-4"><p className="text-xs font-bold uppercase text-danger">Old Data</p><p className="mt-2 font-bold">{selected.oldData}</p></div><div className="rounded-lg bg-success/10 p-4"><p className="text-xs font-bold uppercase text-success">New Data</p><p className="mt-2 font-bold">{selected.newData}</p></div></div>}</Modal></>
}
