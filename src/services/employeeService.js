import { delay, readStore, storeKeys, updateStore, writeStore } from './localStore.js'

function normalizeEmployee(payload) {
  const code = payload.code || payload.id
  return {
    role: payload.role || 'Employee',
    department: payload.department || 'General',
    leaveBalance: payload.leaveBalance || { casual: 12, sick: 8, earned: 18 },
    wfhLocation: payload.wfhLocation || { latitude: '', longitude: '', radius: 150 },
    joined: payload.joined || new Date().toISOString().slice(0, 10),
    status: payload.status || 'Active',
    ...payload,
    id: code,
    code
  }
}

function assertUniqueEmployee(payload, existingEmployees, currentId) {
  const duplicate = existingEmployees.find((employee) => {
    const sameRecord = employee.id === currentId
    return !sameRecord && (employee.code === payload.code || employee.email === payload.email || employee.phone === payload.phone)
  })
  if (duplicate) throw new Error('Employee code, email, or phone already exists')
}

export const getEmployees = () => delay(readStore(storeKeys.employees))

export const getEmployeeById = (id) => delay(readStore(storeKeys.employees).find((employee) => employee.id === id))

export const createEmployee = (payload) => {
  const employees = readStore(storeKeys.employees)
  assertUniqueEmployee(payload, employees)
  const employee = normalizeEmployee(payload)
  writeStore(storeKeys.employees, [employee, ...employees])
  return delay(employee)
}

export const updateEmployee = (id, payload) => {
  const employees = readStore(storeKeys.employees)
  assertUniqueEmployee(payload, employees, id)
  const nextEmployee = normalizeEmployee({ ...employees.find((employee) => employee.id === id), ...payload })
  updateStore(storeKeys.employees, (current) => current.map((employee) => (employee.id === id ? nextEmployee : employee)))
  return delay(nextEmployee)
}

export const toggleEmployeeStatus = (id) => {
  const employees = updateStore(storeKeys.employees, (current) =>
    current.map((employee) =>
      employee.id === id ? { ...employee, status: employee.status === 'Active' ? 'Inactive' : 'Active' } : employee
    )
  )
  return delay(employees.find((employee) => employee.id === id))
}
