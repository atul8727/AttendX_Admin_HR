import { FiEdit } from 'react-icons/fi'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Table from '../../components/ui/Table.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getAttendance } from '../../services/attendanceService.js'

export default function AttendanceList() {
  const { data, loading } = useFetch(getAttendance)
  if (loading) return <Loader />
  return <div className="space-y-6"><h1 className="text-2xl font-black">Attendance Management</h1><Card><div className="mb-4 grid gap-3 md:grid-cols-3"><Input type="date" defaultValue="2026-09-22" /><Input placeholder="Employee name" /><Input placeholder="Office or status" /></div><Table rows={data} columns={[{ key: 'employee', header: 'Employee' }, { key: 'date', header: 'Date' }, { key: 'checkIn', header: 'Check In' }, { key: 'checkOut', header: 'Check Out' }, { key: 'location', header: 'Location' }, { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> }, { key: 'actions', header: 'Actions', render: () => <Button variant="warning" icon={FiEdit}>Correct</Button> }]} /></Card></div>
}
