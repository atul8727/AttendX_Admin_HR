import {
  mockAttendance,
  mockAuditLogs,
  mockDevices,
  mockEmployees,
  mockHolidays,
  mockLeaves,
  mockLeaveTypes,
  mockOffices,
  mockReports,
  mockSettings
} from '../mock/mockData.js'

const STORAGE_PREFIX = 'attendx-admin'
const STORAGE_VERSION = '2'

export const storeKeys = {
  employees: 'employees',
  offices: 'offices',
  devices: 'devices',
  leaves: 'leaves',
  leaveTypes: 'leaveTypes',
  holidays: 'holidays',
  attendance: 'attendance',
  reports: 'reports',
  auditLogs: 'auditLogs',
  settings: 'settings'
}

const defaults = {
  [storeKeys.employees]: mockEmployees,
  [storeKeys.offices]: mockOffices,
  [storeKeys.devices]: mockDevices,
  [storeKeys.leaves]: mockLeaves,
  [storeKeys.leaveTypes]: mockLeaveTypes,
  [storeKeys.holidays]: mockHolidays,
  [storeKeys.attendance]: mockAttendance,
  [storeKeys.reports]: mockReports,
  [storeKeys.auditLogs]: mockAuditLogs,
  [storeKeys.settings]: mockSettings
}

function key(name) {
  return `${STORAGE_PREFIX}:${name}`
}

function ensureStorageVersion() {
  const versionKey = key('version')
  if (localStorage.getItem(versionKey) === STORAGE_VERSION) return
  Object.values(storeKeys).forEach((name) => localStorage.removeItem(key(name)))
  localStorage.setItem(versionKey, STORAGE_VERSION)
}

function clone(value) {
  return structuredClone(value)
}

export function readStore(name) {
  ensureStorageVersion()
  const saved = localStorage.getItem(key(name))
  if (saved) return JSON.parse(saved)
  const initialValue = clone(defaults[name])
  localStorage.setItem(key(name), JSON.stringify(initialValue))
  return initialValue
}

export function writeStore(name, value) {
  localStorage.setItem(key(name), JSON.stringify(value))
  return clone(value)
}

export function updateStore(name, updater) {
  const current = readStore(name)
  return writeStore(name, updater(current))
}

export function delay(value, ms = 250) {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), ms))
}
