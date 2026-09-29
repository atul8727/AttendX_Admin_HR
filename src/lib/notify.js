import toast from 'react-hot-toast'

export const notify = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  info: (message, options) => toast(message, options),
  promise: (promise, messages, options) => toast.promise(promise, messages, options)
}
