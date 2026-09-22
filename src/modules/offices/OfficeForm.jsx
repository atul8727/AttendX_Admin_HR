import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'

export default function OfficeForm() {
  return (
    <Card>
      <h1 className="mb-4 text-2xl font-black">Office Form</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Office Name" />
        <Input label="City" />
        <Input label="Latitude" />
        <Input label="Longitude" />
        <Input label="Geofence Radius" />
        <Input label="WFH Location Rules" />
      </div>
      <Button className="mt-5">Save Office</Button>
    </Card>
  )
}
