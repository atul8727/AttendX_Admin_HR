import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getLeaveBalances } from '../../services/leaveService.js'

export default function LeaveBalances() {
  const { data, loading } = useFetch(getLeaveBalances)
  if (loading) return <Loader />
  return (
    <Card>
      <h1 className="mb-4 text-xl font-black sm:text-2xl">Leave Balances</h1>
      <Table rows={data} columns={[
        { key: 'name', header: 'Employee' },
        { key: 'casual', header: 'Casual', render: (row) => <ProgressBar value={row.casual} max={12} /> },
        { key: 'sick', header: 'Sick', render: (row) => <ProgressBar value={row.sick} max={8} tone="info" /> },
        { key: 'earned', header: 'Earned', render: (row) => <ProgressBar value={row.earned} max={18} tone="teal" /> }
      ]} />
    </Card>
  )
}
