export const mockEmployees = [
  { id: 'EMP001', code: 'EMP001', name: 'Aarav Sharma', role: 'Frontend Engineer', department: 'Product', office: 'Noida HQ', expectedLogin: '09:30', expectedLogout: '18:30', status: 'Active', email: 'aarav@attendx.in', phone: '+91 98765 12001', wfh: 'Enabled', wfhLocation: { latitude: '28.5355', longitude: '77.3910', radius: 150 }, device: 'MacBook Pro M3', joined: '2024-02-12', leaveBalance: { casual: 8, sick: 5, earned: 12 } },
  { id: 'EMP002', code: 'EMP002', name: 'Meera Nair', role: 'HR Manager', department: 'People', office: 'Gurugram', expectedLogin: '10:00', expectedLogout: '19:00', status: 'Active', email: 'meera@attendx.in', phone: '+91 98765 12002', wfh: 'Enabled', wfhLocation: { latitude: '28.4595', longitude: '77.0266', radius: 150 }, device: 'ThinkPad X1', joined: '2023-06-01', leaveBalance: { casual: 6, sick: 7, earned: 15 } },
  { id: 'EMP003', code: 'EMP003', name: 'Kabir Khan', role: 'QA Lead', department: 'Quality', office: 'Remote', expectedLogin: '09:45', expectedLogout: '18:45', status: 'Inactive', email: 'kabir@attendx.in', phone: '+91 98765 12003', wfh: 'Disabled', wfhLocation: { latitude: '', longitude: '', radius: 0 }, device: 'Dell Latitude', joined: '2022-11-18', leaveBalance: { casual: 2, sick: 3, earned: 4 } },
  { id: 'EMP004', code: 'EMP004', name: 'Isha Patel', role: 'Finance Analyst', department: 'Finance', office: 'Mumbai', expectedLogin: '09:30', expectedLogout: '18:30', status: 'Active', email: 'isha@attendx.in', phone: '+91 98765 12004', wfh: 'Enabled', wfhLocation: { latitude: '19.0760', longitude: '72.8777', radius: 150 }, device: 'HP EliteBook', joined: '2025-01-08', leaveBalance: { casual: 9, sick: 6, earned: 10 } },
  { id: 'EMP005', code: 'EMP005', name: 'Rohan Verma', role: 'Backend Engineer', department: 'Engineering', office: 'Noida HQ', expectedLogin: '09:30', expectedLogout: '18:30', status: 'Active', email: 'rohan@attendx.in', phone: '+91 98765 12005', wfh: 'Disabled', wfhLocation: { latitude: '', longitude: '', radius: 0 }, device: 'MacBook Air M2', joined: '2024-08-14', leaveBalance: { casual: 7, sick: 8, earned: 11 } },
  { id: 'EMP006', code: 'EMP006', name: 'Naina Singh', role: 'Product Designer', department: 'Design', office: 'Bengaluru', expectedLogin: '10:00', expectedLogout: '19:00', status: 'Active', email: 'naina@attendx.in', phone: '+91 98765 12006', wfh: 'Enabled', wfhLocation: { latitude: '12.9716', longitude: '77.5946', radius: 150 }, device: 'iPad Pro', joined: '2025-03-21', leaveBalance: { casual: 10, sick: 4, earned: 8 } }
]

export const mockOffices = [
  { id: 'OFF-001', name: 'Noida HQ', city: 'Noida', radius: '250m', status: 'Active', employees: 86 },
  { id: 'OFF-002', name: 'Gurugram', city: 'Gurugram', radius: '150m', status: 'Active', employees: 44 },
  { id: 'OFF-003', name: 'Bengaluru', city: 'Bengaluru', radius: '300m', status: 'Active', employees: 52 },
  { id: 'OFF-004', name: 'Mumbai', city: 'Mumbai', radius: '200m', status: 'Inactive', employees: 18 }
]

export const mockDevices = [
  { id: 'DEV-101', employee: 'Aarav Sharma', currentDevice: 'iPhone 14', requestedDevice: 'iPhone 16', status: 'Pending', reason: 'Device upgrade after repair issues' },
  { id: 'DEV-102', employee: 'Meera Nair', currentDevice: 'Pixel 8', requestedDevice: 'Pixel 10', status: 'Approved', reason: 'Approved by IT' },
  { id: 'DEV-103', employee: 'Isha Patel', currentDevice: 'Samsung S23', requestedDevice: 'Samsung S25', status: 'Pending', reason: 'Camera GPS instability' }
]

export const mockLeaves = [
  { id: 'LV-101', employee: 'Meera Nair', type: 'Sick Leave', from: '2026-09-22', to: '2026-09-24', days: 3, status: 'Pending', reason: 'Medical rest' },
  { id: 'LV-102', employee: 'Aarav Sharma', type: 'Casual Leave', from: '2026-09-22', to: '2026-09-22', days: 1, status: 'Approved', reason: 'Personal work' },
  { id: 'LV-103', employee: 'Isha Patel', type: 'Earned Leave', from: '2026-10-01', to: '2026-10-04', days: 4, status: 'Pending', reason: 'Family event' }
]

export const mockLeaveTypes = [
  { id: 'LT-01', name: 'Casual Leave', annualQuota: 12, color: 'primary', status: 'Active' },
  { id: 'LT-02', name: 'Sick Leave', annualQuota: 8, color: 'info', status: 'Active' },
  { id: 'LT-03', name: 'Earned Leave', annualQuota: 18, color: 'teal', status: 'Active' }
]

export const mockHolidays = [
  { id: 'HOL-01', name: 'Gandhi Jayanti', date: '2026-10-02', type: 'Full-day', office: 'All Offices' },
  { id: 'HOL-02', name: 'Diwali Eve', date: '2026-11-07', type: 'Half-day', office: 'All Offices' },
  { id: 'HOL-03', name: 'Christmas', date: '2026-12-25', type: 'Full-day', office: 'All Offices' }
]

export const mockAttendance = [
  { id: 'ATT-001', employee: 'Aarav Sharma', date: '2026-09-22', checkIn: '09:24', checkOut: '18:28', status: 'Present', location: 'Noida HQ' },
  { id: 'ATT-002', employee: 'Meera Nair', date: '2026-09-22', checkIn: '10:22', checkOut: '18:11', status: 'Late', location: 'Gurugram' },
  { id: 'ATT-003', employee: 'Isha Patel', date: '2026-09-22', checkIn: '-', checkOut: '-', status: 'Absent', location: 'Mumbai' },
  { id: 'ATT-004', employee: 'Kabir Khan', date: '2026-09-22', checkIn: '09:30', checkOut: '17:46', status: 'WFH', location: 'Remote' },
  { id: 'ATT-005', employee: 'Rohan Verma', date: '2026-09-22', checkIn: '09:41', checkOut: '18:33', status: 'Late', location: 'Noida HQ' },
  { id: 'ATT-006', employee: 'Naina Singh', date: '2026-09-22', checkIn: '-', checkOut: '-', status: 'On Leave', location: 'Bengaluru' }
]

export const mockReports = [
  { id: 'RPT-01', title: 'Daily Attendance', tone: 'primary', count: '184 rows' },
  { id: 'RPT-02', title: 'Monthly Summary', tone: 'teal', count: '26 days' },
  { id: 'RPT-03', title: 'Late Arrivals', tone: 'warning', count: '14 cases' },
  { id: 'RPT-04', title: 'Leave Utilization', tone: 'info', count: '39 leaves' },
  { id: 'RPT-05', title: 'Security / Mock GPS', tone: 'danger', count: '3 flagged' },
  { id: 'RPT-06', title: 'Excel Export', tone: 'success', count: 'Ready' }
]

export const mockAuditLogs = [
  { id: 'AUD-001', time: '2026-09-22 10:45', admin: 'Admin User', action: 'Approved leave request', entity: 'LV-102', oldData: 'Pending', newData: 'Approved' },
  { id: 'AUD-002', time: '2026-09-22 11:05', admin: 'Admin User', action: 'Updated geofence radius', entity: 'OFF-001', oldData: '200m', newData: '250m' },
  { id: 'AUD-003', time: '2026-09-22 12:18', admin: 'HR Lead', action: 'Rejected device request', entity: 'DEV-099', oldData: 'Pending', newData: 'Rejected' }
]

export const mockSettings = { graceOccurrences: 3, defaultGeofenceRadius: 150, mockGpsEnforcement: 'Log Only' }
