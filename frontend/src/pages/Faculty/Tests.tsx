import { useSidebar } from '../../components/Faculty/Layout'

export default function FacultyTests() {
  const { setIsMobileOpen } = useSidebar()

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Faculty — Tests (placeholder)</h1>
      <p className="text-sm text-slate-600 mt-2">Simplified placeholder to avoid build-time syntax errors.</p>
      <div className="mt-6">
        <button onClick={() => setIsMobileOpen(true)} className="px-4 py-2 bg-slate-100 rounded">Open sidebar</button>
      </div>
    </div>
  )
}
