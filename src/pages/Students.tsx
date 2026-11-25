import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Loader2, Pencil, Plus, Trash2, UserCheck, GraduationCap, Wallet } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { StatCard } from '../components/ui/StatCard'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useToast } from '../components/ui/Toast'
import { StudentForm } from '../components/students/StudentForm'
import { useStudents } from '../hooks/useStudents'
import { calcNet, calcPaid, calcPending } from '../lib/students'
import type { Course } from '../data/mock'
import { useApiList } from '../hooks/useOptions'
import { fmtDate, money } from '../lib/utils'
import type { StudentRow } from '../types/student'

export default function Students() {
  const toast = useToast()
  const navigate = useNavigate()
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents()
  const courses = useApiList<Course>('/courses')
  const [mode, setMode] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<StudentRow | null>(null)
  const [deleting, setDeleting] = useState<StudentRow | null>(null)

  const rows: StudentRow[] = useMemo(
    () => students.map((s) => ({ ...s, netFees: calcNet(s), paid: calcPaid(s), pending: calcPending(s) })),
    [students],
  )

  const columns: Column<StudentRow>[] = [
    { key: 'id', header: 'ID', render: (r) => <span className="font-medium text-brand-700">{r.id}</span> },
    { key: 'name', header: 'Student', render: (r) => (
      <button onClick={() => navigate(`/students/${r.id}`)} className="flex items-center gap-3 text-left cursor-pointer">
        <Avatar name={r.name} src={r.photo} /><span className="font-medium text-slate-800 hover:text-brand-700">{r.name}</span>
      </button>
    ) },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'course', header: 'Course' },
    { key: 'batch', header: 'Batch' },
    { key: 'admissionDate', header: 'Admitted', render: (r) => fmtDate(r.admissionDate) },
    { key: 'netFees', header: 'Total fees', render: (r) => money(r.netFees) },
    { key: 'paid', header: 'Paid', render: (r) => <span className="text-emerald-600">{money(r.paid)}</span> },
    { key: 'pending', header: 'Pending', render: (r) => <span className={r.pending > 0 ? 'font-medium text-rose-600' : 'text-slate-500'}>{money(r.pending)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
  ]

  const close = () => { setMode(null); setSelected(null) }

  if (loading) {
    return (
      <>
        <PageHeader title="Students" subtitle="Manage student admissions, fees and profiles" />
        <div className="flex items-center justify-center gap-3 py-24 text-slate-400">
          <Loader2 className="animate-spin" size={20} /> Loading students…
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Students" subtitle="Manage student admissions, fees and profiles"
        actions={<Button icon={<Plus size={16} />} onClick={() => setMode('add')}>Add Student</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Students" value={rows.length} icon={GraduationCap} tone="blue" />
        <StatCard label="Active Students" value={rows.filter((r) => r.status === 'Active').length} icon={UserCheck} tone="green" />
        <StatCard label="Pending Fees" value={money(rows.reduce((a, r) => a + r.pending, 0))} icon={Wallet} tone="rose" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['name', 'id', 'phone', 'email']}
        filters={[
          { key: 'course', label: 'Courses', options: courses.map((c) => c.name) },
          { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
        ]}
        actions={(r) => (
          <>
            <Button size="sm" variant="ghost" aria-label="View profile" onClick={() => navigate(`/students/${r.id}`)}><Eye size={15} /></Button>
            <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => { setSelected(r); setMode('edit') }}><Pencil size={15} /></Button>
            <Button size="sm" variant="ghost" aria-label="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleting(r)}><Trash2 size={15} /></Button>
          </>
        )}
      />

      <Modal open={mode !== null} onClose={close} wide title={mode === 'edit' ? `Edit ${selected?.name}` : 'Add New Student'}>
        {mode && (
          <StudentForm
            key={selected?.id ?? 'new'}
            student={mode === 'edit' ? selected! : undefined}
            onCancel={close}
            onSubmit={async (v) => {
              try {
                if (mode === 'edit' && selected) {
                  await updateStudent(selected.id, v)
                  toast('Student updated')
                } else {
                  const s = await addStudent(v)
                  toast(`Student added with ID ${s.id}`)
                }
                close()
              } catch (err: any) {
                toast(err.message || 'Could not save student')
              }
            }}
          />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete student">
        <p className="text-sm text-slate-600">
          Delete <b>{deleting?.name}</b> ({deleting?.id})? Their payment and attendance history will be removed. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { deleteStudent(deleting!.id); toast('Student deleted'); setDeleting(null) }}>Delete</Button>
        </div>
      </Modal>
    </>
  )
}
