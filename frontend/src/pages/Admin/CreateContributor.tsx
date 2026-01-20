import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import makeHeaders from '../../lib/makeHeaders';

const CreateContributor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = (typeof window !== 'undefined') ? (localStorage.getItem('admin_token') || localStorage.getItem('superadmin_token')) : '';

  useEffect(() => {
    if (isEditMode && id) {
      fetchContributor();
    }
  }, [id]);

  const fetchContributor = async () => {
    try {
      const res = await apiFetch(`/admin/contributors/${id}`, {
        headers: makeHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.data) {
        const c = body.data;
        setUsername(c.username || '');
        setFname(c.fname || '');
        setLname(c.lname || '');
        setContact(c.contact || '');
        setEmail(c.email || '');
      }
    } catch (err: any) {
      setMsg(err.message || 'Failed to load contributor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      let res;
      if (isEditMode) {
        res = await apiFetch(`/admin/contributors/${id}`, {
          method: 'PUT',
          headers: makeHeaders('admin_token','application/json'),
          body: JSON.stringify({ username, fname, lname, contact, email, password: password || undefined }),
        });
      } else {
        res = await apiFetch('/admin/contributors', {
          method: 'POST',
          headers: makeHeaders('admin_token','application/json'),
          body: JSON.stringify({ username, password, fname, lname, contact, email }),
        });
      }
      
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || (isEditMode ? 'Failed to update contributor' : 'Failed to create contributor'));
        setLoading(false);
        return;
      }
      
      navigate('/admin/contributors');
    } catch (err: any) {
      setMsg(err.message || 'Network error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/contributors')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Contributors</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditMode ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Contributor' : 'Create New Contributor'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEditMode ? 'Update contributor information' : 'Add a new content contributor to the platform'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <h2 className="text-lg font-bold text-white">Contributor Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {msg && (
              <div className={`mb-6 text-sm p-3 rounded-lg ${
                msg.includes('error') || msg.includes('Failed') || msg.includes('failed') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {msg}
              </div>
            )}

            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Basic Information
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter username" 
                    value={username} 
                    onChange={(e)=>setUsername(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password {isEditMode && <span className="text-gray-500 font-normal">(optional)</span>}
                    {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="password"
                    placeholder={isEditMode ? "Leave blank to keep current" : "Enter password"} 
                    value={password} 
                    onChange={(e)=>setPassword(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required={!isEditMode}
                  />
                </div>
              </div>

              {/* Middle Column - Name */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    Personal Details
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="First name" 
                    value={fname} 
                    onChange={(e)=>setFname(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Last name" 
                    value={lname} 
                    onChange={(e)=>setLname(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    required 
                  />
                </div>
              </div>

              {/* Right Column - Contact */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
                  <input 
                    type="text"
                    placeholder="Phone number" 
                    value={contact} 
                    onChange={(e)=>setContact(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="email@example.com" 
                    value={email} 
                    onChange={(e)=>setEmail(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditMode ? 'Update Contributor' : 'Create Contributor'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/contributors')}
                disabled={loading}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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

export default CreateContributor;
