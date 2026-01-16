import React, { useEffect, useState } from 'react'
import Sidebar from '../../components/SuperAdmin/sidebar'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const Indicator: React.FC<{ok: boolean; label: string}> = ({ ok, label }) => (
  <div className="flex items-center justify-between bg-white rounded-lg border p-4">
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      <div className="text-sm text-gray-900 font-medium">{label}</div>
    </div>
    <div className={`text-xs ${ok ? 'text-green-700' : 'text-red-700'}`}>{ok ? 'OK' : 'Issue'}</div>
  </div>
)

type Health = {
  success: boolean
  mongodb?: boolean
  env?: boolean
  port?: number
  frontendFound?: boolean
  details?: {
    superadminSecret?: boolean
    adminSecret?: boolean
    institutionSecret?: boolean
    mongoUriPresent?: boolean
  }
}

const SystemVitals: React.FC = () => {
  const [mongoOk, setMongoOk] = useState<boolean | null>(null)
  const [envOk, setEnvOk] = useState<boolean | null>(null)
  const [port, setPort] = useState<number | null>(null)
  const [frontendFound, setFrontendFound] = useState<boolean | null>(null)
  const [details, setDetails] = useState<Health['details']>({})

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role')
    if (role !== 'SuperAdmin') { window.location.href = '/login'; return }

    const check = async () => {
      try {
        const res = await fetch(`${BACKEND}/health`)
        if (res.ok) {
          const body: Health = await res.json().catch(() => ({} as any))
          setMongoOk(Boolean(body.mongodb))
          setEnvOk(Boolean(body.env))
          setPort(typeof body.port === 'number' ? body.port : null)
          setFrontendFound(Boolean(body.frontendFound))
          setDetails(body.details || {})
          return
        }
      } catch (err) {
        // ignore
      }
      setMongoOk(false); setEnvOk(false)
      setFrontendFound(false); setPort(null)
    }

    check()
  }, [])

  const lines = [
    port ? `Server running on port ${port}` : 'Server port unavailable',
    mongoOk ? 'Connected to MongoDB' : 'MongoDB connection issue',
    envOk ? '[dotenv] env loaded from .env' : '[dotenv] env not loaded',
    `[ENV] SUPERADMIN_JWT_SECRET set: ${details?.superadminSecret ? 'yes' : 'no'}`,
    `[ENV] ADMIN_JWT_SECRET set: ${details?.adminSecret ? 'yes' : 'no'}`,
    `[ENV] INSTITUTION_JWT_SECRET set: ${details?.institutionSecret ? 'yes' : 'no'}`,
    `[ENV] MONGO_URI set: ${details?.mongoUriPresent ? 'yes' : 'no'}`,
    `[SERVER] Frontend build found: ${frontendFound ? 'yes' : 'no'}`,
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-50 p-8">
        <main className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">System Vitals</h2>
            <p className="text-gray-600">Basic system health checks for GradEdgeDev</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Indicator ok={mongoOk === true} label="MongoDB Connection" />
            <Indicator ok={envOk === true} label=".env Loaded" />
          </div>

          <div className="mt-6 bg-white rounded-lg border p-6">
            <ul className="space-y-2 text-sm text-gray-800">
              {lines.map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    /Connected to MongoDB/.test(t) || /yes$/.test(t) || /running on port/.test(t)
                      ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-gray-500">These messages reflect the latest `/health` response.</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SystemVitals
