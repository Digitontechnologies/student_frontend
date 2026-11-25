import { useMemo, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { FeeSummary } from './FeeSummary'
import type { Batch, Course } from '../../data/mock'
import { useApiList } from '../../hooks/useOptions'
import { emptyForm, fileToAvatar, PAYMENT_METHODS, studentToForm, validateStudent } from '../../lib/students'
import type { FormErrors, PaymentMethod, Student, StudentFormValues } from '../../types/student'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-semibold text-slate-900">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function StudentForm({ student, onSubmit, onCancel }: {
  student?: Student
  onSubmit: (values: StudentFormValues) => void
  onCancel: () => void
}) {
  const isEdit = !!student
  const [v, setV] = useState<StudentFormValues>(() => (student ? studentToForm(student) : emptyForm()))
  const [errors, setErrors] = useState<FormErrors>({})
  const [photoError, setPhotoError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof StudentFormValues>(k: K, val: StudentFormValues[K]) => {
    setV((p) => ({ ...p, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const courses = useApiList<Course>('/courses')
  const batches = useApiList<Batch>('/batches')
  const batchOptions = useMemo(() => batches.filter((b) => b.course === v.course).map((b) => b.name), [batches, v.course])
  const courseNames = useMemo(() => courses.map((c) => c.name), [courses])

  const pickCourse = (name: string) => {
    const c = courses.find((x) => x.name === name)
    const bs = batches.filter((b) => b.course === name).map((b) => b.name)
    setV((p) => ({ ...p, course: name, batch: bs.includes(p.batch) ? p.batch : bs[0] ?? '', totalFees: isEdit && p.course === name ? p.totalFees : String(c?.fee ?? '') }))
    setErrors((e) => ({ ...e, course: undefined, batch: undefined, totalFees: undefined }))
  }

  const onPhoto = async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setPhotoError('Please choose an image file')
    try { set('photo', await fileToAvatar(f)); setPhotoError('') } catch { setPhotoError('Could not process image') }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateStudent(v, isEdit)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    onSubmit(v)
  }

  const total = Number(v.totalFees) || 0
  const discount = Number(v.discount) || 0
  const paid = isEdit ? (student!.payments.reduce((a, p) => a + p.amount, 0)) : Number(v.initialPayment) || 0
  const err = (k: keyof StudentFormValues) => errors[k]
  const ring = (k: keyof StudentFormValues) => (err(k) ? 'border-rose-400' : '')

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={v.name || 'New Student'} size={64} src={v.photo || undefined} />
        <div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" icon={<Camera size={14} />} onClick={() => fileRef.current?.click()}>Upload photo</Button>
            {v.photo && <Button type="button" size="sm" variant="ghost" onClick={() => set('photo', '')}>Remove</Button>}
          </div>
          <p className="mt-1 text-xs text-slate-400">{photoError || 'Optional. Initials are shown when no photo is set.'}</p>
        </div>
      </div>

      <Section title="Personal information">
        <div className="sm:col-span-2"><Field label="Full name *" error={err('name')}><Input data-error={!!err('name')} className={ring('name')} value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Aarav Sharma" /></Field></div>
        <Field label="Date of birth *" error={err('dob')}><Input data-error={!!err('dob')} className={ring('dob')} type="date" max={new Date().toISOString().slice(0, 10)} value={v.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
        <Field label="Gender *" error={err('gender')}><Select data-error={!!err('gender')} className={ring('gender')} placeholder="Select gender" options={['Male', 'Female', 'Other']} value={v.gender} onChange={(e) => set('gender', e.target.value as StudentFormValues['gender'])} /></Field>
        <Field label="Phone number *" error={err('phone')}><Input data-error={!!err('phone')} className={ring('phone')} type="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile" /></Field>
        <Field label="WhatsApp number" error={err('whatsapp')} hint="Defaults to phone number if empty"><Input data-error={!!err('whatsapp')} className={ring('whatsapp')} type="tel" value={v.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Email *" error={err('email')}><Input data-error={!!err('email')} className={ring('email')} type="email" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></Field></div>
        <div className="sm:col-span-2"><Field label="Address *" error={err('address')}><Textarea data-error={!!err('address')} className={ring('address')} value={v.address} onChange={(e) => set('address', e.target.value)} /></Field></div>
      </Section>

      <Section title="Parent / guardian">
        <Field label="Parent name *" error={err('parentName')}><Input data-error={!!err('parentName')} className={ring('parentName')} value={v.parentName} onChange={(e) => set('parentName', e.target.value)} /></Field>
        <Field label="Parent contact *" error={err('parentPhone')}><Input data-error={!!err('parentPhone')} className={ring('parentPhone')} type="tel" value={v.parentPhone} onChange={(e) => set('parentPhone', e.target.value)} /></Field>
      </Section>

      <Section title="Course & admission">
        <Field label="Course *" error={err('course')}><Select data-error={!!err('course')} className={ring('course')} placeholder="Select course" options={courseNames} value={v.course} onChange={(e) => pickCourse(e.target.value)} /></Field>
        <Field label="Batch *" error={err('batch')}><Select data-error={!!err('batch')} className={ring('batch')} placeholder={v.course ? 'Select batch' : 'Select a course first'} options={batchOptions} value={v.batch} disabled={!v.course} onChange={(e) => set('batch', e.target.value)} /></Field>
        <Field label="Admission date *" error={err('admissionDate')}><Input data-error={!!err('admissionDate')} className={ring('admissionDate')} type="date" value={v.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} /></Field>
        <Field label="Status"><Select options={['Active', 'Inactive']} value={v.status} onChange={(e) => set('status', e.target.value as StudentFormValues['status'])} /></Field>
      </Section>

      <Section title="Fees">
        <Field label="Total course fees (₹) *" error={err('totalFees')}><Input data-error={!!err('totalFees')} className={ring('totalFees')} type="number" min={0} value={v.totalFees} onChange={(e) => set('totalFees', e.target.value)} /></Field>
        <Field label="Discount (₹)" error={err('discount')}><Input data-error={!!err('discount')} className={ring('discount')} type="number" min={0} value={v.discount} onChange={(e) => set('discount', e.target.value)} /></Field>
        {!isEdit && (
          <>
            <Field label="Initial payment (₹)" error={err('initialPayment')}><Input data-error={!!err('initialPayment')} className={ring('initialPayment')} type="number" min={0} value={v.initialPayment} onChange={(e) => set('initialPayment', e.target.value)} /></Field>
            <Field label="Payment method"><Select options={PAYMENT_METHODS} value={v.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)} /></Field>
          </>
        )}
        <div className="sm:col-span-2">
          <FeeSummary total={total} discount={discount} paid={paid} />
          {isEdit && <p className="mt-2 text-xs text-slate-400">Payments are managed from the student's profile.</p>}
        </div>
      </Section>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEdit ? 'Save changes' : 'Add student'}</Button>
      </div>
    </form>
  )
}
