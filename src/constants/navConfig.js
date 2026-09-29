import {
  FiActivity,
  FiCalendar,
  FiClipboard,
  FiCpu,
  FiFileText,
  FiHome,
  FiMapPin,
  FiUsers,
  FiMonitor
} from 'react-icons/fi'

export const navGroups = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard', path: '/', icon: FiHome },
      { label: 'Employees', path: '/employees', icon: FiUsers },
      { label: 'Work From Home', path: '/wfh', icon: FiMonitor },
      { label: 'Offices', path: '/offices', icon: FiMapPin },
      { label: 'Devices', path: '/devices', icon: FiCpu }
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Leave', path: '/leave/requests', icon: FiCalendar },
      { label: 'Holidays', path: '/holidays', icon: FiClipboard },
      { label: 'Attendance Overview', path: '/attendance', icon: FiActivity },
      { label: 'Attendance Report', path: '/reports', icon: FiFileText }
    ]
  }
]
