import { FiPlus } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getLeaveTypes } from '../../services/leaveService.js'

export default function LeaveTypes() {
  const { data, loading } = useFetch(getLeaveTypes)
  if (loading) return <Loader />
  return <Card><div className="mb-4 flex justify-between"><h1 className="text-2xl font-black">Leave Types</h1><Button icon={FiPlus}>Add Type</Button></div><Table rows={data} columns={[{ key: 'name', header: 'Type' }, { key: 'annualQuota', header: 'Annual Quota' }, { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> }]} /></Card>
}
