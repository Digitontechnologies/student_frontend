export type Gender = 'Male' | 'Female' | 'Other'
export type StudentStatus = 'Active' | 'Inactive'
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer'
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave'

export interface Payment {
  id: string
  date: string
  amount: number
  method: PaymentMethod
  note?: string
  referenceNo?: string
  receiptNo?: string
}

export interface AttendanceRecord {
  date: string
  status: AttendanceStatus
}

export interface Student {
  id: string
  name: string
  dob: string
  gender: Gender
  phone: string
  whatsapp: string
  email: string
  address: string
  parentName: string
  parentPhone: string
  course: string
  batch: string
  admissionDate: string
  totalFees: number
  discount: number
  paid?: number
  remainingFees?: number
  status: StudentStatus
  photo?: string
  payments: Payment[]
  attendance: AttendanceRecord[]
}

/** Form state: everything is a string so inputs stay controlled. */
export interface StudentFormValues {
  name: string
  dob: string
  gender: Gender | ''
  phone: string
  whatsapp: string
  email: string
  address: string
  parentName: string
  parentPhone: string
  course: string
  batch: string
  admissionDate: string
  totalFees: string
  discount: string
  initialPayment: string
  paymentMethod: PaymentMethod
  status: StudentStatus
  photo: string
}

export type FormErrors = Partial<Record<keyof StudentFormValues, string>>

/** Student plus derived fee figures, used by the list table. */
export interface StudentRow extends Student {
  netFees: number
  paid: number
  pending: number
}
