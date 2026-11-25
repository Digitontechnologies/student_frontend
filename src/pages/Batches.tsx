import { useEffect, useState } from 'react'
import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import type { Batch } from '../data/mock'
import { fmtDate, today } from '../lib/utils'
import { api } from '../lib/api'

export default function Batches() {
  // Fetch course names from API for the filter dropdown
  const [apiCourseNames, setApiCourseNames] = useState<string[]>([])
  useEffect(() => {
    api.get<{ name: string }[]>('/courses').then((cs) => {
      setApiCourseNames(cs.map((c) => c.name))
    }).catch(() => {})
  }, [])

  return (
    <CrudPage<Batch>
      title="Batches" subtitle="Schedule and manage class batches" entity="Batch" idPrefix="BAT"
      initial={[]} searchKeys={['name', 'id', 'course']} defaults={{ startDate: today(), enrolled: 0, capacity: 30, status: 'Upcoming' }}
      apiPath="/batches"
      filters={[{ key: 'course', label: 'Courses', options: apiCourseNames }, { key: 'status', label: 'Status', options: ['Ongoing', 'Upcoming', 'Completed'] }]}
      columns={[
        { key: 'name', header: 'Batch', render: (r) => <div><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-500">{r.id}</p></div> },
        { key: 'course', header: 'Course' }, { key: 'timing', header: 'Timing' },
        { key: 'startDate', header: 'Start', render: (r) => fmtDate(r.startDate) },
        { key: 'enrolled', header: 'Enrolled', render: (r) => (
          <div className="w-32">
            <p className="mb-1 text-xs text-slate-500">{r.enrolled}/{r.capacity}</p>
            <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${Math.min(100, (r.enrolled / Math.max(1, r.capacity)) * 100)}%` }} /></div>
          </div>
        ) },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Batch name', required: true },
        { name: 'course', label: 'Course', type: 'select', options: apiCourseNames },
        { name: 'timing', label: 'Timing (e.g. 09:00 – 11:00)', required: true },
        { name: 'startDate', label: 'Start date', type: 'date' },
        { name: 'capacity', label: 'Capacity', type: 'number', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Ongoing', 'Upcoming', 'Completed'] },
      ]}
      viewRender={(r) => <Detail items={[['ID', r.id], ['Batch', r.name], ['Course', r.course], ['Timing', r.timing], ['Start', fmtDate(r.startDate)], ['Enrolled', `${r.enrolled}/${r.capacity}`]]} />}
    />
  )
}
