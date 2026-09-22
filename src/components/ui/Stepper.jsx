import { FiMinus, FiPlus } from 'react-icons/fi'
import Button from './Button.jsx'

export default function Stepper({ value, onChange, min = 0, max = 999 }) {
  return (
    <div className="flex w-36 items-center justify-between rounded-lg border border-primary/15 bg-app-bg p-1">
      <Button variant="ghost" icon={FiMinus} className="min-h-8 px-2" onClick={() => onChange(Math.max(min, value - 1))} />
      <span className="font-bold text-app-text">{value}</span>
      <Button variant="ghost" icon={FiPlus} className="min-h-8 px-2" onClick={() => onChange(Math.min(max, value + 1))} />
    </div>
  )
}
