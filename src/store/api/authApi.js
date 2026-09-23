import { apiSlice } from '../apiSlice.js'

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    loginAdmin: builder.mutation({
      query: (credentials) => ({
        url: '/admin/auth/login',
        method: 'POST',
        body: credentials
      })
    }),
    logoutAdmin: builder.mutation({
      query: (refreshToken) => ({
        url: '/auth/logout',
        method: 'POST',
        body: { refresh_token: refreshToken },
        responseHandler: 'text'
      })
    })
  })
})

export const { useLoginAdminMutation, useLogoutAdminMutation } = authApi
