import { useEffect, useState } from 'react'
import { Building2, Bell, RotateCcw, Save, Shield, User } from 'lucide-react'
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

const DEFAULT_TERMS = [
  'Fees once paid are strictly non-refundable.',
  'Course fees must be paid as per the agreed payment schedule.',
  'Students are responsible for clearing all pending fees within the specified due date.',
  'Please retain this receipt for future reference.',
  'For any payment-related queries, contact the institute administration.',
]

export default function Settings() {
  const toast = useToast()
  const { user } = useAuth()
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('institute')
  const [branchName, setBranchName] = useState('Main Branch')
  const [termsText, setTermsText] = useState(DEFAULT_TERMS.join('\n'))
  const [savingSettings, setSavingSettings] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  useEffect(() => {
    api.get<{ receiptTerms?: string[]; branchName?: string }>('/settings')
      .then((s) => {
        if (s.branchName) setBranchName(s.branchName)
        if (Array.isArray(s.receiptTerms) && s.receiptTerms.length > 0) {
          setTermsText(s.receiptTerms.join('\n'))
        }
      })
      .catch(() => {})
  }, [])

  const submit = (msg: string) => (e: React.FormEvent) => { e.preventDefault(); toast(msg) }

  const saveInstituteSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const receiptTerms = termsText.split('\n').map((l) => l.trim()).filter(Boolean)
    setSavingSettings(true)
    try {
      const updated = await api.put<{ receiptTerms: string[]; branchName: string }>('/settings', {
        branchName: branchName.trim() || 'Main Branch',
        receiptTerms,
      })
      setBranchName(updated.branchName)
      setTermsText(updated.receiptTerms.join('\n'))
      toast('Institute & receipt settings saved')
    } catch (err: any) {
      toast(err.message || 'Could not save settings')
    } finally {
      setSavingSettings(false)
    }
  }

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
            <button key={id} onClick={() => setTab(id)} className={cn('flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer', tab === id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-white')}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
        <Card className="p-6">
          {tab === 'institute' && (
            <form onSubmit={saveInstituteSettings} className="grid gap-4 sm:grid-cols-2">
              <Field label="Institute name"><Input defaultValue="Digiton Technologies" /></Field>
              <Field label="Branch name"><Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Main Branch" /></Field>
              <Field label="Email"><Input type="email" defaultValue="info@digitontechnologies.com" /></Field>
              <Field label="Phone"><Input defaultValue="+91 80000 00000" /></Field>
              <Field label="Currency"><Select options={['INR (₹)', 'USD ($)', 'EUR (€)']} defaultValue="INR (₹)" /></Field>
              <Field label="Academic year"><Select options={['2025–26', '2026–27']} defaultValue="2026–27" /></Field>
              <div className="sm:col-span-2"><Field label="Address"><Textarea defaultValue="12 MG Road, Bengaluru, Karnataka" /></Field></div>
              <div className="sm:col-span-2 border-t border-[#E7EAF0] pt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Fee Receipt Terms &amp; Conditions (one clause per line)</span>
                  <button
                    type="button"
                    onClick={() => setTermsText(DEFAULT_TERMS.join('\n'))}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Reset defaults
                  </button>
                </div>
                <Textarea
                  rows={5}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  placeholder="Enter one term/condition per line"
                />
              </div>
              <div className="sm:col-span-2"><Button type="submit" disabled={savingSettings} icon={<Save size={16} />}>{savingSettings ? 'Saving…' : 'Save changes'}</Button></div>
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
