import { useEffect, useState } from 'react'
import { Bell, CheckCheck, ClipboardCheck, Loader2, Megaphone, Wallet } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import type { NotificationItem } from '../data/mock'
import { cn } from '../lib/utils'
import { api } from '../lib/api'

const icons = { fee: Wallet, enquiry: Megaphone, exam: ClipboardCheck, system: Bell }

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    api.get<NotificationItem[]>('/notifications')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const markRead = (id: string) => {
    setItems(items.map((n) => (n.id === id ? { ...n, read: true } : n)))
    api.put(`/notifications/${id}/read`, {}).catch(() => {})
  }

  const markAllRead = () => {
    setItems(items.map((n) => ({ ...n, read: true })))
    api.put('/notifications/mark-all-read', {}).catch(() => {})
  }

  const list = items.filter((n) => tab === 'all' || !n.read)

  if (loading) {
    return (
      <>
        <PageHeader title="Notifications" subtitle="Stay on top of what matters" />
        <div className="flex justify-center py-24 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Stay on top of what matters"
        actions={<Button variant="secondary" icon={<CheckCheck size={16} />} onClick={markAllRead}>Mark all read</Button>} />
      <div className="mb-4 flex gap-2">
        {(['all', 'unread'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('rounded-xl px-4 py-2 text-sm font-medium capitalize cursor-pointer', tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200')}>{t}</button>
        ))}
      </div>
      <Card>
        <ul className="divide-y divide-slate-100">
          {list.map((n) => {
            const Icon = icons[n.type] || Bell
            return (
              <li key={n.id} className={cn('flex items-start gap-4 p-4', !n.read && 'bg-brand-50/40')}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Icon size={18} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{n.time}</p>
                </div>
                {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>}
              </li>
            )
          })}
          {list.length === 0 && <li className="p-12 text-center text-sm text-slate-400">You're all caught up 🎉</li>}
        </ul>
      </Card>
    </>
  )
}
