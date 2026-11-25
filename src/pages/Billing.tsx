import { CrudPage } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { PrintDoc, Row } from '../components/ui/PrintDoc'
import type { Invoice, Student } from '../data/mock'
import { useApiList } from '../hooks/useOptions'
import { fmtDate, money, today } from '../lib/utils'

const total = (i: Invoice) => Math.round(i.amount * (1 + i.tax / 100))

export default function Billing() {
  const studentList = useApiList<Student>('/students')
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
        <PrintDoc title="Invoice">
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm"><p><span className="text-slate-500">Invoice:</span> <b>{r.id}</b></p><p className="text-right"><span className="text-slate-500">Date:</span> {fmtDate(r.issueDate)}</p><p><span className="text-slate-500">Billed to:</span> <b>{r.student}</b></p><p className="text-right"><Badge>{r.status}</Badge></p></div>
          <Row k={r.description} v={money(r.amount)} />
          <Row k={`Tax (${r.tax}%)`} v={money(total(r) - r.amount)} />
          <Row k="Total" v={money(total(r))} bold />
        </PrintDoc>
      )}
    />
  )
}
