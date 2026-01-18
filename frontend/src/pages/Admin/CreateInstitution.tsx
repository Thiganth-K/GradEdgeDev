import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CreateInstitution: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    institutionId: '',
    password: '',
    location: '',
    contactNo: '',
    email: '',
    facultyLimit: '',
    studentLimit: '',
    batchLimit: '',
    testLimit: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = (typeof window !== 'undefined') ? (localStorage.getItem('admin_token') || localStorage.getItem('superadmin_token')) : null;
    const payload: any = { ...form };
    ['facultyLimit', 'studentLimit', 'batchLimit', 'testLimit'].forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });

    const postHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) postHeaders.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${BACKEND}/admin/institutions`, {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert('Institution created successfully!');
        navigate('/admin/institutions');
      } else {
        alert(data.message || 'Failed to create institution');
      }
    } catch (error) {
      console.error('Error creating institution:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Create New Institution</h2>
              <p className="text-sm text-gray-500">Fill in the details to add a new institution</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/institutions')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-gray-700">Basic Information</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="e.g., MIT University"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Institution ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.institutionId}
                    onChange={(e) => setForm({ ...form, institutionId: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="e.g., MIT001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Middle Column - Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-semibold text-gray-700">Contact Details</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="e.g., Boston, MA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={form.contactNo}
                    onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="e.g., +1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="e.g., admin@mit.edu"
                  />
                </div>
              </div>

              {/* Right Column - Resource Limits */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="font-semibold text-gray-700">Resource Limits</h3>
                </div>
                <p className="text-xs text-gray-500 -mt-2 mb-2">Leave empty for unlimited access</p>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Faculty Limit
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.facultyLimit}
                    onChange={(e) => setForm({ ...form, facultyLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="∞"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Student Limit
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.studentLimit}
                    onChange={(e) => setForm({ ...form, studentLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="∞"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Batch Limit
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.batchLimit}
                    onChange={(e) => setForm({ ...form, batchLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="∞"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Test Limit
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.testLimit}
                    onChange={(e) => setForm({ ...form, testLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="∞"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Institution...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Institution
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/institutions')}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInstitution;
