import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Building2, GraduationCap, Calendar, Save, Edit2 } from 'lucide-react'
import StudentLayout from '../../components/Student/StudentLayout'
import { getJson, postJson, putJson } from '../../lib/api'

interface ProfileProps {
  username: string
  onLogout: () => void
}

interface StudentProfile {
  username: string
  enrollment_id: string
  full_name: string
  email: string
  mobile: string
  department: string
  institutional_id: string
  faculty_id?: string
  faculty_username?: string
  role: string
}

const Profile: React.FC<ProfileProps> = ({ username, onLogout }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sidebar controls
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Username/Password change state
  const [showCredentialsChange, setShowCredentialsChange] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [changingCredentials, setChangingCredentials] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [username])

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  async function loadProfile() {
    setLoading(true)
    setError(null)

    try {
      const res = await getJson<{ ok: boolean; data?: StudentProfile; error?: string }>(
        `/api/student/${username}`
      )

      if (res.ok) {
        if (res.data.ok && res.data.data) {
          setProfile(res.data.data)
        } else {
          setError(res.data.error || 'Failed to load profile')
        }
      } else {
        setError(res.error || 'Failed to load profile')
      }
    } catch (err) {
      setError('Network error while loading profile')
    } finally {
      setLoading(false)
    }
  }

  async function sendOTP() {
    if (!profile?.email) {
      setError('Email not found. Cannot send OTP.')
      return
    }

    setError(null)
    setChangingCredentials(true)

    try {
      const res = await postJson<{ ok: boolean; error?: string }, { email: string }>(
        `/api/student/${username}/send-otp`,
        { email: profile.email }
      )

      if (res.ok && res.data.ok) {
        setOtpSent(true)
        setOtpTimer(60)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setError(res.ok ? res.data.error || 'Failed to send OTP' : res.error || 'Network error')
      }
    } catch (err) {
      setError('Failed to send OTP')
    } finally {
      setChangingCredentials(false)
    }
  }

  async function verifyOTP() {
    if (!otp || otp.length !== 4) {
      setError('Please enter 4-digit OTP')
      return
    }

    setError(null)
    setChangingCredentials(true)

    try {
      const res = await postJson<{ ok: boolean; error?: string }, { otp: string }>(
        `/api/student/${username}/verify-otp`,
        { otp }
      )

      if (res.ok && res.data.ok) {
        setOtpVerified(true)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setError(res.ok ? res.data.error || 'Invalid OTP' : res.error || 'Network error')
      }
    } catch (err) {
      setError('Failed to verify OTP')
    } finally {
      setChangingCredentials(false)
    }
  }

  async function saveCredentials() {
    if (!newUsername && !newPassword) {
      setError('Please enter new username or password')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setChangingCredentials(true)

    try {
      const payload: { new_username?: string; new_password?: string } = {}

      if (newUsername.trim()) payload.new_username = newUsername.trim()
      if (newPassword.trim()) payload.new_password = newPassword.trim()

      const res = await putJson<{ ok: boolean; data?: { username?: string }; error?: string }, typeof payload>(
        `/api/student/${username}/update-credentials`,
        payload
      )

      if (res.ok && res.data.ok) {
        setSaveSuccess(true)

        // If username changed, update localStorage and reload
        if (res.data.data?.username) {
          localStorage.setItem('username', res.data.data.username)
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        } else {
          setTimeout(() => {
            setSaveSuccess(false)
            resetCredentialsForm()
          }, 3000)
        }
      } else {
        setError(res.ok ? res.data.error || 'Failed to update credentials' : res.error || 'Network error')
      }
    } catch (err) {
      setError('Failed to update credentials')
    } finally {
      setChangingCredentials(false)
    }
  }

  function resetCredentialsForm() {
    setShowCredentialsChange(false)
    setNewUsername('')
    setNewPassword('')
    setConfirmPassword('')
    setOtp('')
    setOtpSent(false)
    setOtpVerified(false)
    setOtpTimer(0)
    setError(null)
  }

  if (loading) {
    return (
      <StudentLayout 
        username={username} 
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      >
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (error && !profile) {
    return (
      <StudentLayout 
        username={username} 
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      >
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border-2 border-red-600 rounded-lg p-6 text-center">
              <p className="text-red-700 font-semibold">{error}</p>
              <button
                onClick={loadProfile}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout 
      username={username} 
      onLogout={onLogout}
      isCollapsed={isSidebarCollapsed}
      toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      isMobileOpen={isMobileSidebarOpen}
      setIsMobileOpen={setIsMobileSidebarOpen}
    >
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-red-50 text-lg">Manage your personal information</p>
            </div>
            <div className="bg-white rounded-full p-4">
              <User className="w-12 h-12 text-red-600" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-600 rounded-lg p-4 animate-fadeIn">
            <p className="text-green-700 font-semibold text-center">
              ✓ {otpSent && !showCredentialsChange ? 'OTP sent to your email!' : 'Updated successfully!'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-600 rounded-lg p-4">
            <p className="text-red-700 font-semibold text-center">{error}</p>
          </div>
        )}

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl border-2 border-red-600">
            {/* Profile Header */}
            <div className="p-6 border-b-2 border-red-600 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-600 rounded-full p-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{profile?.full_name || ''}</h2>
                    <p className="text-red-600 font-semibold">{profile?.enrollment_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCredentialsChange(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Update Credentials</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 text-red-600" />
                    <span>Username</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg">
                    <p className="text-gray-600 font-medium">{profile?.username || '—'}</p>
                  </div>
                </div>

                {/* Password (masked) */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Mail className="w-4 h-4 text-red-600" />
                    <span>Password</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg">
                    <p className="text-gray-600 font-medium">••••••••</p>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 text-red-600" />
                    <span>Full Name</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">{profile?.full_name || '—'}</p>
                  </div>
                </div>

                {/* Enrollment ID (Read-only) */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <GraduationCap className="w-4 h-4 text-red-600" />
                    <span>Enrollment ID</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg">
                    <p className="text-gray-600 font-medium">{profile?.enrollment_id || '—'}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Mail className="w-4 h-4 text-red-600" />
                    <span>Email Address</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">{profile?.email || '—'}</p>
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Phone className="w-4 h-4 text-red-600" />
                    <span>Mobile Number</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">{profile?.mobile || '—'}</p>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Building2 className="w-4 h-4 text-red-600" />
                    <span>Department</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">{profile?.department || '—'}</p>
                  </div>
                </div>

                {/* Institution ID (Read-only) */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Building2 className="w-4 h-4 text-red-600" />
                    <span>Institution ID</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg">
                    <p className="text-gray-600 font-medium">{profile?.institutional_id || '—'}</p>
                  </div>
                </div>

                {/* Faculty Info (if assigned) */}
                {profile?.faculty_id && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <User className="w-4 h-4 text-red-600" />
                      <span>Assigned Faculty</span>
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                      <p className="text-gray-800 font-medium">
                        {profile.faculty_id} {profile.faculty_username && `(${profile.faculty_username})`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="mt-6 bg-white rounded-lg shadow-xl border-2 border-red-600 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-red-600" />
              <span>Account Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="text-gray-800 font-semibold">{profile?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-gray-800 font-semibold capitalize">{profile?.role}</p>
              </div>
            </div>
          </div>

          {/* Update Credentials Modal */}
          {showCredentialsChange && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl border-2 border-red-600 max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="p-6 border-b-2 border-red-600 bg-red-50">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <Edit2 className="w-5 h-5 text-red-600" />
                    <span>Update Credentials</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Verify your identity with a 4-digit OTP sent to your email (valid for 1 minute).
                  </p>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  {!otpVerified ? (
                    <>
                      {!otpSent ? (
                        <div className="flex flex-col space-y-3">
                          <button
                            onClick={sendOTP}
                            disabled={changingCredentials}
                            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 w-full"
                          >
                            <Mail className="w-4 h-4" />
                            <span>{changingCredentials ? 'Sending...' : 'Send OTP to Verify'}</span>
                          </button>
                          <button
                            onClick={resetCredentialsForm}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4">
                            <p className="text-blue-700 font-semibold text-sm">
                              OTP sent to {profile?.email}. Valid for {otpTimer} seconds.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Enter 4-Digit OTP</label>
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              maxLength={4}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none text-center text-2xl font-bold tracking-widest"
                              placeholder="----"
                            />
                          </div>

                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={verifyOTP}
                              disabled={changingCredentials || otpTimer === 0 || otp.length !== 4}
                              className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 w-full"
                            >
                              <span>{changingCredentials ? 'Verifying...' : 'Verify OTP'}</span>
                            </button>
                            <button
                              onClick={resetCredentialsForm}
                              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4">
                        <p className="text-green-700 font-semibold text-sm">
                          ✓ Identity verified! You can now update your credentials.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">New Username (optional)</label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                          placeholder="Enter new username"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">New Password (optional)</label>
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                        <input
                          type="text"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={saveCredentials}
                          disabled={changingCredentials || (!newUsername && !newPassword)}
                          className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 w-full"
                        >
                          <Save className="w-4 h-4" />
                          <span>{changingCredentials ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                        <button
                          onClick={resetCredentialsForm}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  )
}

export default Profile
