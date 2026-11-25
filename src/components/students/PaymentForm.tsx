import { useState } from 'react'
import { Button } from '../ui/Button'
import { Field, Input, Select } from '../ui/Field'
import { PAYMENT_METHODS } from '../../lib/students'
import { money, today } from '../../lib/utils'
import type { Payment, PaymentMethod } from '../../types/student'

export function PaymentForm({ pending, onSubmit, onCancel }: {
  pending: number
  onSubmit: (p: Omit<Payment, 'id'>) => void
  onCancel: () => void
}) {
  const [amount, setAmount] = useState(String(pending || ''))
  const [date, setDate] = useState(today())
  const [method, setMethod] = useState<PaymentMethod>('Cash')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) return setError('Enter an amount greater than 0')
    if (n > pending) return setError(`Amount cannot exceed pending fees (${money(pending)})`)
    if (!date) return setError('Select a date')
    onSubmit({ amount: n, date, method, note: note.trim() || undefined })
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <p className="text-sm text-slate-600 sm:col-span-2">Pending fees: <b className="text-rose-600">{money(pending)}</b></p>
      <Field label="Amount (₹) *" error={error}><Input type="number" min={0} value={amount} onChange={(e) => { setAmount(e.target.value); setError('') }} /></Field>
      <Field label="Date *"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Method"><Select options={PAYMENT_METHODS} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} /></Field>
      <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Record payment</Button>
      </div>
    </form>
  )
}
