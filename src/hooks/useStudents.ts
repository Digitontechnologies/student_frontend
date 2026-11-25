import { useCallback, useEffect, useState } from 'react'
import { formToStudentFields, newPaymentId } from '../lib/students'
import { api } from '../lib/api'
import type { Payment, Student, StudentFormValues } from '../types/student'

/** Student state backed directly by the Neon PostgreSQL API. */
export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<any[]>('/students')
      .then(async (rows) => {
        const enriched: Student[] = await Promise.all(
          rows.map(async (s) => {
            let payments: Payment[] = []
            let attendance: { date: string; status: string }[] = []
            try { payments = await api.get<Payment[]>(`/students/${s.id}/payments`) } catch { /* empty */ }
            try { attendance = await api.get<{ date: string; status: string }[]>(`/students/${s.id}/attendance`) } catch { /* empty */ }
            return {
              id: s.id,
              name: s.name,
              dob: s.dob || '',
              gender: s.gender || 'Male',
              phone: s.phone || '',
              whatsapp: s.whatsapp || s.phone || '',
              email: s.email || '',
              address: s.address || '',
              parentName: s.parentName || '',
              parentPhone: s.parentPhone || '',
              course: s.course || '',
              batch: s.batch || '',
              admissionDate: s.admissionDate || '',
              totalFees: Number(s.totalFees || 0),
              discount: Number(s.discount || 0),
              status: s.status || 'Active',
              photo: s.photo,
              payments,
              attendance: attendance.map((a) => ({ date: a.date, status: a.status as any })),
            } as Student
          }),
        )
        setStudents(enriched)
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [])

  const addStudent = useCallback(async (v: StudentFormValues): Promise<Student> => {
    const initial = Number(v.initialPayment || 0)
    const body = {
      name: v.name.trim(),
      dob: v.dob,
      gender: v.gender,
      phone: v.phone.trim(),
      whatsapp: v.whatsapp.trim() || v.phone.trim(),
      email: v.email.trim(),
      address: v.address.trim(),
      parentName: v.parentName.trim(),
      parentPhone: v.parentPhone.trim(),
      course: v.course,
      batch: v.batch,
      admissionDate: v.admissionDate,
      totalFees: Number(v.totalFees),
      discount: Number(v.discount || 0),
      status: v.status,
      photo: v.photo || undefined,
      initialPayment: initial,
      paymentMethod: v.paymentMethod,
    }

    const result = await api.post<{ id: string }>('/students', body)
    const student: Student = {
      ...formToStudentFields(v),
      id: result.id,
      payments: initial > 0
        ? [{ id: newPaymentId(), date: v.admissionDate, amount: initial, method: v.paymentMethod, note: 'Initial payment' }]
        : [],
      attendance: [],
    }
    setStudents((prev) => [student, ...prev])
    return student
  }, [])

  const updateStudent = useCallback(async (id: string, v: StudentFormValues) => {
    await api.put(`/students/${encodeURIComponent(id)}`, {
      name: v.name.trim(),
      dob: v.dob,
      gender: v.gender,
      phone: v.phone.trim(),
      whatsapp: v.whatsapp.trim() || v.phone.trim(),
      email: v.email.trim(),
      address: v.address.trim(),
      parentName: v.parentName.trim(),
      parentPhone: v.parentPhone.trim(),
      status: v.status,
      photo: v.photo || undefined,
    })
    const fields = formToStudentFields(v)
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)))
  }, [])

  const deleteStudent = useCallback(async (id: string) => {
    await api.del(`/students/${encodeURIComponent(id)}`)
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addPayment = useCallback(async (id: string, p: Omit<Payment, 'id'>) => {
    const res = await api.post<{ id: string }>(`/students/${encodeURIComponent(id)}/payments`, {
      date: p.date,
      amount: p.amount,
      method: p.method,
      note: p.note,
    })
    const payment: Payment = { ...p, id: res.id || newPaymentId() }
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, payments: [...s.payments, payment] } : s)))
  }, [])

  return { students, loading, addStudent, updateStudent, deleteStudent, addPayment }
}
