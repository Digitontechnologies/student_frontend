import { cn } from '../../lib/utils'

const tones: Record<string, string> = {
  green: 'bg-brand-50 text-brand-700',
  red: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-accent-50 text-accent-600',
  purple: 'bg-violet-50 text-violet-700',
  gray: 'bg-slate-100 text-slate-600',
}

const auto: Record<string, string> = {
  active: 'green', paid: 'green', present: 'green', completed: 'green', converted: 'green', issued: 'green',
  approved: 'green', published: 'green', passed: 'green',
  pending: 'amber', partial: 'amber', 'partially paid': 'amber', upcoming: 'amber', 'follow-up': 'amber', late: 'amber', leave: 'amber', 'on leave': 'amber',
  ongoing: 'blue', new: 'blue', scheduled: 'blue', interested: 'blue', contacted: 'purple',
  inactive: 'gray', draft: 'gray', 'half day': 'purple',
  overdue: 'red', absent: 'red', lost: 'red', failed: 'red', rejected: 'red', cancelled: 'red',
}

export function Badge({ children, tone }: { children: string; tone?: keyof typeof tones }) {
  const t = tone ?? auto[String(children).toLowerCase()] ?? 'gray'
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', tones[t])}>{children}</span>
}
