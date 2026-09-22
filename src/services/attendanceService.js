import { delay, readStore, storeKeys } from './localStore.js'

export const getAttendance = () => delay(readStore(storeKeys.attendance))
export const getAttendanceDetail = (id) => delay(readStore(storeKeys.attendance).find((record) => record.id === id))
export const createAttendanceCorrection = (payload) => delay({ id: `COR-${Date.now()}`, ...payload, status: 'Pending' })
