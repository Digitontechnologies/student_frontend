import { money } from '../../lib/utils'

/** Net / paid / pending breakdown with a progress bar. */
export function FeeSummary({ total, discount, paid }: { total: number; discount: number; paid: number }) {
  const net = Math.max(0, total - discount)
  const pending = Math.max(0, net - paid)
  const pct = net > 0 ? Math.min(100, Math.round((paid / net) * 100)) : 0
  const items: [string, string, string][] = [
    ['Total fees', money(total), 'text-slate-900'],
    ['Discount', `− ${money(discount)}`, 'text-violet-600'],
    ['Net payable', money(net), 'text-slate-900'],
    ['Paid', money(paid), 'text-emerald-600'],
    ['Pending', money(pending), pending > 0 ? 'text-rose-600' : 'text-emerald-600'],
  ]
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(([k, v, c]) => (
          <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className={`text-sm font-semibold ${c}`}>{v}</dd></div>
        ))}
      </dl>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-slate-500">{pct}% paid</p>
    </div>
  )
}
