import { initials } from '../../lib/utils'

const colors = ['from-blue-500 to-indigo-500', 'from-violet-500 to-fuchsia-500', 'from-sky-500 to-blue-600', 'from-purple-500 to-indigo-600']

export function Avatar({ name, size = 36, src }: { name: string; size?: number; src?: string }) {
  const c = colors[name.length % colors.length]
  if (src) return <img src={src} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  return (
    <div style={{ width: size, height: size }} className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${c} text-xs font-semibold text-white`}>
      {initials(name)}
    </div>
  )
}
