import { courses, students as mockStudents } from '../data/mock'
import { today } from './utils'
import type {
  AttendanceRecord, AttendanceStatus, FormErrors, Payment, PaymentMethod, Student, StudentFormValues,
} from '../types/student'

const STORAGE_KEY = 'institutepro.students.v1'

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Bank Transfer']

/* ---------- fee calculations ---------- */
export const calcNet = (s: Pick<Student, 'totalFees' | 'discount'>) => Math.max(0, s.totalFees - s.discount)
export const calcPaid = (s: Pick<Student, 'payments'>) => s.payments.reduce((a, p) => a + p.amount, 0)
export const calcPending = (s: Student) => Math.max(0, calcNet(s) - calcPaid(s))

export function attendanceSummary(records: AttendanceRecord[]) {
  const count = (st: AttendanceStatus) => records.filter((r) => r.status === st).length
  const attended = count('Present') + count('Late')
  return {
    total: records.length,
    present: count('Present'),
    absent: count('Absent'),
    late: count('Late'),
    leave: count('Leave'),
    percent: records.length ? Math.round((attended / records.length) * 100) : 0,
  }
}

/* ---------- ids ---------- */
export function nextStudentId(list: Student[]) {
  const max = list.reduce((m, s) => Math.max(m, Number(s.id.replace(/\D/g, '')) || 0), 1000)
  return `STU-${max + 1}`
}
export const newPaymentId = () => `PAY-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`

/* ---------- seed data ---------- */
const FEMALE = ['Diya', 'Ananya', 'Kavya', 'Meera', 'Sneha', 'Priya', 'Neha', 'Pooja', 'Riya']
const hash = (i: number, k: number) => Math.abs(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1

function buildSeed(): Student[] {
  return mockStudents.map((m, i): Student => {
    const first = m.name.split(' ')[0]
    const last = m.name.split(' ')[1]
    const totalFees = courses.find((c) => c.name === m.course)?.fee ?? 25000
    const discount = [0, 0, 2000, 5000][Math.floor(hash(i, 1) * 4)]
    const net = totalFees - discount
    const frac = [1, 1, 0.5, 0.25, 0][Math.floor(hash(i, 2) * 5)]
    const paidTotal = Math.round((net * frac) / 100) * 100
    const payments: Payment[] = []
    if (paidTotal > 0) {
      const first = frac === 1 ? Math.round((paidTotal * 0.6) / 100) * 100 : paidTotal
      payments.push({ id: `PAY-S${i}A`, date: m.admissionDate, amount: first, method: PAYMENT_METHODS[Math.floor(hash(i, 3) * 4)], note: 'Initial payment' })
      if (paidTotal - first > 0) {
        const d = new Date(m.admissionDate); d.setDate(d.getDate() + 30)
        payments.push({ id: `PAY-S${i}B`, date: d.toISOString().slice(0, 10), amount: paidTotal - first, method: 'UPI', note: 'Installment' })
      }
    }
    const attendance: AttendanceRecord[] = []
    const d = new Date()
    while (attendance.length < 20) {
      d.setDate(d.getDate() - 1)
      if (d.getDay() === 0 || d.getDay() === 6) continue
      const r = hash(i, attendance.length + 10)
      attendance.push({ date: d.toISOString().slice(0, 10), status: r < 0.78 ? 'Present' : r < 0.88 ? 'Late' : r < 0.96 ? 'Absent' : 'Leave' })
    }
    const year = 1996 + Math.floor(hash(i, 4) * 10)
    return {
      id: m.id, name: m.name, dob: `${year}-0${1 + Math.floor(hash(i, 5) * 9)}-1${Math.floor(hash(i, 6) * 9)}`,
      gender: FEMALE.includes(first) ? 'Female' : 'Male', phone: m.phone, whatsapp: m.phone, email: m.email,
      address: m.address, parentName: `Mr. ${last}`, parentPhone: `99${Math.floor(10000000 + hash(i, 7) * 89999999)}`,
      course: m.course, batch: m.batch, admissionDate: m.admissionDate, totalFees, discount,
      status: m.status === 'Active' ? 'Active' : 'Inactive', payments, attendance,
    }
  })
}

/* ---------- localStorage ---------- */
export function saveStudents(list: Student[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* quota / private mode */ }
}

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as Student[]
    }
  } catch { /* fall through to seed */ }
  const seed = buildSeed()
  saveStudents(seed)
  return seed
}

/* ---------- form helpers ---------- */
export const emptyForm = (): StudentFormValues => ({
  name: '', dob: '', gender: '', phone: '', whatsapp: '', email: '', address: '', parentName: '', parentPhone: '',
  course: '', batch: '', admissionDate: today(), totalFees: '', discount: '0', initialPayment: '0',
  paymentMethod: 'Cash', status: 'Active', photo: '',
})

export const studentToForm = (s: Student): StudentFormValues => ({
  name: s.name, dob: s.dob, gender: s.gender, phone: s.phone, whatsapp: s.whatsapp, email: s.email, address: s.address,
  parentName: s.parentName, parentPhone: s.parentPhone, course: s.course, batch: s.batch, admissionDate: s.admissionDate,
  totalFees: String(s.totalFees), discount: String(s.discount), initialPayment: '0', paymentMethod: 'Cash',
  status: s.status, photo: s.photo ?? '',
})

const digits = (v: string) => v.replace(/\D/g, '')

export function validateStudent(v: StudentFormValues, isEdit: boolean): FormErrors {
  const e: FormErrors = {}
  if (!v.name.trim()) e.name = 'Full name is required'
  else if (v.name.trim().length < 3) e.name = 'Enter at least 3 characters'
  if (!v.dob) e.dob = 'Date of birth is required'
  else if (v.dob > today()) e.dob = 'Date of birth cannot be in the future'
  if (!v.gender) e.gender = 'Select a gender'
  if (!v.phone.trim()) e.phone = 'Phone number is required'
  else if (digits(v.phone).length < 10 || digits(v.phone).length > 13) e.phone = 'Enter a valid phone number (10–13 digits)'
  if (v.whatsapp.trim() && (digits(v.whatsapp).length < 10 || digits(v.whatsapp).length > 13)) e.whatsapp = 'Enter a valid WhatsApp number'
  if (!v.email.trim()) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Enter a valid email address'
  if (!v.address.trim()) e.address = 'Address is required'
  if (!v.parentName.trim()) e.parentName = 'Parent name is required'
  if (!v.parentPhone.trim()) e.parentPhone = 'Parent contact is required'
  else if (digits(v.parentPhone).length < 10 || digits(v.parentPhone).length > 13) e.parentPhone = 'Enter a valid contact number'
  if (!v.course) e.course = 'Select a course'
  if (!v.batch) e.batch = 'Select a batch'
  if (!v.admissionDate) e.admissionDate = 'Admission date is required'

  const total = Number(v.totalFees), discount = Number(v.discount || 0), initial = Number(v.initialPayment || 0)
  if (v.totalFees === '' || isNaN(total) || total <= 0) e.totalFees = 'Enter total fees greater than 0'
  if (isNaN(discount) || discount < 0) e.discount = 'Discount cannot be negative'
  else if (!e.totalFees && discount > total) e.discount = 'Discount cannot exceed total fees'
  if (!isEdit) {
    if (isNaN(initial) || initial < 0) e.initialPayment = 'Payment cannot be negative'
    else if (!e.totalFees && !e.discount && initial > total - discount) e.initialPayment = 'Payment cannot exceed net fees'
  }
  return e
}

/** Convert validated form values into a Student (without payments/attendance). */
export function formToStudentFields(v: StudentFormValues) {
  return {
    name: v.name.trim(), dob: v.dob, gender: v.gender as Student['gender'], phone: v.phone.trim(),
    whatsapp: v.whatsapp.trim() || v.phone.trim(), email: v.email.trim(), address: v.address.trim(),
    parentName: v.parentName.trim(), parentPhone: v.parentPhone.trim(), course: v.course, batch: v.batch,
    admissionDate: v.admissionDate, totalFees: Number(v.totalFees), discount: Number(v.discount || 0),
    status: v.status, photo: v.photo || undefined,
  }
}

/** Downscale an uploaded image so it fits comfortably in localStorage. */
export function fileToAvatar(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Invalid image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')!
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
