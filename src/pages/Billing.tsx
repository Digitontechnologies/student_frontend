import { createPortal } from 'react-dom'
import { Download, Printer } from 'lucide-react'
import { CrudPage } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { amountInWords } from '../components/ui/FeeReceipt'
import type { Fee, Invoice } from '../data/mock'
import type { Student } from '../types/student'
import { useApiList } from '../hooks/useOptions'
import { fmtDate, money, today } from '../lib/utils'

const total = (i: Invoice) => Math.round(i.amount * (1 + i.tax / 100))

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-3.5 w-1 rounded-full bg-[#00BF63]" />
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#172033]">{title}</h3>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-xs">
      <span className="shrink-0 font-medium text-[#667085]">{label}</span>
      <span className="text-right font-semibold text-[#172033]">{value || '—'}</span>
    </div>
  )
}

function InvoicePdfView({
  invoice,
  student,
  fee,
}: {
  invoice: Invoice
  student?: Student
  fee?: Fee
}) {
  const discount = Number(student?.discount || 0)
  const hasMatchingDiscount =
    discount > 0 && student?.totalFees !== undefined && Math.abs(student.totalFees - discount - invoice.amount) < 1
  const courseFee = hasMatchingDiscount ? Number(student!.totalFees) : invoice.amount
  const appliedDiscount = hasMatchingDiscount ? discount : 0
  const gstAmount = total(invoice) - invoice.amount
  const hasGst = invoice.tax > 0 && gstAmount > 0
  const grandTotal = total(invoice)

  const rawPaid = Number(fee?.paid ?? student?.paid ?? 0)
  const previouslyPaid = invoice.status === 'Paid' ? grandTotal : Math.min(grandTotal, Math.max(0, rawPaid))
  const amountDue = Math.max(0, grandTotal - previouslyPaid)
  const paymentStatus = amountDue === 0 ? 'Paid' : previouslyPaid > 0 ? 'Partially Paid' : invoice.status
  const dueDate = fee?.dueDate || invoice.issueDate

  const triggerPrint = (asPdf = false) => {
    const prevTitle = document.title
    if (asPdf) document.title = invoice.id
    window.print()
    if (asPdf) setTimeout(() => { document.title = prevTitle }, 500)
  }

  const sheet = (
    <div
      className="mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white text-[#172033] print:max-w-none print:rounded-none"
      style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif' }}
    >
      {/* Digiton Green Top Brand Bar */}
      <div className="h-1.5 w-full bg-[#00BF63]" />

      <div className="p-6 print:p-5">
        {/* 1. Company Information (Logo) & Invoice Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E7EAF0] pb-4">
          <img src="/digiton-logo.png" alt="Digiton Technologies" className="h-11 w-auto object-contain" />
          <div className="text-right">
            <span className="inline-block rounded-full bg-[#E8F8F0] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#00A956]">
              Invoice
            </span>
            <p className="mt-1 text-lg font-bold tracking-tight text-[#172033]">{invoice.id}</p>
          </div>
        </div>

        {/* 2. Invoice Details & 3. Student Details */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <div className="rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] px-4 py-3">
            <SectionTitle title="Invoice Details" />
            <div className="divide-y divide-[#E7EAF0]/70">
              <DetailRow label="Invoice Number" value={invoice.id} />
              <DetailRow label="Invoice Date" value={fmtDate(invoice.issueDate)} />
              <DetailRow label="Due Date" value={fmtDate(dueDate)} />
              <div className="flex items-center justify-between gap-4 py-1 text-xs">
                <span className="font-medium text-[#667085]">Status</span>
                <Badge>{paymentStatus}</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] px-4 py-3">
            <SectionTitle title="Student Details" />
            <div className="divide-y divide-[#E7EAF0]/70">
              <DetailRow label="Student Name" value={student?.name || invoice.student} />
              <DetailRow label="Student ID" value={student?.id || '—'} />
              <DetailRow label="Mobile Number" value={student?.phone || '—'} />
              <DetailRow label="Course" value={student?.course || '—'} />
              <DetailRow label="Batch" value={student?.batch || '—'} />
            </div>
          </div>
        </div>

        {/* 4. Fee Breakdown Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-[#E7EAF0]">
          <div className="border-b border-[#E7EAF0] bg-[#F6F8FC] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-1 rounded-full bg-[#00BF63]" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#172033]">Fee Breakdown</h3>
            </div>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E7EAF0] bg-white text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
              <tr>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAF0]">
              <tr>
                <td className="px-4 py-2.5 font-medium text-[#172033]">
                  Course Fee <span className="text-xs text-[#667085]">({invoice.description})</span>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-[#172033]">
                  {money(courseFee)}
                </td>
              </tr>
              {appliedDiscount > 0 && (
                <tr>
                  <td className="px-4 py-2 font-medium text-[#667085]">Discount</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-[#00A956]">
                    - {money(appliedDiscount)}
                  </td>
                </tr>
              )}
              {hasGst && (
                <tr>
                  <td className="px-4 py-2 font-medium text-[#667085]">Applicable GST ({invoice.tax}%)</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-[#172033]">
                    {money(gstAmount)}
                  </td>
                </tr>
              )}
              <tr className="border-l-4 border-l-[#00BF63] bg-[#E8F8F0]">
                <td className="px-4 py-2.5 text-sm font-bold text-[#00A956]">Total Invoice Amount</td>
                <td className="px-4 py-2.5 text-right text-base font-bold tabular-nums text-[#00A956]">
                  {money(grandTotal)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-[#667085]">Previously Paid Amount</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-[#172033]">
                  {money(previouslyPaid)}
                </td>
              </tr>
              <tr className={amountDue > 0 ? 'bg-rose-50/70' : 'bg-[#E8F8F0]/40'}>
                <td className="px-4 py-2.5 font-bold text-[#172033]">Amount Due</td>
                <td
                  className={`px-4 py-2.5 text-right text-sm font-bold tabular-nums ${
                    amountDue > 0 ? 'text-rose-600' : 'text-[#00A956]'
                  }`}
                >
                  {amountDue > 0 ? money(amountDue) : `${money(0)} (Cleared)`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Amount in Words</p>
            <p className="mt-0.5 text-xs font-semibold text-[#172033]">{amountInWords(grandTotal)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Status</span>
            <Badge>{paymentStatus}</Badge>
          </div>
        </div>

        {/* Payment Instructions & Short Terms */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <div className="rounded-xl border border-[#E7EAF0] px-4 py-3">
            <SectionTitle title="Payment Instructions" />
            <p className="text-xs leading-relaxed text-[#667085]">
              Payments can be made via Cash, UPI, Bank Transfer, or Card at the administration desk. Please quote{' '}
              <b className="text-[#172033]">{invoice.id}</b> as your payment reference.
            </p>
          </div>
          <div className="rounded-xl border border-[#E7EAF0] px-4 py-3">
            <SectionTitle title="Terms & Conditions" />
            <ol className="space-y-1 text-[11px] leading-snug text-[#667085]">
              <li className="font-semibold text-[#172033]">1. Fees once paid are non-refundable.</li>
              <li>2. Pay fees as per the agreed schedule.</li>
              <li>3. Keep this invoice for future reference.</li>
              <li>4. Contact administration for queries.</li>
            </ol>
          </div>
        </div>

        {/* 5. Footer: Thank-you & Authorized Signature */}
        <div className="mt-4 flex items-end justify-between gap-6 border-t border-[#E7EAF0] pt-4">
          <div className="max-w-sm">
            <p className="text-xs font-semibold text-[#172033]">Thank you for choosing Digiton Technologies!</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#667085]">
              This is a computer-generated invoice issued by Digiton Technologies.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="mb-1.5 h-7 w-44 border-b border-dashed border-[#667085]/60" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#172033]">Authorized Signature</p>
            <p className="text-[10px] text-[#667085]">Digiton Technologies</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {sheet}
      {createPortal(<div className="print-only-root hidden">{sheet}</div>, document.body)}
      <div className="no-print mt-4 flex justify-end gap-2">
        <Button variant="secondary" icon={<Download size={16} />} onClick={() => triggerPrint(true)}>
          Download PDF
        </Button>
        <Button icon={<Printer size={16} />} onClick={() => triggerPrint(false)}>
          Print
        </Button>
      </div>
    </div>
  )
}

export default function Billing() {
  const studentList = useApiList<Student>('/students')
  const feeList = useApiList<Fee>('/fees')

  return (
    <CrudPage<Invoice>
      title="Billing & Invoices" subtitle="Create and manage student invoices" entity="Invoice" idPrefix="INV"
      initial={[]} searchKeys={['student', 'id', 'description']} defaults={{ issueDate: today(), tax: 18, status: 'Pending' }}
      apiPath="/invoices"
      filters={[{ key: 'status', label: 'Status', options: ['Paid', 'Pending', 'Overdue'] }]}
      columns={[
        { key: 'id', header: 'Invoice' }, { key: 'student', header: 'Student' }, { key: 'description', header: 'Description' },
        { key: 'issueDate', header: 'Issued', render: (r) => fmtDate(r.issueDate) },
        { key: 'amount', header: 'Total (incl. tax)', render: (r) => money(total(r)) },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'student', label: 'Student', type: 'select', options: studentList.map((s) => s.name), required: true },
        { name: 'description', label: 'Description', required: true },
        { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
        { name: 'tax', label: 'Tax (%)', type: 'number' },
        { name: 'issueDate', label: 'Issue date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Overdue'] },
      ]}
      viewRender={(r) => (
        <InvoicePdfView
          invoice={r}
          student={studentList.find((s) => s.name === r.student)}
          fee={feeList.find((f) => f.student === r.student)}
        />
      )}
    />
  )
}
