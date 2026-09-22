import { delay, readStore, storeKeys, updateStore, writeStore } from './localStore.js'

export const getOffices = () => delay(readStore(storeKeys.offices))
export const createOffice = (payload) => {
  const office = { id: `OFF-${Date.now()}`, ...payload }
  writeStore(storeKeys.offices, [office, ...readStore(storeKeys.offices)])
  return delay(office)
}
export const updateOffice = (id, payload) => {
  updateStore(storeKeys.offices, (offices) => offices.map((office) => (office.id === id ? { ...office, ...payload } : office)))
  return delay({ id, ...payload })
}
export const toggleOfficeStatus = (id) => {
  updateStore(storeKeys.offices, (offices) =>
    offices.map((office) => (office.id === id ? { ...office, status: office.status === 'Active' ? 'Inactive' : 'Active' } : office))
  )
  return delay({ id, success: true })
}
