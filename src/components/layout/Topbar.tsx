import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { allNav } from '../../config/nav'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [q, setQ] = useState('')
  const [unread, setUnread] = useState(0)
  const nav = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    api.get<{ read: boolean }[]>('/notifications')
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => {})
  }, [])

  const go = (e: React.FormEvent) => {
    e.preventDefault()
    const m = allNav.find((n) => n.label.toLowerCase().includes(q.trim().toLowerCase()))
    if (m && q.trim()) { nav(m.to); setQ('') }
  }

  const displayName = user?.fullName || 'User'
  const primaryRole = user?.roles?.[0]
    ? user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1)
    : 'Member'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-100 bg-white/80 px-4 backdrop-blur lg:px-8 no-print">
      <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden cursor-pointer" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <form onSubmit={go} className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          list="pages"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump to a page…"
          className="w-full rounded-xl border border-[#E7EAF0] bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-50"
        />
        <datalist id="pages">{allNav.map((n) => <option key={n.to} value={n.label} />)}</datalist>
      </form>
      <div className="ml-auto flex items-center gap-3">
        <Link to="/notifications" className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
          <Bell size={20} />
          {unread > 0 && <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unread}</span>}
        </Link>
        <Link to="/settings" className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100">
          <Avatar name={displayName} />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-500">{primaryRole}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={async () => { await logout(); nav('/login', { replace: true }) }}
          className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
