import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, Loader2, IndianRupee, TrendingDown, TrendingUp, Percent } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { StatCard } from '../components/ui/StatCard'
import { useToast } from '../components/ui/Toast'
import { money } from '../lib/utils'
import { api } from '../lib/api'

type DashStats = {
  revenueMonthly: { month: string; revenue: number; expenses: number }[]
  admissionsMonthly: { month: string; admissions: number }[]
  pendingFees: number
  openEnquiries: number
  courseDistribution: { name: string; value: number }[]
}

const EMPTY_STATS: DashStats = {
  revenueMonthly: [],
  admissionsMonthly: [],
  pendingFees: 0,
  openEnquiries: 0,
  courseDistribution: [],
}

export default function Reports() {
  const toast = useToast()
  const [range, setRange] = useState('Last 6 months')
  const [data, setData] = useState<DashStats | null>(null)
  const [enquiryList, setEnquiryList] = useState<{ status: string }[]>([])
  const [expenseCount, setExpenseCount] = useState(0)

  useEffect(() => {
    Promise.all([
      api.get<DashStats>('/dashboard/stats').catch(() => EMPTY_STATS),
      api.get<{ status: string }[]>('/enquiries').catch(() => []),
      api.get<unknown[]>('/expenses').catch(() => []),
    ]).then(([stats, enqs, exps]) => {
      setData(stats)
      setEnquiryList(enqs)
      setExpenseCount(exps.length)
    })
  }, [])

  if (!data) {
    return (
      <>
        <PageHeader title="Reports & Analytics" subtitle="Loading…" />
        <div className="flex justify-center py-24 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
      </>
    )
  }

  const n = range === 'Last 3 months' ? 3 : 6
  const rev = data.revenueMonthly.slice(-n)
  const adm = data.admissionsMonthly.slice(-n)
  const revenue = rev.reduce((a, r) => a + r.revenue, 0)
  const exp = rev.reduce((a, r) => a + r.expenses, 0)

  const byCourse = data.courseDistribution.map((c) => ({
    name: c.name.split(' ')[0],
    students: c.value,
  }))

  const conv = enquiryList.length > 0
    ? Math.round((enquiryList.filter((e) => e.status === 'Converted').length / enquiryList.length) * 100)
    : 0

  return (
    <>
      <PageHeader
        title="Reports & Analytics" subtitle="Insights into admissions, revenue and performance"
        actions={<>
          <div className="w-44"><Select options={['Last 3 months', 'Last 6 months']} value={range} onChange={(e) => setRange(e.target.value)} /></div>
          <Button variant="secondary" icon={<Download size={16} />} onClick={() => toast('Report exported')}>Export</Button>
        </>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={money(revenue)} icon={IndianRupee} tone="blue" />
        <StatCard label="Expenses" value={money(exp)} icon={TrendingDown} tone="rose" />
        <StatCard label="Net Profit" value={money(revenue - exp)} icon={TrendingUp} tone="green" />
        <StatCard label="Lead Conversion" value={`${conv}%`} icon={Percent} tone="purple" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue vs Expenses" />
          <div className="h-72 p-4"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={rev}><CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} /><Tooltip formatter={(v) => money(Number(v))} /><Legend />
              <Bar dataKey="revenue" fill="#5b6cf2" radius={[6, 6, 0, 0]} /><Bar dataKey="expenses" fill="#a78bfa" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader title="Admissions Trend" />
          <div className="h-72 p-4"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={adm}><CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip />
              <Line type="monotone" dataKey="admissions" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
          </ResponsiveContainer></div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Course Performance" subtitle={`${data.courseDistribution.length} courses · enrolled students`} />
          <div className="h-72 p-4"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCourse}><CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip /><Legend />
              <Bar dataKey="students" fill="#5b6cf2" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer></div>
        </Card>
      </div>
      <p className="mt-4 text-xs text-slate-400">Total recorded expense entries: {expenseCount}</p>
    </>
  )
}
