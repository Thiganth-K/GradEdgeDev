import React from 'react'

const announcements = [
  { id: 1, title: 'Semester Exams', body: 'Semester exams start from Jan 15. Check syllabus.' },
  { id: 2, title: 'Placement Drive', body: 'Top companies visiting campus next month. Register now.' },
]

const AnnouncementPanel: React.FC = () => {
  return (
    <section className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Announcements</h2>
        <button className="text-sm text-cyan-600">See all</button>
      </div>

      <ul className="mt-3 space-y-3">
        {announcements.map((a) => (
          <li key={a.id} className="border p-3 rounded hover:bg-slate-50">
            <div className="font-semibold">{a.title}</div>
            <div className="text-sm text-slate-600">{a.body}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AnnouncementPanel
