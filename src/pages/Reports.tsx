import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, Loader2, IndianRupee, TrendingDown, TrendingUp, Percent } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { StatCard } from '../components/ui/StatCard'
import { useToast } from '../components/ui/Toast'
import { fmtDate, money, today } from '../lib/utils'
import { api } from '../lib/api'

type ReportData = {
  range: string
  from: string
  to: string
  granularity: 'day' | 'month'
  revenue: number
  expenses: number
  netProfit: number
  pendingFees: number
  totalEnquiries: number
  convertedEnquiries: number
  openEnquiries: number
  leadConversion: number
  expenseCount: number
  series: { label: string; revenue: number; expenses: number; admissions: number }[]
  courseDistribution: { name: string; value: number }[]
}

const RANGE_OPTIONS = [
  { value: 'weekly', label: 'Weekly (Last 7 days)' },
  { value: 'monthly', label: 'Monthly (Last 30 days)' },
  { value: 'quarterly', label: 'Quarterly (3 months)' },
  { value: 'halfyearly', label: 'Half-Yearly (6 months)' },
  { value: 'yearly', label: 'Full Year (12 months)' },
  { value: 'custom', label: 'Custom Date Range' },
] as const

export default function Reports() {
  const toast = useToast()
  const [rangeLabel, setRangeLabel] = useState<string>('Half-Yearly (6 months)')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState(today())
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const selectedOption = RANGE_OPTIONS.find((o) => o.label === rangeLabel) ?? RANGE_OPTIONS[3]
  const rangeKey = selectedOption.value

  useEffect(() => {
    if (rangeKey === 'custom' && (!fromDate || !toDate || fromDate > toDate)) return
    setLoading(true)
    const params = new URLSearchParams({ range: rangeKey })
    if (rangeKey === 'custom') {
      params.set('from', fromDate)
      params.set('to', toDate)
    }
    api.get<ReportData>(`/dashboard/reports?${params.toString()}`)
      .then(setData)
      .catch((err: any) => toast(err.message || 'Could not load report'))
      .finally(() => setLoading(false))
  }, [rangeKey, fromDate, toDate])

  const exportCsv = () => {
    if (!data) return
    const rows: string[] = [
      'Digiton Technologies - Reports & Analytics',
      `Period,${rangeLabel}`,
      `From,${data.from}`,
      `To,${data.to}`,
      '',
      'Summary Metric,Value',
      `Revenue,${data.revenue}`,
      `Expenses,${data.expenses}`,
      `Net Profit,${data.netProfit}`,
      `Pending Fees,${data.pendingFees}`,
      `Lead Conversion,${data.leadConversion}% (${data.convertedEnquiries}/${data.totalEnquiries})`,
      `Open Enquiries,${data.openEnquiries}`,
      '',
      'Period,Revenue,Expenses,Admissions',
      ...data.series.map((r) => `"${r.label}",${r.revenue},${r.expenses},${r.admissions}`),
      '',
      'Course,Enrolled Students',
      ...data.courseDistribution.map((c) => `"${c.name.replace(/"/g, '""')}",${c.value}`),
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digiton-report-${data.range}-${data.from}-to-${data.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('Report exported as CSV')
  }

  const periodSubtitle = data ? `${fmtDate(data.from)} – ${fmtDate(data.to)}` : 'Loading…'

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle={`Insights into admissions, revenue and performance · ${periodSubtitle}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-52">
              <Select
                options={RANGE_OPTIONS.map((o) => o.label)}
                value={rangeLabel}
                onChange={(e) => setRangeLabel(e.target.value)}
              />
            </div>
            {rangeKey === 'custom' && (
              <>
                <div className="w-38">
                  <Input
                    type="date"
                    aria-label="From date"
                    value={fromDate}
                    max={toDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <span className="text-xs text-[#667085]">to</span>
                <div className="w-38">
                  <Input
                    type="date"
                    aria-label="To date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </>
            )}
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv} disabled={!data}>
              Export
            </Button>
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex justify-center py-24 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
      ) : data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={money(data.revenue)} icon={IndianRupee} tone="green" />
            <StatCard label="Expenses" value={money(data.expenses)} icon={TrendingDown} tone="rose" />
            <StatCard label="Net Profit" value={money(data.netProfit)} icon={TrendingUp} tone="blue" />
            <StatCard label="Lead Conversion" value={`${data.leadConversion}%`} icon={Percent} tone="purple" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Revenue vs Expenses" subtitle={periodSubtitle} />
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v) => money(Number(v))} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#00BF63" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Admissions Trend" subtitle={periodSubtitle} />
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="admissions" stroke="#5B5CE2" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Course Performance" subtitle={`${data.courseDistribution.length} courses · enrollments in selected period`} />
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.courseDistribution.map((c) => ({ name: c.name, students: c.value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#5B5CE2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#667085]">
            <span>Pending Fees: <b className="text-[#172033]">{money(data.pendingFees)}</b></span>
            <span>Open Enquiries: <b className="text-[#172033]">{data.openEnquiries}</b></span>
            <span>Converted Leads: <b className="text-[#172033]">{data.convertedEnquiries} / {data.totalEnquiries}</b></span>
            <span>Recorded Expense Entries: <b className="text-[#172033]">{data.expenseCount}</b></span>
          </div>
        </>
      )}
    </>
  )
}
