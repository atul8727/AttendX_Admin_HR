import { FiDownload, FiFileText } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getReports } from '../../services/reportService.js'

export default function Reports() {
  const { data, loading } = useFetch(getReports)
  if (loading) return <Loader />
  const tones = { primary: 'bg-primary/10 text-primary', teal: 'bg-teal/10 text-teal', warning: 'bg-warning/15 text-warning', info: 'bg-info/10 text-info', danger: 'bg-danger/10 text-danger', success: 'bg-success/10 text-success' }
  return <div className="space-y-6"><h1 className="text-xl font-black sm:text-2xl">Reports</h1><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((report) => <Card key={report.id}><span className={`mb-4 inline-grid h-12 w-12 place-items-center rounded-lg ${tones[report.tone]}`}><FiFileText className="h-6 w-6" /></span><h2 className="text-lg font-bold">{report.title}</h2><p className="mb-4 text-sm text-app-muted">{report.count}</p><Button variant={report.tone === 'danger' ? 'danger' : report.tone} icon={FiDownload} className="w-full sm:w-auto">Open Report</Button></Card>)}</div></div>
}
