import { useEffect, useState, type ReactNode } from 'react'
import { Eye, Loader2, Pencil, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { DataTable, type Column, type FilterDef } from './DataTable'
import { Field, Input, Select, Textarea } from './Field'
import { Modal } from './Modal'
import { PageHeader } from './PageHeader'
import { useToast } from './Toast'
import { uid } from '../../lib/utils'
import { useApi } from '../../hooks/useApi'

export type FormField = {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'email' | 'tel' | 'select' | 'textarea'
  options?: string[]
  required?: boolean
  full?: boolean
  helper?: ReactNode | ((form: Record<string, any>) => ReactNode)
}

type Row = Record<string, any> & { id: string }

export function CrudPage<T extends Row>({
  title, subtitle, entity, idPrefix, initial, columns, fields, filters, searchKeys,
  stats, headerExtra, rowActions, viewRender, defaults, onSaved, apiPath,
  onOpenNew, onFormChange,
}: {
  title: string
  subtitle: string
  entity: string
  idPrefix: string
  initial: T[]
  columns: Column<T>[]
  fields: FormField[]
  filters?: FilterDef[]
  searchKeys: string[]
  stats?: (rows: T[]) => ReactNode
  headerExtra?: ReactNode
  rowActions?: (row: T, helpers: { update: (r: T) => void; refetch: () => void }) => ReactNode
  viewRender?: (row: T) => ReactNode
  defaults?: Partial<T>
  onSaved?: (row: T) => T
  /** If provided, CRUD operations use the backend API at this path (e.g. '/students'). */
  apiPath?: string
  /** Hook to customize or pre-fetch defaults when opening Add modal */
  onOpenNew?: (defaultValues: Record<string, any>) => Record<string, any>
  /** Hook to react when any field in the form changes (e.g. student selection auto-fills course & fees) */
  onFormChange?: (fieldName: string, value: any, currentForm: Record<string, any>) => Record<string, any> | void
}) {
  const toast = useToast()

  // ── API mode state ────────────────────────────────────────────────────────
  const isApi = Boolean(apiPath)
  const apiHook = useApi<T>(apiPath || '')
  const apiLoading = isApi && apiHook.loading
  const apiError = isApi ? apiHook.error : null

  // Local state — seeded from API data or from initial prop
  const [localRows, setLocalRows] = useState<T[]>(initial)
  const rows = isApi ? apiHook.data : localRows

  // Keep local rows in sync when initial changes (non-API mode)
  useEffect(() => {
    if (!isApi) setLocalRows(initial)
  }, [initial, isApi])

  const [editing, setEditing] = useState<T | null>(null)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<T | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  const openNew = () => {
    let f: Record<string, any> = { ...defaults }
    fields.forEach((x) => { if (f[x.name] === undefined) f[x.name] = x.type === 'select' ? x.options?.[0] ?? '' : '' })
    if (onOpenNew) {
      f = { ...f, ...onOpenNew(f) }
    }
    setForm(f); setEditing(null); setCreating(true)
  }
  const openEdit = (r: T) => {
    const f: Record<string, any> = { ...r }
    fields.forEach((x) => {
      if (x.type === 'select' && !f[x.name] && x.options?.[0]) f[x.name] = x.options[0]
    })
    setForm(f); setEditing(r); setCreating(true)
  }
  const close = () => { setCreating(false); setEditing(null); setSaving(false) }

  const handleFieldChange = (name: string, val: any) => {
    let next = { ...form, [name]: val }
    if (onFormChange) {
      const updates = onFormChange(name, val, next)
      if (updates) next = { ...next, ...updates }
    }
    setForm(next)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form } as Record<string, any>
    fields.forEach((f) => { if (f.type === 'number') data[f.name] = Number(data[f.name] || 0) })

    if (isApi) {
      setSaving(true)
      try {
        if (editing) {
          await apiHook!.update(editing.id, data as Partial<T>)
          toast(`${entity} updated`)
        } else {
          await apiHook!.create(data as Partial<T>)
          toast(`${entity} added`)
        }
        close()
      } catch (err: any) {
        toast(err.message || 'Save failed')
        setSaving(false)
      }
    } else {
      if (editing) {
        let next = { ...editing, ...data } as T
        if (onSaved) next = onSaved(next)
        setLocalRows(localRows.map((r) => (r.id === editing.id ? next : r)))
        toast(`${entity} updated`)
      } else {
        let next = { ...data, id: uid(idPrefix) } as T
        if (onSaved) next = onSaved(next)
        setLocalRows([next, ...localRows])
        toast(`${entity} added`)
      }
      close()
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    if (isApi) {
      try {
        await apiHook!.remove(deleting.id)
        toast(`${entity} deleted`)
      } catch (err: any) {
        toast(err.message || 'Delete failed')
      }
    } else {
      setLocalRows(localRows.filter((r) => r.id !== deleting.id))
      toast(`${entity} deleted`)
    }
    setDeleting(null)
  }

  const update = isApi
    ? (r: T) => { apiHook!.update(r.id, r as Partial<T>).then(() => toast(`${entity} updated`)) }
    : (r: T) => setLocalRows((rs) => rs.map((x) => (x.id === r.id ? r : x)))

  // ── Loading / Error states ──────────────────────────────────────────────
  if (isApi && apiLoading && rows.length === 0) {
    return (
      <>
        <PageHeader title={title} subtitle={subtitle} />
        <div className="flex items-center justify-center gap-3 py-24 text-slate-400">
          <Loader2 className="animate-spin" size={20} /> Loading {entity.toLowerCase()}s…
        </div>
      </>
    )
  }

  if (isApi && apiError && rows.length === 0) {
    return (
      <>
        <PageHeader title={title} subtitle={subtitle} />
        <div className="flex flex-col items-center gap-3 py-24 text-slate-500">
          <AlertTriangle size={28} className="text-amber-500" />
          <p className="text-sm">{apiError}</p>
          <Button variant="secondary" onClick={() => apiHook!.refetch()}>Retry</Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<>{headerExtra}<Button icon={<Plus size={16} />} onClick={openNew}>Add {entity}</Button></>}
      />
      {stats && <div className="mb-6">{stats(rows)}</div>}
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={searchKeys}
        filters={filters}
        actions={(r) => (
          <>
            {rowActions?.(r, { update, refetch: () => apiHook?.refetch() })}
            {viewRender && <Button size="sm" variant="ghost" aria-label="View" onClick={() => setViewing(r)}><Eye size={15} /></Button>}
            <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => openEdit(r)}><Pencil size={15} /></Button>
            <Button size="sm" variant="ghost" aria-label="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleting(r)}><Trash2 size={15} /></Button>
          </>
        )}
      />

      <Modal open={creating} onClose={close} title={`${editing ? 'Edit' : 'Add'} ${entity}`}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <Field label={f.label + (f.required ? ' *' : '')}>
                {f.type === 'select' ? (
                  <Select options={f.options ?? []} required={f.required} value={form[f.name] ?? ''} onChange={(e) => handleFieldChange(f.name, e.target.value)} />
                ) : f.type === 'textarea' ? (
                  <Textarea required={f.required} value={form[f.name] ?? ''} onChange={(e) => handleFieldChange(f.name, e.target.value)} />
                ) : (
                  <Input type={f.type ?? 'text'} required={f.required} value={form[f.name] ?? ''} onChange={(e) => handleFieldChange(f.name, e.target.value)} />
                )}
                {f.helper && (
                  <div className="mt-1 text-xs text-slate-500">
                    {typeof f.helper === 'function' ? f.helper(form) : f.helper}
                  </div>
                )}
              </Field>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin mr-1" /> Saving…</> : editing ? 'Save changes' : `Add ${entity}`}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`${entity} details`} wide>
        {viewing && viewRender?.(viewing)}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={`Delete ${entity}`}>
        <p className="text-sm text-slate-600">Are you sure you want to delete <b>{deleting?.id}</b>? This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  )
}

export function Detail({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">{k}</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-800">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
