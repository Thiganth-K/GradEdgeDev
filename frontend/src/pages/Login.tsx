import React, { useState } from 'react'
import { postJson } from '../lib/api'

type Props = {
  onLoginSuccess: (username: string, role: string) => void
}

export default function LoginPage({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // The backend expects field 'username' or 'name'.
      const res = await postJson<{ ok: boolean; role: string; redirect: string; message?: string }>(
        '/api/auth/login',
        { username, password },
      )

      if (res.ok && res.data.ok) {
        onLoginSuccess(username, res.data.role)
      } else {
        const msg = !res.ok ? res.error : res.data.message || 'Login failed'
        setError(msg)
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 text-center">Login</h1>
        
        {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
        </div>
      </div>
    </div>
  )
}
