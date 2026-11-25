import { CrudPage, Detail } from '../components/ui/CrudPage'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import type { Staff as S } from '../data/mock'
import { fmtDate, money, today } from '../lib/utils'

const roles = ['Instructor', 'Counsellor', 'Accountant', 'Receptionist', 'Lab Assistant']
const depts = ['Technology', 'Design', 'Marketing', 'Administration']

export default function Staff() {
  return (
    <CrudPage<S>
      title="Staff" subtitle="Manage instructors and administrative staff" entity="Staff" idPrefix="STF"
      initial={[]} searchKeys={['name', 'id', 'email', 'role']}
      defaults={{ joinDate: today(), status: 'Active' }}
      apiPath="/staff"
      filters={[
        { key: 'role', label: 'Roles', options: roles },
        { key: 'department', label: 'Departments', options: depts },
      ]}
      columns={[
        { key: 'name', header: 'Name', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} /><div><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></div></div> },
        { key: 'role', header: 'Role' }, { key: 'department', header: 'Department' },
        { key: 'salary', header: 'Salary', render: (r) => money(r.salary) },
        { key: 'joinDate', header: 'Joined', render: (r) => fmtDate(r.joinDate) },
        { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Full name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true },
        { name: 'role', label: 'Role', type: 'select', options: roles },
        { name: 'department', label: 'Department', type: 'select', options: depts },
        { name: 'salary', label: 'Monthly salary (₹)', type: 'number', required: true },
        { name: 'joinDate', label: 'Join date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'] },
      ]}
      viewRender={(r) => (
        <Detail items={[['ID', r.id], ['Name', r.name], ['Email', r.email], ['Phone', r.phone], ['Role', r.role], ['Department', r.department], ['Salary', money(r.salary)], ['Joined', fmtDate(r.joinDate)]]} />
      )}
    />
  )
}
