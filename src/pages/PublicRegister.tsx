import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Award, BookOpen, Briefcase, Building, Building2, Calendar,
  Camera, Check, CheckCircle2, GraduationCap, Loader2, Mail, MapPin, Phone, PhoneCall,
  Trash2, User, UserCheck,
} from 'lucide-react'
import { cn } from '../lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const GENDERS = ['Male', 'Female', 'Other'] as const
const PURPOSES = ['Training', 'Placement'] as const
const CURRENT_STATUSES = ['Student', 'Fresher', 'Professional', 'Career Break'] as const
const SOURCES = ['Social Media', 'Website', 'Friend', 'Referral', 'Walk-in'] as const

const STEPS = [
  { id: 1, title: 'Personal Details', short: 'Personal', subtitle: 'Basic contact and identity information' },
  { id: 2, title: 'Academic Details', short: 'Academic', subtitle: 'Educational background and qualifications' },
  { id: 3, title: 'Training / Professional', short: 'Training', subtitle: 'Program preferences and career background' },
  { id: 4, title: 'Enquiry Source & Declaration', short: 'Source', subtitle: 'How you heard about us & confirmation' },
] as const

function IconInput({
  label, required, icon: Icon, error, className, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  error?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#172033]">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      <div className="relative">
        <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]" />
        <input
          {...props}
          className={cn(
            'h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-[#172033] outline-none transition placeholder:text-slate-400',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
              : 'border-[#E7EAF0] focus:border-[#00BF63] focus:ring-4 focus:ring-[#E8F8F0]',
            className,
          )}
        />
      </div>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
}

function OptionCards({
  label, required, options, value, onChange, cols = 'grid-cols-2 sm:grid-cols-3', error,
}: {
  label: string
  required?: boolean
  options: readonly string[]
  value: string
  onChange: (v: string) => void
  cols?: string
  error?: string
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-[#172033]">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      <div className={cn('grid gap-2.5', cols)}>
        {options.map((opt) => {
          const selected = value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition cursor-pointer',
                selected
                  ? 'border-[#00BF63] bg-[#E8F8F0] text-[#00A956] shadow-xs'
                  : 'border-[#E7EAF0] bg-white text-[#172033] hover:border-[#00BF63]/50 hover:bg-[#F6F8FC]',
              )}
            >
              <span className="truncate">{opt}</span>
              <span
                className={cn(
                  'grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition',
                  selected ? 'border-[#00BF63] bg-[#00BF63] text-white' : 'border-slate-300 bg-white',
                )}
              >
                {selected && <Check size={11} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </div>
  )
}

export default function PublicRegister() {
  const [step, setStep] = useState(1)
  const [courses, setCourses] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successId, setSuccessId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name: '',
    fatherName: '',
    phone: '',
    altPhone: '',
    email: '',
    gender: '',
    address: '',
    qualification: '',
    department: '',
    institution: '',
    yearOfPassing: '',
    percentage: '',
    purpose: 'Training',
    course: '',
    currentStatus: '',
    experienceYears: '',
    companyName: '',
    source: 'Website',
    referralName: '',
    photo: '',
    declarationAccepted: false,
  })

  useEffect(() => {
    fetch(`${API_BASE}/public/courses`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { name: string }[]) => {
        const names = list.map((c) => c.name)
        setCourses(names)
        if (names.length > 0) setForm((f) => ({ ...f, course: f.course || names[0] }))
      })
      .catch(() => {})
  }, [])

  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm((prev) => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }))
  }

  const handlePhotoChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select a valid image file (JPG, PNG, WebP)' }))
      return
    }
    if (file.size > 500 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Photo must be under 500 KB' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') set('photo', reader.result)
    }
    reader.readAsDataURL(file)
  }

  const validateStep = (targetStep: number) => {
    const e: Record<string, string> = {}
    if (targetStep === 1) {
      if (!form.name.trim()) e.name = 'Full name is required'
      if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid 10-digit mobile number'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email ID'
      if (!form.gender) e.gender = 'Please select gender'
      if (!form.address.trim()) e.address = 'Address is required'
    } else if (targetStep === 2) {
      if (!form.qualification.trim()) e.qualification = 'Qualification is required'
    } else if (targetStep === 3) {
      if (!form.purpose) e.purpose = 'Select a purpose'
      if (!form.course.trim()) e.course = 'Select a course or area of interest'
      if (!form.currentStatus) e.currentStatus = 'Select your current status'
    } else if (targetStep === 4) {
      if (!form.declarationAccepted) e.declarationAccepted = 'Please accept the declaration to submit'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    setSubmitError('')
    if (validateStep(step)) {
      setStep((s) => Math.min(4, s + 1))
    }
  }

  const handleBack = () => {
    setSubmitError('')
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSubmitError('')
    if (!validateStep(4)) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/public/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || 'Could not submit enquiry')
      }
      setSuccessId(data.id)
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const showReferralName = form.source === 'Referral' || form.source === 'Friend'
  const progressPercent = Math.round((step / STEPS.length) * 100)
  const currentStepMeta = STEPS[step - 1]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F8FC] text-[#172033]">
      {/* Clean Top Header */}
      <header className="sticky top-0 z-20 border-b border-[#E7EAF0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <img src="/digiton-logo.png" alt="Digiton Technologies" className="h-8 w-auto object-contain sm:h-9" />
          <span className="inline-flex items-center rounded-full border border-[#00BF63]/20 bg-[#E8F8F0] px-3 py-1 text-xs font-semibold text-[#00A956]">
            Student Portal
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-10">
        {/* Centered Heading & Subtitle */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
            Student Registration
          </h1>
          <p className="mt-2 text-sm text-[#667085] sm:text-base">
            Complete the 4-step enquiry form below to register with Digiton Technologies.
          </p>
        </div>

        {/* 4-Step Horizontal Progress Indicator */}
        {!successId && (
          <div className="mt-6 rounded-2xl border border-[#E7EAF0] bg-white p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-[#172033]">
                Step {step} of {STEPS.length}: <span className="text-[#00A956]">{currentStepMeta.title}</span>
              </span>
              <span className="shrink-0 rounded-full bg-[#E8F8F0] px-2.5 py-0.5 text-xs font-bold text-[#00A956]">
                {progressPercent}%
              </span>
            </div>

            {/* Green Progress Track */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E7EAF0]">
              <div
                className="h-full rounded-full bg-[#00BF63] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Desktop & Tablet Horizontal Stepper */}
            <div className="mt-4 hidden grid-cols-4 gap-3 sm:grid">
              {STEPS.map((s) => {
                const completed = step > s.id
                const active = step === s.id
                return (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition',
                      completed
                        ? 'border-[#00BF63]/40 bg-[#E8F8F0] text-[#00A956]'
                        : active
                          ? 'border-[#00BF63] bg-white font-semibold text-[#172033] shadow-xs'
                          : 'border-[#E7EAF0] bg-[#F6F8FC] text-[#667085]',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                        completed || active ? 'bg-[#00BF63] text-white' : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      {completed ? <Check size={13} strokeWidth={3} /> : s.id}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </div>
                )
              })}
            </div>

            {/* Mobile Compact Stepper */}
            <div className="mt-3 grid grid-cols-4 gap-1.5 sm:hidden">
              {STEPS.map((s) => {
                const completed = step > s.id
                const active = step === s.id
                return (
                  <div
                    key={s.id}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-center',
                      completed
                        ? 'border-[#00BF63]/40 bg-[#E8F8F0] text-[#00A956]'
                        : active
                          ? 'border-[#00BF63] bg-white text-[#172033]'
                          : 'border-transparent bg-[#F6F8FC] text-[#667085]',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold',
                        completed || active ? 'bg-[#00BF63] text-white' : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      {completed ? <Check size={11} strokeWidth={3} /> : s.id}
                    </span>
                    <span className="w-full truncate text-[10px] font-semibold">{s.short}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Centered White Form Container (max-w-1100px) */}
        <main className="mt-6 rounded-3xl border border-[#E7EAF0] bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          {successId ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#E8F8F0] text-[#00BF63]">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-[#172033]">Enquiry Submitted Successfully!</h2>
              <p className="mt-2 max-w-md text-sm text-[#667085]">
                Thank you for registering with Digiton Technologies. Please keep your Enquiry ID for future reference.
              </p>
              <div className="mt-5 rounded-2xl border border-[#00BF63]/30 bg-[#E8F8F0] px-6 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#00A956]">Enquiry Reference ID</p>
                <p className="mt-0.5 text-xl font-bold text-[#172033]">{successId}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessId(null)
                  setStep(1)
                  setErrors({})
                  setForm((f) => ({
                    ...f,
                    name: '', fatherName: '', phone: '', altPhone: '', email: '', gender: '', address: '',
                    qualification: '', department: '', institution: '', yearOfPassing: '', percentage: '',
                    currentStatus: '', experienceYears: '', companyName: '', referralName: '', photo: '', declarationAccepted: false,
                  }))
                }}
                className="mt-6 rounded-xl border border-[#E7EAF0] bg-white px-5 py-2.5 text-sm font-semibold text-[#172033] hover:bg-[#E8F8F0] hover:text-[#00A956] transition cursor-pointer"
              >
                Submit Another Enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {submitError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitError}
                </div>
              )}

              <div className="border-b border-[#E7EAF0] pb-4">
                <h2 className="text-lg font-bold text-[#172033]">{currentStepMeta.title}</h2>
                <p className="mt-0.5 text-sm text-[#667085]">{currentStepMeta.subtitle}</p>
              </div>

              {/* Step 1: Personal Details */}
              {step === 1 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Optional Student Photo */}
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-2xl border border-[#E7EAF0] bg-[#F6F8FC] p-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white text-[#667085]">
                      {form.photo ? (
                        <img src={form.photo} alt="Student preview" className="h-full w-full object-cover" />
                      ) : (
                        <Camera size={24} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#172033]">
                        Student Photo <span className="font-normal text-[#667085]">(Optional)</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#667085]">JPG, PNG or WebP up to 500 KB</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E7EAF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#172033] transition hover:border-[#00BF63] hover:text-[#00A956]">
                          <Camera size={13} /> {form.photo ? 'Change Photo' : 'Upload Photo'}
                          <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
                        </label>
                        {form.photo && (
                          <button
                            type="button"
                            onClick={() => set('photo', '')}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>
                      {errors.photo && <p className="mt-1 text-xs text-rose-600">{errors.photo}</p>}
                    </div>
                  </div>

                  <IconInput
                    label="Full Name" required icon={User} placeholder="Enter your full name"
                    value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name}
                  />
                  <IconInput
                    label="Father Name" icon={UserCheck} placeholder="Father's / Guardian's name"
                    value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)}
                  />
                  <IconInput
                    label="Mobile Number" required type="tel" icon={Phone} placeholder="10-digit mobile number"
                    value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone}
                  />
                  <IconInput
                    label="Alternative Number" type="tel" icon={PhoneCall} placeholder="Optional alternate number"
                    value={form.altPhone} onChange={(e) => set('altPhone', e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <IconInput
                      label="Email ID" required type="email" icon={Mail} placeholder="you@example.com"
                      value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <OptionCards
                      label="Gender" required options={GENDERS} value={form.gender}
                      onChange={(v) => set('gender', v)} cols="grid-cols-3" error={errors.gender}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-[#172033]">
                        Address <span className="text-rose-500">*</span>
                      </span>
                      <div className="relative">
                        <MapPin size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-[#667085]" />
                        <textarea
                          rows={2}
                          placeholder="Full residential address"
                          value={form.address}
                          onChange={(e) => set('address', e.target.value)}
                          className={cn(
                            'w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#172033] outline-none transition placeholder:text-slate-400',
                            errors.address
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                              : 'border-[#E7EAF0] focus:border-[#00BF63] focus:ring-4 focus:ring-[#E8F8F0]',
                          )}
                        />
                      </div>
                      {errors.address && <span className="mt-1 block text-xs text-rose-600">{errors.address}</span>}
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Academic Details */}
              {step === 2 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <IconInput
                    label="Qualification" required icon={GraduationCap} placeholder="e.g. B.E / B.Tech / B.Sc / MCA"
                    value={form.qualification} onChange={(e) => set('qualification', e.target.value)} error={errors.qualification}
                  />
                  <IconInput
                    label="Department" icon={BookOpen} placeholder="e.g. Computer Science / IT"
                    value={form.department} onChange={(e) => set('department', e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <IconInput
                      label="Institution / College Name" icon={Building2} placeholder="College or University name"
                      value={form.institution} onChange={(e) => set('institution', e.target.value)}
                    />
                  </div>
                  <IconInput
                    label="Year of Passing" icon={Calendar} placeholder="e.g. 2025"
                    value={form.yearOfPassing} onChange={(e) => set('yearOfPassing', e.target.value)}
                  />
                  <IconInput
                    label="Percentage / CGPA" icon={Award} placeholder="e.g. 78% or 8.2 CGPA"
                    value={form.percentage} onChange={(e) => set('percentage', e.target.value)}
                  />
                </div>
              )}

              {/* Step 3: Training / Professional Details */}
              {step === 3 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <OptionCards
                      label="Purpose" required options={PURPOSES} value={form.purpose}
                      onChange={(v) => set('purpose', v)} cols="grid-cols-2" error={errors.purpose}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-[#172033]">
                        Course / Area of Interest <span className="text-rose-500">*</span>
                      </span>
                      {courses.length > 0 ? (
                        <select
                          value={form.course}
                          onChange={(e) => set('course', e.target.value)}
                          className={cn(
                            'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#172033] outline-none transition',
                            errors.course
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                              : 'border-[#E7EAF0] focus:border-[#00BF63] focus:ring-4 focus:ring-[#E8F8F0]',
                          )}
                        >
                          <option value="">Select a course</option>
                          {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter course or area of interest"
                          value={form.course}
                          onChange={(e) => set('course', e.target.value)}
                          className="h-11 w-full rounded-xl border border-[#E7EAF0] bg-white px-3.5 text-sm text-[#172033] outline-none focus:border-[#00BF63] focus:ring-4 focus:ring-[#E8F8F0]"
                        />
                      )}
                      {errors.course && <span className="mt-1 block text-xs text-rose-600">{errors.course}</span>}
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <OptionCards
                      label="Current Status" required options={CURRENT_STATUSES} value={form.currentStatus}
                      onChange={(v) => set('currentStatus', v)} cols="grid-cols-2 sm:grid-cols-4" error={errors.currentStatus}
                    />
                  </div>

                  <IconInput
                    label="Years of Experience" icon={Briefcase} placeholder="e.g. 0 or 2.5 years"
                    value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)}
                  />
                  <IconInput
                    label="Current Company Name" icon={Building} placeholder="If working (optional)"
                    value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                  />
                </div>
              )}

              {/* Step 4: Enquiry Source & Declaration */}
              {step === 4 && (
                <div className="space-y-5">
                  <OptionCards
                    label="Enquiry Source" options={SOURCES} value={form.source}
                    onChange={(v) => set('source', v)} cols="grid-cols-2 sm:grid-cols-3"
                  />
                  {showReferralName && (
                    <IconInput
                      label="Referral Name" icon={UserCheck} placeholder="Name of the friend / person who referred you"
                      value={form.referralName} onChange={(e) => set('referralName', e.target.value)}
                    />
                  )}

                  <div className="rounded-2xl border border-[#E7EAF0] bg-[#F6F8FC] p-4 sm:p-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.declarationAccepted}
                        onChange={(e) => set('declarationAccepted', e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                          form.declarationAccepted
                            ? 'border-[#00BF63] bg-[#00BF63] text-white'
                            : 'border-slate-300 bg-white',
                        )}
                      >
                        {form.declarationAccepted && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className="text-xs leading-relaxed text-[#667085]">
                        <b className="text-[#172033]">Declaration:</b> I confirm that the information provided above is true and accurate to the best of my knowledge, and I authorize Digiton Technologies to contact me regarding course and placement updates.
                      </span>
                    </label>
                    {errors.declarationAccepted && (
                      <p className="mt-2 text-xs text-rose-600">{errors.declarationAccepted}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-[#E7EAF0] pt-5">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-5 text-sm font-semibold text-[#172033] transition hover:bg-[#F6F8FC] cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#00BF63] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00A956] cursor-pointer"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#00BF63] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00A956] disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                    ) : (
                      'Submit Enquiry'
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
