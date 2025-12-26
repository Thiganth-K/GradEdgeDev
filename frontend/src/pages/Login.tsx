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
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all h-[600px]">
        {/* Left Panel - Branding */}
        <div className="relative hidden w-5/12 flex-col justify-between bg-[#8B1E1E] p-12 text-white md:flex">
          <div className="space-y-2 animate-slideUp">
            <div className="inline-block rounded-full bg-white px-4 py-1.5 shadow-md">
              <span className="font-bold text-slate-900">Grad</span>
              <span className="font-bold text-[#8B1E1E]">Edge</span>
            </div>
          </div>

          <div className="mb-20">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              <span className="block animate-slideUp delay-100">Bridge the</span>
              <span className="block animate-slideUp delay-200">Campus-to-</span>
              <span className="block animate-slideUp delay-300">Career</span>
              <span className="block animate-slideUp delay-400">Gap.</span>
            </h1>
            <p className="mt-6 text-sm text-white/80 font-light max-w-xs animate-slideUp delay-500">
              Empowering the next generation with precise placement tracking and AI-driven prep.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase animate-fadeIn delay-700">
              Placement Intelligence<br />Portal
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex w-full flex-col justify-center bg-white p-12 md:w-7/12 relative">
          {/* Mobile Header (only visible on small screens) */}
          <div className="md:hidden pb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold">
              <span className="text-slate-900">Grad</span>
              <span className="text-[#8B1E1E]">Edge</span>
            </h1>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <h2 className="mb-1 text-3xl font-bold text-slate-900 animate-slideUp">Portal Access</h2>
            <p className="mb-8 text-xs font-bold tracking-wider text-slate-400 uppercase animate-slideUp delay-100">
              Authorized Student Login
            </p>

            <form onSubmit={onSubmit} className="space-y-6">
              {!isResetMode && (
                <div className="space-y-2 animate-slideUp delay-200">
                  <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">
                    {isSignup ? 'Username' : 'University ID'}
                  </label>
                  <input
                    className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 outline-none transition-all duration-300 hover:border-slate-300 hover:bg-white"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={isSignup ? "Choose a username" : "enter username"}
                    autoComplete="username"
                    required
                  />
                </div>
              )}

              {isResetMode && (
                <div className="rounded-lg bg-blue-50/50 p-4 border border-blue-100 mb-4 animate-scaleIn">
                  <h3 className="font-semibold text-blue-900 mb-1">Reset Password</h3>
                  <p className="text-xs text-blue-700">Enter your details to receive a reset code.</p>
                </div>
              )}

              {!isResetMode && (
                <div className="space-y-2 animate-slideUp delay-300">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">Password</label>
                    {!isSignup && (
                      <button
                        type="button"
                        className="text-[10px] font-bold text-slate-400 hover:text-[#8B1E1E] transition-colors duration-300"
                        onClick={() => {
                          setIsResetMode(true)
                          setIsSignup(false)
                          setError(undefined)
                        }}
                      >
                        FORGOT?
                      </button>
                    )}
                  </div>

                  <input
                    className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 outline-none transition-all duration-300 hover:border-slate-300 hover:bg-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="enter password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              )}

              {/* Extra Signup Fields */}
              {isSignup && !isResetMode && (
                <div className="animate-fadeIn space-y-5 pt-2">
                  <div className="space-y-2 animate-slideUp delay-100">
                    <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">Role</label>
                    <select className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" value={role} onChange={(e) => setRole(e.target.value as any)}>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {(role === 'student' || role === 'faculty') && (
                    <div className="space-y-2 animate-slideUp delay-150">
                      <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">Full Name</label>
                      <input className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
                    </div>
                  )}

                  <div className="space-y-2 animate-slideUp delay-200">
                    <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">Email</label>
                    <input className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" />
                  </div>
                </div>
              )}

              {/* Reset Password Fields */}
              {isResetMode && (
                <div className="space-y-5 animate-fadeIn">
                  {!resetAwaitingOtp ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">Email</label>
                      <input className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Associated Email" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">OTP</label>
                        <input className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} placeholder="Enter 4-digit code" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">New Password</label>
                        <input className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">Confirm</label>
                        <input className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm New Password" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* OTP Input for Signup */}
              {isSignup && awaitingOtp && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <label className="text-[10px] font-bold tracking-widest text-[#8B1E1E] uppercase">Verification Code</label>
                  <input className="w-full rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:border-[#8B1E1E] focus:bg-white focus:ring-4 focus:ring-[#8B1E1E]/5 transition-all duration-300 hover:border-slate-300 hover:bg-white" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="4-digit code" />
                  <p className="text-xs text-slate-500">Check your email for the code.</p>
                </div>
              )}


              {error && <div className="rounded-lg bg-red-50 p-4 text-xs font-medium text-red-600 animate-slideInRight">{error}</div>}

              <div className="pt-4">
                <button
                  className="group relative w-auto min-w-[140px] overflow-hidden rounded-xl border-2 border-[#8B1E1E] bg-white px-8 py-3 text-xs font-bold tracking-widest text-[#8B1E1E] uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                    {loading ? 'Working...' : (isResetMode && !resetAwaitingOtp ? 'Send Code' : (isResetMode ? 'Reset' : (isSignup && !awaitingOtp ? 'Sign Up' : (isSignup ? 'Verify' : 'Sign In'))))}
                  </span>
                  <div className="absolute inset-0 -z-0 h-full w-full origin-left scale-x-0 bg-[#8B1E1E] transition-transform duration-300 ease-out group-hover:scale-x-100"></div>
                </button>
              </div>

            </form>

            <div className="mt-12 text-center">
              {!isResetMode && (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 hover:text-[#8B1E1E] transition-colors duration-300 hover:underline hover:underline-offset-4"
                  onClick={() => {
                    setIsSignup(!isSignup)
                    setError(undefined)
                    setIsResetMode(false)
                  }}
                >
                  {isSignup ? "Already have an accout? Sign In" : "Don't have an account? Sign Up"}
                </button>
              )}
              {isResetMode && (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 hover:text-[#8B1E1E] transition-colors duration-300 hover:underline hover:underline-offset-4"
                  onClick={() => {
                    setIsResetMode(false)
                    setError(undefined)
                  }}
                >
                  Back to Login
                </button>
              )}

              <p className="mt-8 text-[10px] font-medium italic text-slate-400 max-w-xs mx-auto leading-relaxed">
                "Your future isn't just an outcome, it's the result of your preparation."
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
