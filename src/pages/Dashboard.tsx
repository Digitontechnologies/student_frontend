import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { CalendarCheck, GraduationCap, Loader2, UserCheck, UserCog, UserPlus, Wallet, IndianRupee } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { fmtDate, money } from '../lib/utils'
import { api } from '../lib/api'

const COLORS = ['#5B5CE2', '#8B5CF6', '#00BF63', '#a78bfa', '#6366f1', '#00A956']

type DashStats = {
  totalStudents: number
  activeStudents: number
  staffMembers: number
  pendingFees: number
  openEnquiries: number
  recentStudents: { id: string; name: string; course: string; admissionDate: string; status: string }[]
  courseDistribution: { name: string; value: number }[]
  revenueMonthly: { month: string; revenue: number; expenses: number }[]
  admissionsMonthly: { month: string; admissions: number }[]
}

const EMPTY: DashStats = {
  totalStudents: 0,
  activeStudents: 0,
  staffMembers: 0,
  pendingFees: 0,
  openEnquiries: 0,
  recentStudents: [],
  courseDistribution: [],
  revenueMonthly: [],
  admissionsMonthly: [],
}

export default function Dashboard() {
  const [data, setData] = useState<DashStats | null>(null)

  useEffect(() => {
    // Add cache-busting timestamp to avoid stale data
    api.get<DashStats>(`/dashboard/stats?_=${Date.now()}`).then(setData).catch(() => setData(EMPTY))
  }, [])

  if (!data) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Loading…" />
        <div className="flex justify-center py-24 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
      </>
    )
  }

  const lastRevenue = data.revenueMonthly[data.revenueMonthly.length - 1]
  const lastAdm = data.admissionsMonthly[data.admissionsMonthly.length - 1]

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's what's happening at your institute today." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={data.totalStudents} icon={GraduationCap} tone="blue" />
        <StatCard label="Active Students" value={data.activeStudents} icon={UserCheck} tone="purple" />
        <StatCard label="Staff Members" value={data.staffMembers} icon={UserCog} tone="green" />
        <StatCard label="Monthly Revenue" value={money(lastRevenue?.revenue ?? 0)} icon={IndianRupee} tone="blue" />
        <StatCard label="Pending Fees" value={money(data.pendingFees)} icon={Wallet} tone="rose" />
        <StatCard label="Today's Attendance" value="—" icon={CalendarCheck} tone="green" />
        <StatCard label="New Admissions" value={lastAdm?.admissions ?? 0} icon={UserPlus} tone="purple" />
        <StatCard label="Open Enquiries" value={data.openEnquiries} icon={UserPlus} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue vs Expenses" subtitle="Last 6 months" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueMonthly}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5b6cf2" stopOpacity={0.3} /><stop offset="95%" stopColor="#5b6cf2" stopOpacity={0} /></linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#5b6cf2" strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="expenses" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Students by Course" subtitle="Enrollment distribution" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.courseDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {data.courseDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Monthly Admissions" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.admissionsMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="admissions" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent Admissions" action={<Link to="/students" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">View all</Link>} />
          <ul className="divide-y divide-slate-100 p-2">
            {data.recentStudents.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-3">
                <Avatar name={s.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">{s.course} · {fmtDate(s.admissionDate)}</p>
                </div>
                <Badge>{s.status}</Badge>
              </li>
            ))}
            {data.recentStudents.length === 0 && (
              <li className="p-8 text-center text-sm text-slate-400">No admissions yet</li>
            )}
          </ul>
        </Card>
      </div>
    </>
  )
}
