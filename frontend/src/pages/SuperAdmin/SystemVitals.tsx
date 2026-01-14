import React, { useEffect, useState } from 'react'
import Sidebar from '../../components/SuperAdmin/sidebar'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const Indicator: React.FC<{ok: boolean; label: string}> = ({ ok, label }) => (
  <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
      <div className="text-sm text-white/90 font-medium">{label}</div>
    </div>
    <div className="text-xs text-white/70">{ok ? 'OK' : 'Issue'}</div>
  </div>
)

const SystemVitals: React.FC = () => {
  const [mongoOk, setMongoOk] = useState<boolean | null>(null)
  const [envOk, setEnvOk] = useState<boolean | null>(null)

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role')
    if (role !== 'SuperAdmin') { window.location.href = '/login'; return }

    const check = async () => {
      try {
        const res = await fetch(`${BACKEND}/health`)
        if (res.ok) {
          try {
            const body = await res.json()
            // Expect optional shape { mongodb: true, env: true }
            setMongoOk(Boolean(body.mongodb ?? true))
            setEnvOk(Boolean(body.env ?? true))
            return
          } catch { }
          // fallback: 200 = healthy
          setMongoOk(true); setEnvOk(true)
          return
        }
      } catch (err) {
        // ignore
      }
      setMongoOk(false); setEnvOk(false)
    }

    check()
  }, [])

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto flex">
        <Sidebar />
        <main className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-red-700">System Vitals</h2>
            <div className="mt-2 text-sm text-gray-600">Basic system health checks for GradEdgeDev</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Indicator ok={mongoOk === null ? false : mongoOk} label="MongoDB Connection" />
            <Indicator ok={envOk === null ? false : envOk} label=".env Loaded" />
          </div>

          <div className="mt-6 text-sm text-gray-500">Note: This page attempts a simple `/health` request to the backend. For more detailed vitals, implement a dedicated health endpoint.</div>
        </main>
      </div>
    </div>
  )
}

export default SystemVitals
