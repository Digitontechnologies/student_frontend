// Sample data for UI demonstration only (no backend).
let seed = 7
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]
const date = (back: number) => new Date(Date.now() - Math.floor(rnd() * back) * 86400000).toISOString().slice(0, 10)

export const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Diya', 'Ananya', 'Ishaan', 'Kavya', 'Rohan', 'Meera', 'Arjun', 'Sneha', 'Karan', 'Priya', 'Rahul', 'Neha', 'Siddharth', 'Pooja', 'Varun', 'Riya', 'Nikhil']
export const lastNames = ['Sharma', 'Patel', 'Verma', 'Reddy', 'Iyer', 'Khan', 'Singh', 'Nair', 'Gupta', 'Mehta']
const fullName = () => `${pick(firstNames)} ${pick(lastNames)}`

export const courseNames = ['Full Stack Development', 'Data Science', 'Digital Marketing', 'UI/UX Design', 'Cyber Security', 'Cloud Computing']
export const batchNames = ['FSD-Morning', 'DS-Evening', 'DM-Weekend', 'UX-Morning', 'CS-Evening', 'CC-Weekend']

export type Student = { id: string; name: string; email: string; phone: string; course: string; batch: string; admissionDate: string; status: string; address: string }
export const students: Student[] = Array.from({ length: 34 }, (_, i) => {
  const n = fullName()
  const ci = Math.floor(rnd() * courseNames.length)
  return {
    id: `STU-${1001 + i}`, name: n, email: `${n.split(' ')[0].toLowerCase()}${i}@mail.com`,
    phone: `98${Math.floor(10000000 + rnd() * 89999999)}`, course: courseNames[ci], batch: batchNames[ci],
    admissionDate: date(300), status: pick(['Active', 'Active', 'Active', 'Inactive', 'Completed']), address: `${Math.floor(rnd() * 99)}, MG Road, Bengaluru`,
  }
})

export type Staff = { id: string; name: string; email: string; phone: string; role: string; department: string; salary: number; joinDate: string; status: string }
export const staff: Staff[] = Array.from({ length: 14 }, (_, i) => {
  const n = fullName()
  return {
    id: `STF-${201 + i}`, name: n, email: `${n.split(' ')[0].toLowerCase()}.staff${i}@institute.com`,
    phone: `97${Math.floor(10000000 + rnd() * 89999999)}`, role: pick(['Instructor', 'Instructor', 'Counsellor', 'Accountant', 'Receptionist', 'Lab Assistant']),
    department: pick(['Technology', 'Design', 'Marketing', 'Administration']), salary: 25000 + Math.floor(rnd() * 40) * 1000, joinDate: date(1200), status: pick(['Active', 'Active', 'Active', 'On Leave']),
  }
})

export type Course = { id: string; name: string; duration: string; fee: number; instructor: string; seats: number; status: string; description: string }
export const courses: Course[] = courseNames.map((name, i) => ({
  id: `CRS-${i + 1}`, name, duration: pick(['3 Months', '4 Months', '6 Months']), fee: 20000 + i * 5000,
  instructor: staff[i].name, seats: 30 + i * 5, status: 'Active', description: `Professional ${name} program with hands-on projects.`,
}))

export type Batch = { id: string; name: string; course: string; timing: string; startDate: string; capacity: number; enrolled: number; status: string }
export const batches: Batch[] = batchNames.map((name, i) => ({
  id: `BAT-${i + 1}`, name, course: courseNames[i], timing: pick(['09:00 – 11:00', '17:00 – 19:00', '10:00 – 13:00']),
  startDate: date(200), capacity: 30, enrolled: students.filter((s) => s.batch === name).length, status: pick(['Ongoing', 'Ongoing', 'Upcoming']),
}))

export type Fee = { id: string; student: string; course: string; total: number; paid: number; due: number; dueDate: string; status: string }
export const fees: Fee[] = students.slice(0, 24).map((s, i) => {
  const total = courses.find((c) => c.name === s.course)!.fee
  const paid = pick([total, total, Math.round(total / 2), Math.round(total / 4), 0])
  return { id: `FEE-${3001 + i}`, student: s.name, course: s.course, total, paid, due: total - paid, dueDate: date(30), status: paid === total ? 'Paid' : paid === 0 ? 'Overdue' : 'Partial' }
})

export type Invoice = { id: string; student: string; description: string; amount: number; tax: number; issueDate: string; status: string }
export const invoices: Invoice[] = students.slice(0, 18).map((s, i) => ({
  id: `INV-${5001 + i}`, student: s.name, description: `${s.course} – tuition`, amount: 5000 + Math.floor(rnd() * 20) * 1000, tax: 18, issueDate: date(60), status: pick(['Paid', 'Paid', 'Pending', 'Overdue']),
}))

export type Receipt = { id: string; student: string; invoice: string; amount: number; method: string; date: string; status: string }
export const receipts: Receipt[] = invoices.filter((x) => x.status === 'Paid').map((inv, i) => ({
  id: `RCP-${7001 + i}`, student: inv.student, invoice: inv.id, amount: Math.round(inv.amount * 1.18), method: pick(['Cash', 'UPI', 'Card', 'Bank Transfer']), date: inv.issueDate, status: 'Issued',
}))

export type Exam = { id: string; title: string; course: string; date: string; maxMarks: number; passMarks: number; duration: string; status: string }
export const exams: Exam[] = courseNames.flatMap((c, i) => [
  { id: `EXM-${i * 2 + 1}`, title: `${c} – Mid Term`, course: c, date: date(90), maxMarks: 100, passMarks: 40, duration: '2 hrs', status: 'Completed' },
  { id: `EXM-${i * 2 + 2}`, title: `${c} – Final`, course: c, date: new Date(Date.now() + (10 + i * 3) * 86400000).toISOString().slice(0, 10), maxMarks: 100, passMarks: 40, duration: '3 hrs', status: 'Scheduled' },
])

export type Certificate = { id: string; student: string; course: string; grade: string; issueDate: string; status: string }
export const certificates: Certificate[] = students.filter((s) => s.status === 'Completed').slice(0, 8).map((s, i) => ({
  id: `CERT-${9001 + i}`, student: s.name, course: s.course, grade: pick(['A+', 'A', 'B+', 'B']), issueDate: date(60), status: pick(['Issued', 'Issued', 'Pending']),
}))

export type Enquiry = { id: string; name: string; phone: string; course: string; source: string; date: string; status: string; notes: string }
export const enquiries: Enquiry[] = Array.from({ length: 16 }, (_, i) => ({
  id: `ENQ-${4001 + i}`, name: fullName(), phone: `96${Math.floor(10000000 + rnd() * 89999999)}`, course: pick(courseNames),
  source: pick(['Website', 'Walk-in', 'Instagram', 'Referral', 'Google Ads']), date: date(40), status: pick(['New', 'Contacted', 'Follow-up', 'Converted', 'Lost']), notes: 'Interested in demo class.',
}))

export type Expense = { id: string; title: string; category: string; amount: number; date: string; method: string; status: string }
export const expenses: Expense[] = Array.from({ length: 18 }, (_, i) => {
  const cat = pick(['Rent', 'Salaries', 'Utilities', 'Marketing', 'Equipment', 'Maintenance'])
  return { id: `EXP-${6001 + i}`, title: `${cat} payment`, category: cat, amount: 2000 + Math.floor(rnd() * 40) * 1000, date: date(60), method: pick(['Cash', 'UPI', 'Bank Transfer']), status: pick(['Approved', 'Approved', 'Pending']) }
})

export const revenueMonthly = [
  { month: 'Jun', revenue: 285000, expenses: 160000 }, { month: 'Jul', revenue: 312000, expenses: 172000 },
  { month: 'Aug', revenue: 298000, expenses: 168000 }, { month: 'Sep', revenue: 355000, expenses: 181000 },
  { month: 'Oct', revenue: 392000, expenses: 190000 }, { month: 'Nov', revenue: 428000, expenses: 198000 },
]
export const admissionsMonthly = [
  { month: 'Jun', admissions: 18 }, { month: 'Jul', admissions: 24 }, { month: 'Aug', admissions: 21 },
  { month: 'Sep', admissions: 33 }, { month: 'Oct', admissions: 38 }, { month: 'Nov', admissions: 29 },
]

export type NotificationItem = { id: string; title: string; body: string; time: string; type: 'fee' | 'enquiry' | 'exam' | 'system'; read: boolean }
export const notifications: NotificationItem[] = [
  { id: 'n1', title: 'Fee overdue', body: '5 students have overdue fees this week.', time: '10 min ago', type: 'fee', read: false },
  { id: 'n2', title: 'New enquiry', body: 'A new enquiry arrived from the website for Data Science.', time: '1 hr ago', type: 'enquiry', read: false },
  { id: 'n3', title: 'Exam scheduled', body: 'Full Stack Development final exam is scheduled next week.', time: '3 hrs ago', type: 'exam', read: false },
  { id: 'n4', title: 'Certificate ready', body: '3 certificates are ready for approval.', time: 'Yesterday', type: 'system', read: true },
  { id: 'n5', title: 'Payment received', body: 'Receipt RCP-7003 was generated for ₹23,600.', time: 'Yesterday', type: 'fee', read: true },
  { id: 'n6', title: 'Batch full', body: 'UX-Morning batch has reached full capacity.', time: '2 days ago', type: 'system', read: true },
]
