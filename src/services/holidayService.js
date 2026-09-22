import { delay, readStore, storeKeys, updateStore, writeStore } from './localStore.js'

export const getHolidays = () => delay(readStore(storeKeys.holidays))
export const createHoliday = (payload) => {
  const holiday = { id: `HOL-${Date.now()}`, ...payload }
  writeStore(storeKeys.holidays, [holiday, ...readStore(storeKeys.holidays)])
  return delay(holiday)
}
export const updateHoliday = (id, payload) => {
  updateStore(storeKeys.holidays, (holidays) => holidays.map((holiday) => (holiday.id === id ? { ...holiday, ...payload } : holiday)))
  return delay({ id, ...payload })
}
export const deleteHoliday = (id) => {
  updateStore(storeKeys.holidays, (holidays) => holidays.filter((holiday) => holiday.id !== id))
  return delay({ id, deleted: true })
}
