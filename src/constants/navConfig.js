import {
  FiActivity,
  FiCalendar,
  FiClipboard,
  FiCpu,
  FiFileText,
  FiHome,
  FiMapPin,
  FiUsers,
  FiMonitor,
  FiShieldOff
} from 'react-icons/fi'

// labelKey = translation key (locales/*/nav.json). Text yahan mat likho.
export const navGroups = [
  {
    labelKey: 'nav:groups.core',
    items: [
      { labelKey: 'nav:items.dashboard', path: '/', icon: FiHome },
      { labelKey: 'nav:items.employees', path: '/employees', icon: FiUsers },
      { labelKey: 'nav:items.wfh', path: '/wfh', icon: FiMonitor },
      { labelKey: 'nav:items.offices', path: '/offices', icon: FiMapPin },
      { labelKey: 'nav:items.devices', path: '/devices', icon: FiCpu }
    ]
  },
  {
    labelKey: 'nav:groups.operations',
    items: [
      { labelKey: 'nav:items.leave', path: '/leave/requests', icon: FiCalendar },
      { labelKey: 'nav:items.holidays', path: '/holidays', icon: FiClipboard },
      { labelKey: 'nav:items.attendanceOverview', path: '/attendance', icon: FiActivity },
      { labelKey: 'nav:items.attendanceReport', path: '/reports', icon: FiFileText },
      { labelKey: 'nav:items.attendanceReport', path: '/reports', icon: FiFileText },
      { labelKey: 'nav:items.suspiciousAttempts', path: '/attendance/suspicious-attempts', icon: FiShieldOff }
    ]
  }
]