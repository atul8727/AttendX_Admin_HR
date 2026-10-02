import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiAlertCircle, FiEye, FiEyeOff, FiLock, FiMail, FiLoader } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import logo from '../../assets/logo.svg'
import { useAuth } from '../../hooks/useAuth.js'
import { hasValidSession } from '../../store/apiSlice.js'
import { notify } from '../../lib/notify.js'

const initialForm = {
  login: '',
  password: ''
}

export default function Login() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [failedMessage, setFailedMessage] = useState('')
  const { login, isLoading, errorMessage } = useAuth()

  useEffect(() => {
    if (hasValidSession()) navigate('/', { replace: true })
  }, [navigate])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (failedMessage) setFailedMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFailedMessage('')
    try {
      await login(form)
      navigate('/', { replace: true })
    } catch {
      setFailedMessage(errorMessage)
      notify.error(errorMessage, { id: 'login-error' })
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-app-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-app-surface shadow-soft ring-1 ring-primary/15">
            <img src={logo} alt="AttendX" className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-app-text">{t('title')}</h1>
          <p className="mt-1 text-sm text-app-muted">{t('subtitle')}</p>
        </div>

        {/* Card */}
        <section className="rounded-2xl border border-primary/15 bg-app-surface p-6 shadow-soft ring-1 ring-white/40 backdrop-blur-sm sm:p-8 dark:ring-white/5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                label={t('login')}
                type="email"
                autoComplete="username"
                placeholder="admin@attendx.com"
                className="pl-10"
                value={form.login}
                onChange={(event) => updateField('login', event.target.value)}
                required
              />
              <FiMail className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-app-muted" />
            </div>

            <div className="relative">
              <Input
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-10 pr-11"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                required
              />
              <FiLock className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-app-muted" />
              {/* View / hide password */}
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-[26px] grid h-8 w-8 place-items-center rounded-md text-app-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                title={showPassword ? t('hidePassword') : t('showPassword')}
                aria-pressed={showPassword}
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>

            {failedMessage && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger"
              >
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {failedMessage}
              </p>
            )}

            <Button className="w-full py-2.5 text-base shadow-soft" disabled={isLoading} type="submit">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <FiLoader className="h-4 w-4 animate-spin" />
                  {t('signingIn')}
                </span>
              ) : (
                t('signIn')
              )}
            </Button>
          </form>
        </section>
      </div>

      {/* Footer alag rakha hai taaki form bilkul beech me rahe */}
      <p className="absolute bottom-4 left-0 right-0 px-4 text-center text-xs text-app-muted">
        {t('footer', { year: new Date().getFullYear() })}
      </p>
    </main>
  )
}