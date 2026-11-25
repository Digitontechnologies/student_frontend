import { useEffect, useState } from 'react'
import { Save, Loader2, CalendarCheck, UserCheck, UserX, Clock } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import { StatCard } from '../components/ui/StatCard'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../components/ui/Toast'
import { cn, today } from '../lib/utils'
import { api } from '../lib/api'

type Status = 'Present' | 'Absent' | 'Late' | 'Leave'
const opts: { s: Status; cls: string }[] = [
  { s: 'Present', cls: 'bg-emerald-600 text-white' },
  { s: 'Absent', cls: 'bg-rose-600 text-white' },
  { s: 'Late', cls: 'bg-amber-500 text-white' },
  { s: 'Leave', cls: 'bg-violet-600 text-white' },
]

type Person = { id: string; name: string; sub: string }

function AttendanceSheet({ title, subtitle, groupLabel, apiType }: {
  title: string
  subtitle: string
  groupLabel?: string
  apiType: 'students' | 'staff'
}) {
  const toast = useToast()
  const [date, setDate] = useState(today())
  const [group, setGroup] = useState('')
  const [marks, setMarks] = useState<Record<string, Status>>({})
  const [list, setList] = useState<Person[]>([])
  const [batches, setBatches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch batch names for Student Attendance
  useEffect(() => {
    if (apiType !== 'students') return
    api.get<string[]>('/attendance/batches')
      .then((bs) => {
        setBatches(bs)
        if (bs.length > 0 && !group) setGroup(bs[0])
      })
      .catch(() => setBatches([]))
  }, [apiType])

  // Fetch live roster & saved attendance from Neon PostgreSQL
  useEffect(() => {
    setLoading(true)
    const params = apiType === 'students'
      ? `/attendance/students?date=${date}${group ? `&batch=${encodeURIComponent(group)}` : ''}`
      : `/attendance/staff?date=${date}`
    api.get<(Person & { status?: string })[]>(params)
      .then((rows) => {
        setList(rows)
        const m: Record<string, Status> = {}
        rows.forEach((r) => { if (r.status) m[`${date}|${r.id}`] = r.status as Status })
        setMarks((prev) => ({ ...prev, ...m }))
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [date, group, apiType])

  const get = (id: string): Status => marks[`${date}|${id}`] ?? 'Present'
  const set = (id: string, s: Status) => setMarks({ ...marks, [`${date}|${id}`]: s })
  const count = (s: Status) => list.filter((p) => get(p.id) === s).length
  const markAll = (s: Status) => setMarks({ ...marks, ...Object.fromEntries(list.map((p) => [`${date}|${p.id}`, s])) })

  const saveAttendance = async () => {
    if (list.length === 0) {
      toast('No records to save')
      return
    }
    const records = list.map((p) => ({
      studentNo: p.id,
      staffNo: p.id,
      batchName: p.sub,
      status: get(p.id),
    }))
    try {
      await api.post(`/attendance/${apiType}`, { date, records })
      toast(`Attendance saved for ${date}`)
    } catch (err: any) {
      toast(err.message || 'Save failed')
    }
  }

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={<Button icon={<Save size={16} />} onClick={saveAttendance}>Save attendance</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={list.length} icon={CalendarCheck} tone="blue" />
        <StatCard label="Present" value={count('Present')} icon={UserCheck} tone="green" />
        <StatCard label="Absent" value={count('Absent')} icon={UserX} tone="rose" />
        <StatCard label="Late / Leave" value={count('Late') + count('Leave')} icon={Clock} tone="amber" />
      </div>
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end">
          <div className="sm:w-48"><Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
          {apiType === 'students' && batches.length > 0 && (
            <div className="sm:w-56"><Field label={groupLabel ?? 'Batch'}><Select options={batches} value={group} onChange={(e) => setGroup(e.target.value)} /></Field></div>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="secondary" size="sm" onClick={() => markAll('Present')}>All present</Button>
            <Button variant="secondary" size="sm" onClick={() => markAll('Absent')}>All absent</Button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3"><Avatar name={p.name} /><div><p className="text-sm font-medium text-slate-800">{p.name}</p><p className="text-xs text-slate-500">{p.id} · {p.sub}</p></div></div>
                <div className="flex gap-1.5">
                  {opts.map(({ s, cls }) => (
                    <button key={s} onClick={() => set(p.id, s)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer', get(p.id) === s ? cls : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{s}</button>
                  ))}
                </div>
              </li>
            ))}
            {list.length === 0 && (
              <li className="p-10 text-center text-sm text-slate-400">
                {apiType === 'students'
                  ? 'No students enrolled yet. Add courses, batches, and students first.'
                  : 'No staff members added yet. Add staff members first.'}
              </li>
            )}
          </ul>
        )}
      </Card>
    </>
  )
}

export function StudentAttendance() {
  return (
    <AttendanceSheet
      title="Student Attendance"
      subtitle="Mark daily attendance batch-wise"
      groupLabel="Batch"
      apiType="students"
    />
  )
}

export function StaffAttendance() {
  return (
    <AttendanceSheet
      title="Staff Attendance"
      subtitle="Mark daily attendance for staff members"
      apiType="staff"
    />
  )
}
