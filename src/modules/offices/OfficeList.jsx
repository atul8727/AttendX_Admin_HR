import { FiEdit, FiPlus, FiPower } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getOffices, toggleOfficeStatus } from '../../services/officeService.js'

export default function OfficeList() {
  const { data, loading, refetch } = useFetch(getOffices)
  async function handleToggle(id) {
    await toggleOfficeStatus(id)
    await refetch()
  }
  if (loading) return <Loader />
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-3">
        <div><h1 className="text-2xl font-black">Office Management</h1><p className="text-sm text-app-muted">Offices, geofences, and employee WFH setup.</p></div>
        <Button icon={FiPlus}>Add Office</Button>
      </div>
      <Card>
        <Table rows={data} columns={[
          { key: 'name', header: 'Office' },
          { key: 'city', header: 'City' },
          { key: 'radius', header: 'Geofence' },
          { key: 'employees', header: 'Employees' },
          { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
          { key: 'actions', header: 'Actions', render: (row) => <div className="flex gap-2"><Button variant="info" icon={FiEdit} className="px-3" /><Button variant={row.status === 'Active' ? 'danger' : 'success'} icon={FiPower} className="px-3" onClick={() => handleToggle(row.id)} /></div> }
        ]} />
      </Card>
    </div>
  )
}
