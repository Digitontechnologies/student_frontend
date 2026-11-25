import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search, SearchX } from 'lucide-react'
import { Card } from './Card'
import { Input, Select } from './Field'

export type Column<T> = {
  key: string
  header: string
  render?: (row: T) => ReactNode
}
export type FilterDef = { key: string; label: string; options: string[] }

export function DataTable<T extends Record<string, any>>({
  columns, rows, searchKeys, filters = [], pageSize = 8, actions, toolbar,
}: {
  columns: Column<T>[]
  rows: T[]
  searchKeys: string[]
  filters?: FilterDef[]
  pageSize?: number
  actions?: (row: T) => ReactNode
  toolbar?: ReactNode
}) {
  const [q, setQ] = useState('')
  const [fv, setFv] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!s || searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(s))) &&
        filters.every((f) => !fv[f.key] || String(r[f.key]) === fv[f.key]),
    )
  }, [rows, q, fv, searchKeys, filters])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const cur = Math.min(page, pages)
  const view = filtered.slice((cur - 1) * pageSize, cur * pageSize)
  const cell = (c: Column<T>, r: T) => (c.render ? c.render(r) : String(r[c.key] ?? '—'))

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {filters.map((f) => (
            <Select
              key={f.key}
              aria-label={f.label}
              placeholder={`All ${f.label}`}
              options={f.options}
              value={fv[f.key] ?? ''}
              onChange={(e) => { setFv({ ...fv, [f.key]: e.target.value }); setPage(1) }}
              className="sm:w-40"
            />
          ))}
        </div>
        {toolbar}
      </div>

      {/* Desktop table */}
      <div className="scroll-thin hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-5 py-3 font-medium">{c.header}</th>)}
              {actions && <th className="px-5 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {view.map((r, i) => (
              <tr key={r.id ?? i} className="hover:bg-slate-50/60">
                {columns.map((c) => <td key={c.key} className="whitespace-nowrap px-5 py-3.5 text-slate-700">{cell(c, r)}</td>)}
                {actions && <td className="px-5 py-3.5"><div className="flex justify-end gap-1">{actions(r)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {view.map((r, i) => (
          <div key={r.id ?? i} className="space-y-2 p-4">
            {columns.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-xs text-slate-500">{c.header}</span>
                <span className="text-right text-slate-800">{cell(c, r)}</span>
              </div>
            ))}
            {actions && <div className="flex justify-end gap-1 pt-1">{actions(r)}</div>}
          </div>
        ))}
      </div>

      {view.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-14 text-slate-400">
          <SearchX size={28} /><p className="text-sm">No records found</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm text-slate-500">
        <span>
          {filtered.length === 0 ? 0 : (cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <button disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="rounded-lg border border-slate-200 p-1.5 enabled:hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronLeft size={16} /></button>
          <span className="px-1">Page {cur} / {pages}</span>
          <button disabled={cur >= pages} onClick={() => setPage(cur + 1)} className="rounded-lg border border-slate-200 p-1.5 enabled:hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronRight size={16} /></button>
        </div>
      </div>
    </Card>
  )
}
