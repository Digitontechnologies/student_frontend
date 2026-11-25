export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const money = (n: number) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const uid = (p = 'ID') => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

export const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export const today = () => new Date().toISOString().slice(0, 10)

export const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
