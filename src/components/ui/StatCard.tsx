import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from './Card'
import { cn } from '../../lib/utils'

const tones = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-violet-50 text-violet-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
}

export function StatCard({ label, value, icon: Icon, tone = 'blue', trend }: {
  label: string; value: string | number; icon: LucideIcon; tone?: keyof typeof tones; trend?: number
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className={cn('grid h-11 w-11 place-items-center rounded-xl', tones[tone])}><Icon size={20} /></div>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Card>
  )
}
