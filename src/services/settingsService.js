import { delay, readStore, storeKeys, writeStore } from './localStore.js'

export const getSettings = () => delay(readStore(storeKeys.settings))

export const updateSettings = (payload) => {
  const settings = { ...readStore(storeKeys.settings), ...payload }
  writeStore(storeKeys.settings, settings)
  return delay(settings)
}
