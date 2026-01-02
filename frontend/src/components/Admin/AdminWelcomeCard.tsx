import LoadingSpinner from '../LoadingSpinner'

type Props = {
  title: string
  subtitle: string
  username?: string
  loading?: boolean
  error?: string
  onLogout?: () => void
  onManage?: () => void
  onViewLogs?: () => void
  onManageInstitutional?: () => void
}

export default function AdminWelcomeCard({
  title,
  subtitle,
  username,
  loading,
  error,
  onLogout,
  onManageInstitutional,
  onViewLogs,
}: Props) {
  return (
    <div className="w-full">
      {/* Animated Top Border Accent */}
      <div className="h-2 w-full bg-red-600 animate-pulse" />

      {/* Header Section */}
      <div className="border-b-4 border-red-600 bg-red-600 px-8 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="space-y-3 animate-slideUp">
              <h1 className="text-5xl font-bold tracking-tight">{title}</h1>
              <p className="text-xl text-white opacity-90">{subtitle}</p>
            </div>

            {/* Dashboard Icon */}
            <div className="animate-slideInRight delay-200">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white ring-4 ring-white/20 transition-transform duration-300 hover:rotate-12 hover:scale-110">
                <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-8 py-12">
        {/* Status Card */}
        <div className="mb-10 animate-slideUp delay-300">
          <div className="relative overflow-hidden rounded-xl border-2 border-red-600 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="md" label="Loading admin profile..." />
              </div>
            ) : error ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-semibold text-red-600">Failed to reach backend</p>
                </div>
                <p className="text-base text-gray-600">{error}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Signed in as</p>
                  <p className="text-3xl font-bold text-black">{username ?? 'Admin'}</p>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-xl">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {onManageInstitutional ? (
            <button
              onClick={onManageInstitutional}
              className="group/btn relative animate-slideUp delay-400 overflow-hidden rounded-xl border-2 border-red-600 bg-white p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-red-700 hover:shadow-2xl"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 transition-all duration-300 group-hover/btn:bg-red-700">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-black">Institutional</p>
                  <p className="text-sm text-gray-500">Manage</p>
                </div>
              </div>
            </button>
          ) : null}

          {/* Faculty management removed for admin users */}

          {onViewLogs ? (
            <button
              onClick={onViewLogs}
              className="group/btn relative animate-slideUp delay-700 overflow-hidden rounded-xl border-2 border-red-600 bg-white p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-red-700 hover:shadow-2xl"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 transition-all duration-300 group-hover/btn:bg-red-700">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-black">View Logs</p>
                  <p className="text-sm text-gray-500">Activity</p>
                </div>
              </div>
            </button>
          ) : null}

          {onLogout ? (
            <button
              onClick={onLogout}
              className="group/btn relative animate-slideUp delay-700 overflow-hidden rounded-xl border-2 border-red-600 bg-white p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:bg-red-600 hover:shadow-2xl"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 transition-all duration-300 group-hover/btn:bg-white">
                  <svg className="h-6 w-6 text-white transition-colors duration-300 group-hover/btn:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-black transition-colors duration-300 group-hover/btn:text-white">Logout</p>
                  <p className="text-sm text-gray-500 transition-colors duration-300 group-hover/btn:text-white">Sign out</p>
                </div>
              </div>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
