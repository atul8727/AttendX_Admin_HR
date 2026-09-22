import { delay, readStore, storeKeys } from './localStore.js'

export const getReports = () => delay(readStore(storeKeys.reports))
export const getReportByType = (type) => delay({ type, rows: readStore(storeKeys.attendance) })
export const exportReportToExcel = (type) => delay({ type, exported: true })
