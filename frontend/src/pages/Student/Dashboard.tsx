import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import { RadarChart as MuiRadarChart } from '@mui/x-charts/RadarChart'
import { TrendingUp, Bell, Calendar, Flame, Target, Award, BookOpen, Code, Users, Clock, CheckCircle2, Activity, Video, X, ArrowUpRight } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import StudentLayout from '../../components/Student/StudentLayout'

interface Announcement {
  id: string
  title: string
  description: string
  date: string
  category: string
}

interface DashboardProps {
  username?: string
  onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ username = 'Student', onLogout }) => {
  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }
  // 360° Readiness Analysis Data
  const radarData = [
    { subject: 'Aptitude', score: 85, fullMark: 100, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50' },
    { subject: 'Coding', score: 72, fullMark: 100, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { subject: 'Soft Skills', score: 75, fullMark: 100, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50' },
    { subject: 'Domain', score: 80, fullMark: 100, color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-50' },
    { subject: 'Projects', score: 85, fullMark: 100, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
  ]

  // MUI Radar options
  const [hideMark, setHideMark] = useState(false)
  const [fillArea, setFillArea] = useState(false)

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
  const navigate = useNavigate()

  // Announcements (fetched)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!username) return
      try {
        const res = await (await import('../../lib/api')).studentApi.getAnnouncements(username)
        if (mounted && res.ok && res.data) {
          // res.data.data is expected to be array
          setAnnouncements(Array.isArray(res.data.data) ? res.data.data : res.data)
        }
      } catch (e) {
        console.error('Failed to load announcements', e)
      }
    }
    void load()
    return () => { mounted = false }
  }, [username])

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
    { label: 'Current Streak', value: '15', unit: 'days', icon: Flame, color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Attendance', value: '92', unit: '%', icon: CheckCircle2, color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Tests Completed', value: '24', unit: 'tests', icon: Target, color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Avg Score', value: '78', unit: '%', icon: Award, color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' },
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
      <motion.div
        className="p-6 bg-gray-50 min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Header Banner: Welcome & Actions */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, {username}! 👋</h1>
            <p className="text-gray-500">Ready to level up your skills today?</p>
          </div>

          <div className="flex gap-3">
            {/* Upcoming Sessions Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUpcomingSessions(!showUpcomingSessions)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
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
                className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-red-500 hover:shadow-sm transition-all"
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
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/30' : ''
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
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          variants={itemVariants}
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={index}
                className={`${stat.bgColor} rounded-lg shadow p-5 border border-gray-200`}
                whileHover={{ scale: 1.05, y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-label-strong text-gray-500 mb-2">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</h3>
                      <span className="text-sm text-gray-500">{stat.unit}</span>
                    </div>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Top Section: Readiness Pentagon Graph (60%) and Notice Board (40%) */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* 360° Readiness Analysis - Pentagon (Radar) Graph */}
          <div className="bg-white rounded-lg shadow p-6 lg:w-3/5">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">360° Readiness Analysis</h2>
            </div>

            <div className="flex flex-col items-center">
              {/* Pentagon Radar Graph - top center */}
              <div className="w-full flex flex-col items-center mb-4">
                <div className="w-full max-w-md mb-3">
                  <Stack direction="row" spacing={2} className="justify-center">
                    <FormControlLabel
                      control={<Checkbox checked={!hideMark} onChange={(e) => setHideMark(!e.target.checked)} />}
                      labelPlacement="end"
                      label="with mark"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={fillArea} onChange={(e) => setFillArea(e.target.checked)} />}
                      labelPlacement="end"
                      label="fill area"
                    />
                  </Stack>
                </div>

                <div className="w-full flex justify-center">
                  <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <MuiRadarChart
                      height={300}
                      radar={{ max: 100, metrics: radarData.map((r) => r.subject) }}
                      series={[
                        {
                          label: 'You',
                          data: radarData.map((r) => r.score),
                          color: '#ea0029',
                        },
                      ]}
                    />
                  </Box>
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
                        className={`rounded-lg border-2 px-4 py-3 text-center bg-white transition-all ${isSelected
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
                        className={`rounded-lg border-2 px-4 py-3 text-center bg-white transition-all ${isSelected
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
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Notice Board</h2>
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
                                // If this announcement references a test, navigate student to tests and open it
                                if ((announcement as any).test_id) {
                                  const tid = (announcement as any).test_id
                                  navigate(`/student/tests`, { state: { openTestId: tid } })
                                }
                              }}
                              className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${isRead
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
                                    <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-label-strong">
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
                          className={`px-3 py-1 text-xs font-medium rounded-md border ${isFirst
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
                          className={`px-3 py-1 text-xs font-medium rounded-md border ${isLast
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
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
          variants={itemVariants}
        >
          {/* Weekly Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Weekly Activity</h2>
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
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
                <Line
                  type="monotone"
                  dataKey="tests"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  name="Tests"
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
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
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Recent Activity</h2>
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
        </motion.div>

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
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <Target className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Focus Areas for Improvement</h2>
            </div>
            <button className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline decoration-red-200 underline-offset-4 transition-all">
              View Full Analysis →
            </button>
          </div>
          <div className="space-y-5">
            {improvementAreas.map((area, index) => {
              const progress = (area.current / area.target) * 100
              const isPriorityHigh = area.priority === 'High'
              return (
                <div key={index} className="space-y-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:shadow-md group cursor-default border border-transparent hover:border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-gray-800 group-hover:text-red-700 transition-colors">{area.area}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-label-strong ${isPriorityHigh
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                        {area.priority} Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 font-medium">{area.current}%</span>
                      <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                      <span className="text-gray-900 font-bold">{area.target}%</span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    {/* Background Track Pattern */}
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]"></div>

                    {/* Animated Progress Fill */}
                    <motion.div
                      className={`h-full rounded-full relative overflow-hidden ${isPriorityHigh
                        ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                        }`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.2 }}
                      viewport={{ once: true }}
                    >
                      {/* Shine effect */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
                    </motion.div>

                    {/* Target Marker */}
                    <div
                      className="absolute top-0 w-0.5 h-full bg-gray-400/50 z-10"
                      style={{ left: `${(area.target / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          <motion.button
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full group relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex justify-between items-start">
              <div className="relative z-10">
                <span className="text-label-strong text-gray-400">Skill Check</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">Take Assessment</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:scale-110 transition-transform relative z-10">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 relative z-10">
              <div className="px-3 py-1.5 rounded-full bg-red-50 border border-red-100 flex items-center gap-2 group-hover:bg-red-100 transition-colors">
                <Code className="w-3.5 h-3.5 text-red-600" />
                <span className="text-xs font-semibold text-red-700">Test your skills now</span>
              </div>
            </div>

            {/* Hover Effect Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity -mr-16 -mt-16"></div>
          </motion.button>

          <motion.button
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
          >
            <div className="flex justify-between items-start">
              <div className="relative z-10">
                <span className="text-label-strong text-gray-400">Preparation</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">Mock Interview</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:scale-110 transition-transform relative z-10">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 relative z-10">
              <div className="px-3 py-1.5 rounded-full bg-red-50 border border-red-100 flex items-center gap-2 group-hover:bg-red-100 transition-colors">
                <Users className="w-3.5 h-3.5 text-red-600" />
                <span className="text-xs font-semibold text-red-700">Practice interviews</span>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity -mr-16 -mt-16"></div>
          </motion.button>

          <motion.button
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
          >
            <div className="flex justify-between items-start">
              <div className="relative z-10">
                <span className="text-label-strong text-gray-400">Roadmap</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">Learning Path</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:scale-110 transition-transform relative z-10">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 relative z-10">
              <div className="px-3 py-1.5 rounded-full bg-red-50 border border-red-100 flex items-center gap-2 group-hover:bg-red-100 transition-colors">
                <BookOpen className="w-3.5 h-3.5 text-red-600" />
                <span className="text-xs font-semibold text-red-700">Personalized roadmap</span>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity -mr-16 -mt-16"></div>
          </motion.button>
        </motion.div>

      </motion.div>
    </StudentLayout>
  )
}

export default Dashboard