import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { notify } from '../lib/notify.js'
import i18n from '../i18n/index.js'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (import.meta.env.DEV && !API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is required. Add it to your local .env file.')
}


const TOKEN_KEY = 'attendx-token'
const REFRESH_TOKEN_KEY = 'attendx-refresh-token'
const USER_KEY = 'attendx-user'
const REFRESH_ENDPOINT = '/auth/refresh'

// In endpoints par 401 ka matlab "session expire" nahi hota
const AUTH_ENDPOINTS = ['/auth/login', '/auth/logout', '/auth/refresh']

/* ------------------------------ Session helpers ------------------------------ */

export function normalizeSession(payload) {
  const data = payload?.data ?? payload ?? {}
  return {
    access_token: data.access_token ?? data.accessToken ?? data.token ?? null,
    refresh_token: data.refresh_token ?? data.refreshToken ?? null,
    user: data.user ?? data.admin ?? null
  }
}

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

export function setAuthSession(payload) {
  const session = normalizeSession(payload)
  if (session.access_token) localStorage.setItem(TOKEN_KEY, session.access_token)
  if (session.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token)
  if (session.user) localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return json.exp ? json.exp * 1000 : null
  } catch {
    return null
  }
}

// "Token hai" != "login hai". Expired token + refresh token nahi = logged out.
export function hasValidSession() {
  const token = getAuthToken()
  if (!token) return false
  const expiry = getTokenExpiry(token)
  const expired = expiry !== null && expiry <= Date.now()
  if (expired && !getRefreshToken()) {
    clearAuthSession()
    return false
  }
  return true
}

function forceLogout() {
  clearAuthSession()
  notify.error(i18n.t('errors:sessionExpired'), { id: 'session-expired' })
  if (window.location.pathname !== '/login') window.location.replace('/login')
}

/* ------------------------------ Token refresh ------------------------------ */

let refreshPromise = null

async function requestNewAccessToken() {
  const refreshToken = getRefreshToken()
  if (!REFRESH_ENDPOINT || !refreshToken) return false
  try {
    const response = await fetch(`${API_BASE_URL}${REFRESH_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    if (!response.ok) return false
    const session = normalizeSession(await response.json().catch(() => null))
    if (!session.access_token) return false
    setAuthSession(session)
    return true
  } catch {
    return false
  }
}

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

function isAuthEndpoint(url = '') {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

// Used by authenticated downloads that cannot use RTK Query.
export async function authorizedFetch(url, options = {}) {
  const send = () => {
    const token = getAuthToken()
    return fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
  }

  let response = await send()
  if (response.status === 401) {
    if (await refreshAccessToken()) response = await send()
    if (response.status === 401) forceLogout()
  }
  return response
}

/* --------------------------------- RTK Query --------------------------------- */

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAuthToken()
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  },
  responseHandler: async (response) => {
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')

    if (isJson) return response.json()

    const text = await response.text()
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 120)

    // Preserve status codes for RTK Query error handling.
    if (!response.ok) {
      return { message: preview || `Request failed (status ${response.status})` }
    }

    throw new Error(
      `The server did not return JSON (status ${response.status}).${preview ? ` Response: ${preview}` : ''}`
    )
  }
})

async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions)
  const url = typeof args === 'string' ? args : args?.url

  if (result.error?.status === 401 && !isAuthEndpoint(url)) {
    if (await refreshAccessToken()) {
      result = await rawBaseQuery(args, api, extraOptions)
    }
    if (result.error?.status === 401) forceLogout()
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Employee', 'DeviceRequest', 'EmployeeDevice', 'AttendanceOverride', 'Holiday', 'LeaveType', 'LeaveBalance', 'LeaveRequest', 'Report', 'Office', 'WfhLocation'],
  endpoints: () => ({})
})
