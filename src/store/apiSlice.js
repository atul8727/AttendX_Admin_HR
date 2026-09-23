import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const TOKEN_KEY = 'attendx-token'
const REFRESH_TOKEN_KEY = 'attendx-refresh-token'
const USER_KEY = 'attendx-user'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getAuthUser() {
  const user = localStorage.getItem(USER_KEY)
  if (!user) return null
  try {
    return JSON.parse(user)
  } catch {
    return null
  }
}

export function setAuthSession(data) {
  if (data?.access_token) localStorage.setItem(TOKEN_KEY, data.access_token)
  if (data?.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
  if (data?.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = getAuthToken()
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  tagTypes: ['Employee', 'DeviceRequest', 'EmployeeDevice'],
  endpoints: () => ({})
})