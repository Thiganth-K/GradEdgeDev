import React, { useEffect, useState } from 'react'
import Sidebar from '../../components/SuperAdmin/sidebar'
import SuperAdminTable, { type Column, StatusBadge, PriorityBadge } from '../../components/SuperAdmin/SuperAdminTable'
import SuperAdminPageHeader from '../../components/SuperAdmin/SuperAdminPageHeader'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

<<<<<<< Updated upstream
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
=======
interface Vital {
    id: string;
    topic: string;
    status: 'Active' | 'Failed';
    priority: 'High' | 'Low';
    details: string;
}

const SystemVitals: React.FC = () => {
  const [data, setData] = useState<Vital[]>([])
  const [loading, setLoading] = useState(true)
>>>>>>> Stashed changes

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role')
    if (role !== 'SuperAdmin') { window.location.href = '/login'; return }

    const check = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/health`)
        if (res.ok) {
<<<<<<< Updated upstream
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
=======
          const body: any = await res.json().catch(() => ({}))
          // Transform simple health check into table rows
          const rows: Vital[] = [
             { id: '1', topic: 'MongoDB Connection', status: body.mongodb ? 'Active' : 'Failed', priority: 'High', details: body.mongodb ? 'Connected' : 'Disconnected' },
             { id: '2', topic: 'Environment Variables', status: body.env ? 'Active' : 'Failed', priority: 'High', details: body.env ? 'Loaded .env' : 'Missing vars' },
             { id: '3', topic: 'Frontend Build', status: body.frontendFound ? 'Active' : 'Failed', priority: 'Low', details: 'Dist folder check' },
             { id: '4', topic: 'Server Port', status: typeof body.port === 'number' ? 'Active' : 'Failed', priority: 'Medium' as any, details: `Port ${body.port}` }
          ];
          setData(rows)
>>>>>>> Stashed changes
        }
      } catch (err) {
         setData([{ id: 'err', topic: 'Health Check', status: 'Failed', priority: 'High', details: 'Network Error' }])
      }
<<<<<<< Updated upstream
      setMongoOk(false); setEnvOk(false)
=======
      setLoading(false)
>>>>>>> Stashed changes
    }

    check()
  }, [])

<<<<<<< Updated upstream
=======
  const columns: Column<Vital>[] = [
    {
        header: 'Service Check',
        accessor: (row) => <span className="text-gray-900 font-medium">{row.topic}</span>
    },
    {
        header: 'Details',
        accessor: 'details'
    },
    {
        header: 'Priority',
        accessor: (row) => <PriorityBadge priority={row.priority} />
    },
    {
        header: 'Status',
        accessor: (row) => <StatusBadge status={row.status} />
    }
  ];

>>>>>>> Stashed changes
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar />
<<<<<<< Updated upstream
      <div className="flex-1 bg-gray-50 p-8">
        <main className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">System Vitals</h2>
            <p className="text-gray-600">Basic system health checks for GradEdgeDev</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Indicator ok={mongoOk === null ? false : mongoOk} label="MongoDB Connection" />
            <Indicator ok={envOk === null ? false : envOk} label=".env Loaded" />
          </div>

          <div className="mt-6 text-sm text-gray-500">Note: This page attempts a simple `/health` request to the backend. For more detailed vitals, implement a dedicated health endpoint.</div>
        </main>
=======
      <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden">
         <SuperAdminPageHeader 
            title="System Vitals" 
            subtitle="Real-time health checks and status"
         />
         <div className="flex-1 overflow-hidden p-8">
            <SuperAdminTable 
                title="System Vitals"
                data={data}
                columns={columns}
                isLoading={loading}
            />
         </div>
>>>>>>> Stashed changes
      </div>
    </div>
  )
}

export default SystemVitals
