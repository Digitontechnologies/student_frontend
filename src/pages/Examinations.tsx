import { useEffect, useState } from 'react'
import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import type { Exam } from '../data/mock'
import { fmtDate, today } from '../lib/utils'
import { api } from '../lib/api'

export default function Examinations() {
  const [apiCourseNames, setApiCourseNames] = useState<string[]>([])
  useEffect(() => {
    api.get<{ name: string }[]>('/courses').then((cs) => {
      setApiCourseNames(cs.map((c) => c.name))
    }).catch(() => {})
  }, [])

  return (
    <CrudPage<Exam>
      title="Examinations" subtitle="Schedule exams and track results" entity="Exam" idPrefix="EXM"
      initial={[]} searchKeys={['title', 'id', 'course']} defaults={{ date: today(), maxMarks: 100, passMarks: 40, status: 'Scheduled' }}
      apiPath="/examinations"
      filters={[{ key: 'course', label: 'Courses', options: apiCourseNames }, { key: 'status', label: 'Status', options: ['Scheduled', 'Completed', 'Cancelled'] }]}
      columns={[
        { key: 'title', header: 'Exam', render: (r) => <div><p className="font-medium text-slate-800">{r.title}</p><p className="text-xs text-slate-500">{r.id}</p></div> },
        { key: 'course', header: 'Course' }, { key: 'date', header: 'Date', render: (r) => fmtDate(r.date) },
        { key: 'duration', header: 'Duration' }, { key: 'maxMarks', header: 'Marks', render: (r) => `${r.passMarks}/${r.maxMarks}` },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'title', label: 'Exam title', required: true, full: true },
        { name: 'course', label: 'Course', type: 'select', options: apiCourseNames },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'duration', label: 'Duration (e.g. 2 hrs)', required: true },
        { name: 'maxMarks', label: 'Max marks', type: 'number', required: true },
        { name: 'passMarks', label: 'Pass marks', type: 'number', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled'] },
      ]}
      viewRender={(r) => <Detail items={[['ID', r.id], ['Title', r.title], ['Course', r.course], ['Date', fmtDate(r.date)], ['Duration', r.duration], ['Max / Pass marks', `${r.maxMarks} / ${r.passMarks}`], ['Status', <Badge>{r.status}</Badge>]]} />}
    />
  )
}
