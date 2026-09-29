import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiCheckCircle, FiUsers } from 'react-icons/fi'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import ProgressBar from '../../../components/ui/ProgressBar.jsx'
import Select from '../../../components/ui/Select.jsx'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((year) => ({ label: String(year), value: String(year) }))

/**
 * One place to set up leave balances for ALL employees.
 * For every active leave type the admin picks the yearly days (e.g. CL 12, SL 10) and clicks once.
 * `assignment` is the return value of useLeaveAssignment(), passed in from the parent page.
 */
export default function AssignAllModal({ open, onClose, activeTypes, assignment, defaultYear = CURRENT_YEAR }) {
  const { state, running, assign, reset } = assignment
  const [year, setYear] = useState(String(defaultYear))
  const [selected, setSelected] = useState([])
  const [quotas, setQuotas] = useState({})
  const [updateExisting, setUpdateExisting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelected(activeTypes.map((type) => String(type.id)))
      setQuotas(Object.fromEntries(activeTypes.map((type) => [String(type.id), String(type.defaultAnnualDays)])))
      setYear(String(defaultYear))
      setUpdateExisting(false)
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function toggle(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  async function handleAssign() {
    try {
      await assign({ leaveTypeIds: selected, year, quotas, updateExisting, leaveTypes: activeTypes })
    } catch (err) {
      void err
    }
  }

  const allSelected = selected.length === activeTypes.length && activeTypes.length > 0
  const invalidQuota = selected.some((id) => quotas[id] === '' || Number(quotas[id]) < 0 || Number.isNaN(Number(quotas[id])))
  const percent = state.total ? Math.round((state.done / state.total) * 100) : state.phase === 'done' ? 100 : 0
  const finished = state.phase === 'done'

  return (
    <Modal open={open} title="Set Up Leave Balances for All Employees" onClose={running ? () => {} : onClose} className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FiUsers className="h-5 w-5" />
          </span>
          <div className="space-y-1 text-sm text-app-muted">
            <p>
              <b className="text-app-text">Step 1:</b> Choose the year. <b className="text-app-text">Step 2:</b> Tick the leave types and set the days per
              year for each. <b className="text-app-text">Step 3:</b> Click Assign.
            </p>
            <p>Every active employee gets these balances. Employees who already have one are skipped, so it is safe to run again.</p>
          </div>
        </div>

        <Select label="Year" value={year} onChange={(event) => setYear(event.target.value)} options={YEAR_OPTIONS} disabled={running} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-app-text">Leave types and yearly days</span>
            {activeTypes.length > 0 && (
              <button
                type="button"
                disabled={running}
                onClick={() => setSelected(allSelected ? [] : activeTypes.map((type) => String(type.id)))}
                className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            )}
          </div>

          {activeTypes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-warning/40 bg-warning/10 p-3 text-sm font-semibold text-warning">
              There are no active leave types. Create or activate one in the Leave Types tab first.
            </p>
          ) : (
            <div className="divide-y divide-primary/10 overflow-hidden rounded-lg border border-primary/15">
              {activeTypes.map((type) => {
                const id = String(type.id)
                const checked = selected.includes(id)
                return (
                  <div key={id} className={`flex items-center gap-3 p-3 transition ${checked ? 'bg-primary/5' : 'bg-app-bg'}`}>
                    <input type="checkbox" className="h-4 w-4 shrink-0 accent-primary" checked={checked} disabled={running} onChange={() => toggle(id)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-app-text">{type.name}</p>
                      <p className="text-xs text-app-muted">Code: {type.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        aria-label={`${type.name} days per year`}
                        value={quotas[id] ?? ''}
                        disabled={running || !checked}
                        onChange={(event) => setQuotas({ ...quotas, [id]: event.target.value })}
                        className="min-h-10 w-20 rounded-lg border border-primary/15 bg-app-surface px-3 text-center font-bold text-app-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      />
                      <span className="w-16 text-xs font-semibold text-app-muted">days / year</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/15 bg-app-bg p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            checked={updateExisting}
            disabled={running}
            onChange={(event) => setUpdateExisting(event.target.checked)}
          />
          <span className="text-sm">
            <span className="block font-bold text-app-text">Also update existing balances</span>
            <span className="text-xs text-app-muted">
              Employees who already have a balance will be changed to the days above. Days already used are kept.
            </span>
          </span>
        </label>

        {(running || finished) && (
          <div className="space-y-2 rounded-lg border border-primary/15 bg-app-bg p-4">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{state.phase === 'scanning' ? 'Checking employees and existing balances...' : finished ? 'Completed' : 'Assigning...'}</span>
              <span className="text-primary">{percent}%</span>
            </div>
            <ProgressBar value={state.done} max={state.total || 1} tone={finished ? 'success' : 'primary'} />
            <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs font-semibold text-app-muted sm:grid-cols-4">
              <div className="rounded-lg bg-success/10 p-2 text-success">
                <p className="text-lg font-black">{state.created}</p>Newly assigned
              </div>
              <div className="rounded-lg bg-teal/10 p-2 text-teal">
                <p className="text-lg font-black">{state.updated}</p>Updated
              </div>
              <div className="rounded-lg bg-info/10 p-2 text-info">
                <p className="text-lg font-black">{state.alreadyAssigned}</p>Already assigned
              </div>
              <div className={`rounded-lg p-2 ${state.failed ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                <p className="text-lg font-black">{state.failed}</p>Failed
              </div>
            </div>
          </div>
        )}

        {finished && state.failed === 0 && (
          <p className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">
            <FiCheckCircle className="h-4 w-4 shrink-0" />
            Done. {state.employees} employees now have their leave balances.
          </p>
        )}
        {(state.phase === 'error' || (finished && state.failed > 0)) && (
          <div className="space-y-1 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">
            <p className="flex items-center gap-2">
              <FiAlertTriangle className="h-4 w-4 shrink-0" /> Some assignments failed.
            </p>
            {state.errors.map((message, index) => (
              <p key={index} className="text-xs font-medium">
                - {message}
              </p>
            ))}
            <p className="text-xs font-medium">Run it again and only the missing ones will be processed.</p>
          </div>
        )}

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose} disabled={running} className="w-full sm:w-auto">
            {finished ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="button"
            icon={FiUsers}
            onClick={handleAssign}
            disabled={running || selected.length === 0 || invalidQuota || activeTypes.length === 0}
            className="w-full sm:w-auto"
          >
            {running ? 'Assigning...' : finished ? 'Run Again' : 'Assign to All Employees'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}