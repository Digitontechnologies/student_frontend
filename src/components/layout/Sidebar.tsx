import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { navGroups } from '../../config/nav'
import { cn } from '../../lib/utils'

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#E7EAF0] bg-white transition-transform lg:translate-x-0 no-print',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#E7EAF0] px-5">
          <img src="/digiton-logo.png" alt="Digiton Technologies" className="h-9 w-auto max-w-[175px] object-contain" />
          <button className="lg:hidden cursor-pointer text-slate-500 hover:text-slate-800" onClick={onClose}><X size={20} /></button>
        </div>
        <nav className="scroll-thin flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {navGroups.map((g) => (
            <div key={g.title}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.title}</p>
              {g.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
