import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJson, postJson, putJson, deleteJson } from '../../lib/api'

type FacultyRow = {
  username: string
  faculty_id?: string
  full_name?: string
  department?: string
}

type StudentRow = {
  name: string
  regno: string
  dept: string
  email: string
  mobile: string
}

type StudentDoc = {
  _id?: string
  full_name?: string
  enrollment_id?: string
  department?: string
  email?: string
  mobile?: string
  faculty_id?: string
  faculty_username?: string
}

type BatchRow = {
  batch_code: string
  name?: string
  department?: string
  year?: string
  section?: string
  faculty_id?: string
}

type Props = {
  username?: string
  institutionId?: string
}

export default function BatchManagement({ username, institutionId: propInstitutionId }: Props) {
  const navigate = useNavigate()
  const [institutionId] = useState(propInstitutionId || username || '')
  
  const [facultyList, setFacultyList] = useState<FacultyRow[]>([])
  const [batches, setBatches] = useState<BatchRow[]>([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [editBatchCode, setEditBatchCode] = useState('')
  const [editForm, setEditForm] = useState<BatchRow | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [batchForm, setBatchForm] = useState<BatchRow>({ batch_code: '', name: '', department: '', year: '', section: '', faculty_id: '' })
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchSubmitError, setBatchSubmitError] = useState<string | null>(null)
  const [batchSubmitSuccess, setBatchSubmitSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!institutionId) return
    void loadFaculty()
    void loadBatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId])

  async function loadFaculty() {
    if (!institutionId) return
    const res = await getJson<{ ok: boolean; data: FacultyRow[]; error?: string }>(
      `/api/institutional/${institutionId}/faculty`,
    )
    if (res.ok && res.data.ok) {
      setFacultyList(res.data.data)
    }
  }

  async function loadBatches() {
    if (!institutionId) return
    setBatchesLoading(true)
    const res = await getJson<{ ok: boolean; data: BatchRow[]; error?: string }>(
      `/api/institutional/${institutionId}/batches`,
    )
    if (res.ok && res.data.ok) {
      setBatches(res.data.data || [])
    }
    setBatchesLoading(false)
  }

  // faculty assignment helper moved to StudentManagement

  function updateBatchField(field: keyof BatchRow, value: string) {
    setBatchForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmitBatch() {
    setBatchSubmitError(null)
    setBatchSubmitSuccess(null)
    if (!institutionId) {
      setBatchSubmitError('Institution ID is required')
      return
    }
    if (!batchForm.batch_code) {
      setBatchSubmitError('Batch code is required')
      return
    }
    if (!batchForm.faculty_id) {
      setBatchSubmitError('Assign a faculty to make it visible in their dashboard')
      return
    }

    setBatchSubmitting(true)
    const payload = {
      batch_code: batchForm.batch_code.trim(),
      name: batchForm.name?.trim() || undefined,
      department: batchForm.department?.trim() || undefined,
      year: batchForm.year?.trim() || undefined,
      section: batchForm.section?.trim() || undefined,
      faculty_id: batchForm.faculty_id,
    }

    const res = await postJson<{ ok: boolean; data?: BatchRow; error?: string }, typeof payload>(
      `/api/institutional/${institutionId}/batches`,
      payload,
      { headers: { 'x-requested-by': 'institutional' } },
    )
    setBatchSubmitting(false)

    if (!res.ok || !res.data.ok) {
      setBatchSubmitError(res.ok ? res.data.error || 'Unable to create batch' : res.error || 'Network error')
      return
    }

    setBatchSubmitSuccess('Batch created')
    setBatchForm({ batch_code: '', name: '', department: '', year: '', section: '', faculty_id: '' })
    void loadBatches()
  }

  

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="h-1.5 w-full bg-red-600 animate-pulse" />
      
      {/* Header */}
      <div className="border-b-4 border-red-600 bg-red-600 px-6 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-slideUp">
              <button
                onClick={() => navigate('/institutional/welcome')}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white transition-all duration-300 hover:scale-110"
              >
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
                <p className="mt-1 text-sm text-white opacity-90">Create and manage batches for your institution</p>
                {institutionId && (
                  <p className="mt-1 text-xs text-white/80">Institution ID: {institutionId}</p>
                )}
              </div>
            </div>
            
            <div className="animate-slideInRight delay-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white ring-2 ring-white/20">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-lg border-2 border-red-600 bg-white p-6 shadow-xl mb-8 animate-scaleIn">
          <h2 className="text-xl font-bold text-black mb-4">Create Batch</h2>
          <p className="text-sm text-gray-600 mb-6">Create a batch and assign it to a faculty. It will appear on that faculty dashboard.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Batch code *</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.batch_code}
                onChange={(e) => updateBatchField('batch_code', e.target.value)}
                placeholder="CSE-2026-A"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Batch name</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.name || ''}
                onChange={(e) => updateBatchField('name', e.target.value)}
                placeholder="Computer Science 2026 A"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.department || ''}
                onChange={(e) => updateBatchField('department', e.target.value)}
                placeholder="CSE"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                  value={batchForm.year || ''}
                  onChange={(e) => updateBatchField('year', e.target.value)}
                  placeholder="2026"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                  value={batchForm.section || ''}
                  onChange={(e) => updateBatchField('section', e.target.value)}
                  placeholder="A"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to faculty *</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-red-600 focus:outline-none"
                value={batchForm.faculty_id || ''}
                onChange={(e) => updateBatchField('faculty_id', e.target.value)}
              >
                <option value="">Select faculty</option>
                {facultyList.map((f) => (
                  <option key={f.username} value={f.faculty_id || ''}>
                    {(f.faculty_id || f.username) + (f.full_name ? ` — ${f.full_name}` : '')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {batchSubmitError && <div className="mt-4 text-sm text-red-600 font-semibold">{batchSubmitError}</div>}
          {batchSubmitSuccess && <div className="mt-4 text-sm text-green-600 font-semibold">{batchSubmitSuccess}</div>}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onSubmitBatch}
              disabled={batchSubmitting}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {batchSubmitting ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">Existing Batches</h3>
            <button
              type="button"
              onClick={() => void loadBatches()}
              className="text-sm text-red-600 font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>
          {batchesLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : batches.length === 0 ? (
            <div className="text-sm text-gray-600">No batches yet. Create one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="py-2 px-3">Batch Code</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Section</th>
                    <th className="py-2 px-3">Faculty</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => (
                    <tr key={b.batch_code}>
                      <td className="py-2 px-3 font-semibold text-gray-900">{b.batch_code}</td>
                      <td className="py-2 px-3 text-gray-800">{b.name || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.department || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.year || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.section || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">{b.faculty_id || '-'}</td>
                      <td className="py-2 px-3 text-gray-800">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditBatchCode(b.batch_code)
                              setEditForm({ ...b })
                              setEditError(null)
                            }}
                            className="text-sm text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!institutionId) return alert('Institution ID missing')
                              if (!confirm(`Delete batch ${b.batch_code}? This cannot be undone.`)) return
                              try {
                                setDeleteLoading(b.batch_code)
                                const res = await deleteJson<{
                                  ok: boolean
                                  error?: string
                                  reason?: 'not_found' | 'belongs_to_other' | 'unknown' | 'diag_error'
                                }>(
                                  `/api/institutional/${institutionId}/batches/${encodeURIComponent(b.batch_code)}`,
                                  { headers: { 'x-requested-by': 'institutional' } },
                                )
                                setDeleteLoading(null)

                                if (!res.ok) {
                                  // Network or HTTP error
                                  alert(res.error || `Delete failed (${res.status || 'error'})`)
                                  return
                                }

                                if (!res.data.ok) {
                                  // Handle diagnostic reason from server
                                  const reason = res.data.reason
                                  if (reason === 'not_found') {
                                    alert('Delete failed: batch not found')
                                  } else if (reason === 'belongs_to_other') {
                                    alert('Delete failed: batch belongs to a different institution')
                                  } else if (reason === 'diag_error') {
                                    alert('Delete failed: server diagnostics error')
                                  } else {
                                    alert(res.data.error || 'Delete failed')
                                  }
                                  return
                                }
                                void loadBatches()
                              } catch (err) {
                                setDeleteLoading(null)
                                alert('Delete failed')
                              }
                            }}
                            className="text-sm text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700"
                          >
                            {deleteLoading === b.batch_code ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Edit Batch Modal */}
          {editForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Edit Batch {editBatchCode}</h3>
                  <button onClick={() => setEditForm(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <input className="w-full border-2 border-gray-300 rounded-lg px-4 py-2" value={editForm.name || ''} onChange={(e) => setEditForm(prev => prev ? ({ ...prev, name: e.target.value }) : prev)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                    <input className="w-full border-2 border-gray-300 rounded-lg px-4 py-2" value={editForm.department || ''} onChange={(e) => setEditForm(prev => prev ? ({ ...prev, department: e.target.value }) : prev)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                    <input className="w-full border-2 border-gray-300 rounded-lg px-4 py-2" value={editForm.year || ''} onChange={(e) => setEditForm(prev => prev ? ({ ...prev, year: e.target.value }) : prev)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                    <input className="w-full border-2 border-gray-300 rounded-lg px-4 py-2" value={editForm.section || ''} onChange={(e) => setEditForm(prev => prev ? ({ ...prev, section: e.target.value }) : prev)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to faculty</label>
                    <select className="w-full border-2 border-gray-300 rounded-lg px-4 py-2" value={editForm.faculty_id || ''} onChange={(e) => setEditForm(prev => prev ? ({ ...prev, faculty_id: e.target.value }) : prev)}>
                      <option value="">Select faculty</option>
                      {facultyList.map(f => (
                        <option key={f.username} value={f.faculty_id || ''}>{(f.faculty_id || f.username) + (f.full_name ? ` — ${f.full_name}` : '')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {editError && <div className="mt-4 text-sm text-red-600">{editError}</div>}

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setEditForm(null)} className="px-4 py-2 border rounded">Cancel</button>
                  <button
                    onClick={async () => {
                      if (!institutionId || !editBatchCode || !editForm) return
                      setEditSaving(true)
                      setEditError(null)
                      try {
                        const payload = {
                          name: editForm.name || undefined,
                          department: editForm.department || undefined,
                          year: editForm.year || undefined,
                          section: editForm.section || undefined,
                          faculty_id: editForm.faculty_id || undefined,
                        }
                        const res = await putJson<{ ok: boolean; data?: BatchRow; error?: string }, typeof payload>(
                          `/api/institutional/${institutionId}/batches/${encodeURIComponent(
                            editBatchCode,
                          )}`,
                          payload,
                          { headers: { 'x-requested-by': 'institutional' } },
                        )
                        setEditSaving(false)
                        if (!res.ok || !res.data.ok) {
                          setEditError(res.ok ? res.data.error || 'Update failed' : res.error || 'Network error')
                          return
                        }
                        setEditForm(null)
                        void loadBatches()
                      } catch (err) {
                        setEditSaving(false)
                        setEditError('Update failed')
                      }
                    }}
                    disabled={editSaving}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    {editSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Student bulk-create moved to StudentManagement page */}
      </div>
    </div>
  )
}
