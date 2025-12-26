import React from 'react'

const statData = [
  { label: 'Attended Tests', value: 8, change: +2 },
  { label: 'Avg Marks', value: 78, change: -1 },
  { label: 'Placement Training', value: 5, change: +1 },
  { label: 'Attendance %', value: 92, change: +3 },
]

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1)
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" className="w-full h-12">
      <polyline
        fill="none"
        stroke="#0ea5e9"
        strokeWidth={2}
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

const PerformanceOverview: React.FC = () => {
  return (
    <section className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statData.map((s) => (
          <div key={s.label} className="p-4 border rounded">
            <div className="flex justify-between items-baseline">
              <div>
                <div className="text-sm text-slate-500">{s.label}</div>
                <div className="text-2xl font-semibold">{s.value}</div>
              </div>
              <div className={`text-sm font-medium ${s.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {s.change >= 0 ? `+${s.change}` : s.change}
              </div>
            </div>
            <div className="mt-2">
              <Sparkline values={[10, 20, 15, 30, 25, 35, 40]} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm text-slate-600 mb-2">Marks Breakdown</h3>
        <div className="space-y-3">
          {/* Simple bar chart built with divs to avoid extra deps */}
          {[
            { name: 'Maths', score: 78 },
            { name: 'DSA', score: 84 },
            { name: 'DBMS', score: 72 },
            { name: 'OS', score: 80 },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-700">{m.name}</div>
              <div className="flex-1 bg-slate-100 h-3 rounded overflow-hidden">
                <div className="bg-cyan-500 h-3" style={{ width: `${m.score}%` }} />
              </div>
              <div className="w-12 text-right text-sm">{m.score}%</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PerformanceOverview
