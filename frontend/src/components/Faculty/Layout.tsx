import React, { useState, useEffect } from 'react'
import FacultySidebar from './Sidebar'

interface FacultyLayoutProps {
  children: React.ReactNode
  facultyId: string
  onLogout: () => void
}

const FacultyLayout: React.FC<FacultyLayoutProps> = ({ children, facultyId, onLogout }) => {
  // Initialize state from localStorage to persist across refreshes/navigation
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('faculty_sidebar_collapsed')
    return saved ? JSON.parse(saved) : false
  })
  
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Update localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('faculty_sidebar_collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen, isCollapsed, toggleCollapse }}>
      <div className="flex h-screen bg-[#F4F7FE] font-sans selection:bg-rose-100 selection:text-rose-900 overflow-hidden">
        <FacultySidebar 
          facultyId={facultyId} 
          onLogout={onLogout} 
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        
        {/* 
          Main content wrapper 
          - Uses flex-1 to take remaining space
          - Handles mobile/desktop layout shifts same as Dashboard did
          - Expects children to contain the page content
        */}
        <div className="flex-1 flex flex-col h-full transition-all duration-300 relative overflow-hidden">
           {children}
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

// Context to allow children to control sidebar (e.g. mobile toggle)
interface SidebarContextType {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  isCollapsed: boolean
  toggleCollapse: () => void
}

export const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a FacultyLayout')
  }
  return context
}


export default FacultyLayout
