import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, Download, Loader2, Pencil, Trash2, SearchX } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Card, CardHeader } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { Detail } from '../components/ui/CrudPage'
import { FeeReceipt } from '../components/ui/FeeReceipt'
import { StatCard } from '../components/ui/StatCard'
import { useToast } from '../components/ui/Toast'
import { StudentForm } from '../components/students/StudentForm'
import { PaymentForm } from '../components/students/PaymentForm'
import { FeeSummary } from '../components/students/FeeSummary'
import { useStudents } from '../hooks/useStudents'
import { attendanceSummary, calcPaid, calcPending } from '../lib/students'
import type { Batch, Course } from '../data/mock'
import type { Payment } from '../types/student'
import { useApiList } from '../hooks/useOptions'
import { fmtDate, money } from '../lib/utils'
import { CalendarCheck, UserCheck, UserX, Clock } from 'lucide-react'

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { students, loading, updateStudent, deleteStudent, addPayment } = useStudents()
  const courses = useApiList<Course>('/courses')
  const batches = useApiList<Batch>('/batches')
  const [modal, setModal] = useState<'edit' | 'pay' | 'delete' | null>(null)
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null)
  const s = students.find((x) => x.id === id)

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-400">
        <Loader2 className="animate-spin" size={20} /> Loading…
      </div>
    )
  }

  if (!s) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-slate-500">
        <SearchX size={32} />
        <p>Student <b>{id}</b> was not found.</p>
        <Link to="/students"><Button variant="secondary" icon={<ArrowLeft size={16} />}>Back to students</Button></Link>
      </Card>
    )
  }

  const paid = calcPaid(s)
  const pending = calcPending(s)
  const att = attendanceSummary(s.attendance)
  const course = courses.find((c) => c.name === s.course)
  const batch = batches.find((b) => b.name === s.batch)
  const payments = [...s.payments].sort((a, b) => b.date.localeCompare(a.date))
  const records = [...s.attendance].sort((a, b) => b.date.localeCompare(a.date))
  const age = s.dob ? Math.floor((Date.now() - new Date(s.dob).getTime()) / 31557600000) : null

  return (
    <>
      <Link to="/students" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700"><ArrowLeft size={15} /> Students</Link>
      <PageHeader
        title="Student Profile" subtitle={`${s.id} · ${s.course}`}
        actions={<>
          <Button variant="secondary" icon={<Pencil size={16} />} onClick={() => setModal('edit')}>Edit</Button>
          <Button variant="secondary" icon={<CreditCard size={16} />} disabled={pending === 0} onClick={() => setModal('pay')}>Record payment</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setModal('delete')}>Delete</Button>
        </>}
      />

      <Card className="mb-6 flex flex-col items-center gap-5 p-6 sm:flex-row">
        <Avatar name={s.name} size={88} src={s.photo} />
        <div className="text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-xl font-bold text-slate-900">{s.name}</h2><Badge>{s.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{s.email} · {s.phone}</p>
          <p className="text-sm text-slate-500">{s.course} · {s.batch} · Admitted {fmtDate(s.admissionDate)}</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal information" />
          <div className="p-5"><Detail items={[
            ['Full name', s.name], ['Gender', s.gender], ['Date of birth', `${fmtDate(s.dob)}${age !== null ? ` (${age} yrs)` : ''}`],
            ['Phone', s.phone], ['WhatsApp', s.whatsapp], ['Email', s.email], ['Parent name', s.parentName], ['Parent contact', s.parentPhone], ['Address', s.address],
          ]} /></div>
        </Card>
        <Card>
          <CardHeader title="Course details" />
          <div className="p-5"><Detail items={[
            ['Course', s.course], ['Duration', course?.duration ?? '—'], ['Instructor', course?.instructor ?? '—'],
            ['Batch', s.batch], ['Timing', batch?.timing ?? '—'], ['Admission date', fmtDate(s.admissionDate)],
          ]} /></div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Fee details" action={pending > 0 ? <Button size="sm" onClick={() => setModal('pay')}>Record payment</Button> : <Badge>Paid</Badge>} />
        <div className="p-5"><FeeSummary total={s.totalFees} discount={s.discount} paid={paid} /></div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Payment history" subtitle={`${payments.length} payment${payments.length === 1 ? '' : 's'}`} />
        {payments.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No payments recorded yet</p>
        ) : (
          <div className="scroll-thin overflow-x-auto p-2">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500"><tr>{['Payment ID', 'Date', 'Method', 'Note', 'Amount', 'Receipt'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-700">{p.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(p.date)}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3 text-slate-500">{p.note ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-600">{money(p.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Download size={14} />}
                        onClick={() => setReceiptPayment(p)}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Attendance history" subtitle={att.total ? `Last ${att.total} class days` : undefined} />
        {att.total === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No attendance recorded yet</p>
        ) : (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Attendance rate" value={`${att.percent}%`} icon={CalendarCheck} tone="blue" />
              <StatCard label="Present" value={att.present} icon={UserCheck} tone="green" />
              <StatCard label="Absent" value={att.absent} icon={UserX} tone="rose" />
              <StatCard label="Late / Leave" value={att.late + att.leave} icon={Clock} tone="amber" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {records.map((r) => (
                <div key={r.date} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 text-xs">
                  <span className="text-slate-600">{fmtDate(r.date).slice(0, 6)}</span><Badge>{r.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} wide title={`Edit ${s.name}`}>
        <StudentForm
          student={s}
          onCancel={() => setModal(null)}
          onSubmit={async (v) => {
            try {
              await updateStudent(s.id, v)
              toast('Student updated')
              setModal(null)
            } catch (err: any) {
              toast(err.message || 'Could not update student')
            }
          }}
        />
      </Modal>
      <Modal open={modal === 'pay'} onClose={() => setModal(null)} title="Record payment">
        <PaymentForm
          pending={pending}
          onCancel={() => setModal(null)}
          onSubmit={async (p) => {
            try {
              await addPayment(s.id, p)
              toast(`Payment of ${money(p.amount)} recorded`)
              setModal(null)
            } catch (err: any) {
              toast(err.message || 'Could not record payment')
            }
          }}
        />
      </Modal>
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete student">
        <p className="text-sm text-slate-600">Delete <b>{s.name}</b> ({s.id})? Their payment and attendance history will be removed. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await deleteStudent(s.id)
                toast('Student deleted')
                navigate('/students')
              } catch (err: any) {
                toast(err.message || 'Could not delete student')
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
      <Modal open={!!receiptPayment} onClose={() => setReceiptPayment(null)} title="Fee Receipt" wide>
        {receiptPayment && (
          <FeeReceipt receiptOrPaymentId={receiptPayment.receiptNo || receiptPayment.id} />
        )}
      </Modal>
    </>
  )
}
