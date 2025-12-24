import { useState, type FormEvent } from 'react'
import { postJson } from '../lib/api'

type Props = {
  onLoginSuccess: (username: string, role?: string) => void
}

export default function LoginPage({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const [isSignup, setIsSignup] = useState(false)
  const [role, setRole] = useState<'student' | 'admin' | 'faculty' | 'recruiter'>('student')
  const [fullName, setFullName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [department, setDepartment] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    setLoading(true)

    try {
      if (isSignup) {
        const payload: Record<string, unknown> = { username, password, role }
        if (role === 'student' || role === 'faculty') {
          if (fullName) payload.full_name = fullName
          if (role === 'faculty' && facultyId) payload.faculty_id = facultyId
          if (department) payload.department = department
        }
        if (role === 'recruiter') {
          if (firstName) payload.first_name = firstName
          if (lastName) payload.last_name = lastName
        }
        // collect contact fields for all signup roles when provided
        if (email) payload.email = email
        if (mobile) payload.mobile = mobile

        const res = await postJson('/api/auth/signup', payload)
        setLoading(false)
        if (!res.ok) {
          setError(res.error)
          return
        }
        setIsSignup(false)
        setPassword('')
        setError('Signup successful — please sign in')
        return
      }

      const res = await postJson('/api/auth/login', { username, password })
      setLoading(false)
      if (!res.ok) {
        setError(res.error || 'Request failed')
        return
      }
      const data = (res as any).data
      if (!data || !data.ok) {
        setError(data?.message || 'Invalid credentials')
        return
      }
      const r = data.role || 'student'
      const u = username.trim()
      if (u) {
        localStorage.setItem('logged_in', 'true')
        localStorage.setItem('username', u)
        localStorage.setItem('role', r)
      }
      onLoginSuccess(u || '', r)
    } catch (err) {
      setLoading(false)
      setError('Network error')
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">GradEdgeDev</h1>
          <p className="text-sm text-slate-600">Enter your GradEdgeDev username and password to get started.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">GradEdgeDev username</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">GradEdgeDev password</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {isSignup && (
            <>
              <div className="mb-2">
                <label className="block text-sm">Role</label>
                <select className="w-full border p-2" value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(role === 'student' || role === 'faculty') && (
                <>
                  <div className="mb-2">
                    <label className="block text-sm">Full name</label>
                    <input className="w-full border p-2" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  {role === 'student' && null}
                  {role === 'faculty' && (
                    <>
                      <div className="mb-2">
                        <label className="block text-sm">Faculty ID</label>
                        <input className="w-full border p-2" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm">Department</label>
                        <input className="w-full border p-2" value={department} onChange={(e) => setDepartment(e.target.value)} />
                      </div>
                    </>
                  )}
                </>
              )}
              {role === 'recruiter' && (
                <>
                  <div className="mb-2">
                    <label className="block text-sm">First name</label>
                    <input className="w-full border p-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm">Last name</label>
                    <input className="w-full border p-2" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </>
              )}

              {/* Contact fields for all signup users */}
              <div className="mb-2">
                <label className="block text-sm">Email</label>
                <input className="w-full border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Phone</label>
                <input className="w-full border p-2" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
            </>
          )}

          {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="mt-4 flex items-center justify-between">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
              {isSignup ? 'Sign Up' : 'Sign In'}
            </button>
            <button type="button" className="text-sm text-blue-600" onClick={() => { setIsSignup(!isSignup); setError(undefined); }}>
              {isSignup ? 'Have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <button
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Working' : (isSignup ? 'Sign up' : 'Get started')}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">Backend: <span className="font-mono">POST /api/auth/login</span></p>
      </div>
    </main>
  )
}
