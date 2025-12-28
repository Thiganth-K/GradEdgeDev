import { useEffect, useState, type FormEvent } from 'react'
import { postJson } from '../lib/api'

type Props = {
  onLoginSuccess: (username: string, role: string) => void
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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F0F2F5] font-sans p-4">
      {/* Card Container */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl lg:min-h-[500px]">
        {/* Left Panel */}
        <div className="hidden lg:flex w-5/12 flex-col justify-between bg-red-500 p-8 text-white relative">
          {/* Decorative elements can go here if needed, but keeping it clean for now */}
          <div>
            <div className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-bold shadow-sm">
              <span className="text-slate-900">Grad</span>
              <span className="text-red-500">Edge</span>
            </div>
          </div>

          <div className="z-10 mt-6 mb-auto">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight">
              Bridge the <br />
              Campus-to-<br />
              Career <br />
              Gap.
            </h1>
            <p className="mt-4 max-w-xs text-xs text-white/90 leading-relaxed font-medium">
              Empowering the next generation with precise placement tracking and AI-driven prep.
            </p>
          </div>

          <div className="z-10">
            <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 uppercase">Placement Intelligence Portal</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex w-full lg:w-7/12 items-center justify-center bg-white p-8">
          <div className="w-full max-w-sm">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Portal Access</h2>
              <p className="mt-1 text-[10px] font-bold text-red-500 tracking-widest uppercase">
                {isSignup ? 'CREATE NEW ACCOUNT' : (isResetMode ? 'PASSWORD RECOVERY' : 'AUTHORIZED STUDENT LOGIN')}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {/* Common Fields */}
              {!isResetMode && !isSignup && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University ID</label>
                  <input
                    className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all placeholder-slate-300"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="enter username"
                    autoComplete="username"
                    required
                  />
                </div>
              )}

              {isSignup && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                    <select
                      className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-200 outline-none"
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
                    <input
                      className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-200"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                    />
                  </div>

                  {/* Role specific fields */}
                  {(role === 'student' || role === 'faculty') && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                        <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                      </div>
                      {role === 'faculty' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty ID</label>
                            <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="Faculty ID" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                            <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {role === 'recruiter' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                        <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Name</label>
                        <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                    <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile</label>
                    <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" />
                  </div>
                </>
              )}

              {/* Password Login Mode */}
              {!isResetMode && !isSignup && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                    <button
                      type="button"
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                      onClick={() => {
                        setIsResetMode(true)
                        setIsSignup(false)
                        setError(undefined)
                      }}
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all placeholder-slate-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="enter password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              )}

              {/* Signup Password */}
              {isSignup && !awaitingOtp && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <input
                    className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    type="password"
                  />
                </div>
              )}

              {/* Reset Password Fields */}
              {isResetMode && !resetAwaitingOtp && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
                    <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                    <input className="w-full rounded-lg bg-gray-50 border-none px-4 py-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Associated email" />
                  </div>
                </>
              )}

              {/* OTP Fields */}
              {((isSignup && awaitingOtp) || (isResetMode && resetAwaitingOtp)) && (
                <div className="space-y-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Verification Code</label>
                    <input
                      className="w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm tracking-widest"
                      value={isResetMode ? resetOtp : otp}
                      onChange={(e) => isResetMode ? setResetOtp(e.target.value) : setOtp(e.target.value)}
                      placeholder="Enter 4-digit code"
                    />
                  </div>
                  {isResetMode && resetAwaitingOtp && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                        <input className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm</label>
                        <input className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm password" />
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>
                      {(isResetMode ? resetOtpSecondsLeft : otpSecondsLeft) ?
                        `Expires in ${String(Math.floor(((isResetMode ? resetOtpSecondsLeft : otpSecondsLeft) || 0) / 60)).padStart(2, '0')}:${String(((isResetMode ? resetOtpSecondsLeft : otpSecondsLeft) || 0) % 60).padStart(2, '0')}`
                        : 'Expired'}
                    </span>
                    <button type="button" onClick={isResetMode ? handleResendResetOtp : handleResendOtp} className="text-red-500 font-medium underline">Resend Code</button>
                  </div>
                </div>
              )}

              {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 font-medium border border-red-100">{error}</div> : null}

              <div className="pt-2">
                <button
                  className="w-full rounded-lg border border-red-500 bg-white text-red-500 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-[0.98]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Working...' : (isResetMode ? (resetAwaitingOtp ? 'Reset & Login' : 'Send Code') : (isSignup ? (awaitingOtp ? 'Verify & Sign up' : 'Sign up') : 'Sign In'))}
                </button>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wide transition-colors"
                  onClick={() => {
                    if (isResetMode) {
                      setIsResetMode(false)
                      setError(undefined)
                    } else {
                      setIsSignup(!isSignup)
                      setError(undefined)
                      setAwaitingOtp(false)
                    }
                  }}
                >
                  {isResetMode ? 'Back to Login' : (isSignup ? 'Have an account? Sign In' : "Don't have an account? Sign Up")}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] italic text-slate-400 font-serif">"Your future isn't just an outcome, it's the result of your preparation."</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
