import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8FC] p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/digiton-logo.png" alt="Digiton Technologies" className="h-12 w-auto max-w-[220px] object-contain" />
          <h1 className="mt-5 text-xl font-bold text-[#172033]">Institute Pro</h1>
          <p className="mt-1 text-sm text-[#667085]">by Digiton Technologies</p>
          <p className="mt-2 text-sm text-[#667085]">Sign in to your account to continue</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}

          <Field label="Email address">
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="admin@institutepro.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Button type="submit" disabled={submitting} className="w-full justify-center" icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
