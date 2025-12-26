import { useState, useEffect, type FormEvent } from 'react'
import { postJson } from '../lib/api'

type Props = {
  onLoginSuccess: (username: string, role?: string) => void
}

export default function LoginPage({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password reset state
  const [isResetMode, setIsResetMode] = useState(false)
  const [email, setEmail] = useState('')
  const [resetAwaitingOtp, setResetAwaitingOtp] = useState(false)
  const [resetOtp, setResetOtp] = useState('')
  const [resetOtpSecondsLeft, setResetOtpSecondsLeft] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  // OTP countdown timer (valid ~120s)
  useEffect(() => {
    if (!resetAwaitingOtp) return
    if (resetOtpSecondsLeft === null || resetOtpSecondsLeft <= 0) return
    const t = setTimeout(() => {
      setResetOtpSecondsLeft((s) => (typeof s === 'number' ? s - 1 : s))
    }, 1000)
    return () => clearTimeout(t)
  }, [resetAwaitingOtp, resetOtpSecondsLeft])

  function startOtpTimer() {
    setResetOtpSecondsLeft(120)
  }

  async function onLoginSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username || !password) {
      setError('Please enter username and password')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await postJson<{ ok: boolean; role?: string; username?: string; redirect?: string; message?: string }>(
        '/api/auth/login',
        { username, password },
      )
      if (res.ok && res.data.ok) {
        onLoginSuccess(res.data.username || username, res.data.role)
        setUsername('')
        setPassword('')
      } else {
        setError(res.ok ? res.data.message || 'Invalid credentials' : res.error || 'Network error')
      }
    } catch {
      setError('Unexpected error during login')
    } finally {
      setLoading(false)
    }
  }

  async function onResetInitSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username || !email) {
      setError('Please enter username and email')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await postJson<{ ok: boolean; message?: string; otp?: string }>(
        '/api/auth/password-reset/init',
        { username, email },
      )
      if (res.ok && res.data.ok) {
        setResetAwaitingOtp(true)
        startOtpTimer()
      } else {
        setError(res.ok ? res.data.message || 'Unable to start reset' : res.error || 'Network error')
      }
    } catch {
      setError('Unexpected error during reset init')
    } finally {
      setLoading(false)
    }
  }

  async function onResetVerifySubmit(e: FormEvent) {
    e.preventDefault()
    if (!username || !email || !resetOtp || !newPassword) {
      setError('Please fill username, email, OTP and new password')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await postJson<{ ok: boolean; message?: string }>(
        '/api/auth/password-reset/verify',
        { username, email, otp: resetOtp, new_password: newPassword },
      )
      if (res.ok && res.data.ok) {
        // Reset completed
        setResetAwaitingOtp(false)
        setIsResetMode(false)
        setResetOtp('')
        setNewPassword('')
        setConfirmNewPassword('')
        setResetOtpSecondsLeft(null)
      } else {
        setError(res.ok ? res.data.message || 'Invalid OTP' : res.error || 'Network error')
      }
    } catch {
      setError('Unexpected error during reset verify')
    } finally {
      setLoading(false)
    }
  }

  async function onResendOtp() {
    if (!username || !email) {
      setError('Please enter username and email')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await postJson<{ ok: boolean; message?: string; otp?: string }>(
        '/api/auth/password-reset/resend',
        { username, email },
      )
      if (res.ok && res.data.ok) {
        startOtpTimer()
      } else {
        setError(res.ok ? res.data.message || 'Unable to resend OTP' : res.error || 'Network error')
      }
    } catch {
      setError('Unexpected error during OTP resend')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">
          {isResetMode ? 'Password Reset' : 'Login'}
        </h1>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">
            {error}
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={onLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Username</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={disabled}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {!resetAwaitingOtp ? (
              <form onSubmit={onResetInitSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Username</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={disabled}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 disabled:opacity-60"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={onResetVerifySubmit} className="space-y-3">
                <div className="text-sm text-gray-600">
                  Enter the 4-digit OTP sent to your email.
                  {typeof resetOtpSecondsLeft === 'number' && resetOtpSecondsLeft > 0 && (
                    <span className="ml-2">Expires in {resetOtpSecondsLeft}s</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">OTP</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full border rounded px-3 py-2"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={disabled}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded px-3 py-2 disabled:opacity-60"
                  >
                    {loading ? 'Verifying…' : 'Verify & Update'}
                  </button>
                  <button
                    type="button"
                    onClick={onResendOtp}
                    disabled={disabled}
                    className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-center">
          {!isResetMode ? (
            <button
              type="button"
              className="text-blue-700 hover:underline"
              onClick={() => {
                setIsResetMode(true)
                setError(null)
              }}
            >
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              className="text-blue-700 hover:underline"
              onClick={() => {
                setIsResetMode(false)
                setResetAwaitingOtp(false)
                setResetOtp('')
                setNewPassword('')
                setConfirmNewPassword('')
                setResetOtpSecondsLeft(null)
                setError(null)
              }}
            >
              Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

