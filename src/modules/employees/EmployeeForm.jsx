import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'

export default function EmployeeForm() {
  return (
    <Card>
      <h1 className="mb-4 text-xl font-black sm:text-2xl">Employee Form</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Full Name" placeholder="Employee name" />
        <Input label="Email" placeholder="employee@company.com" />
        <Input label="Role" placeholder="Designation" />
        <Select label="Office" options={[{ label: 'Noida HQ', value: 'noida' }, { label: 'Bengaluru', value: 'bengaluru' }, { label: 'Mumbai', value: 'mumbai' }]} />
      </div>
      <Button className="mt-5 w-full sm:w-auto">Save Employee</Button>
    </Card>
  )
}
