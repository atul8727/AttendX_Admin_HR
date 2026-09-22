import { FiCheck, FiX } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { approveLeaveRequest, getLeaveRequests, rejectLeaveRequest } from '../../services/leaveService.js'

export default function LeaveRequests() {
  const { data, loading, refetch } = useFetch(getLeaveRequests)
  async function handleApprove(id) {
    await approveLeaveRequest(id)
    await refetch()
  }
  async function handleReject(id) {
    await rejectLeaveRequest(id, 'Rejected by admin')
    await refetch()
  }
  if (loading) return <Loader />
  return (
    <Card>
      <h1 className="mb-4 text-2xl font-black">Leave Requests</h1>
      <Table rows={data} columns={[
        { key: 'employee', header: 'Employee' },
        { key: 'type', header: 'Type' },
        { key: 'from', header: 'From' },
        { key: 'to', header: 'To' },
        { key: 'days', header: 'Days' },
        { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
        { key: 'actions', header: 'Actions', render: (row) => <div className="flex gap-2"><Button variant="success" icon={FiCheck} className="px-3" onClick={() => handleApprove(row.id)} /><Button variant="danger" icon={FiX} className="px-3" onClick={() => handleReject(row.id)} /></div> }
      ]} />
    </Card>
  )
}
