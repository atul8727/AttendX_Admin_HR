import { delay, readStore, storeKeys, updateStore, writeStore } from './localStore.js'

export const getLeaveTypes = () => delay(readStore(storeKeys.leaveTypes))
export const createLeaveType = (payload) => {
  const leaveType = { id: `LT-${Date.now()}`, ...payload }
  writeStore(storeKeys.leaveTypes, [leaveType, ...readStore(storeKeys.leaveTypes)])
  return delay(leaveType)
}
export const updateLeaveType = (id, payload) => {
  updateStore(storeKeys.leaveTypes, (types) => types.map((type) => (type.id === id ? { ...type, ...payload } : type)))
  return delay({ id, ...payload })
}
export const deleteLeaveType = (id) => {
  updateStore(storeKeys.leaveTypes, (types) => types.filter((type) => type.id !== id))
  return delay({ id, deleted: true })
}
export const getLeaveBalances = () =>
  delay(readStore(storeKeys.employees).map(({ id, name, leaveBalance }) => ({ id, name, ...leaveBalance })))
export const adjustLeaveBalance = (id, payload) => delay({ id, ...payload })
export const getLeaveRequests = () => delay(readStore(storeKeys.leaves))
export const approveLeaveRequest = (id) => {
  updateStore(storeKeys.leaves, (leaves) => leaves.map((leave) => (leave.id === id ? { ...leave, status: 'Approved' } : leave)))
  return delay({ id, status: 'Approved' })
}
export const rejectLeaveRequest = (id, reason) => {
  updateStore(storeKeys.leaves, (leaves) => leaves.map((leave) => (leave.id === id ? { ...leave, status: 'Rejected', reason } : leave)))
  return delay({ id, status: 'Rejected', reason })
}
export const cancelLeaveRequest = (id) => {
  updateStore(storeKeys.leaves, (leaves) => leaves.map((leave) => (leave.id === id ? { ...leave, status: 'Cancelled' } : leave)))
  return delay({ id, status: 'Cancelled' })
}
