type Props = {
  title: string
  subtitle: string
  username?: string
  loading?: boolean
  error?: string
  onLogout?: () => void
  onManage?: () => void
  onViewLogs?: () => void
}

export default function AdminWelcomeCard({
  title,
  subtitle,
  username,
  loading,
  error,
  onLogout,
  onManage,
  onViewLogs,
}: Props) {
  return (
    <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-end space-x-2">
        {onManage ? (
          <button
            onClick={onManage}
            className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-200"
          >
            Manage faculty
          </button>
        ) : null}
        {onViewLogs ? (
          <button
            onClick={onViewLogs}
            className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-200"
          >
            View logs
          </button>
        ) : null}
        {onLogout ? (
          <button
            onClick={onLogout}
            className="rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Logout
          </button>
        ) : null}
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        {loading ? (
          <p className="text-sm text-slate-600">Loading admin profile…</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">Failed to reach backend</p>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-slate-600">Signed in as</p>
            <p className="text-base font-medium text-slate-900">{username ?? 'Admin'}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Backend: <span className="font-mono">GET /api/admin/me</span>
      </p>
    </div>
  )
}
