import React, { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AnnouncementCreate: React.FC = () => {
  const [message, setMessage] = useState('');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedFac, setSelectedFac] = useState<string[]>([]);
  const [selectedStu, setSelectedStu] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [sendAllFac, setSendAllFac] = useState(false);
  const [sendAllStu, setSendAllStu] = useState(false);
  const [sendAllBatch, setSendAllBatch] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const token = localStorage.getItem('institution_token') || '';

  const makeHeaders = (contentType = false) => {
    const h: Record<string, string> = {};
    if (contentType) h['Content-Type'] = 'application/json';
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, sRes, bRes] = await Promise.all([
          fetch(`${BACKEND}/institution/faculties`, { headers: makeHeaders() }),
          fetch(`${BACKEND}/institution/students`, { headers: makeHeaders() }),
          fetch(`${BACKEND}/institution/batches`, { headers: makeHeaders() }),
        ]);
        const fBody = await fRes.json().catch(() => ({}));
        const sBody = await sRes.json().catch(() => ({}));
        const bBody = await bRes.json().catch(() => ({}));
        if (fRes.ok) setFaculties(fBody.data || []);
        if (sRes.ok) setStudents(sBody.data || []);
        if (bRes.ok) setBatches(bBody.data || []);
      } catch (err) {
        // ignore – lists may be empty
      }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch(`${BACKEND}/institution/announcements`, {
        method: 'POST',
        headers: makeHeaders(true),
        body: JSON.stringify({
          message,
          targetFacultyIds: selectedFac,
          targetStudentIds: selectedStu,
          targetBatchIds: selectedBatch,
          sendToAllFaculty: sendAllFac,
          sendToAllStudents: sendAllStu,
          sendToAllBatches: sendAllBatch,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(body.message || 'Failed to create announcement'); return; }
      setMsg('Announcement created'); setMessage(''); setSelectedFac([]); setSelectedStu([]); setSelectedBatch([]);
    } catch (err: any) { setMsg(err.message || 'Network error'); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create Announcement</h2>
      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}
      <form onSubmit={submit} className="space-y-3 bg-white p-4 rounded shadow">
        <textarea placeholder="Message" value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full border p-2 rounded h-28" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold">Faculty</label>
            <div className="mt-2">
              <label className="flex items-center"><input type="checkbox" checked={sendAllFac} onChange={(e)=>setSendAllFac(e.target.checked)} /> <span className="ml-2">Send to all faculty</span></label>
              {!sendAllFac && faculties.map(f => (
                <label key={f._id} className="flex items-center mt-1"><input type="checkbox" checked={selectedFac.includes(f._id)} onChange={(e)=>{
                  if (e.target.checked) setSelectedFac([...selectedFac, f._id]); else setSelectedFac(selectedFac.filter(x=>x!==f._id));
                }} /> <span className="ml-2">{f.username} ({f.role})</span></label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold">Students</label>
            <div className="mt-2">
              <label className="flex items-center"><input type="checkbox" checked={sendAllStu} onChange={(e)=>setSendAllStu(e.target.checked)} /> <span className="ml-2">Send to all students</span></label>
              {!sendAllStu && students.map(s => (
                <label key={s._id} className="flex items-center mt-1"><input type="checkbox" checked={selectedStu.includes(s._id)} onChange={(e)=>{
                  if (e.target.checked) setSelectedStu([...selectedStu, s._id]); else setSelectedStu(selectedStu.filter(x=>x!==s._id));
                }} /> <span className="ml-2">{s.username} {s.name ? `(${s.name})` : ''}</span></label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold">Batches</label>
            <div className="mt-2">
              <label className="flex items-center"><input type="checkbox" checked={sendAllBatch} onChange={(e)=>setSendAllBatch(e.target.checked)} /> <span className="ml-2">Send to all batches</span></label>
              {!sendAllBatch && batches.map(b => (
                <label key={b._id} className="flex items-center mt-1"><input type="checkbox" checked={selectedBatch.includes(b._id)} onChange={(e)=>{
                  if (e.target.checked) setSelectedBatch([...selectedBatch, b._id]); else setSelectedBatch(selectedBatch.filter(x=>x!==b._id));
                }} /> <span className="ml-2">{b.name}</span></label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <button className="px-4 py-2 bg-red-600 text-white rounded">Send Announcement</button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementCreate;
