import { useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import { useGetEmployeeQuery } from '../../store/api/employeesApi.js'

export default function EmployeeDetail() {
  const { id = 'EMP-001' } = useParams()
  const { data: employee } = useGetEmployeeQuery(id)
  if (!employee) return null
  const tabs = ['Profile', 'Office Assignment', 'WFH Location', 'Leave Balance', 'Device History']
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={employee.name} />
          <div>
            <h1 className="text-2xl font-black">{employee.name}</h1>
            <p className="text-app-muted">{employee.role} - {employee.department}</p>
          </div>
          <Badge status={employee.status} />
        </div>
      </Card>
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => <button key={tab} className="whitespace-nowrap rounded-lg bg-app-surface px-4 py-2 text-sm font-bold text-app-text shadow-soft">{tab}</button>)}
      </div>
      <Card>
        <h2 className="mb-4 text-lg font-bold">Leave Balance</h2>
        <div className="space-y-4">
          {Object.entries(employee.leaveBalance).map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm font-semibold capitalize"><span>{key}</span><span>{value}/18</span></div>
              <ProgressBar value={value} max={18} tone={key === 'sick' ? 'info' : 'teal'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
