import {
  FiActivity,
  FiCalendar,
  FiClipboard,
  FiCpu,
  FiFileText,
  FiHome,
  FiMapPin,
  FiSettings,
  FiShield,
  FiUsers
} from 'react-icons/fi'

export const navGroups = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard', path: '/', icon: FiHome },
      { label: 'Employees', path: '/employees', icon: FiUsers },
      { label: 'Offices', path: '/offices', icon: FiMapPin },
      { label: 'Devices', path: '/devices', icon: FiCpu, badge: 3 }
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Leave', path: '/leave/requests', icon: FiCalendar, badge: 5 },
      { label: 'Holidays', path: '/holidays', icon: FiClipboard },
      { label: 'Attendance', path: '/attendance', icon: FiActivity },
      { label: 'Reports', path: '/reports', icon: FiFileText }
    ]
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: FiSettings },
      { label: 'Audit Log', path: '/audit', icon: FiShield }
    ]
  }
]
