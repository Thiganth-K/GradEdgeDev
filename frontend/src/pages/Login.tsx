import React, { useState } from 'react';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Try SuperAdmin first
      let res = await fetch(`${BACKEND}/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        // store SuperAdmin token when available
        if (body.token) localStorage.setItem('superadmin_token', body.token);
        localStorage.setItem('gradedge_role', body.role || 'SuperAdmin');
        window.location.href = '/superadmin/dashboard';
        return;
      }

      // If not superadmin, try regular admin (stored in DB)
      res = await fetch(`${BACKEND}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      body = await res.json();
      if (res.ok && body.success) {
        localStorage.setItem('gradedge_role', 'admin');
        localStorage.setItem('admin_data', JSON.stringify(body.data || {}));
        if (body.token) localStorage.setItem('admin_token', body.token);
        window.location.href = '/admin/dashboard';
        return;
      }

      // If not admin, try institution login using the same username as institutionId
      res = await fetch(`${BACKEND}/institution/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId: username, password }),
      });
      body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        localStorage.setItem('gradedge_role', 'institution');
        localStorage.setItem('institution_data', JSON.stringify(body.data || {}));
        if (body.token) localStorage.setItem('institution_token', body.token);
        window.location.href = '/institution/dashboard';
        return;
      }

      setError(body.message || 'Login failed');
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-red-700">GradEdgeDev — Admin Login</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div>
            <button type="submit" className="w-full py-2 px-4 bg-red-600 text-white rounded">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
