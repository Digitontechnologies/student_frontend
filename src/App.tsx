import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import Login from './pages/Login'
import PublicRegister from './pages/PublicRegister'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentProfile from './pages/StudentProfile'
import Staff from './pages/Staff'
import Courses from './pages/Courses'
import Batches from './pages/Batches'
import { StudentAttendance, StaffAttendance } from './pages/Attendance'
import Fees from './pages/Fees'
import Billing from './pages/Billing'
import Receipts from './pages/Receipts'
import Examinations from './pages/Examinations'
import Certificates from './pages/Certificates'
import Enquiries from './pages/Enquiries'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={22} /> Checking session…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<PublicRegister />} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="staff" element={<Staff />} />
          <Route path="courses" element={<Courses />} />
          <Route path="batches" element={<Batches />} />
          <Route path="student-attendance" element={<StudentAttendance />} />
          <Route path="staff-attendance" element={<StaffAttendance />} />
          <Route path="fees" element={<Fees />} />
          <Route path="billing" element={<Billing />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="examinations" element={<Examinations />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
