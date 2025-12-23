import React from 'react'

type Props = {
  username?: string
  onLogout?: () => void
}

export default function StudentWelcome({ username, onLogout }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold">Welcome, {username || 'Student'}</h1>
        <p className="mt-2 text-sm text-slate-600">This is the student area.</p>
        <div className="mt-6">
          <button onClick={onLogout} className="rounded bg-red-600 px-4 py-2 text-white">Logout</button>
        </div>
      </div>
    </div>
  )
}
