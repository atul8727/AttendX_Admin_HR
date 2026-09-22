import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'

export default function AttendanceCorrection() {
  return <Card><h1 className="mb-4 text-2xl font-black">Attendance Correction</h1><div className="grid gap-4 md:grid-cols-2"><Input label="Employee ID" /><Input label="Date" type="date" /><Input label="Correct Check In" type="time" /><Input label="Correct Check Out" type="time" /><Input label="Mandatory Reason" className="md:col-span-2" /></div><Button variant="warning" className="mt-5">Submit Correction</Button></Card>
}
