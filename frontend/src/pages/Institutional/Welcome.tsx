import { useNavigate } from 'react-router-dom'

type Props = {
  username?: string
  institutionalId?: string
  onLogout?: () => void
}

export default function InstitutionalWelcome({ username, institutionalId, onLogout }: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="h-1.5 w-full bg-red-600 animate-pulse" />
      
      {/* Header */}
      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="animate-slideUp">
              <h1 className="text-3xl font-bold tracking-tight">Institutional Dashboard</h1>
              <p className="mt-1 text-sm text-white opacity-90">Welcome, {username || 'Institution'}</p>
              {institutionalId ? (
                <p className="mt-1 text-xs text-white/80">Institution ID: {institutionalId}</p>
              ) : null}
            </div>
            
            <div className="flex items-center space-x-4 animate-slideInRight delay-200">
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 transition-all duration-300 hover:scale-105"
              >
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-bold text-red-600">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Management Cards */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-2xl font-bold text-black mb-6 animate-fadeIn">Management Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Faculty Management Card */}
          <button
            onClick={() => navigate('/institutional/faculty')}
            className="group rounded-lg border-2 border-red-600 bg-white p-6 text-left transition-all duration-300 hover:bg-red-600 hover:shadow-xl animate-scaleIn"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 transition-all duration-300 group-hover:bg-white">
                <svg className="h-6 w-6 text-white transition-all duration-300 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-red-600 transition-all duration-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black transition-all duration-300 group-hover:text-white">Faculty Management</h3>
            <p className="mt-2 text-sm text-gray-600 transition-all duration-300 group-hover:text-white/90">Create and manage faculty accounts, assign departments, and control access.</p>
          </button>

          {/* Batch Management Card */}
          <button
            onClick={() => navigate('/institutional/batch')}
            className="group rounded-lg border-2 border-red-600 bg-white p-6 text-left transition-all duration-300 hover:bg-red-600 hover:shadow-xl animate-scaleIn delay-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 transition-all duration-300 group-hover:bg-white">
                <svg className="h-6 w-6 text-white transition-all duration-300 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-red-600 transition-all duration-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black transition-all duration-300 group-hover:text-white">Batch Management</h3>
            <p className="mt-2 text-sm text-gray-600 transition-all duration-300 group-hover:text-white/90">Batch create students via CSV upload or manual entry with faculty assignment.</p>
          </button>

          {/* Student Management Card */}
          <button
            onClick={() => navigate('/institutional/students')}
            className="group rounded-lg border-2 border-red-600 bg-white p-6 text-left transition-all duration-300 hover:bg-red-600 hover:shadow-xl animate-scaleIn delay-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 transition-all duration-300 group-hover:bg-white">
                <svg className="h-6 w-6 text-white transition-all duration-300 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-red-600 transition-all duration-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black transition-all duration-300 group-hover:text-white">Student Management</h3>
            <p className="mt-2 text-sm text-gray-600 transition-all duration-300 group-hover:text-white/90">View, edit, and delete student records with faculty reassignment options.</p>
          </button>

          {/* Tests Management Card */}
          <button
            onClick={() => navigate('/institutional/tests')}
            className="group rounded-lg border-2 border-red-600 bg-white p-6 text-left transition-all duration-300 hover:bg-red-600 hover:shadow-xl animate-scaleIn delay-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 transition-all duration-300 group-hover:bg-white">
                <svg className="h-6 w-6 text-white transition-all duration-300 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M12 6v.01" />
                </svg>
              </div>
              <svg className="h-5 w-5 text-red-600 transition-all duration-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black transition-all duration-300 group-hover:text-white">Tests Management</h3>
            <p className="mt-2 text-sm text-gray-600 transition-all duration-300 group-hover:text-white/90">Create MCQ tests (aptitude, technical, psychometric) and assign them to faculty and students.</p>
          </button>
        </div>
      </div>
    </div>
  )
}
