import { CrudPage } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { FeeReceipt } from '../components/ui/FeeReceipt'
import type { Invoice, Receipt, Student } from '../data/mock'
import { useApiList } from '../hooks/useOptions'
import { fmtDate, money, today } from '../lib/utils'

export default function Receipts() {
  const studentList = useApiList<Student>('/students')
  const invoiceList = useApiList<Invoice>('/invoices')
  return (
    <CrudPage<Receipt>
      title="Payment Receipts" subtitle="Receipts issued for received payments" entity="Receipt" idPrefix="RCP"
      initial={[]} searchKeys={['student', 'id', 'invoice']} defaults={{ date: today(), status: 'Issued' }}
      apiPath="/receipts"
      filters={[{ key: 'method', label: 'Methods', options: ['Cash', 'UPI', 'Card', 'Bank Transfer'] }]}
      columns={[
        { key: 'id', header: 'Receipt' }, { key: 'student', header: 'Student' }, { key: 'invoice', header: 'Invoice' },
        { key: 'amount', header: 'Amount', render: (r) => money(r.amount) }, { key: 'method', header: 'Method' },
        { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'student', label: 'Student', type: 'select', options: studentList.map((s) => s.name), required: true },
        { name: 'invoice', label: 'Invoice', type: 'select', options: invoiceList.map((i) => i.id) },
        { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
        { name: 'method', label: 'Payment method', type: 'select', options: ['Cash', 'UPI', 'Card', 'Bank Transfer'] },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Issued', 'Cancelled'] },
      ]}
      viewRender={(r) => <FeeReceipt receiptOrPaymentId={r.id} />}
    />
  )
}
