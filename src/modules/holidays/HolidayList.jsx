import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { deleteHoliday, getHolidays } from '../../services/holidayService.js'

export default function HolidayList() {
  const { data, loading, refetch } = useFetch(getHolidays)
  async function handleDelete(id) {
    await deleteHoliday(id)
    await refetch()
  }
  if (loading) return <Loader />
  return (
    <Card>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-black sm:text-2xl">Holiday Management</h1>
        <Button icon={FiPlus} className="w-full sm:w-auto">Add Holiday</Button>
      </div>
      <Table rows={data} columns={[
        { key: 'date', header: 'Date' },
        { key: 'name', header: 'Holiday' },
        { key: 'type', header: 'Type' },
        { key: 'office', header: 'Office' },
        { key: 'actions', header: 'Actions', render: (row) => <div className="flex flex-wrap gap-2"><Button variant="info" icon={FiEdit} className="px-3" /><Button variant="danger" icon={FiTrash2} className="px-3" onClick={() => handleDelete(row.id)} /></div> }
      ]} />
    </Card>
  )
}
