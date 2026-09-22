import { delay, readStore, storeKeys } from './localStore.js'

export const getAuditLogs = () => delay(readStore(storeKeys.auditLogs))
export const getAuditLogById = (id) => delay(readStore(storeKeys.auditLogs).find((log) => log.id === id))
