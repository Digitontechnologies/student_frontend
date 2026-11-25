import {
  Award, Bell, BookOpen, CalendarCheck, ClipboardCheck, CreditCard, FileText, GraduationCap, Layers,
  LayoutDashboard, Megaphone, Receipt, Settings, UserCheck, UserCog, Users, Wallet, BarChart3,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon }

export const navGroups: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Academics',
    items: [
      { to: '/students', label: 'Students', icon: GraduationCap },
      { to: '/staff', label: 'Staff', icon: UserCog },
      { to: '/courses', label: 'Courses', icon: BookOpen },
      { to: '/batches', label: 'Batches', icon: Layers },
      { to: '/student-attendance', label: 'Student Attendance', icon: CalendarCheck },
      { to: '/staff-attendance', label: 'Staff Attendance', icon: UserCheck },
      { to: '/examinations', label: 'Examinations', icon: ClipboardCheck },
      { to: '/certificates', label: 'Certificates', icon: Award },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/fees', label: 'Fees', icon: Wallet },
      { to: '/billing', label: 'Billing & Invoices', icon: FileText },
      { to: '/receipts', label: 'Payment Receipts', icon: Receipt },
      { to: '/expenses', label: 'Expenses', icon: CreditCard },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/enquiries', label: 'Enquiries & Leads', icon: Megaphone },
      { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export const allNav = navGroups.flatMap((g) => g.items)
export { Users }
