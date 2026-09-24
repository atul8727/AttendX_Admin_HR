import { useState } from 'react'
import { MODULE_API_STATUS } from '../config/moduleApiStatus.js'
import { LOCAL_DEMO_TOKEN, clearAuthSession, setAuthSession } from '../store/apiSlice.js'
import { useLoginAdminMutation, useLogoutAdminMutation } from '../store/api/authApi.js'

const DEMO_ADMINS = [
  { login: 'admin@attendx.com', password: 'admin123' },
  { login: 'admin@example.com', password: 'admin@123' }
]

function getApiErrorMessage(error) {
  return error?.data?.message || error?.error || 'Login failed'
}

function useAuthFromApi() {
  const [loginApi, { isLoading, isError, error }] = useLoginAdminMutation()
  const [logoutApi] = useLogoutAdminMutation()

  return {
    isLoading,
    isError,
    errorMessage: getApiErrorMessage(error),
    login: async (form) => {
      const response = await loginApi(form).unwrap()
      setAuthSession(response.data)
    },
    logout: async (refreshToken) => {
      await logoutApi(refreshToken).unwrap()
      clearAuthSession()
    }
  }
}

function useAuthFromLocal() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  return {
    isLoading,
    isError: Boolean(errorMessage),
    errorMessage: errorMessage || 'Invalid login or password',
    login: async (form) => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        await new Promise((resolve) => setTimeout(resolve, 300))
        const admin = DEMO_ADMINS.find((item) => item.login === form.login && item.password === form.password)
        if (!admin) {
          throw new Error('Invalid login or password')
        }
        setAuthSession({
          access_token: LOCAL_DEMO_TOKEN,
          user: { name: 'Admin', email: admin.login, role: 'ADMIN' }
        })
      } catch (error) {
        setErrorMessage(error.message || 'Invalid login or password')
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    logout: async () => clearAuthSession()
  }
}

export function useAuth() {
  const apiAuth = useAuthFromApi()
  const localAuth = useAuthFromLocal()
  return MODULE_API_STATUS.auth ? apiAuth : localAuth
}
