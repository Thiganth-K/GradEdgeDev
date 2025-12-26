import React, { useState } from 'react'

const initial = [
  { id: 1, text: 'Your assignment has been graded', unread: true },
  { id: 2, text: 'Placement registration confirmed', unread: true },
  { id: 3, text: 'New announcement posted', unread: false },
]

const Notifications: React.FC = () => {
  const [items, setItems] = useState(initial)

  const markAllRead = () => setItems(items.map((i) => ({ ...i, unread: false })))

  return (
    <section className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Notifications</h2>
        <button onClick={markAllRead} className="text-sm text-slate-600">Mark all read</button>
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((n) => (
          <li key={n.id} className={`p-2 rounded ${n.unread ? 'bg-slate-100' : ''}`}>
            <div className="text-sm">{n.text}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Notifications
