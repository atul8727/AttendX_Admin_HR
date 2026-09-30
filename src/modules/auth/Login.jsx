import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiLock, FiMail, FiLoader } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher.jsx'
import logo from '../../assets/logo.svg'
import { useAuth } from '../../hooks/useAuth.js'
// import { getAuthToken } from '../../store/apiSlice.js'
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
  const { login, isLoading, errorMessage } = useAuth()

  useEffect(() => {
    // if (getAuthToken()) navigate('/', { replace: true })
    if (hasValidSession()) navigate('/', { replace: true })
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await login(form)
      navigate('/', { replace: true })
    } catch {
      notify.error(errorMessage, { id: 'login-error' })
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-app-bg px-4 py-8">
      {/* Background decoration — soft glowing blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.10),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(13,148,136,0.10),transparent_35%)]" />

      {/* Language switch — login se pehle bhi language badal sakte hain */}
      <LanguageSwitcher className="absolute right-4 top-4 z-10" />

      <div className="relative w-full max-w-md">
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
                placeholder="admin@attendx.com"
                className="pl-10"
                value={form.login}
                onChange={(event) => setForm({ ...form, login: event.target.value })}
                required
              />
              <FiMail className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-app-muted" />
            </div>

            <div className="relative">
              <Input
                label={t('password')}
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
              <FiLock className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-app-muted" />
            </div>

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

        <p className="mt-6 text-center text-xs text-app-muted">
          {t('footer', { year: new Date().getFullYear() })}
        </p>
      </div>
    </main>
  )
}