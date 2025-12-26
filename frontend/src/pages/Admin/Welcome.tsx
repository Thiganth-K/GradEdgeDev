import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminWelcomeCard from '../../components/Admin/AdminWelcomeCard.tsx'
import AdminLogs from '../../components/Admin/AdminLogs'
import { getJson } from '../../lib/api'

type AdminMeResponse = {
  username: string
  greeting?: string
}

type Props = {
  username?: string
  fallbackUsername?: string
  onLogout?: () => void
}

export default function AdminWelcomePage({ username: propUsername, fallbackUsername, onLogout }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const [data, setData] = useState<AdminMeResponse | undefined>(undefined)
  const [showLogs, setShowLogs] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(undefined)

      const result = await getJson<AdminMeResponse>('/api/admin/me')

      if (cancelled) return

      if (!result.ok) {
        setError(result.error)
        setData(undefined)
      } else {
        setData(result.data)
      }

      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const subtitle = data?.greeting ?? 'Welcome to the admin dashboard.'
  const username = data?.username ?? propUsername ?? fallbackUsername

  function handleManage() {
    navigate('/faculty/manage')
  }

  function handleManageInstitutional() {
    navigate('/admin/institutional')
  }

  function handleViewLogs() {
    setShowLogs((s) => !s)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
      <AdminWelcomeCard
        title="Admin Welcome"
        subtitle={subtitle}
        username={username}
        loading={loading}
        error={error}
        onLogout={onLogout}
        onManage={handleManage}
        onManageInstitutional={handleManageInstitutional}
        onViewLogs={handleViewLogs}
      />

      {showLogs ? <AdminLogs /> : null}
    </main>
  )
}
