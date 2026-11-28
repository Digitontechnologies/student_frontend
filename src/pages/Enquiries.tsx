import { useEffect, useState } from 'react'
import { CheckCircle2, Copy, ExternalLink, Loader2, UserPlus } from 'lucide-react'
import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import type { Batch, Course, Enquiry } from '../data/mock'
import { fmtDate, money, today } from '../lib/utils'
import { api } from '../lib/api'

type FullEnquiry = Enquiry & {
  fatherName?: string
  altPhone?: string
  email?: string
  gender?: string
  address?: string
  qualification?: string
  department?: string
  institution?: string
  yearOfPassing?: string
  percentage?: string
  purpose?: string
  currentStatus?: string
  experienceYears?: string
  companyName?: string
  referralName?: string
  photo?: string
  convertedStudentId?: number | null
}

const sources = ['Website', 'Social Media', 'Friend', 'Referral', 'Walk-in', 'Instagram', 'Google Ads']
const statuses = ['New', 'Contacted', 'Follow-up', 'Interested', 'Approved', 'Rejected']

export default function Enquiries() {
  const toast = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  // Approve & Admit modal state
  const [admitting, setAdmitting] = useState<FullEnquiry | null>(null)
  const [refetchFn, setRefetchFn] = useState<(() => void) | null>(null)
  const [admitName, setAdmitName] = useState('')
  const [admitPhone, setAdmitPhone] = useState('')
  const [admitEmail, setAdmitEmail] = useState('')
  const [admitCourse, setAdmitCourse] = useState('')
  const [admitBatch, setAdmitBatch] = useState('')
  const [admitTotalFee, setAdmitTotalFee] = useState('')
  const [admitPaid, setAdmitPaid] = useState('0')
  const [admitDate, setAdmitDate] = useState(today())
  const [admitMethod, setAdmitMethod] = useState('Cash')
  const [admitError, setAdmitError] = useState('')
  const [admittingBusy, setAdmittingBusy] = useState(false)

  useEffect(() => {
    api.get<Course[]>('/courses').then(setCourses).catch(() => {})
    api.get<Batch[]>('/batches').then(setBatches).catch(() => {})
  }, [])

  const apiCourseNames = courses.map((c) => c.name)

  const openAdmitModal = (enq: FullEnquiry, refetch: () => void) => {
    const matchedCourse = courses.find((c) => c.name.toLowerCase() === (enq.course || '').toLowerCase()) || courses[0]
    const courseName = matchedCourse?.name || enq.course || ''
    const matchingBatches = batches.filter((b) => b.course === courseName)
    const defaultBatch = matchingBatches[0]?.name || batches[0]?.name || ''

    setAdmitting(enq)
    setRefetchFn(() => refetch)
    setAdmitName(enq.name)
    setAdmitPhone(enq.phone)
    setAdmitEmail(enq.email || '')
    setAdmitCourse(courseName)
    setAdmitBatch(defaultBatch)
    setAdmitTotalFee(matchedCourse?.fee ? String(matchedCourse.fee) : '')
    setAdmitPaid('0')
    setAdmitDate(today())
    setAdmitMethod('Cash')
    setAdmitError('')
    setAdmittingBusy(false)
  }

  const handleCourseChange = (newCourse: string) => {
    setAdmitCourse(newCourse)
    const c = courses.find((x) => x.name === newCourse)
    if (c?.fee) setAdmitTotalFee(String(c.fee))
    const matching = batches.filter((b) => b.course === newCourse)
    if (matching.length > 0) setAdmitBatch(matching[0].name)
  }

  const submitAdmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admitting) return
    setAdmitError('')
    const totalFee = Number(admitTotalFee)
    const initialPaid = Number(admitPaid || 0)
    if (!admitEmail.trim()) {
      setAdmitError('Student email is required for admission.')
      return
    }
    if (!Number.isFinite(totalFee) || totalFee <= 0) {
      setAdmitError('Total course fee must be greater than 0.')
      return
    }
    if (!Number.isFinite(initialPaid) || initialPaid < 0 || initialPaid > totalFee) {
      setAdmitError(`Initial paid amount must be between 0 and ${money(totalFee)}.`)
      return
    }

    setAdmittingBusy(true)
    try {
      const res = await api.post<{ studentId: string; receiptNo?: string }>(
        `/enquiries/${encodeURIComponent(admitting.id)}/approve-admit`,
        {
          name: admitName.trim(),
          phone: admitPhone.trim(),
          email: admitEmail.trim(),
          course: admitCourse,
          batch: admitBatch,
          totalFee,
          initialPaid,
          paymentDate: admitDate,
          paymentMethod: admitMethod,
        },
      )
      toast(
        `Admitted ${admitName} (${res.studentId})${res.receiptNo ? ` · Receipt ${res.receiptNo}` : ''}`,
      )
      refetchFn?.()
      setAdmitting(null)
    } catch (err: any) {
      setAdmitError(err.message || 'Could not approve and admit student')
      setAdmittingBusy(false)
    }
  }

  const availableBatches = batches.filter((b) => !admitCourse || b.course === admitCourse)
  const batchOptions = (availableBatches.length > 0 ? availableBatches : batches).map((b) => b.name)
  const pendingPreview = Math.max(0, Number(admitTotalFee || 0) - Number(admitPaid || 0))

  return (
    <>
      <CrudPage<FullEnquiry>
        title="Enquiries & Leads"
        subtitle="Track prospective students from public registration to admission"
        entity="Enquiry"
        idPrefix="ENQ"
        initial={[]}
        searchKeys={['name', 'id', 'phone', 'email', 'course']}
        defaults={{ date: today(), status: 'New', source: 'Website' }}
        apiPath="/enquiries"
        headerExtra={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Copy size={15} />}
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/register`)
                toast('Public registration link copied')
              }}
            >
              Copy /register link
            </Button>
            <a href="/register" target="_blank" rel="noreferrer">
              <Button variant="secondary" icon={<ExternalLink size={15} />}>Public Form</Button>
            </a>
          </div>
        }
        filters={[
          { key: 'status', label: 'Status', options: statuses },
          { key: 'source', label: 'Sources', options: sources },
        ]}
        columns={[
          {
            key: 'name',
            header: 'Lead',
            render: (r) => (
              <div>
                <p className="font-medium text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-500">{r.id}{r.purpose ? ` · ${r.purpose}` : ''}</p>
              </div>
            ),
          },
          { key: 'phone', header: 'Phone' },
          { key: 'course', header: 'Interested in' },
          { key: 'source', header: 'Source' },
          { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
          { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]}
        fields={[
          { name: 'name', label: 'Name', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'course', label: 'Course', type: 'select', options: apiCourseNames },
          { name: 'source', label: 'Source', type: 'select', options: sources },
          { name: 'status', label: 'Status', type: 'select', options: statuses },
          { name: 'notes', label: 'Internal Notes', type: 'textarea', full: true },
        ]}
        rowActions={(r, { refetch }) =>
          r.status !== 'Approved' && r.status !== 'Rejected' && !r.convertedStudentId ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<UserPlus size={14} />}
              onClick={() => openAdmitModal(r, refetch)}
            >
              Approve &amp; Admit
            </Button>
          ) : r.status === 'Approved' ? (
            <span className="inline-flex items-center gap-1 px-2 text-xs font-medium text-[#00A956]">
              <CheckCircle2 size={14} /> Admitted
            </span>
          ) : null
        }
        viewRender={(r) => (
          <div className="space-y-4">
            {r.photo && (
              <div className="flex items-center gap-3">
                <img src={r.photo} alt={r.name} className="h-16 w-16 rounded-2xl border border-[#E7EAF0] object-cover" />
                <div>
                  <p className="text-sm font-semibold text-[#172033]">{r.name}</p>
                  <p className="text-xs text-[#667085]">{r.id}</p>
                </div>
              </div>
            )}
            <Detail
              items={[
                ['Enquiry ID', r.id],
                ['Status', <Badge>{r.status}</Badge>],
                ['Full Name', r.name],
                ['Father Name', r.fatherName || '—'],
                ['Mobile', r.phone],
                ['Alternative No.', r.altPhone || '—'],
                ['Email', r.email || '—'],
                ['Gender', r.gender || '—'],
                ['Address', r.address || '—'],
                ['Qualification', r.qualification || '—'],
                ['Department', r.department || '—'],
                ['Institution', r.institution || '—'],
                ['Year of Passing', r.yearOfPassing || '—'],
                ['Percentage', r.percentage || '—'],
                ['Purpose', r.purpose || '—'],
                ['Course Interest', r.course || '—'],
                ['Current Status', r.currentStatus || '—'],
                ['Experience', r.experienceYears || '—'],
                ['Company', r.companyName || '—'],
                ['Source', r.source],
                ['Referral Name', r.referralName || '—'],
                ['Submitted Date', fmtDate(r.date)],
                ['Internal Notes', r.notes || '—'],
              ]}
            />
          </div>
        )}
      />

      {/* Approve & Admit Modal */}
      <Modal open={!!admitting} onClose={() => setAdmitting(null)} title="Approve & Admit Student" wide>
        {admitting && (
          <form onSubmit={submitAdmit} className="space-y-4">
            {admitError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {admitError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Student Name *">
                <Input required value={admitName} onChange={(e) => setAdmitName(e.target.value)} />
              </Field>
              <Field label="Mobile Number *">
                <Input required value={admitPhone} onChange={(e) => setAdmitPhone(e.target.value)} />
              </Field>
              <Field label="Email ID *">
                <Input type="email" required value={admitEmail} onChange={(e) => setAdmitEmail(e.target.value)} />
              </Field>
              <Field label="Course *">
                <Select options={apiCourseNames} required value={admitCourse} onChange={(e) => handleCourseChange(e.target.value)} />
              </Field>
              <Field label="Batch *">
                <Select options={batchOptions} required value={admitBatch} onChange={(e) => setAdmitBatch(e.target.value)} />
              </Field>
              <Field label="Payment Date *">
                <Input type="date" required value={admitDate} onChange={(e) => setAdmitDate(e.target.value)} />
              </Field>
              <Field label="Total Course Fee (₹) *">
                <Input type="number" min={1} required value={admitTotalFee} onChange={(e) => setAdmitTotalFee(e.target.value)} />
              </Field>
              <Field label="Initial Paid Amount (₹)" hint={`Pending balance: ${money(pendingPreview)}`}>
                <Input type="number" min={0} value={admitPaid} onChange={(e) => setAdmitPaid(e.target.value)} />
              </Field>
              {Number(admitPaid || 0) > 0 && (
                <Field label="Payment Method">
                  <Select options={['Cash', 'UPI', 'Bank Transfer', 'Card']} value={admitMethod} onChange={(e) => setAdmitMethod(e.target.value)} />
                </Field>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAdmitting(null)}>Cancel</Button>
              <Button type="submit" disabled={admittingBusy}>
                {admittingBusy ? <><Loader2 size={14} className="animate-spin mr-1" /> Admitting…</> : 'Confirm Approve & Admit'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
