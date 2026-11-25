import { Award } from 'lucide-react'
import { CrudPage } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { PrintDoc } from '../components/ui/PrintDoc'
import type { Certificate, Course, Student } from '../data/mock'
import { useApiList } from '../hooks/useOptions'
import { fmtDate, today } from '../lib/utils'

export default function Certificates() {
  const studentList = useApiList<Student>('/students')
  const courseList = useApiList<Course>('/courses')
  const liveCourseNames = courseList.map((c) => c.name)

  return (
    <CrudPage<Certificate>
      title="Certificates" subtitle="Issue and print course completion certificates" entity="Certificate" idPrefix="CERT"
      initial={[]} searchKeys={['student', 'id', 'course']} defaults={{ issueDate: today(), grade: 'A', status: 'Pending' }}
      apiPath="/certificates"
      filters={[{ key: 'status', label: 'Status', options: ['Issued', 'Pending'] }, { key: 'course', label: 'Courses', options: liveCourseNames }]}
      columns={[
        { key: 'id', header: 'Certificate' }, { key: 'student', header: 'Student' }, { key: 'course', header: 'Course' },
        { key: 'grade', header: 'Grade' }, { key: 'issueDate', header: 'Issued', render: (r) => fmtDate(r.issueDate) },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'student', label: 'Student', type: 'select', options: studentList.map((s) => s.name), required: true },
        { name: 'course', label: 'Course', type: 'select', options: liveCourseNames },
        { name: 'grade', label: 'Grade', type: 'select', options: ['A+', 'A', 'B+', 'B', 'C'] },
        { name: 'issueDate', label: 'Issue date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Issued', 'Pending'] },
      ]}
      viewRender={(r) => (
        <PrintDoc title="Certificate">
          <div className="rounded-xl border-4 border-double border-brand-500/40 p-8 text-center">
            <Award className="mx-auto text-accent-600" size={44} />
            <p className="mt-3 text-sm uppercase tracking-widest text-slate-500">Certificate of Completion</p>
            <p className="mt-6 text-sm text-slate-500">This is to certify that</p>
            <p className="my-2 text-3xl font-bold text-brand-700">{r.student}</p>
            <p className="text-sm text-slate-500">has successfully completed the course</p>
            <p className="my-2 text-xl font-semibold text-slate-900">{r.course}</p>
            <p className="text-sm text-slate-600">with grade <b>{r.grade}</b> · {fmtDate(r.issueDate)}</p>
            <p className="mt-6 text-xs text-slate-400">Certificate ID: {r.id}</p>
          </div>
        </PrintDoc>
      )}
    />
  )
}
