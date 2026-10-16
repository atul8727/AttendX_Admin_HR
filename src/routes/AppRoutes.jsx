import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import Loader from '../components/ui/Loader.jsx'
// import { getAuthToken } from '../store/apiSlice.js'
import { hasValidSession } from '../store/apiSlice.js'
const Login = lazy(() => import('../modules/auth/Login.jsx'))
const Dashboard = lazy(() => import('../modules/dashboard/Dashboard.jsx'))
const EmployeeList = lazy(() => import('../modules/employees/EmployeeList.jsx'))
const EmployeeForm = lazy(() => import('../modules/employees/EmployeeForm.jsx'))
const EmployeeDetail = lazy(() => import('../modules/employees/EmployeeDetail.jsx'))
const OfficeList = lazy(() => import('../modules/offices/OfficeList.jsx'))
// const OfficeForm = lazy(() => import('../modules/offices/OfficeForm.jsx'))
const WfhList = lazy(() => import('../modules/wfh/WfhList.jsx'))
const DeviceRequests = lazy(() => import('../modules/devices/DeviceRequests.jsx'))
const LeaveRequests = lazy(() => import('../modules/leave/LeaveRequests.jsx'))
const LeaveTypes = lazy(() => import('../modules/leave/LeaveTypes.jsx'))
const LeaveBalances = lazy(() => import('../modules/leave/LeaveBalances.jsx'))
const HolidayList = lazy(() => import('../modules/holidays/HolidayList.jsx'))
const AttendanceList = lazy(() => import('../modules/attendance/AttendanceList.jsx'))
const AttendanceCorrection = lazy(() => import('../modules/attendance/AttendanceCorrection.jsx'))
const Reports = lazy(() => import('../modules/reports/Reports.jsx'))
const ReportCenter = lazy(() => import('../modules/reportCenter/ReportCenter.jsx'))
const SuspiciousAttempts = lazy(() => import('../modules/suspicious/SuspiciousAttempts.jsx'))

function ProtectedRoutes() {
  const location = useLocation()
  // if (!getAuthToken()) return <Navigate to="/login" replace state={{ from: location }} />
  if (!hasValidSession()) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export default function AppRoutes() {
  return (

    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<ProtectedRoutes />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/new" element={<EmployeeForm />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="offices" element={<OfficeList />} />
                        <Route path="wfh" element={<WfhList />} />
            {/* <Route path="offices/new" element={<OfficeForm />} /> */}
            <Route path="devices" element={<DeviceRequests />} />
            <Route path="leave/requests" element={<LeaveRequests />} />
            <Route path="leave/types" element={<LeaveTypes />} />
            <Route path="leave/balances" element={<LeaveBalances />} />
            <Route path="holidays" element={<HolidayList />} />
            <Route path="attendance" element={<AttendanceList />} />
            <Route path="attendance/correction" element={<AttendanceCorrection />} />
            <Route path="reports" element={<Reports />} />
            <Route path="report-center" element={<ReportCenter />} />
            <Route path="attendance/suspicious-attempts" element={<SuspiciousAttempts />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}