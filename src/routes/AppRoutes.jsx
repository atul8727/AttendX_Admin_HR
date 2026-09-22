import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import AttendanceCorrection from '../modules/attendance/AttendanceCorrection.jsx'
import AttendanceList from '../modules/attendance/AttendanceList.jsx'
import AuditLog from '../modules/audit/AuditLog.jsx'
import Dashboard from '../modules/dashboard/Dashboard.jsx'
import DeviceRequests from '../modules/devices/DeviceRequests.jsx'
import EmployeeDetail from '../modules/employees/EmployeeDetail.jsx'
import EmployeeForm from '../modules/employees/EmployeeForm.jsx'
import EmployeeList from '../modules/employees/EmployeeList.jsx'
import HolidayList from '../modules/holidays/HolidayList.jsx'
import LeaveBalances from '../modules/leave/LeaveBalances.jsx'
import LeaveRequests from '../modules/leave/LeaveRequests.jsx'
import LeaveTypes from '../modules/leave/LeaveTypes.jsx'
import OfficeForm from '../modules/offices/OfficeForm.jsx'
import OfficeList from '../modules/offices/OfficeList.jsx'
import Reports from '../modules/reports/Reports.jsx'
import Settings from '../modules/settings/Settings.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="offices" element={<OfficeList />} />
        <Route path="offices/new" element={<OfficeForm />} />
        <Route path="devices" element={<DeviceRequests />} />
        <Route path="leave/requests" element={<LeaveRequests />} />
        <Route path="leave/types" element={<LeaveTypes />} />
        <Route path="leave/balances" element={<LeaveBalances />} />
        <Route path="holidays" element={<HolidayList />} />
        <Route path="attendance" element={<AttendanceList />} />
        <Route path="attendance/correction" element={<AttendanceCorrection />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
