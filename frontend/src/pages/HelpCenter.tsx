import React, { useState } from 'react'
import {
    Search,
    User,
    Lock,
    ChevronRight,
    Phone,
    MapPin,
    Mail,
    Menu,
    Code,
    BookOpen,
    FileText,
    Users,
    Calendar,
    FileBarChart,
    TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import StudentLayout from '../components/Student/StudentLayout'
import FacultySidebar from '../components/Faculty/Sidebar'

// --- Icon Helper ---
const RocketIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
)

interface HelpCenterProps {
    username?: string
    role?: string
    onLogout?: () => void
    facultyId?: string
}

const HelpCenter: React.FC<HelpCenterProps> = ({ username, role, onLogout, facultyId }) => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')

    // Faculty Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    // --- Content Definitions ---

    // 1. Common Categories (Everyone sees these)
    const commonCategories = [
        {
            icon: Lock,
            title: 'Login & Security',
            description: 'Troubleshoot login issues, reset passwords, and manage 2FA.',
            color: 'bg-blue-100 text-blue-600',
            link: '#'
        },
        {
            icon: User,
            title: 'Profile Settings',
            description: 'Manage your personal details, contact info, and preferences.',
            color: 'bg-red-100 text-red-600',
            link: '#'
        }
    ]

    // 2. Student Specific
    const studentCategories = [
        {
            icon: RocketIcon,
            title: 'Getting Started',
            description: 'New to GradEdge? Start here for a quick tour of student features.',
            color: 'bg-green-100 text-green-600',
            link: '#'
        },
        {
            icon: Code,
            title: 'Assessments & Tests',
            description: 'Help with taking coding tests, aptitude quizzes, and mock exams.',
            color: 'bg-purple-100 text-purple-600',
            link: '#'
        },
        {
            icon: BookOpen,
            title: 'Learning Paths',
            description: 'Guides on following domain courses and tracking your progress.',
            color: 'bg-orange-100 text-orange-600',
            link: '#'
        },
        {
            icon: FileText,
            title: 'Resume Builder',
            description: 'Tips and troubleshooting for the automated resume builder tool.',
            color: 'bg-teal-100 text-teal-600',
            link: '#'
        }
    ]

    // 3. Faculty Specific
    const facultyCategories = [
        {
            icon: Users,
            title: 'Batch Management',
            description: 'How to create batches, add students, and manage groups.',
            color: 'bg-emerald-100 text-emerald-600',
            link: '#'
        },
        {
            icon: Calendar,
            title: 'Session Planning',
            description: 'Scheduling classes, managing attendance, and calendar syncing.',
            color: 'bg-indigo-100 text-indigo-600',
            link: '#'
        },
        {
            icon: FileBarChart,
            title: 'Analytics & Reports',
            description: 'Generating performance reports and analyzing student data.',
            color: 'bg-rose-100 text-rose-600',
            link: '#'
        },
        {
            icon: TrendingUp,
            title: 'Student Progress',
            description: 'Tracking individual student growth and assessment history.',
            color: 'bg-cyan-100 text-cyan-600',
            link: '#'
        }
    ]

    // Determine which categories to show
    const displayCategories = role === 'faculty'
        ? [...facultyCategories, ...commonCategories]
        : role === 'student'
            ? [...studentCategories, ...commonCategories]
            : [...studentCategories, ...commonCategories] // Default

    // --- FAQs ---
    const studentFaqs = [
        { q: "How do I start a mock test?", a: "Navigate to the 'Aptitude' or 'Coding' section in your dashboard and select a topic to begin." },
        { q: "Where can I view my past scores?", a: "All your previous attempts are recorded in the 'Assessment History' tab." },
        { q: "My resume score is low, how to improve?", a: "Use the Resume Builder's suggestions tool to find keywords missing for your target role." },
        { q: "Can I retake an assessment?", a: "Yes, practice assessments can be retaken unlimited times. Scheduled exams are one-time only." },
    ]

    const facultyFaqs = [
        { q: "How do I add students to a batch?", a: "Go to 'Batches', select a batch, and click 'Add Student'. You can upload a CSV for bulk additions." },
        { q: "How to download attendance reports?", a: "In the 'Session Planning' tab, select a session and click 'Export Report'." },
        { q: "Can I edit a scheduled session?", a: "Yes, click on the session in your calendar and select 'Edit' to change time or topic." },
        { q: "How to track a specific student?", a: "Use the global search bar or go to 'Student Progress' to find a student profile." },
    ]

    const displayFaqs = role === 'faculty' ? facultyFaqs : studentFaqs

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } as any }
    }

    // Main Content Visuals
    const HelpContent = (
        <div className="bg-slate-50/50 min-h-full font-sans text-slate-900 pb-20 relative">

            {/* Conditional Navbar for Public View */}
            {!role && (
                <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">G</div>
                            <span className="text-xl font-bold tracking-tight">Grad<span className="text-red-600">Edge</span> <span className="text-slate-400 font-medium text-sm ml-2">Help Center</span></span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                                Sign In
                            </button>
                        </div>
                    </div>
                </nav>
            )}

            {/* Mobile Sidebar Toggle (for Faculty view if wrapped manually) */}
            {role === 'faculty' && (
                <div className="lg:hidden p-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-lg">Help Center</span>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="bg-white border-b border-slate-200 relative overflow-hidden">
                {/* Floating Elements */}
                <motion.div
                    animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-10 -left-10 w-64 h-64 bg-red-500/5 rounded-full blur-[80px]"
                />
                <motion.div
                    animate={{ y: [0, 40, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-20 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"
                />

                <div className="max-w-4xl mx-auto px-4 py-24 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            How can we help you?
                        </h1>
                        <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Search our knowledge base or browse categories below to find answers regarding your account, assessments, and more.
                        </p>

                        <div className="relative max-w-2xl mx-auto group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-12 pr-4 py-5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm hover:shadow-md"
                                placeholder="Search for articles, guides, and more..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 border border-slate-200 rounded-lg bg-white text-[10px] font-bold text-slate-400">⌘ K</kbd>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

                {/* Categories */}
                <div className="mb-24">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {displayCategories.map((cat, idx) => (
                            <motion.a
                                variants={itemVariants}
                                href={cat.link}
                                key={idx}
                                className="group p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-500/5 hover:border-red-100 transition-all duration-300 relative overflow-hidden"
                                whileHover={{ y: -5 }}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <cat.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-red-600 transition-colors">{cat.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">{cat.description}</p>
                                <div className="flex items-center text-sm font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <span>Explore Articles</span>
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </motion.a>
                        ))}
                    </motion.div>
                </div>

                {/* Direct Support Channels */}
                <div className="mb-24">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">Direct Support Channels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Phone, label: "Call Us", val: "+1 (555) 123-4567", sub: "Mon-Fri, 9am - 6pm EST" },
                            { icon: Mail, label: "Email Support", val: "support@gradedge.io", sub: "Typical response time: 2 hours" },
                            { icon: MapPin, label: "Visit HQ", val: "123 Innovation Dr", sub: "Tech City, CA 94000" }
                        ].map((contact, i) => (
                            <motion.div
                                key={i}
                                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-red-100 transition-colors"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-600">
                                    <contact.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{contact.label}</p>
                                    <p className="text-slate-900 font-bold">{contact.val}</p>
                                    <p className="text-xs text-slate-400 mt-1">{contact.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* FAQ & Contact Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Recent FAQs */}
                    <div className="lg:col-span-7">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {displayFaqs.map((faq, idx) => (
                                <motion.div
                                    key={idx}
                                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    whileHover={{ x: 4 }}
                                >
                                    <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-4">
                                        <div className="min-w-[24px] h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold mt-0.5 group-hover:bg-red-600 group-hover:text-white transition-colors">Q</div>
                                        {faq.q}
                                    </h3>
                                    <p className="text-slate-600 text-sm pl-10 leading-relaxed">{faq.a}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                            <div className="p-8 bg-[#0F172A] text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-2">Still need help?</h3>
                                    <p className="text-slate-400 text-sm">Can't find what you're looking for? Send us a message.</p>
                                </div>
                                {/* Decorative blob */}
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-600 rounded-full blur-3xl opacity-30"></div>
                            </div>

                            <div className="p-8">
                                <form className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                                        <input type="email" className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-red-500 focus:ring-red-500 transition-all" placeholder="you@example.com" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Topic</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Login', 'Billing', 'Technical', 'Other'].map(opt => (
                                                <button key={opt} type="button" className="px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all text-center">
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message</label>
                                        <textarea className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-red-500 focus:ring-red-500 h-32 resize-none transition-all" placeholder="Describe your issue..."></textarea>
                                    </div>

                                    <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-red-500/20 transition-all active:scale-[0.98] hover:shadow-red-500/30">
                                        Send Request
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-12 mt-20 relative z-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-400 text-sm font-medium">© 2025 GradEdge Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )

    // --- Conditional Layout Wrapping ---

    // 1. Student Layout
    if (role === 'student' && username && onLogout) {
        return (
            <StudentLayout username={username} onLogout={onLogout}>
                {/* StudentLayout provides the sidebar and a flex-1 container. 
                     We need to ensure HelpContent fits well inside. 
                     Since HelpContent has 'min-h-full' it should expand. 
                 */}
                {HelpContent}
            </StudentLayout>
        )
    }

    // 2. Faculty Layout (Replicated from FacultyDashboard.tsx)
    if (role === 'faculty' && username && onLogout && facultyId) {
        return (
            <div className="flex h-screen bg-[#F4F7FE] font-sans selection:bg-rose-100 selection:text-rose-900 overflow-hidden">
                <FacultySidebar
                    facultyId={facultyId}
                    onLogout={onLogout}
                    isCollapsed={isSidebarCollapsed}
                    toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isMobileOpen={isMobileSidebarOpen}
                    setIsMobileOpen={setIsMobileSidebarOpen}
                />

                <div className="flex-1 flex flex-col h-full transition-all duration-300 relative overflow-hidden">
                    {/* Reuse the 'HelpContent' but wrap in a scrollable container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                        {HelpContent}
                    </div>
                </div>
            </div>
        )
    }

    // 3. Default / Public View
    return HelpContent
}

export default HelpCenter
