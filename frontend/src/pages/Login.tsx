import { useState, useEffect, type FormEvent } from 'react'
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
  const [isResetMode, setIsResetMode] = useState(false)
  const [role, setRole] = useState<'student' | 'admin' | 'faculty' | 'recruiter'>('student')
  const [fullName, setFullName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [department, setDepartment] = useState('')
  const [awaitingOtp, setAwaitingOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number | null>(null)
  const [resetAwaitingOtp, setResetAwaitingOtp] = useState(false)
  const [resetOtp, setResetOtp] = useState('')
  const [resetOtpSecondsLeft, setResetOtpSecondsLeft] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  async function handleResendOtp() {
    if (!email) {
      setError('Enter your email before resending OTP')
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      const res = await postJson('/api/auth/signup/resend', { email })
      setLoading(false)
      if (!res.ok) {
        setError(res.error || 'Failed to resend OTP')
        return
      }
      const data = (res as any).data
      setError((data && data.message) || 'OTP resent — check your email')
      // reset OTP timer to 2 minutes on successful resend
      setOtp('')
      setAwaitingOtp(true)
      setOtpSecondsLeft(120)
    } catch (e) {
      setLoading(false)
      setError('Network error while resending OTP')
    }
  }

  async function handleResendResetOtp() {
    if (!username || !email) {
      setError('Enter your username and email before resending reset OTP')
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      const res = await postJson('/api/auth/password-reset/resend', { username, email })
      setLoading(false)
      if (!res.ok) {
        setError(res.error || 'Failed to resend password reset OTP')
        return
      }
      const data = (res as any).data
      setError((data && data.message) || 'Password reset OTP resent — check your email')
      setResetOtp('')
      setResetAwaitingOtp(true)
      setResetOtpSecondsLeft(120)
    } catch (e) {
      setLoading(false)
      setError('Network error while resending password reset OTP')
    }
  }

  // countdown timer for OTP validity (2 minutes)
  useEffect(() => {
    if (!awaitingOtp || otpSecondsLeft === null || otpSecondsLeft <= 0) {
      return
    }
    const id = window.setInterval(() => {
      setOtpSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [awaitingOtp, otpSecondsLeft])

  // countdown timer for password reset OTP (2 minutes)
  useEffect(() => {
    if (!resetAwaitingOtp || resetOtpSecondsLeft === null || resetOtpSecondsLeft <= 0) {
      return
    }
    const id = window.setInterval(() => {
      setResetOtpSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [resetAwaitingOtp, resetOtpSecondsLeft])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    setLoading(true)

    try {
      if (isResetMode) {
        if (!resetAwaitingOtp) {
          if (!username || !email) {
            setLoading(false)
            setError('Username and email are required for password reset')
            return
          }
          const res = await postJson('/api/auth/password-reset/init', { username, email })
          setLoading(false)
          if (!res.ok) {
            setError(res.error || 'Request failed')
            return
          }
          const data = (res as any).data
          if (data && (data.ok || res.ok)) {
            setResetAwaitingOtp(true)
            setResetOtpSecondsLeft(120)
            setError('Password reset OTP sent — enter the code below and your new password.')
            return
          }
          setError((res as any).error || 'Failed to request password reset OTP')
          return
        }

        // resetAwaitingOtp === true -> verify reset OTP and update password
        if (resetOtpSecondsLeft !== null && resetOtpSecondsLeft <= 0) {
          setLoading(false)
          setError('Reset OTP expired. Please click Resend OTP to get a new code.')
          return
        }
        if (!newPassword) {
          setLoading(false)
          setError('New password is required')
          return
        }
        if (newPassword !== confirmNewPassword) {
          setLoading(false)
          setError('New password and confirmation do not match')
          return
        }

        const ver = await postJson('/api/auth/password-reset/verify', {
          username,
          email,
          otp: resetOtp,
          new_password: newPassword,
        })
        setLoading(false)
        if (!ver.ok) {
          setError(ver.error || 'Password reset failed')
          return
        }
        const vdata = (ver as any).data
        if (!vdata || !vdata.ok) {
          setError(vdata?.message || 'Password reset failed')
          return
        }

        setIsResetMode(false)
        setResetAwaitingOtp(false)
        setResetOtp('')
        setResetOtpSecondsLeft(null)
        setNewPassword('')
        setConfirmNewPassword('')
        setPassword('')
        setError('Password reset successful — please sign in with your new password')
        return
      }

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

        if (!awaitingOtp) {
          if (!email) {
            setLoading(false)
            setError('Email is required for signup')
            return
          }
          const res = await postJson('/api/auth/signup/init', payload)
          setLoading(false)
          if (!res.ok) {
            setError(res.error || 'Request failed')
            return
          }
          const data = (res as any).data
          if (data && (data.ok || res.ok)) {
            setAwaitingOtp(true)
            setOtpSecondsLeft(120)
            setError('OTP sent to email — enter the 4-digit code below')
            return
          }
          setError((res as any).error || 'Failed to request OTP')
          return
        }

        // awaitingOtp === true -> verify OTP
        if (otpSecondsLeft !== null && otpSecondsLeft <= 0) {
          setLoading(false)
          setError('OTP expired. Please click Resend OTP to get a new code.')
          return
        }
        const ver = await postJson('/api/auth/signup/verify', { email, otp })
        setLoading(false)
        if (!ver.ok) {
          setError(ver.error || 'OTP verification failed')
          return
        }
        const vdata = (ver as any).data
        if (!vdata || !vdata.ok) {
          setError(vdata?.message || 'OTP verification failed')
          return
        }
        setIsSignup(false)
        setPassword('')
        setAwaitingOtp(false)
        setOtp('')
        setOtpSecondsLeft(null)
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

          {!isResetMode && (
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
          )}

          {!isSignup && !isResetMode && (
            <div className="-mt-1 mb-1 flex justify-end">
              <button
                type="button"
                className="text-xs text-blue-600 underline"
                onClick={() => {
                  setIsResetMode(true)
                  setIsSignup(false)
                  setError(undefined)
                  setAwaitingOtp(false)
                  setOtp('')
                  setOtpSecondsLeft(null)
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {isSignup && !isResetMode && (
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

          {isSignup && awaitingOtp && !isResetMode && (
            <>
              <div className="mb-2">
                <label className="block text-sm">Verification code (4 digits)</label>
                <input
                  className="w-full border p-2"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
              </div>
              <div className="mb-1 text-xs text-slate-600">
                {otpSecondsLeft !== null && otpSecondsLeft > 0 ? (
                  <span>
                    OTP expires in{' '}
                    {String(Math.floor(otpSecondsLeft / 60)).padStart(2, '0')}:
                    {String(otpSecondsLeft % 60).padStart(2, '0')}
                  </span>
                ) : (
                  <span className="text-red-600">OTP expired. Please click Resend OTP.</span>
                )}
              </div>
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs text-blue-600 underline disabled:opacity-60"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {isResetMode && !resetAwaitingOtp && (
            <>
              <div className="mb-2">
                <label className="block text-sm">Email for password reset</label>
                <input
                  className="w-full border p-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the email associated with this account"
                />
              </div>
            </>
          )}

          {isResetMode && resetAwaitingOtp && (
            <>
              <div className="mb-2">
                <label className="block text-sm">Reset verification code (4 digits)</label>
                <input
                  className="w-full border p-2"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="Enter reset OTP"
                />
              </div>
              <div className="mb-1 text-xs text-slate-600">
                {resetOtpSecondsLeft !== null && resetOtpSecondsLeft > 0 ? (
                  <span>
                    Reset OTP expires in{' '}
                    {String(Math.floor(resetOtpSecondsLeft / 60)).padStart(2, '0')}:
                    {String(resetOtpSecondsLeft % 60).padStart(2, '0')}
                  </span>
                ) : (
                  <span className="text-red-600">Reset OTP expired. Please click Resend OTP.</span>
                )}
              </div>
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs text-blue-600 underline disabled:opacity-60"
                  onClick={handleResendResetOtp}
                  disabled={loading}
                >
                  Resend reset OTP
                </button>
              </div>

              <div className="mb-2">
                <label className="block text-sm">New password</label>
                <input
                  className="w-full border p-2"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Confirm new password</label>
                <input
                  className="w-full border p-2"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
            </>
          )}

          {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <div className="mt-4 flex items-center justify-between">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
              {isResetMode ? 'Reset Password' : (isSignup ? 'Sign Up' : 'Sign In')}
            </button>
            <button
              type="button"
              className="text-sm text-blue-600"
              onClick={() => {
                if (isResetMode) {
                  setIsResetMode(false)
                } else {
                  setIsSignup(!isSignup)
                }
                setError(undefined)
                setAwaitingOtp(false)
                setOtp('')
                setOtpSecondsLeft(null)
                setResetAwaitingOtp(false)
                setResetOtp('')
                setResetOtpSecondsLeft(null)
                setNewPassword('')
                setConfirmNewPassword('')
              }}
            >
              {isResetMode ? 'Back to sign in' : (isSignup ? 'Have an account? Sign in' : "Don't have an account? Sign up")}
            </button>
          </div>

          <button
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Working' : (isResetMode ? 'Reset password' : (isSignup ? 'Sign up' : 'Get started'))}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">Backend: <span className="font-mono">POST /api/auth/login</span></p>
      </div>
    </main>
  )
}
