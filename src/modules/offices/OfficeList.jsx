import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiAlertCircle, FiCheckCircle, FiGlobe, FiMapPin, FiPlus, FiRefreshCw, FiSearch, FiTarget } from 'react-icons/fi'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { getApiErrorMessage } from '../../lib/apiError.js'
import { useAddOfficeMutation, useDeleteOfficeMutation, useGetOfficesQuery, useUpdateOfficeMutation } from '../../store/api/officesApi.js'
import DeleteOfficeModal from './components/DeleteOfficeModal.jsx'
import OfficeCard from './components/OfficeCard.jsx'
import OfficeDetailsModal from './components/OfficeDetailsModal.jsx'
import OfficeFormModal from './components/OfficeFormModal.jsx'

export default function OfficeList() {
  const { t } = useTranslation('offices')
  const { data, isLoading, isFetching, isError, error, refetch } = useGetOfficesQuery()
  const [addOffice] = useAddOfficeMutation()
  const [updateOffice] = useUpdateOfficeMutation()
  const [deleteOffice] = useDeleteOfficeMutation()

  const [search, setSearch] = useState('')
  const [formState, setFormState] = useState({ open: false, office: null })
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [notice, setNotice] = useState('')

  const offices = useMemo(() => data || [], [data])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return offices
    return offices.filter((office) => [office.name, office.timezone, office.id].some((value) => String(value).toLowerCase().includes(query)))
  }, [offices, search])

  const stats = useMemo(() => {
    const total = offices.length
    const averageRadius = total ? Math.round(offices.reduce((sum, office) => sum + office.allowedRadius, 0) / total) : 0
    const timezones = new Set(offices.map((office) => office.timezone)).size
    return { total, averageRadius, timezones }
  }, [offices])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  function openCreate() {
    setFormState({ open: true, office: null })
  }

  function openEdit(office) {
    setViewing(null)
    setFormState({ open: true, office })
  }

  function closeForm() {
    setFormState({ open: false, office: null })
  }

  // Modals apna error khud dikhate hain, isliye yahan error re-throw hone dete hain.
  async function handleSave(values) {
    if (formState.office) {
      await updateOffice({ id: formState.office.id, ...values }).unwrap()
      setNotice(t('list.notice.updated'))
    } else {
      await addOffice(values).unwrap()
      setNotice(t('list.notice.created'))
    }
    closeForm()
  }

  async function handleDelete(office) {
    await deleteOffice(office.id).unwrap()
    setDeleting(null)
    setNotice(t('list.notice.deleted', { name: office.name }))
  }

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-black sm:text-2xl">{t('list.title')}</h1>
          <p className="text-sm text-app-muted">{t('list.subtitle')}</p>
        </div>
        <Button icon={FiPlus} onClick={openCreate} className="w-full sm:w-auto">
          {t('list.add')}
        </Button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success" role="status">
          <FiCheckCircle className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('list.stats.total')} value={stats.total} tone="primary" icon={FiMapPin} />
        <StatCard label={t('list.stats.avgRadius')} value={t('units.meters', { value: stats.averageRadius })} tone="secondary" icon={FiTarget} />
        <StatCard label={t('list.stats.timezones')} value={stats.timezones} tone="info" icon={FiGlobe} />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
            <Input placeholder={t('list.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-3 text-sm text-app-muted">
            {isFetching && <span className="font-semibold">{t('common:actions.refreshing')}</span>}
            <span>{t('list.showing', { shown: filtered.length, total: offices.length })}</span>
            <Button variant="ghost" icon={FiRefreshCw} onClick={refetch} disabled={isFetching} aria-label={t('list.refreshAria')} className="px-3" />
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-start gap-3 rounded-xl bg-danger/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-danger">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              {getApiErrorMessage(error, t('list.loadFailed'))}
            </p>
            <Button variant="danger" icon={FiRefreshCw} onClick={refetch}>
              {t('list.retry')}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          offices.length === 0 ? (
            <div className="space-y-3">
              <EmptyState title={t('list.emptyTitle')} description={t('list.emptyBody')} />
              <div className="flex justify-center">
                <Button icon={FiPlus} onClick={openCreate}>
                  {t('list.addFirst')}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState title={t('list.noMatchTitle')} description={t('list.noMatchBody')} />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((office) => (
              <OfficeCard key={office.id} office={office} onView={setViewing} onEdit={openEdit} onDelete={setDeleting} />
            ))}
          </div>
        )}
      </Card>

      {formState.open && <OfficeFormModal office={formState.office} onClose={closeForm} onSubmit={handleSave} />}
      {viewing && <OfficeDetailsModal office={viewing} onClose={() => setViewing(null)} onEdit={openEdit} />}
      {deleting && <DeleteOfficeModal office={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />}
    </div>
  )
}