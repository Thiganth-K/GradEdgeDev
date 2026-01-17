import React, { useEffect, useState } from 'react'
import Sidebar from '../../components/SuperAdmin/sidebar'
import { FaSearch, FaFilter, FaTh } from 'react-icons/fa'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001'

type VitalCheck = {
  id: string
  service: string
  details: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'ACTIVE' | 'FAILED'
}

const SystemVitals: React.FC = () => {
  const [checks, setChecks] = useState<VitalCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const role = localStorage.getItem('gradedge_role')
    if (role !== 'SuperAdmin') { window.location.href = '/login'; return }

    const check = async () => {
      try {
        const res = await fetch(`${BACKEND}/health`)
        const body: any = await res.json().catch(() => ({}))
        
        const vitals: VitalCheck[] = [
          {
            id: 'mongodb',
            service: 'MongoDB Connection',
            details: body.mongodb ? 'Connected' : 'Disconnected',
            priority: 'HIGH',
            status: body.mongodb ? 'ACTIVE' : 'FAILED'
          },
          {
            id: 'env',
            service: 'Environment Variables',
            details: body.env ? 'Loaded .env' : 'Not loaded',
            priority: 'HIGH',
            status: body.env ? 'ACTIVE' : 'FAILED'
          },
          {
            id: 'frontend',
            service: 'Frontend Build',
            details: body.frontendFound ? 'Dist folder check' : 'Not found',
            priority: 'LOW',
            status: body.frontendFound ? 'ACTIVE' : 'FAILED'
          },
          {
            id: 'port',
            service: 'Server Port',
            details: body.port ? `Port ${body.port}` : 'Port unavailable',
            priority: 'MEDIUM',
            status: body.port ? 'ACTIVE' : 'FAILED'
          }
        ]
        
        setChecks(vitals)
        setLoading(false)
      } catch (err) {
        setLoading(false)
      }
    }

    check()
  }, [])

  const filteredChecks = checks.filter(check => 
    check.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    check.details.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredChecks.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedChecks = filteredChecks.slice(startIdx, endIdx)

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-600',
      MEDIUM: 'bg-orange-600',
      LOW: 'bg-blue-600'
    }
    return <span className={`px-3 py-1 ${colors[priority]} text-white text-xs font-semibold rounded`}>{priority}</span>
  }

  const getStatusBadge = (status: string) => {
    const color = status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'
    return <span className={`px-3 py-1 ${color} text-white text-xs font-semibold rounded`}>{status}</span>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SYSTEM VITALS</h1>
          <p className="text-sm text-gray-500 mt-1">REAL-TIME HEALTH CHECKS AND STATUS</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaFilter className="text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaTh className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SERVICE CHECK
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  DETAILS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  PRIORITY
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && paginatedChecks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No vitals found.
                  </td>
                </tr>
              )}
              {!loading && paginatedChecks.map((check) => (
                <tr key={check.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {check.service}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {check.details}
                  </td>
                  <td className="px-6 py-4">
                    {getPriorityBadge(check.priority)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(check.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIdx + 1}-{Math.min(endIdx, filteredChecks.length)} of {filteredChecks.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SystemVitals
