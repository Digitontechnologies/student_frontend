import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, Clock, Loader2, Printer, Wallet } from 'lucide-react'
import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { FeeReceipt } from '../components/ui/FeeReceipt'
import { StatCard } from '../components/ui/StatCard'
import { useToast } from '../components/ui/Toast'
import type { Course, Fee } from '../data/mock'
import type { Student } from '../types/student'
import { useApiList } from '../hooks/useOptions'
import { api } from '../lib/api'
import { fmtDate, money, today } from '../lib/utils'

type PaymentHistoryItem = {
  id: string
  date: string
  amount: number
  method: string
  referenceNo: string
  remarks: string
  receiptNo: string
}

const recompute = (f: Fee): Fee => {
  const due = Math.max(0, f.total - f.paid)
  return { ...f, due, status: due === 0 ? 'Paid' : f.paid > 0 ? 'Partially Paid' : 'Pending' }
}

function PaymentHistoryList({ feeId, onPrintReceipt }: { feeId: string; onPrintReceipt?: (item: PaymentHistoryItem) => void }) {
  const [history, setHistory] = useState<PaymentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<PaymentHistoryItem[]>(`/fees/${encodeURIComponent(feeId)}/history`)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [feeId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
        <Loader2 size={14} className="animate-spin" /> Loading payment history…
      </div>
    )
  }

  if (history.length === 0) {
    return <p className="py-2 text-xs text-slate-400">No previous payments recorded.</p>
  }

  return (
    <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
      {history.map((h) => (
        <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#E7EAF0] bg-slate-50 px-3 py-2 text-xs">
          <div>
            <p className="font-medium text-[#172033]">
              {money(h.amount)} · <span className="uppercase">{h.method.replace('_', ' ')}</span>
              {h.receiptNo && <span className="ml-1.5 text-[#667085]">({h.receiptNo})</span>}
            </p>
            <p className="text-[#667085]">
              {fmtDate(h.date)}
              {h.referenceNo ? ` · Ref: ${h.referenceNo}` : ''}
              {h.remarks ? ` · ${h.remarks}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone="green">Paid</Badge>
            {onPrintReceipt && (
              <button
                type="button"
                title="Print receipt"
                onClick={() => onPrintReceipt(h)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-[#E8F8F0] hover:text-[#00A956] cursor-pointer"
              >
                <Printer size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Fees() {
  const toast = useToast()
  const studentList = useApiList<Student>('/students')
  const courseList = useApiList<Course>('/courses')
  const liveCourseNames = courseList.map((c) => c.name)

  // Collect Pending Fee modal state (row edit / collect)
  const [collecting, setCollecting] = useState<Fee | null>(null)
  const [refetchFn, setRefetchFn] = useState<(() => void) | null>(null)
  const [amountPaying, setAmountPaying] = useState('')
  const [payDate, setPayDate] = useState(today())
  const [method, setMethod] = useState('Cash')
  const [referenceNo, setReferenceNo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Smart Add Fee modal state (selects student -> detects existing fee or creates new)
  const [addOpen, setAddOpen] = useState(false)
  const [existingFees, setExistingFees] = useState<Fee[]>([])
  const [addStudent, setAddStudent] = useState('')
  const [addCourse, setAddCourse] = useState('')
  const [addTotal, setAddTotal] = useState('')
  const [addPaid, setAddPaid] = useState('0')
  const [addDueDate, setAddDueDate] = useState(today())
  const [addMethod, setAddMethod] = useState('Cash')
  const [addRefNo, setAddRefNo] = useState('')
  const [addRemarks, setAddRemarks] = useState('')
  const [addError, setAddError] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [receiptId, setReceiptId] = useState<string | null>(null)

  const openCollectModal = (fee: Fee, refetch: () => void) => {
    const pending = Math.max(0, fee.total - fee.paid)
    setCollecting(fee)
    setRefetchFn(() => refetch)
    setAmountPaying(pending > 0 ? String(pending) : '0')
    setPayDate(today())
    setMethod('Cash')
    setReferenceNo('')
    setRemarks('')
    setFormError('')
    setSubmitting(false)
  }

  const closeCollectModal = () => {
    setCollecting(null)
    setSubmitting(false)
    setFormError('')
  }

  const submitCollect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collecting) return
    const pending = Math.max(0, collecting.total - collecting.paid)
    const payNow = Number(amountPaying)

    if (!Number.isFinite(payNow) || payNow <= 0) {
      setFormError('Amount paying now must be greater than 0.')
      return
    }
    if (payNow > pending) {
      setFormError(`Amount paying now cannot exceed the pending amount (${money(pending)}).`)
      return
    }

    setFormError('')
    setSubmitting(true)
    try {
      const res = await api.post<{ receiptNo?: string; paymentId?: string; collected: number }>(
        `/fees/${encodeURIComponent(collecting.id)}/collect`,
        {
          amount: payNow,
          date: payDate,
          method,
          referenceNo: referenceNo.trim() || undefined,
          remarks: remarks.trim() || undefined,
        },
      )
      toast(`Collected ${money(res.collected || payNow)} from ${collecting.student}${res.receiptNo ? ` (${res.receiptNo})` : ''}`)
      refetchFn?.()
      closeCollectModal()
      if (res.receiptNo || res.paymentId) setReceiptId(res.receiptNo || res.paymentId || null)
    } catch (err: any) {
      setFormError(err.message || 'Payment collection failed')
      setSubmitting(false)
    }
  }

  const syncAddDefaults = (studentName: string, courseName: string | undefined, feesList: Fee[]) => {
    const s = studentList.find((x) => x.name === studentName)
    const effectiveCourse = courseName || s?.course || liveCourseNames[0] || ''
    const existing = feesList.find((f) => f.student === studentName && f.course === effectiveCourse)
    setAddStudent(studentName)
    setAddCourse(effectiveCourse)
    setAddError('')
    setAddMethod('Cash')
    setAddRefNo('')
    setAddRemarks('')
    setAddDueDate(today())

    if (existing) {
      const pending = Math.max(0, existing.total - existing.paid)
      setAddTotal(String(existing.total))
      setAddPaid(pending > 0 ? String(pending) : '0')
    } else {
      const c = courseList.find((x) => x.name === effectiveCourse)
      const defaultTotal = c?.fee ?? (s?.totalFees ? Math.max(0, Number(s.totalFees) - Number(s.discount || 0)) : '')
      setAddTotal(defaultTotal !== '' ? String(defaultTotal) : '')
      setAddPaid('0')
    }
  }

  const openAddModal = (rows: Fee[], refetch: () => void) => {
    setExistingFees(rows)
    setRefetchFn(() => refetch)
    // Prefer first student with pending or no fee; fallback to first student
    const firstStudent = studentList[0]?.name ?? ''
    syncAddDefaults(firstStudent, undefined, rows)
    setAddOpen(true)
  }

  const matchedExistingFee = existingFees.find((f) => f.student === addStudent && f.course === addCourse) || null
  const matchedPending = matchedExistingFee ? Math.max(0, matchedExistingFee.total - matchedExistingFee.paid) : 0
  const addPayNowNum = Number(addPaid || 0)
  const addRemainingAfter = Math.max(0, matchedPending - (Number.isFinite(addPayNowNum) ? addPayNowNum : 0))

  const submitAddModal = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')

    if (matchedExistingFee) {
      if (matchedPending <= 0) return
      if (!Number.isFinite(addPayNowNum) || addPayNowNum <= 0) {
        setAddError('Amount paying now must be greater than 0.')
        return
      }
      if (addPayNowNum > matchedPending) {
        setAddError(`Amount paying now cannot exceed the pending amount (${money(matchedPending)}).`)
        return
      }
      setAddSubmitting(true)
      try {
        const res = await api.post<{ receiptNo?: string; paymentId?: string; collected: number }>(
          `/fees/${encodeURIComponent(matchedExistingFee.id)}/collect`,
          {
            amount: addPayNowNum,
            date: addDueDate,
            method: addMethod,
            referenceNo: addRefNo.trim() || undefined,
            remarks: addRemarks.trim() || undefined,
          },
        )
        toast(`Collected ${money(res.collected || addPayNowNum)} from ${addStudent}${res.receiptNo ? ` (${res.receiptNo})` : ''}`)
        refetchFn?.()
        setAddOpen(false)
        if (res.receiptNo || res.paymentId) setReceiptId(res.receiptNo || res.paymentId || null)
      } catch (err: any) {
        setAddError(err.message || 'Payment collection failed')
      } finally {
        setAddSubmitting(false)
      }
      return
    }

    const totalNum = Number(addTotal)
    if (!Number.isFinite(totalNum) || totalNum <= 0) {
      setAddError('Total fee must be greater than 0.')
      return
    }
    if (!Number.isFinite(addPayNowNum) || addPayNowNum < 0 || addPayNowNum > totalNum) {
      setAddError(`Initial paid amount must be between 0 and ${money(totalNum)}.`)
      return
    }

    setAddSubmitting(true)
    try {
      await api.post('/fees', {
        student: addStudent,
        course: addCourse,
        total: totalNum,
        paid: addPayNowNum,
        dueDate: addDueDate,
      })
      toast(`Fee added for ${addStudent}`)
      refetchFn?.()
      setAddOpen(false)
    } catch (err: any) {
      setAddError(err.message || 'Failed to add fee')
    } finally {
      setAddSubmitting(false)
    }
  }

  const pendingAmount = collecting ? Math.max(0, collecting.total - collecting.paid) : 0
  const parsedPayNow = Number(amountPaying || 0)
  const remainingAfter = Math.max(0, pendingAmount - (Number.isFinite(parsedPayNow) ? parsedPayNow : 0))

  return (
    <>
      <CrudPage<Fee>
        title="Fees" subtitle="Track student fee plans and collections" entity="Fee" idPrefix="FEE"
        initial={[]} searchKeys={['student', 'id', 'course']} defaults={{ dueDate: today(), paid: 0 }} onSaved={recompute}
        apiPath="/fees"
        onAddClick={({ rows, refetch }) => openAddModal(rows, refetch)}
        onEditClick={(r, { refetch }) => openCollectModal(r, refetch)}
        filters={[
          { key: 'status', label: 'Status', options: ['Paid', 'Partially Paid', 'Pending', 'Overdue'] },
          { key: 'course', label: 'Courses', options: liveCourseNames },
        ]}
        stats={(rows) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Fees" value={money(rows.reduce((a, r) => a + r.total, 0))} icon={Wallet} tone="blue" />
            <StatCard label="Collected" value={money(rows.reduce((a, r) => a + r.paid, 0))} icon={CheckCircle2} tone="green" />
            <StatCard label="Pending" value={money(rows.reduce((a, r) => a + r.due, 0))} icon={Clock} tone="amber" />
            <StatCard label="Overdue Accounts" value={rows.filter((r) => r.status === 'Overdue').length} icon={Banknote} tone="rose" />
          </div>
        )}
        columns={[
          { key: 'student', header: 'Student', render: (r) => <div><p className="font-medium text-slate-800">{r.student}</p><p className="text-xs text-slate-500">{r.id}</p></div> },
          { key: 'course', header: 'Course' },
          { key: 'total', header: 'Total', render: (r) => money(r.total) },
          { key: 'paid', header: 'Paid', render: (r) => money(r.paid) },
          { key: 'due', header: 'Due', render: (r) => money(r.due) },
          { key: 'dueDate', header: 'Due date', render: (r) => fmtDate(r.dueDate) },
          { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]}
        fields={[
          { name: 'student', label: 'Student', type: 'select', options: studentList.map((s) => s.name), required: true },
          { name: 'course', label: 'Course', type: 'select', options: liveCourseNames },
          { name: 'total', label: 'Total fee (₹)', type: 'number', required: true },
          { name: 'paid', label: 'Paid (₹)', type: 'number' },
          { name: 'dueDate', label: 'Due date', type: 'date' },
        ]}
        rowActions={(r, { refetch }) =>
          r.due > 0 ? (
            <Button size="sm" variant="secondary" onClick={() => openCollectModal(r, refetch)}>
              Collect
            </Button>
          ) : null
        }
        viewRender={(r) => (
          <div className="space-y-5">
            <Detail items={[
              ['ID', r.id],
              ['Student', r.student],
              ['Course', r.course],
              ['Total', money(r.total)],
              ['Paid', money(r.paid)],
              ['Due', money(r.due)],
              ['Due date', fmtDate(r.dueDate)],
              ['Status', <Badge>{r.status}</Badge>],
            ]} />
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">Payment History</h4>
              <PaymentHistoryList
                feeId={r.id}
                onPrintReceipt={(item) => setReceiptId(item.receiptNo || item.id)}
              />
            </div>
          </div>
        )}
      />

      {/* Smart Add Fee / Collect Pending Fee Modal (from "+ Add Fee" button) */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={matchedExistingFee ? 'Collect Pending Fee' : 'Add Fee'}
        wide={!!matchedExistingFee}
      >
        <form onSubmit={submitAddModal} className="space-y-4">
          {addError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {addError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student *">
              <Select
                options={studentList.map((s) => s.name)}
                required
                value={addStudent}
                onChange={(e) => syncAddDefaults(e.target.value, undefined, existingFees)}
              />
            </Field>
            <Field label="Course *">
              <Select
                options={liveCourseNames}
                required
                value={addCourse}
                onChange={(e) => syncAddDefaults(addStudent, e.target.value, existingFees)}
              />
            </Field>
          </div>

          {matchedExistingFee ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Total Fee (₹)">
                  <Input value={money(matchedExistingFee.total)} readOnly className="bg-slate-50 text-[#667085]" />
                </Field>
                <Field label="Already Paid Amount (₹)">
                  <Input value={money(matchedExistingFee.paid)} readOnly className="bg-slate-50 text-[#667085]" />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-[#E8F8F0] px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#00A956]">Pending Amount</span>
                <span className="text-lg font-bold text-[#172033]">{money(matchedPending)}</span>
              </div>

              {matchedPending > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Amount Paying Now (₹) *"
                    hint={`Remaining balance after payment: ${money(addRemainingAfter)}`}
                  >
                    <Input
                      type="number"
                      min={1}
                      max={matchedPending}
                      step="any"
                      required
                      value={addPaid}
                      onChange={(e) => setAddPaid(e.target.value)}
                    />
                  </Field>
                  <Field label="Payment Date *">
                    <Input
                      type="date"
                      required
                      value={addDueDate}
                      onChange={(e) => setAddDueDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Payment Method *">
                    <Select
                      options={['Cash', 'UPI', 'Bank Transfer', 'Card']}
                      required
                      value={addMethod}
                      onChange={(e) => setAddMethod(e.target.value)}
                    />
                  </Field>
                  <Field label="Transaction ID / Reference">
                    <Input
                      type="text"
                      placeholder="Optional reference number"
                      value={addRefNo}
                      onChange={(e) => setAddRefNo(e.target.value)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Remarks">
                      <Textarea
                        placeholder="Optional payment notes"
                        value={addRemarks}
                        onChange={(e) => setAddRemarks(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E7EAF0] bg-slate-50 p-4 text-center text-sm text-[#667085]">
                  All fees for <b>{addStudent}</b> ({addCourse}) have already been paid in full. Select another course above if adding a new course fee.
                </div>
              )}

              <div className="border-t border-[#E7EAF0] pt-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">Payment History</h4>
                <PaymentHistoryList feeId={matchedExistingFee.id} />
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Total Fee (₹) *">
                <Input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={addTotal}
                  onChange={(e) => setAddTotal(e.target.value)}
                />
              </Field>
              <Field label="Initial Paid (₹)">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={addPaid}
                  onChange={(e) => setAddPaid(e.target.value)}
                />
              </Field>
              <Field label="Due Date">
                <Input
                  type="date"
                  value={addDueDate}
                  onChange={(e) => setAddDueDate(e.target.value)}
                />
              </Field>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            {(!matchedExistingFee || matchedPending > 0) && (
              <Button type="submit" disabled={addSubmitting}>
                {addSubmitting ? (
                  <><Loader2 size={14} className="animate-spin mr-1" /> Saving…</>
                ) : matchedExistingFee ? 'Collect Payment' : 'Add Fee'}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Collect Pending Fee Modal (from row Edit / Collect action) */}
      <Modal open={!!collecting} onClose={closeCollectModal} title="Collect Pending Fee" wide>
        {collecting && (
          <form onSubmit={submitCollect} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Student Name">
                <Input value={collecting.student} readOnly className="bg-slate-50 text-[#667085]" />
              </Field>
              <Field label="Course Name">
                <Input value={collecting.course} readOnly className="bg-slate-50 text-[#667085]" />
              </Field>
              <Field label="Total Fee (₹)">
                <Input value={money(collecting.total)} readOnly className="bg-slate-50 text-[#667085]" />
              </Field>
              <Field label="Already Paid Amount (₹)">
                <Input value={money(collecting.paid)} readOnly className="bg-slate-50 text-[#667085]" />
              </Field>
            </div>

            <div className="rounded-xl border border-[#E7EAF0] bg-[#E8F8F0] px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00A956]">Pending Amount</span>
              <span className="text-lg font-bold text-[#172033]">{money(pendingAmount)}</span>
            </div>

            {pendingAmount > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Amount Paying Now (₹) *"
                  hint={`Remaining balance after payment: ${money(remainingAfter)}`}
                >
                  <Input
                    type="number"
                    min={1}
                    max={pendingAmount}
                    step="any"
                    required
                    value={amountPaying}
                    onChange={(e) => setAmountPaying(e.target.value)}
                  />
                </Field>
                <Field label="Payment Date *">
                  <Input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </Field>
                <Field label="Payment Method *">
                  <Select
                    options={['Cash', 'UPI', 'Bank Transfer', 'Card']}
                    required
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  />
                </Field>
                <Field label="Transaction ID / Reference">
                  <Input
                    type="text"
                    placeholder="Optional reference number"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Remarks">
                    <Textarea
                      placeholder="Optional payment notes"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#E7EAF0] bg-slate-50 p-4 text-center text-sm text-[#667085]">
                All fees for this enrollment have been paid in full.
              </div>
            )}

            <div className="border-t border-[#E7EAF0] pt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">Payment History</h4>
              <PaymentHistoryList feeId={collecting.id} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeCollectModal}>Cancel</Button>
              {pendingAmount > 0 && (
                <Button type="submit" disabled={submitting}>
                  {submitting ? <><Loader2 size={14} className="animate-spin mr-1" /> Collecting…</> : 'Collect Payment'}
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Fee Receipt Modal */}
      <Modal open={!!receiptId} onClose={() => setReceiptId(null)} title="Fee Receipt" wide>
        {receiptId && <FeeReceipt receiptOrPaymentId={receiptId} />}
      </Modal>
    </>
  )
}
