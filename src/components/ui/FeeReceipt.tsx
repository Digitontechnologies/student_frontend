import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Loader2, Printer } from 'lucide-react'
import { api } from '../../lib/api'
import { fmtDate, money } from '../../lib/utils'
import { Badge } from './Badge'
import { Button } from './Button'

export type ReceiptDetail = {
  receiptNo: string
  paymentId: string
  paymentDate: string
  branchName: string
  studentName: string
  studentId: string
  courseName: string
  batchName: string
  totalCourseFee: number
  previousPaidAmount: number
  currentPaymentAmount: number
  totalPaidTillDate: number
  remainingPendingBalance: number
  paymentMethod: string
  transactionId: string
  paymentNotes: string
  paymentStatus: 'Paid' | 'Partially Paid' | 'Pending'
  termsAndConditions?: string[]
}

const DEFAULT_TERMS = [
  'Fees once paid are strictly non-refundable.',
  'Course fees must be paid as per the agreed payment schedule.',
  'Students are responsible for clearing all pending fees within the specified due date.',
  'Please retain this receipt for future reference.',
  'For any payment-related queries, contact the institute administration.',
]

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]
  return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '')
}

function threeDigits(n: number): string {
  if (n === 0) return ''
  if (n < 100) return twoDigits(n)
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${twoDigits(n % 100)}` : ''}`
}

/** Converts a numeric rupee amount into Indian English words. */
export function amountInWords(amount: number): string {
  const whole = Math.floor(Math.max(0, amount))
  if (whole === 0) return 'Rupees Zero Only'

  const crore = Math.floor(whole / 10000000)
  const lakh = Math.floor((whole % 10000000) / 100000)
  const thousand = Math.floor((whole % 100000) / 1000)
  const rest = whole % 1000

  const parts: string[] = []
  if (crore) parts.push(`${twoDigits(crore)} Crore`)
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`)
  if (rest) parts.push(threeDigits(rest))

  return `Rupees ${parts.join(' ')} Only`
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-xs">
      <span className="shrink-0 font-medium text-[#667085]">{label}</span>
      <span className="text-right font-semibold text-[#172033]">{value || '—'}</span>
    </div>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-3.5 w-1 rounded-full bg-[#00BF63]" />
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#172033]">{title}</h3>
    </div>
  )
}

export function FeeReceipt({ receiptOrPaymentId }: { receiptOrPaymentId: string }) {
  const [data, setData] = useState<ReceiptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get<ReceiptDetail>(`/receipts/detail/${encodeURIComponent(receiptOrPaymentId)}`)
      .then(setData)
      .catch((err: any) => setError(err.message || 'Could not load receipt'))
      .finally(() => setLoading(false))
  }, [receiptOrPaymentId])

  const triggerPrint = (asPdf = false) => {
    if (!data) return
    const prevTitle = document.title
    if (asPdf) document.title = data.receiptNo
    window.print()
    if (asPdf) setTimeout(() => { document.title = prevTitle }, 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#667085]">
        <Loader2 size={18} className="animate-spin text-[#00BF63]" /> Generating receipt…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error || 'Receipt not available'}
      </div>
    )
  }

  const terms = data.termsAndConditions?.length ? data.termsAndConditions : DEFAULT_TERMS

  const receiptBody = (
    <div
      className="mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white text-[#172033] print:max-w-none print:rounded-none print:border-[#E7EAF0]"
      style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif' }}
    >
      {/* Digiton Green Top Accent */}
      <div className="h-1.5 w-full bg-[#00BF63]" />

      <div className="p-6 print:p-5">
        {/* Corporate Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E7EAF0] pb-4">
          <div className="flex items-center gap-3">
            <img src="/digiton-logo.png" alt="Digiton Technologies" className="h-10 w-auto object-contain" />
          </div>
          <div className="text-right">
            <span className="inline-block rounded-full bg-[#E8F8F0] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#00A956]">
              Official Fee Receipt
            </span>
            <p className="mt-1 text-base font-bold tracking-tight text-[#172033]">{data.receiptNo}</p>
          </div>
        </div>

        {/* 1. Receipt Information & 2. Student Information */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <div className="rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] px-4 py-3">
            <SectionHeading title="Receipt Information" />
            <div className="divide-y divide-[#E7EAF0]/70">
              <InfoRow label="Receipt Number" value={data.receiptNo} />
              <InfoRow label="Payment ID" value={data.paymentId} />
              <InfoRow label="Payment Date" value={fmtDate(data.paymentDate)} />
              <InfoRow label="Branch Name" value={data.branchName} />
            </div>
          </div>

          <div className="rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] px-4 py-3">
            <SectionHeading title="Student Information" />
            <div className="divide-y divide-[#E7EAF0]/70">
              <InfoRow label="Student Name" value={data.studentName} />
              <InfoRow label="Student ID" value={data.studentId} />
              <InfoRow label="Course Name" value={data.courseName} />
              <InfoRow label="Batch Name" value={data.batchName} />
            </div>
          </div>
        </div>

        {/* 3. Fee Summary */}
        <div className="mt-4 overflow-hidden rounded-xl border border-[#E7EAF0]">
          <div className="border-b border-[#E7EAF0] bg-[#F6F8FC] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-1 rounded-full bg-[#00BF63]" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#172033]">Fee Summary</h3>
            </div>
          </div>
          <div className="divide-y divide-[#E7EAF0] text-[13px]">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="font-medium text-[#667085]">Total Course Fee</span>
              <span className="font-semibold tabular-nums text-[#172033]">{money(data.totalCourseFee)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="font-medium text-[#667085]">Previous Paid Amount</span>
              <span className="font-semibold tabular-nums text-[#172033]">{money(data.previousPaidAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-l-4 border-l-[#00BF63] bg-[#E8F8F0] px-4 py-2.5">
              <span className="text-sm font-bold text-[#00A956]">Current Payment Amount</span>
              <span className="text-base font-bold tabular-nums text-[#00A956]">{money(data.currentPaymentAmount)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="font-medium text-[#667085]">Total Paid Till Date</span>
              <span className="font-bold tabular-nums text-[#172033]">{money(data.totalPaidTillDate)}</span>
            </div>
            <div
              className={`flex items-center justify-between px-4 py-2.5 ${
                data.remainingPendingBalance > 0 ? 'bg-rose-50/70' : 'bg-[#E8F8F0]/40'
              }`}
            >
              <span className="font-bold text-[#172033]">Remaining Pending Balance</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  data.remainingPendingBalance > 0 ? 'text-rose-600' : 'text-[#00A956]'
                }`}
              >
                {data.remainingPendingBalance > 0 ? money(data.remainingPendingBalance) : `${money(0)} (Cleared)`}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Payment Information */}
        <div className="mt-4 rounded-xl border border-[#E7EAF0] px-4 py-3">
          <SectionHeading title="Payment Information" />
          <div className="grid gap-x-6 divide-y divide-[#E7EAF0]/70 sm:grid-cols-2 sm:divide-y-0 print:grid-cols-2">
            <InfoRow label="Payment Method" value={data.paymentMethod} />
            <InfoRow label="Transaction ID / Reference" value={data.transactionId || '—'} />
          </div>
          <div className="border-t border-[#E7EAF0]/70 pt-1 mt-1">
            <InfoRow label="Payment Notes" value={data.paymentNotes || '—'} />
          </div>
        </div>

        {/* Amount in Words & Payment Status */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Amount Received in Words</p>
            <p className="mt-0.5 text-xs font-semibold text-[#172033]">{amountInWords(data.currentPaymentAmount)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Payment Status</span>
            <Badge>{data.paymentStatus}</Badge>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-4 rounded-xl border border-[#E7EAF0] px-4 py-3">
          <SectionHeading title="Terms & Conditions" />
          <ol className="space-y-1 text-[11px] leading-relaxed text-[#667085]">
            {terms.map((clause, idx) => {
              const isNonRefundable = /non[- ]?refundable/i.test(clause)
              return (
                <li
                  key={idx}
                  className={
                    isNonRefundable
                      ? 'rounded-r-md border-l-2 border-amber-500 bg-amber-50 px-2.5 py-1 font-semibold text-[#172033]'
                      : 'px-1'
                  }
                >
                  {idx + 1}. {clause}
                </li>
              )
            })}
          </ol>
        </div>

        {/* 5. Receipt Footer & Authorized Signature */}
        <div className="mt-4 flex items-end justify-between gap-6 border-t border-[#E7EAF0] pt-4">
          <div className="max-w-sm">
            <p className="text-xs font-semibold text-[#172033]">Thank you for your payment!</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#667085]">
              This is an official computer-generated fee receipt issued by Digiton Technologies.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="mb-1.5 h-8 w-44 border-b border-dashed border-[#667085]/60" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#172033]">Authorized Signature</p>
            <p className="text-[10px] text-[#667085]">Digiton Technologies</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {receiptBody}
      {createPortal(<div className="print-only-root hidden">{receiptBody}</div>, document.body)}

      {/* Print / Download PDF Actions */}
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
