import { Banknote, CheckCircle2, Clock, Wallet } from 'lucide-react'
import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { useToast } from '../components/ui/Toast'
import type { Course, Fee } from '../data/mock'
import type { Student } from '../types/student'
import { useApiList } from '../hooks/useOptions'
import { api } from '../lib/api'
import { fmtDate, money, today } from '../lib/utils'

const recompute = (f: Fee): Fee => {
  const due = Math.max(0, f.total - f.paid)
  return { ...f, due, status: due === 0 ? 'Paid' : f.paid === 0 ? 'Overdue' : 'Partial' }
}

export default function Fees() {
  const toast = useToast()
  const studentList = useApiList<Student>('/students')
  const courseList = useApiList<Course>('/courses')
  const liveCourseNames = courseList.map((c) => c.name)

  const resolveFeeDefaults = (studentName?: string, courseName?: string) => {
    const s = studentList.find((x) => x.name === studentName)
    const effectiveCourse = courseName || s?.course || liveCourseNames[0] || ''
    const c = courseList.find((x) => x.name === effectiveCourse)

    let total: number | '' = ''
    let paid = 0

    // Prefer student enrollment data (net = totalFees - discount)
    if (s && s.totalFees !== undefined) {
      const net = Math.max(0, Number(s.totalFees) - Number(s.discount || 0))
      if (net > 0) {
        total = net
        paid = Number(s.paid || 0)
      }
    }
    // Fall back to course base fee
    if (total === '' && c?.fee) {
      total = c.fee
    }

    return {
      student: studentName || (studentList[0]?.name ?? ''),
      course: effectiveCourse,
      total,
      paid,
    }
  }

  return (
    <CrudPage<Fee>
      title="Fees" subtitle="Track student fee plans and collections" entity="Fee" idPrefix="FEE"
      initial={[]} searchKeys={['student', 'id', 'course']} defaults={{ dueDate: today(), paid: 0 }} onSaved={recompute}
      apiPath="/fees"
      onOpenNew={(f) => {
        const studentName = f.student || studentList[0]?.name
        const resolved = resolveFeeDefaults(studentName, f.course)
        return {
          student: resolved.student,
          course: resolved.course,
          total: resolved.total,
          paid: resolved.paid,
        }
      }}
      onFormChange={(name, value, _currentForm) => {
        if (name === 'student') {
          const resolved = resolveFeeDefaults(value, undefined)
          return {
            course: resolved.course,
            total: resolved.total,
            paid: resolved.paid,
          }
        }
        if (name === 'course') {
          const c = courseList.find((x) => x.name === value)
          if (c?.fee) {
            return { total: c.fee }
          }
        }
      }}
      filters={[{ key: 'status', label: 'Status', options: ['Paid', 'Partial', 'Overdue'] }, { key: 'course', label: 'Courses', options: liveCourseNames }]}
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
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                const res = await api.post<{ receiptNo?: string; collected: number }>(`/fees/${encodeURIComponent(r.id)}/collect`, { method: 'Cash', date: today() })
                toast(`Collected ${money(res.collected || r.due)} from ${r.student}${res.receiptNo ? ` (${res.receiptNo})` : ''}`)
                refetch()
              } catch (err: any) {
                toast(err.message || 'Collection failed')
              }
            }}
          >
            Collect
          </Button>
        ) : null
      }
      viewRender={(r) => <Detail items={[['ID', r.id], ['Student', r.student], ['Course', r.course], ['Total', money(r.total)], ['Paid', money(r.paid)], ['Due', money(r.due)], ['Due date', fmtDate(r.dueDate)], ['Status', <Badge>{r.status}</Badge>]]} />}
    />
  )
}
