import { useMemo, useState } from 'react'
import { FiCheck, FiRotateCcw, FiX } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { approveDeviceRequest, getDeviceRequests, rejectDeviceRequest, revokeDevice } from '../../services/deviceService.js'

export default function DeviceRequests() {
  const { data, loading, refetch } = useFetch(getDeviceRequests)
  const [tab, setTab] = useState('Pending')

  const rows = useMemo(() => {
    if (!data) return []
    if (tab === 'Pending') return data.filter((request) => request.status === 'Pending')
    return data.filter((request) => request.status !== 'Pending')
  }, [data, tab])

  async function handleApprove(id) {
    await approveDeviceRequest(id)
    await refetch()
  }

  async function handleReject(id) {
    await rejectDeviceRequest(id, 'Rejected by admin')
    await refetch()
  }

  async function handleRevoke(id) {
    await revokeDevice(id)
    await refetch()
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Device Management</h1>
        <p className="text-sm text-app-muted">Review device change requests and revoke device access.</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-primary/15 bg-app-bg p-1">
            {['Pending', 'History'].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`min-h-10 rounded-md px-4 text-sm font-bold transition ${
                  tab === item ? 'bg-primary text-white shadow-soft' : 'text-primary hover:bg-primary/10'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-app-muted">{rows.length} request(s)</p>
        </div>

        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: 'Employee',
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.employee} />
                  <div>
                    <p className="font-bold">{row.employee}</p>
                    <p className="text-xs text-app-muted">{row.id}</p>
                  </div>
                </div>
              )
            },
            {
              key: 'devices',
              header: 'Current vs Requested',
              render: (row) => (
                <div className="grid min-w-80 grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
                    <p className="text-xs font-bold uppercase text-app-muted">Current</p>
                    <p className="font-bold">{row.currentDevice}</p>
                  </div>
                  <span className="text-lg font-black text-primary">to</span>
                  <div className="rounded-lg border border-primary/10 bg-app-bg p-3">
                    <p className="text-xs font-bold uppercase text-app-muted">Requested</p>
                    <p className="font-bold">{row.requestedDevice}</p>
                  </div>
                </div>
              )
            },
            { key: 'reason', header: 'Reason' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    icon={FiCheck}
                    onClick={() => handleApprove(row.id)}
                    disabled={row.status === 'Approved'}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    icon={FiX}
                    onClick={() => handleReject(row.id)}
                    disabled={row.status === 'Rejected'}
                  >
                    Reject
                  </Button>
                  <Button variant="warning" icon={FiRotateCcw} onClick={() => handleRevoke(row.id)}>
                    Revoke
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
