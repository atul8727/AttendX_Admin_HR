import { COMPANY_INFO } from '../../constants/company.js'

// Screen par kabhi nahi dikhta ("hidden") — sirf Ctrl+P / Print button dabane par
// print preview me "print:block" ki wajah se visible hota hai.
export default function ReportPrintHeader({ title, subtitle }) {
  return (
    <div className="hidden print:mb-6 print:block">
      <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
        <div>
          <h1 className="text-xl font-black text-black">{COMPANY_INFO.name}</h1>
          <p className="text-xs text-black">{COMPANY_INFO.tagline}</p>
          <p className="text-xs text-black">{COMPANY_INFO.address}</p>
        </div>
        <div className="text-right text-xs text-black">
          <p className="text-sm font-bold">{title}</p>
          {subtitle && <p>{subtitle}</p>}
          <p>Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}