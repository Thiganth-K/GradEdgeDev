import React from 'react'

const notices = [
  { id: 1, title: 'Lab Maintenance', date: '2025-12-27', content: 'Computer lab will be closed for maintenance from 10am-2pm.' },
  { id: 2, title: 'Project Submission', date: '2026-01-05', content: 'Submit group projects via LMS by midnight.' },
]

const NoticeBoard: React.FC = () => {
  return (
    <section className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium mb-3">Notice Board</h2>
      <div className="space-y-3">
        {notices.map((n) => (
          <article key={n.id} className="p-3 border rounded">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{n.title}</div>
              <div className="text-sm text-slate-500">{n.date}</div>
            </div>
            <p className="text-sm text-slate-700 mt-1">{n.content}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default NoticeBoard
