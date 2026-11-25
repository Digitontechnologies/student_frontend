import { useState } from 'react'
import { Building2, Bell, Save, Shield, User } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

const tabs = [
  { id: 'institute', label: 'Institute', icon: Building2 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
] as const

function Toggle({ label, desc, defaultOn }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><p className="text-sm font-medium text-slate-800">{label}</p><p className="text-xs text-slate-500">{desc}</p></div>
      <button type="button" role="switch" aria-checked={on} onClick={() => setOn(!on)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer', on ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', on ? 'left-5.5' : 'left-0.5')} />
      </button>
    </div>
  )
}

export default function Settings() {
  const toast = useToast()
  const { user } = useAuth()
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('institute')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const submit = (msg: string) => (e: React.FormEvent) => { e.preventDefault(); toast(msg) }

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match')
      return
    }
    setPwBusy(true)
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      toast('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast(err.message || 'Could not update password')
    } finally {
      setPwBusy(false)
    }
  }

  const roleLabel = user?.roles?.length ? user.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ') : 'Administrator'

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure your institute and account" />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={cn('flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer', tab === id ? 'bg-gradient-to-r from-brand-50 to-violet-50 text-brand-700' : 'text-slate-600 hover:bg-white')}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
        <Card className="p-6">
          {tab === 'institute' && (
            <form onSubmit={submit('Institute settings saved')} className="grid gap-4 sm:grid-cols-2">
              <Field label="Institute name"><Input defaultValue="Institute Pro Training Academy" /></Field>
              <Field label="Registration no."><Input defaultValue="REG-2024-0098" /></Field>
              <Field label="Email"><Input type="email" defaultValue="info@institutepro.com" /></Field>
              <Field label="Phone"><Input defaultValue="+91 80000 00000" /></Field>
              <Field label="Currency"><Select options={['INR (₹)', 'USD ($)', 'EUR (€)']} defaultValue="INR (₹)" /></Field>
              <Field label="Academic year"><Select options={['2025–26', '2026–27']} defaultValue="2026–27" /></Field>
              <div className="sm:col-span-2"><Field label="Address"><Textarea defaultValue="12 MG Road, Bengaluru, Karnataka" /></Field></div>
              <div className="sm:col-span-2"><Button type="submit" icon={<Save size={16} />}>Save changes</Button></div>
            </form>
          )}
          {tab === 'profile' && (
            <form onSubmit={submit('Profile updated')} className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input defaultValue={user?.fullName ?? 'Admin User'} /></Field>
              <Field label="Role"><Input value={roleLabel} disabled /></Field>
              <Field label="Email"><Input type="email" defaultValue={user?.email ?? 'admin@institutepro.local'} /></Field>
              <Field label="Phone"><Input defaultValue="+91 90000 00000" /></Field>
              <div className="sm:col-span-2"><Button type="submit" icon={<Save size={16} />}>Update profile</Button></div>
            </form>
          )}
          {tab === 'notifications' && (
            <div className="divide-y divide-slate-100">
              <Toggle label="Fee reminders" desc="Notify when fees are due or overdue" defaultOn />
              <Toggle label="New enquiries" desc="Alert on every new lead" defaultOn />
              <Toggle label="Exam schedules" desc="Remind before upcoming exams" />
              <Toggle label="Weekly report email" desc="Summary delivered each Monday" defaultOn />
              <div className="pt-4"><Button onClick={() => toast('Notification preferences saved')} icon={<Save size={16} />}>Save preferences</Button></div>
            </div>
          )}
          {tab === 'security' && (
            <form onSubmit={updatePassword} className="grid max-w-md gap-4">
              <Field label="Current password"><Input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
              <Field label="New password"><Input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
              <Field label="Confirm new password"><Input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></Field>
              <div><Button type="submit" disabled={pwBusy} icon={<Save size={16} />}>{pwBusy ? 'Updating…' : 'Update password'}</Button></div>
            </form>
          )}
        </Card>
      </div>
    </>
  )
}
