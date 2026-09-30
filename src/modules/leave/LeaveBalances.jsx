import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FiEdit, FiEyeOff, FiUser, FiUsers } from 'react-icons/fi'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Input from '../../components/ui/Input.jsx'
import Loader from '../../components/ui/Loader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Select from '../../components/ui/Select.jsx'
import Table from '../../components/ui/Table.jsx'
import { getApiErrorMessage } from '../../lib/apiError.js'
import LeaveSubNav from './LeaveSubNav.jsx'
import AssignAllModal from './components/AssignAllModal.jsx'
import { useLeaveAssignment } from './useLeaveAssignment.js'
import { useGetEmployeeQuery, useGetEmployeesQuery } from '../../store/api/employeesApi.js'
import {
  useAddLeaveBalanceMutation,
  useGetLeaveBalancesQuery,
  useGetLeaveTypesQuery,
  useUpdateLeaveBalanceMutation
} from '../../store/api/leaveApi.js'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((year) => ({ label: String(year), value: String(year) }))
const PAGE_SIZE = 20

const emptyForm = { employeeId: '', leaveTypeId: '', year: String(CURRENT_YEAR) }

function EmployeeInfo({ employee, employeeId }) {
  const { t } = useTranslation('leave')
  return (
    <div className="flex items-center gap-3">
      <Avatar name={employee?.name || String(employeeId)} />
      <div>
        <p className="font-bold">{employee?.name || t('common.employeeFallback', { id: employeeId })}</p>
        <p className="text-xs text-app-muted">{employee?.code || t('common.idLabel', { id: employeeId })}</p>
      </div>
    </div>
  )
}

// Used only for employees that are not part of the preloaded employee list.
function EmployeeFetchedCell({ employeeId }) {
  const { data: employee } = useGetEmployeeQuery(employeeId, { skip: !employeeId })
  return <EmployeeInfo employee={employee} employeeId={employeeId} />
}

// Shows one leave type exactly as configured in the Leave Types API.
function LeaveTypeCard({ type }) {
  const { t } = useTranslation('leave')
  const active = type.status === 'Active'
  return (
    <div className={`min-w-[210px] flex-1 basis-0 snap-start rounded-lg border border-primary/15 bg-app-surface p-4 ${active ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-black text-app-text">{type.name}</p>
          <p className="text-xs font-semibold text-app-muted">{type.code}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            active ? 'bg-success/10 text-success' : 'bg-app-muted/15 text-app-muted'
          }`}
        >
          {!active && <FiEyeOff className="h-3 w-3" />}
          {active ? t('status:active') : t('common.hidden')}
        </span>
      </div>
      <p className="mt-4 flex items-end gap-1.5">
        <span className="text-3xl font-black leading-none text-app-text">{type.defaultAnnualDays}</span>
        <span className="pb-0.5 text-xs font-semibold text-app-muted">{t('common.perYear')}</span>
      </p>
    </div>
  )
}

export default function LeaveBalances() {
  const { t } = useTranslation('leave')
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: employeePage, isLoading: employeesLoading } = useGetEmployeesQuery({ page: 1, limit: 100 })
  const { data: leaveTypes = [], isLoading: leaveTypesLoading } = useGetLeaveTypesQuery()
  const {
    data: balancePage,
    isLoading,
    isFetching,
    isError,
    error
  } = useGetLeaveBalancesQuery({ employeeId: employeeFilter, year, page, limit: PAGE_SIZE })
  const [addLeaveBalance, addState] = useAddLeaveBalanceMutation()
  const [updateLeaveBalance, updateState] = useUpdateLeaveBalanceMutation()
  const assignment = useLeaveAssignment()

  const [assignOpen, setAssignOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBalance, setEditingBalance] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [allocatedDaysInput, setAllocatedDaysInput] = useState('')

  useEffect(() => {
    setPage(1)
  }, [year, employeeFilter])

  const employees = useMemo(() => employeePage?.items || [], [employeePage])
  const employeeMap = useMemo(() => Object.fromEntries(employees.map((employee) => [String(employee.id), employee])), [employees])
  const leaveTypeMap = useMemo(() => Object.fromEntries(leaveTypes.map((type) => [String(type.id), type])), [leaveTypes])
  const activeTypes = useMemo(() => leaveTypes.filter((type) => type.status === 'Active'), [leaveTypes])
  const sortedTypes = useMemo(() => [...leaveTypes].sort((a, b) => Number(b.status === 'Active') - Number(a.status === 'Active')), [leaveTypes])

  const rows = useMemo(() => balancePage?.items || [], [balancePage])
  const pagination = balancePage?.pagination || { page: 1, limit: PAGE_SIZE, total: rows.length, total_pages: 1 }

  const employeeOptions = [
    { value: '', label: employeesLoading ? t('balances.loadingEmployees') : t('balances.allEmployees') },
    ...employees.map((employee) => ({ value: employee.id, label: `${employee.name} (${employee.code})` }))
  ]
  const leaveTypeOptions = activeTypes.map((type) => ({
    value: type.id,
    label: t('balances.typeOption', { name: type.name, code: type.code, days: t('common.days', { count: type.defaultAnnualDays }) })
  }))

  function openSingleModal() {
    addState.reset?.()
    setForm({ ...emptyForm, employeeId: employeeFilter, year })
    setModalOpen(true)
  }

  function openEditModal(balance) {
    updateState.reset?.()
    setEditingBalance(balance)
    setAllocatedDaysInput(String(balance.allocatedDays))
  }

  async function handleCreateSubmit(event) {
    event.preventDefault()
    try {
      await addLeaveBalance(form).unwrap()
      setModalOpen(false)
    } catch (err) {
      void err
    }
  }

  async function handleUpdateSubmit(event) {
    event.preventDefault()
    try {
      await updateLeaveBalance({ id: editingBalance.id, allocatedDays: allocatedDaysInput }).unwrap()
      setEditingBalance(null)
    } catch (err) {
      void err
    }
  }

  if (isLoading) return <Loader />

  const editingType = editingBalance ? leaveTypeMap[String(editingBalance.leaveTypeId)] : null
  const editingEmployee = editingBalance ? employeeMap[String(editingBalance.employeeId)] : null
  const addError = addState.error ? getApiErrorMessage(addState.error) : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <h1 className="text-xl font-black sm:text-2xl">{t('balances.title')}</h1>
          <p className="text-sm text-app-muted">{t('balances.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <Button icon={FiUsers} onClick={() => setAssignOpen(true)} disabled={activeTypes.length === 0} className="w-full sm:w-auto">
            {t('balances.assignAll')}
          </Button>
          <Button variant="outline" icon={FiUser} onClick={openSingleModal} disabled={activeTypes.length === 0} className="w-full sm:w-auto">
            {t('balances.addOne')}
          </Button>
        </div>
      </div>

      <LeaveSubNav />

      <section className="space-y-3">
        <h2 className="text-base font-black">{t('balances.typesHeading')}</h2>
        {leaveTypesLoading ? (
          <Loader />
        ) : sortedTypes.length === 0 ? (
          <EmptyState title={t('balances.noTypesTitle')} description={t('balances.noTypesBody')} />
        ) : (
          <div className="hide-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
            {sortedTypes.map((type) => (
              <LeaveTypeCard key={type.id} type={type} />
            ))}
          </div>
        )}
      </section>

      <Card>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_160px]">
          <Select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} options={employeeOptions} />
          <Select value={year} onChange={(event) => setYear(event.target.value)} options={YEAR_OPTIONS} />
        </div>

        {isError && <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(error)}</p>}
        {isFetching && !isLoading && <p className="mb-3 text-sm font-semibold text-app-muted">{t('balances.refreshing')}</p>}

        <Table
          rows={rows}
          columns={[
            {
              key: 'employee',
              header: t('balances.columns.employee'),
              render: (row) => {
                const employee = employeeMap[String(row.employeeId)]
                return employee ? <EmployeeInfo employee={employee} employeeId={row.employeeId} /> : <EmployeeFetchedCell employeeId={row.employeeId} />
              }
            },
            {
              key: 'leaveType',
              header: t('balances.columns.leaveType'),
              render: (row) => {
                const type = leaveTypeMap[String(row.leaveTypeId)]
                if (!type) return leaveTypesLoading ? t('common:actions.loading') : t('common.typeFallback', { id: row.leaveTypeId })
                return (
                  <div className={type.status === 'Active' ? '' : 'opacity-70'}>
                    <p className="font-bold">{type.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-app-muted">
                      {type.code}
                      {type.status !== 'Active' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-app-muted/15 px-2 py-0.5 font-bold">
                          <FiEyeOff className="h-3 w-3" /> {t('common.hidden')}
                        </span>
                      )}
                    </p>
                  </div>
                )
              }
            },
            { key: 'used', header: t('balances.columns.used'), render: (row) => t('common.days', { count: row.usedDays }) },
            {
              key: 'balance',
              header: t('balances.columns.remaining'),
              render: (row) => (
                <div className="min-w-[11rem] space-y-1">
                  <ProgressBar value={row.usedDays} max={row.allocatedDays || 1} tone={row.remainingDays <= 0 ? 'warning' : 'success'} />
                  <p className="text-xs font-semibold text-app-muted">
                    {t('balances.daysLeft', { remaining: row.remainingDays, allocated: row.allocatedDays })}
                  </p>
                </div>
              )
            },
            {
              key: 'actions',
              header: t('balances.columns.actions'),
              render: (row) => <Button variant="info" icon={FiEdit} className="px-3" onClick={() => openEditModal(row)} aria-label={t('balances.adjustAria')} />
            }
          ]}
        />

        <div className="mt-4 flex flex-col gap-3 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t('common:pagination.summary', { page: pagination.page, totalPages: pagination.total_pages, shown: rows.length, total: pagination.total })}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {t('common:actions.previous')}
            </Button>
            <Button variant="ghost" disabled={page >= pagination.total_pages || isFetching} onClick={() => setPage((current) => current + 1)}>
              {t('common:actions.next')}
            </Button>
          </div>
        </div>
      </Card>

      <AssignAllModal open={assignOpen} onClose={() => setAssignOpen(false)} activeTypes={activeTypes} assignment={assignment} defaultYear={Number(year)} />

      {/* Add a balance for one employee */}
      <Modal open={modalOpen} title={t('balances.addModal.title')} onClose={() => setModalOpen(false)} className="max-w-lg">
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          <p className="rounded-lg bg-primary/5 p-3 text-xs text-app-muted">
            <Trans i18nKey="balances.addModal.hint" ns="leave" components={{ b: <b className="text-app-text" /> }} />
          </p>
          {addError && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{addError}</p>}
          <Select
            label={t('balances.addModal.employee')}
            value={form.employeeId}
            onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            options={[{ value: '', label: employeesLoading ? t('balances.loadingEmployees') : t('balances.selectEmployee') }, ...employeeOptions.slice(1)]}
            required
          />
          <Select
            label={t('balances.addModal.leaveType')}
            value={form.leaveTypeId}
            onChange={(event) => setForm({ ...form, leaveTypeId: event.target.value })}
            options={[{ value: '', label: leaveTypesLoading ? t('balances.loadingTypes') : t('balances.selectLeaveType') }, ...leaveTypeOptions]}
            required
          />
          <Input label={t('balances.addModal.year')} type="number" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} required />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={addState.isLoading} className="w-full sm:w-auto">
              {t('balances.addModal.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust days for one balance */}
      <Modal open={Boolean(editingBalance)} title={t('balances.adjust.title')} onClose={() => setEditingBalance(null)} className="max-w-md">
        <form className="space-y-4" onSubmit={handleUpdateSubmit}>
          {editingBalance && (
            <div className="rounded-lg border border-primary/10 bg-app-bg p-3 text-sm">
              <p className="font-bold">{editingEmployee?.name || t('common.employeeFallback', { id: editingBalance.employeeId })}</p>
              <p className="text-xs text-app-muted">
                {t('balances.adjust.summary', {
                  type: editingType ? `${editingType.name} (${editingType.code})` : t('common.typeFallback', { id: editingBalance.leaveTypeId }),
                  year: editingBalance.year,
                  used: t('common.days', { count: editingBalance.usedDays })
                })}
              </p>
            </div>
          )}
          {updateState.error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{getApiErrorMessage(updateState.error)}</p>}
          <Input
            label={t('balances.adjust.totalDays')}
            type="number"
            min="0"
            step="0.5"
            value={allocatedDaysInput}
            onChange={(event) => setAllocatedDaysInput(event.target.value)}
            required
          />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setEditingBalance(null)} className="w-full sm:w-auto">
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={updateState.isLoading} className="w-full sm:w-auto">
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}