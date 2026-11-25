import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: ReactNode
}

const variants = {
  primary: 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-sm shadow-brand-500/30 hover:opacity-90',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

export function Button({ variant = 'primary', size = 'md', icon, className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 cursor-pointer',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
