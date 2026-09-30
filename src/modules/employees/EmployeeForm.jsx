import { useTranslation } from 'react-i18next'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'

export default function EmployeeForm() {
  const { t } = useTranslation('employees')
  return (
    <Card>
      <h1 className="mb-4 text-xl font-black sm:text-2xl">{t('formPage.title')}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label={t('formPage.fullName')} placeholder={t('formPage.fullNamePlaceholder')} />
        <Input label={t('formPage.email')} placeholder="employee@company.com" />
        <Input label={t('formPage.role')} placeholder={t('formPage.rolePlaceholder')} />
        <Select label={t('formPage.office')} options={[{ label: 'Noida HQ', value: 'noida' }, { label: 'Bengaluru', value: 'bengaluru' }, { label: 'Mumbai', value: 'mumbai' }]} />
      </div>
      <Button className="mt-5 w-full sm:w-auto">{t('formPage.save')}</Button>
    </Card>
  )
}