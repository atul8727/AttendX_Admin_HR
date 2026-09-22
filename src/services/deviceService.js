import { delay, readStore, storeKeys, updateStore } from './localStore.js'

export const getDeviceRequests = () => delay(readStore(storeKeys.devices))
export const approveDeviceRequest = (id) => {
  updateStore(storeKeys.devices, (devices) => devices.map((device) => (device.id === id ? { ...device, status: 'Approved' } : device)))
  return delay({ id, status: 'Approved' })
}
export const rejectDeviceRequest = (id, reason) => {
  updateStore(storeKeys.devices, (devices) => devices.map((device) => (device.id === id ? { ...device, status: 'Rejected', reason } : device)))
  return delay({ id, status: 'Rejected', reason })
}
export const revokeDevice = (id) => {
  updateStore(storeKeys.devices, (devices) => devices.map((device) => (device.id === id ? { ...device, status: 'Revoked' } : device)))
  return delay({ id, status: 'Revoked' })
}
