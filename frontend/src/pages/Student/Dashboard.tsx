import React, { useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { TrendingUp, Bell, Calendar, Flame, Target, Award, BookOpen, Code, Users, Clock, CheckCircle2, Activity, Video, X } from 'lucide-react'
import StudentLayout from '../../components/Student/StudentLayout'

interface DashboardProps {
  username: string
  onLogout: () => void
}

interface Announcement {
  id: number
  title: string
  description: string
  date: string
  category: string
}

const Dashboard: React.FC<DashboardProps> = ({ username, onLogout }) => {
  // 360° Readiness Analysis Data
  const radarData = [
    { subject: 'Aptitude', score: 85, fullMark: 100, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50' },
    { subject: 'Coding', score: 72, fullMark: 100, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { subject: 'Soft Skills', score: 75, fullMark: 100, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50' },
    { subject: 'Domain', score: 80, fullMark: 100, color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-50' },
    { subject: 'Projects', score: 85, fullMark: 100, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
  ]

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUpcomingSessions, setShowUpcomingSessions] = useState(false)

  // Notifications
  const notifications = [
    { id: 1, title: 'New Assessment Available', message: 'Java Programming Assessment is now live', time: '5 min ago', type: 'info', read: false },
    { id: 2, title: 'Mock Interview Scheduled', message: 'Your interview is scheduled for tomorrow at 2 PM', time: '1 hour ago', type: 'success', read: false },
    { id: 3, title: 'Assignment Due Soon', message: 'Project report submission deadline is tomorrow', time: '3 hours ago', type: 'warning', read: true },
    { id: 4, title: 'Achievement Unlocked!', message: 'You completed 15-day streak. Keep it up!', time: '1 day ago', type: 'success', read: true },
  ]

  // Upcoming Sessions
  const upcomingSessions = [
    { id: 1, title: 'System Design Workshop', instructor: 'Dr. Sarah Johnson', time: 'Today, 3:00 PM', duration: '2 hours', type: 'Workshop', color: 'bg-blue-500' },
    { id: 2, title: 'Mock Interview Round 1', instructor: 'Tech Recruiter', time: 'Tomorrow, 2:00 PM', duration: '1 hour', type: 'Interview', color: 'bg-purple-500' },
    { id: 3, title: 'React.js Advanced Topics', instructor: 'Prof. Michael Chen', time: 'Dec 28, 10:00 AM', duration: '3 hours', type: 'Class', color: 'bg-green-500' },
    { id: 4, title: 'Resume Review Session', instructor: 'Career Counselor', time: 'Dec 29, 4:00 PM', duration: '30 min', type: 'Counseling', color: 'bg-orange-500' },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  // Announcements
  const announcements: Announcement[] = [
    { 
      id: 1,
      title: 'Campus Placement Drive - Tech Giants', 
      description: 'Major tech companies visiting campus next week. Prepare your resumes and technical skills.',
      date: 'Dec 28, 2025',
      category: 'Placement'
    },
    { 
      id: 2,
      title: 'Mock Interview Session', 
      description: 'Register for the mock interview sessions scheduled for this weekend.',
      date: 'Dec 27, 2025',
      category: 'Training'
    },
    { 
      id: 3,
      title: 'Coding Contest - Winter Challenge', 
      description: 'Participate in the annual winter coding challenge. Prizes for top performers!',
      date: 'Dec 30, 2025',
      category: 'Contest'
    },
    { 
      id: 4,
      title: 'Resume Building Workshop', 
      description: 'Learn to create an impactful resume. Limited seats available.',
      date: 'Jan 02, 2026',
      category: 'Workshop'
    },
  ]

  // Track read announcements and notice board paging/preview
  const [readAnnouncements, setReadAnnouncements] = useState<Set<number>>(new Set())
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0) // start index for current page
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null)

  const toggleReadStatus = (id: number) => {
    setReadAnnouncements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Performance Stats
  const stats = [
    { label: 'Current Streak', value: '15', unit: 'days', icon: Flame, color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Attendance', value: '92', unit: '%', icon: CheckCircle2, color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Tests Completed', value: '24', unit: 'tests', icon: Target, color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Avg Score', value: '78', unit: '%', icon: Award, color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  ]

  // Weekly Activity Data
  const weeklyActivity = [
    { day: 'Mon', hours: 3.5, tests: 2 },
    { day: 'Tue', hours: 4.2, tests: 3 },
    { day: 'Wed', hours: 2.8, tests: 1 },
    { day: 'Thu', hours: 5.1, tests: 4 },
    { day: 'Fri', hours: 3.9, tests: 2 },
    { day: 'Sat', hours: 6.2, tests: 5 },
    { day: 'Sun', hours: 4.5, tests: 3 },
  ]

  // Recent Activities
  const recentActivities = [
    { title: 'Completed Coding Assessment', time: '2 hours ago', type: 'success', icon: Code },
    { title: 'Attended Mock Interview', time: '5 hours ago', type: 'info', icon: Users },
    { title: 'Submitted Project Report', time: '1 day ago', type: 'success', icon: BookOpen },
    { title: 'Missed Aptitude Test', time: '2 days ago', type: 'warning', icon: Clock },
  ]

  // Improvement Areas
  const improvementAreas = [
    { area: 'Dynamic Programming', current: 45, target: 80, priority: 'High' },
    { area: 'System Design', current: 60, target: 85, priority: 'Medium' },
    { area: 'Communication Skills', current: 70, target: 90, priority: 'Medium' },
  ]

  return (
    <StudentLayout username={username} onLogout={onLogout}>
      <div className="p-6 bg-gray-50 min-h-screen">
        
        {/* Top Bar with Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          {/* Upcoming Sessions Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUpcomingSessions(!showUpcomingSessions)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <Video className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Upcoming Sessions</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {upcomingSessions.length}
              </span>
            </button>

            {/* Upcoming Sessions Dropdown */}
            {showUpcomingSessions && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fadeIn">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h3>
                    <button
                      onClick={() => setShowUpcomingSessions(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <div className={`${session.color} w-1 rounded-full flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 mb-1">{session.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{session.instructor}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{session.time}</span>
                            </div>
                            <span>•</span>
                            <span>{session.duration}</span>
                          </div>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${session.color} bg-opacity-10`}>
                            {session.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Full Schedule →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUpcomingSessions(false)
              }}
              className="relative flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all"
            >
              <Bell className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fadeIn">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => {
                    const typeColors = {
                      info: 'bg-blue-100 text-blue-600',
                      success: 'bg-green-100 text-green-600',
                      warning: 'bg-yellow-100 text-yellow-600'
                    }
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`${typeColors[notification.type as keyof typeof typeColors]} p-2 rounded-lg h-fit`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className={`${stat.bgColor} rounded-lg shadow p-5 border border-gray-200`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</h3>
                      <span className="text-sm text-gray-500">{stat.unit}</span>
                    </div>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      {/* Top Section: Readiness Pentagon Graph (60%) and Notice Board (40%) */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* 360° Readiness Analysis - Pentagon (Radar) Graph */}
        <div className="bg-white rounded-lg shadow p-6 lg:w-3/5">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-800">360° Readiness Analysis</h2>
          </div>

          <div className="flex flex-col items-center">
            {/* Pentagon Radar Graph - top center */}
            <div className="w-full flex justify-center mb-4">
              <div className="w-56 h-56 md:w-64 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="80%">
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar
                      name="Readiness"
                      dataKey="score"
                      stroke="#ef4444"
                      fill="#f97316"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Skill Summary Cards: first row 3, second row 2 centered */}
            <div className="w-full mt-2 space-y-3">
              {/* First row: 3 cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {radarData.slice(0, 3).map((skill) => {
                  const isSelected = selectedSkill === skill.subject
                  const statusLabel =
                    skill.score >= 80 ? 'Excellent' : skill.score >= 70 ? 'Good' : 'Needs Focus'
                  const statusColor =
                    skill.score >= 80
                      ? 'text-green-700'
                      : skill.score >= 70
                      ? 'text-yellow-700'
                      : 'text-red-700'

                  return (
                    <button
                      key={skill.subject}
                      type="button"
                      onClick={() => setSelectedSkill(isSelected ? null : skill.subject)}
                      className={`rounded-lg border-2 px-4 py-3 text-center bg-white transition-all ${
                        isSelected
                          ? 'border-red-500 shadow-sm bg-red-50'
                          : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-600 mb-1">{skill.subject}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold text-gray-900">{skill.score}</span>
                        <span className="text-sm text-gray-500">/ 100</span>
                      </div>
                      <p className={`mt-1 text-xs font-medium ${statusColor}`}>{statusLabel}</p>
                    </button>
                  )
                })}
              </div>

              {/* Second row: 2 cards centered under the first row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:w-2/3 mx-auto">
                {radarData.slice(3).map((skill) => {
                  const isSelected = selectedSkill === skill.subject
                  const statusLabel =
                    skill.score >= 80 ? 'Excellent' : skill.score >= 70 ? 'Good' : 'Needs Focus'
                  const statusColor =
                    skill.score >= 80
                      ? 'text-green-700'
                      : skill.score >= 70
                      ? 'text-yellow-700'
                      : 'text-red-700'

                  return (
                    <button
                      key={skill.subject}
                      type="button"
                      onClick={() => setSelectedSkill(isSelected ? null : skill.subject)}
                      className={`rounded-lg border-2 px-4 py-3 text-center bg-white transition-all ${
                        isSelected
                          ? 'border-red-500 shadow-sm bg-red-50'
                          : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-600 mb-1">{skill.subject}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold text-gray-900">{skill.score}</span>
                        <span className="text-sm text-gray-500">/ 100</span>
                      </div>
                      <p className={`mt-1 text-xs font-medium ${statusColor}`}>{statusLabel}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Notice Board - Upcoming Announcements */}
        <div className="bg-white rounded-lg shadow p-6 lg:w-2/5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-800">Notice Board</h2>
          </div>
          
          {announcements.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">No Announcements found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-2">
              {(() => {
                const pageSize = 3
                const start = activeAnnouncementIndex
                const end = Math.min(start + pageSize, announcements.length)
                const isFirst = start === 0
                const isLast = end >= announcements.length

                return (
                  <>
                    <div className="space-y-3">
                      {announcements.slice(start, end).map((announcement) => {
                        const isRead = readAnnouncements.has(announcement.id)
                        return (
                          <div
                            key={announcement.id}
                            onClick={() => {
                              toggleReadStatus(announcement.id)
                              setPreviewAnnouncement(announcement)
                            }}
                            className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                              isRead
                                ? 'bg-red-50 border-red-200 opacity-60 hover:opacity-70'
                                : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className={`font-semibold mb-1 ${isRead ? 'text-red-600' : 'text-red-700'}`}>
                                  {announcement.title}
                                </h3>
                                <p className={`text-sm mb-2 ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                                  {announcement.description}
                                </p>
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="flex items-center gap-1 text-red-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>{announcement.date}</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-medium">
                                    {announcement.category}
                                  </span>
                                </div>
                              </div>
                              {!isRead && (
                                <div className="ml-3 flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveAnnouncementIndex((prev) => (prev - pageSize > 0 ? prev - pageSize : 0))
                        }
                        disabled={isFirst}
                        className={`px-3 py-1 text-xs font-medium rounded-md border ${
                          isFirst
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Prev
                      </button>

                      <span className="text-xs text-gray-500">
                        Showing {start + 1}-{end} of {announcements.length}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveAnnouncementIndex((prev) =>
                            prev + pageSize < announcements.length ? prev + pageSize : prev
                          )
                        }
                        disabled={isLast}
                        className={`px-3 py-1 text-xs font-medium rounded-md border ${
                          isLast
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Activity & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Weekly Activity</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Hours"
              />
              <Line 
                type="monotone" 
                dataKey="tests" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                name="Tests"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Study Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Tests Taken</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => {
              const IconComponent = activity.icon
              const typeColors = {
                success: 'bg-green-100 text-green-600',
                info: 'bg-blue-100 text-blue-600',
                warning: 'bg-yellow-100 text-yellow-600'
              }
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`${typeColors[activity.type as keyof typeof typeColors]} p-2 rounded-lg flex-shrink-0`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Announcement Preview Modal */}
      {previewAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-red-50 border border-red-200 shadow-xl rounded-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-red-100">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                  Announcement Preview
                </span>
                <h3 className="text-base font-semibold text-red-900 truncate pr-6">
                  {previewAnnouncement.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAnnouncement(null)}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-red-900 leading-relaxed">
                {previewAnnouncement.description}
              </p>

              <div className="flex items-center justify-between text-xs text-red-700 mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{previewAnnouncement.date}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                  {previewAnnouncement.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Focus Areas */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-800">Focus Areas for Improvement</h2>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View Full Analysis →
          </button>
        </div>
        <div className="space-y-4">
          {improvementAreas.map((area, index) => {
            const progress = (area.current / area.target) * 100
            const isPriorityHigh = area.priority === 'High'
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-800">{area.area}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isPriorityHigh ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {area.priority} Priority
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">{area.current}%</span>
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-800 font-medium">{area.target}%</span>
                  </div>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isPriorityHigh ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                  <div 
                    className="absolute top-0 w-1 h-3 bg-gray-400"
                    style={{ left: `${(area.target / 100) * 100}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold mb-1">Take Assessment</h3>
              <p className="text-sm text-blue-100">Test your skills now</p>
            </div>
            <Code className="w-8 h-8" />
          </div>
        </button>
        
        <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-4 hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold mb-1">Schedule Mock Interview</h3>
              <p className="text-sm text-purple-100">Practice interviews</p>
            </div>
            <Users className="w-8 h-8" />
          </div>
        </button>
        
        <button className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-4 hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold mb-1">View Learning Path</h3>
              <p className="text-sm text-green-100">Personalized roadmap</p>
            </div>
            <BookOpen className="w-8 h-8" />
          </div>
        </button>
      </div>

      </div>
    </StudentLayout>
  )
}

export default Dashboard