import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';
import { HiAcademicCap } from 'react-icons/hi2';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Try SuperAdmin first
      let res = await fetch(`${BACKEND}/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let body = await safeJson(res);
      if (res.ok && body.success) {
        // store SuperAdmin token when available
        if (body.token) localStorage.setItem('superadmin_token', body.token);
        localStorage.setItem('gradedge_role', body.role || 'SuperAdmin');
        window.location.href = '/superadmin/dashboard';
        return;
      }

      // If not admin, try regular admin (stored in DB)
      res = await fetch(`${BACKEND}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      body = await safeJson(res);
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
      body = await safeJson(res);
      if (res.ok && body.success) {
        localStorage.setItem('gradedge_role', 'institution');
        localStorage.setItem('institution_data', JSON.stringify(body.data || {}));
        if (body.token) localStorage.setItem('institution_token', body.token);
        window.location.href = '/institution/dashboard';
        return;
      }

      // If not institution, try contributor login
      res = await fetch(`${BACKEND}/contributor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      body = await safeJson(res);
      if (res.ok && body.success) {
        localStorage.setItem('gradedge_role', 'contributor');
        localStorage.setItem('contributor_data', JSON.stringify(body.data || {}));
        if (body.token) localStorage.setItem('contributor_token', body.token);
        window.location.href = '/contributor/dashboard';
        return;
      }

      // If not institution, try faculty login
      res = await fetch(`${BACKEND}/institution/faculty/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      });
      body = await safeJson(res);
      if (res.ok && body.success) {
        localStorage.setItem('gradedge_role', 'faculty');
        localStorage.setItem('faculty_data', JSON.stringify(body.data || {}));
        if (body.token) localStorage.setItem('faculty_token', body.token);
        window.location.href = '/faculty/dashboard';
        return;
      }

      // If not faculty, try student login
      res = await fetch(`${BACKEND}/institution/student/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      });
      body = await safeJson(res);
      if (res.ok && body.success) {
        localStorage.setItem('gradedge_role', 'student');
        localStorage.setItem('student_data', JSON.stringify(body.data || {}));
        if (body.token) localStorage.setItem('student_token', body.token);
        window.location.href = '/student/dashboard';
        return;
      }

      setError(body?.message || 'Login failed. Please check your credentials.');
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 md:grid-cols-2">
          {/* Left brand panel */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-500" />
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="relative flex h-full flex-col justify-between p-10 text-white">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-700">
                    <HiAcademicCap className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold tracking-wide">GradEdgeDev</div>
                    <div className="text-xs text-white/80">Secure access portal</div>
                  </div>
                </div>

                <h2 className="mt-8 text-3xl font-semibold leading-tight">
                  Welcome back.
                  <span className="block text-white/90">Sign in to continue.</span>
                </h2>
                <p className="mt-4 max-w-sm text-sm text-white/85">
                  This login works for SuperAdmin, Admin, Institution, Contributor, Faculty, and Student accounts.
                </p>
              </div>

              <div className="text-xs text-white/70">
                <div className="font-medium text-white/80">Tip</div>
                <div className="mt-1">Use your Institution ID as username for Institution login.</div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100 md:hidden">
                    <HiAcademicCap className="h-5 w-5" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
                    <p className="mt-1 text-sm text-gray-500">Enter your credentials to access your dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="hidden text-right text-xs text-gray-500 sm:block">
                <div className="font-medium text-gray-700">GradEdgeDev</div>
                <div className="mt-0.5">Red & White UI</div>
              </div>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-800">Username</label>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-100">
                  <FaUser className="h-4 w-4 text-red-600" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="username"
                    placeholder="Enter username / institution id"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">Password</label>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-100">
                  <FaLock className="h-4 w-4 text-red-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={isSubmitting}
                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password}
                className="group relative w-full overflow-hidden rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background-image:linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)]" />
                <span className="relative">
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </span>
              </button>

              <div className="text-center text-xs text-gray-500">
                By signing in, you agree to follow the platform access policy.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
