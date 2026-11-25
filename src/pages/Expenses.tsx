import { CreditCard, Hourglass, TrendingDown } from 'lucide-react'
import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import type { Expense } from '../data/mock'
import { fmtDate, money, today } from '../lib/utils'

const cats = ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Equipment', 'Maintenance']

export default function Expenses() {
  return (
    <CrudPage<Expense>
      title="Expenses" subtitle="Record and review institute expenses" entity="Expense" idPrefix="EXP"
      initial={[]} searchKeys={['title', 'id', 'category']} defaults={{ date: today(), status: 'Pending' }}
      apiPath="/expenses"
      filters={[{ key: 'category', label: 'Categories', options: cats }, { key: 'status', label: 'Status', options: ['Approved', 'Pending'] }]}
      stats={(rows) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Expenses" value={money(rows.reduce((a, r) => a + r.amount, 0))} icon={TrendingDown} tone="rose" />
          <StatCard label="Approved" value={money(rows.filter((r) => r.status === 'Approved').reduce((a, r) => a + r.amount, 0))} icon={CreditCard} tone="green" />
          <StatCard label="Pending Approval" value={rows.filter((r) => r.status === 'Pending').length} icon={Hourglass} tone="amber" />
        </div>
      )}
      columns={[
        { key: 'title', header: 'Expense', render: (r) => <div><p className="font-medium text-slate-800">{r.title}</p><p className="text-xs text-slate-500">{r.id}</p></div> },
        { key: 'category', header: 'Category' }, { key: 'amount', header: 'Amount', render: (r) => money(r.amount) },
        { key: 'method', header: 'Method' }, { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true, full: true },
        { name: 'category', label: 'Category', type: 'select', options: cats },
        { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
        { name: 'method', label: 'Payment method', type: 'select', options: ['Cash', 'UPI', 'Bank Transfer'] },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved'] },
      ]}
      viewRender={(r) => <Detail items={[['ID', r.id], ['Title', r.title], ['Category', r.category], ['Amount', money(r.amount)], ['Method', r.method], ['Date', fmtDate(r.date)]]} />}
    />
  )
}
