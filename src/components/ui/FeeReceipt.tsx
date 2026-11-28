import { useEffect, useState } from 'react'
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
}

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
    <div className="flex justify-between gap-3 py-1 text-xs">
      <span className="text-[#667085]">{label}</span>
      <span className="text-right font-medium text-[#172033]">{value || '—'}</span>
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

  return (
    <div>
      <div className="print-area rounded-2xl border border-[#E7EAF0] bg-white p-6 text-[#172033]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E7EAF0] pb-4">
          <img src="/digiton-logo.png" alt="Digiton Technologies" className="h-10 w-auto object-contain" />
          <div className="text-right">
            <p className="text-base font-bold uppercase tracking-wider text-[#172033]">Fee Receipt</p>
            <p className="mt-0.5 text-xs font-semibold text-[#00A956]">{data.receiptNo}</p>
          </div>
        </div>

        {/* 1. Receipt Information & 2. Student Information */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
              Receipt Information
            </p>
            <InfoRow label="Receipt Number" value={data.receiptNo} />
            <InfoRow label="Payment ID" value={data.paymentId} />
            <InfoRow label="Payment Date" value={fmtDate(data.paymentDate)} />
            <InfoRow label="Branch Name" value={data.branchName} />
          </div>

          <div className="rounded-xl border border-[#E7EAF0] bg-[#F6F8FC] p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
              Student Information
            </p>
            <InfoRow label="Student Name" value={data.studentName} />
            <InfoRow label="Student ID" value={data.studentId} />
            <InfoRow label="Course Name" value={data.courseName} />
            <InfoRow label="Batch Name" value={data.batchName} />
          </div>
        </div>

        {/* 3. Fee Summary */}
        <div className="mt-5 rounded-xl border border-[#E7EAF0] overflow-hidden">
          <div className="border-b border-[#E7EAF0] bg-[#F6F8FC] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            Fee Summary
          </div>
          <div className="divide-y divide-[#E7EAF0] text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-[#667085]">Total Course Fee</span>
              <span className="font-medium">{money(data.totalCourseFee)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-[#667085]">Previous Paid Amount</span>
              <span className="font-medium">{money(data.previousPaidAmount)}</span>
            </div>
            <div className="flex justify-between bg-[#E8F8F0] px-4 py-3 font-bold text-[#00A956]">
              <span>Current Payment Amount</span>
              <span className="text-base">{money(data.currentPaymentAmount)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-[#667085]">Total Paid Till Date</span>
              <span className="font-semibold text-[#172033]">{money(data.totalPaidTillDate)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-[#667085]">Remaining Pending Balance</span>
              <span className={data.remainingPendingBalance > 0 ? 'font-semibold text-rose-600' : 'font-semibold text-[#00A956]'}>
                {money(data.remainingPendingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Payment Information */}
        <div className="mt-5 rounded-xl border border-[#E7EAF0] p-3.5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            Payment Information
          </p>
          <div className="grid gap-x-6 sm:grid-cols-2">
            <InfoRow label="Payment Method" value={data.paymentMethod} />
            <InfoRow label="Transaction ID / Reference" value={data.transactionId || '—'} />
          </div>
          <InfoRow label="Payment Notes" value={data.paymentNotes || '—'} />
        </div>

        {/* 5. Receipt Footer */}
        <div className="mt-5 border-t border-[#E7EAF0] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[#667085]">Amount in Words: </span>
              <span className="font-semibold text-[#172033]">{amountInWords(data.currentPaymentAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#667085]">Status:</span>
              <Badge>{data.paymentStatus}</Badge>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4 pt-2">
            <p className="max-w-xs text-[11px] text-[#667085]">
              Thank you for your payment. This is an official fee receipt issued by Digiton Technologies.
            </p>
            <div className="text-right">
              <div className="mb-1 h-8 w-40 border-b border-dashed border-[#667085]/50" />
              <p className="text-[11px] font-medium text-[#667085]">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>

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
