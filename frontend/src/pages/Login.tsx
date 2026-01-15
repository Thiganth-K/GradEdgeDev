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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-soft)' }}>
      <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-[980px] grid-cols-1 overflow-hidden bg-white card-enterprise md:grid-cols-5">
          {/* Left brand panel */}
          <div className="relative hidden md:block md:col-span-2 left-gradient">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="relative flex h-full flex-col justify-between p-10 text-white">
              <div>
                <div className="glass-card inline-flex items-center gap-3 px-4 py-2 ring-1 ring-white/20">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-700">
                    <HiAcademicCap className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold tracking-wide">GradEdgeDev</div>
                    <div className="text-xs text-white/80">Secure access portal</div>
                  </div>
                </div>

                <h2 className="mt-8 text-3xl font-semibold leading-tight" style={{ fontFamily: 'Poppins, Inter, system-ui, sans-serif', fontSize: 32 }}>
                  Welcome back.
                  <span className="block text-white/90">Sign in to continue.</span>
                </h2>
                <p className="mt-4 max-w-sm text-sm text-white/85">
                  This login works for SuperAdmin, Admin, Institution, Contributor, Faculty, and Student accounts.
                </p>
              </div>

              <div className="text-xs text-white/70">
                <div className="mb-3">
                  <span className="role-badge">Super Admin</span>
                  <span className="role-badge">Institution</span>
                  <span className="role-badge">Faculty</span>
                  <span className="role-badge">Student</span>
                </div>
                <div className="font-medium text-white/80">Tip</div>
                <div className="mt-1">Use your Institution ID as username for Institution login.</div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="p-6 sm:p-10 md:col-span-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100 md:hidden">
                    <HiAcademicCap className="h-5 w-5" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}>Sign in</h1>
                    <p className="mt-1 text-sm text-gray-500">Access your GradEdgeDev dashboard</p>
                  </div>
                </div>
              </div>

              <div className="hidden text-right text-xs text-gray-500 sm:block">
                <div className="font-medium text-gray-700">GradEdgeDev</div>
                
              </div>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-800">Username / Institution ID</label>
                <div className="mt-2 input-wrapper">
                  <div className="relative">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="username"
                      placeholder="Enter username / institution id"
                      aria-label="Username or Institution ID"
                      className="enterprise-input w-full bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">Password</label>
                <div className="mt-2 input-wrapper">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      aria-label="Password"
                      title="Minimum 8 characters"
                      className="enterprise-input w-full bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="mt-2 field-help">Minimum 8 characters</div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <strong className="mr-2">Invalid credentials.</strong> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password}
                className="group relative flex items-center justify-center w-full overflow-hidden cta-primary"
                aria-label="Sign in"
              >
                {isSubmitting ? <span className="cta-spinner mr-2" aria-hidden="true" /> : null}
                <span className="relative">{isSubmitting ? 'Authenticating…' : 'Sign in'}</span>
              </button>

              <div className="text-left text-xs text-gray-500">
                By signing in, you agree to the platform access policy.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
