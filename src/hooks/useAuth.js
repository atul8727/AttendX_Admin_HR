import { clearAuthSession, setAuthSession } from '../store/apiSlice.js'
import { useLoginAdminMutation, useLogoutAdminMutation } from '../store/api/authApi.js'
import { getApiErrorMessage } from '../lib/apiError.js'

export function useAuth() {
  const [loginApi, { isLoading, isError, error }] = useLoginAdminMutation()
  const [logoutApi] = useLogoutAdminMutation()

  return {
    isLoading,
    isError,
    errorMessage: getApiErrorMessage(error, 'Login failed.'),
    login: async (form) => {
      const response = await loginApi({ login: form.login.trim(), password: form.password }).unwrap()
      setAuthSession(response)
    },
    logout: async (refreshToken) => {
      await logoutApi(refreshToken).unwrap()
      clearAuthSession()
    }
  }
}
