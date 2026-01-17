import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Student/Sidebar';

const StudentProfile: React.FC = () => {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('student_data') : null;
  const parsed = raw ? JSON.parse(raw) : null;

  const [student, setStudent] = useState<any>(parsed || {});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      name: student?.name || '',
      username: student?.username || '',
      regno: student?.regno || '',
      dept: student?.dept || '',
      email: student?.email || '',
      phone: student?.phone || '',
      institution: student?.institution || '',
      batch: student?.batch || '',
    });
  }, [student]);

  const initials = (s: string) => (s || 'S').split(' ').map((p:any) => p[0]).slice(0,2).join('').toUpperCase();

  const handleSave = () => {
    setSaving(true);
    const updated = { ...student, ...form };
    try {
      localStorage.setItem('student_data', JSON.stringify(updated));
      setStudent(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <div className="text-sm text-gray-500">Last updated: <span className="font-medium">{student?.updatedAt ? new Date(student.updatedAt).toLocaleString() : '—'}</span></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded shadow p-6 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-red-600 text-white flex items-center justify-center text-3xl font-bold">{initials(student?.name)}</div>
                <h2 className="mt-4 text-xl font-semibold text-gray-800">{student?.name || 'Student Name'}</h2>
                <div className="text-sm text-gray-500">{student?.username || ''}</div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div><span className="font-medium text-gray-800">Reg. No:</span> {student?.regno || '—'}</div>
                  <div><span className="font-medium text-gray-800">Department:</span> {student?.dept || '—'}</div>
                  <div><span className="font-medium text-gray-800">Batch:</span> {student?.batch || '—'}</div>
                  <div><span className="font-medium text-gray-800">Institution:</span> {student?.institution || '—'}</div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <a href="/student/profile/edit" onClick={(e)=>{e.preventDefault(); setEditing(true);}} className="px-4 py-2 border rounded text-sm">Edit</a>
                  <button onClick={() => { localStorage.removeItem('student_token'); localStorage.removeItem('student_data'); window.location.reload(); }} className="px-4 py-2 bg-red-600 text-white rounded text-sm">Sign out</button>
                </div>
              </div>
            </div>

            {/* Right card - details / form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Personal Details</h3>
                  <div>
                    {!editing && (
                      <button onClick={() => setEditing(true)} className="px-3 py-1.5 border rounded text-sm text-red-600">Edit profile</button>
                    )}
                    {editing && (
                      <button onClick={() => { setEditing(false); setForm({ ...student }); }} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Full name</label>
                    <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Department</label>
                    <input value={form.dept} onChange={(e) => setForm({...form, dept: e.target.value})} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Registration No.</label>
                    <input value={form.regno} onChange={(e) => setForm({...form, regno: e.target.value})} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Batch</label>
                    <input value={form.batch} onChange={(e) => setForm({...form, batch: e.target.value})} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Institution</label>
                    <input value={form.institution} onChange={(e) => setForm({...form, institution: e.target.value})} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">Security: <a href="/student/change-password" className="text-red-600">Change password</a></div>
                  <div className="flex items-center gap-3">
                    {saved && <div className="text-sm text-green-600">Saved</div>}
                    {editing && (
                      <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{saving ? 'Saving…' : 'Save changes'}</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
