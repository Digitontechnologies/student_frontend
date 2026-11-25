import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import type { Course, Staff } from '../data/mock'
import { useApiList } from '../hooks/useOptions'
import { money } from '../lib/utils'

export default function Courses() {
  const staffList = useApiList<Staff>('/staff')
  const instructors = staffList.filter((s) => s.role.toLowerCase().includes('instructor')).map((s) => s.name)
  return (
    <CrudPage<Course>
      title="Courses" subtitle="Programs offered by your institute" entity="Course" idPrefix="CRS"
      initial={[]} searchKeys={['name', 'id', 'instructor']} defaults={{ status: 'Active' }}
      apiPath="/courses"
      filters={[{ key: 'status', label: 'Status', options: ['Active', 'Inactive'] }]}
      columns={[
        { key: 'name', header: 'Course', render: (r) => <div><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-500">{r.id}</p></div> },
        { key: 'duration', header: 'Duration' },
        { key: 'fee', header: 'Fee', render: (r) => money(r.fee) },
        { key: 'instructor', header: 'Instructor' }, { key: 'seats', header: 'Seats' },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Course name', required: true },
        { name: 'duration', label: 'Duration', type: 'select', options: ['1 Month', '3 Months', '4 Months', '6 Months', '12 Months'] },
        { name: 'fee', label: 'Fee (₹)', type: 'number', required: true },
        { name: 'seats', label: 'Total seats', type: 'number', required: true },
        { name: 'instructor', label: 'Instructor', type: 'select', options: instructors.length ? instructors : [''] },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      viewRender={(r) => <Detail items={[['ID', r.id], ['Course', r.name], ['Duration', r.duration], ['Fee', money(r.fee)], ['Instructor', r.instructor], ['Seats', r.seats], ['Description', r.description]]} />}
    />
  )
}
