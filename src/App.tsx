import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, getDashboardPath } from './context/AuthContext.js';
import { LoginPage } from './components/auth/LoginPage.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';

// Student Portal Views
import { StudentDashboard } from './components/student/StudentDashboard.js';
import { StudentProfileView } from './components/student/StudentProfileView.js';
import { StudentAttendanceView } from './components/student/StudentAttendanceView.js';
import { StudentMarksView } from './components/student/StudentMarksView.js';
import { StudentResultsView } from './components/student/StudentResultsView.js';
import { StudentAchievementsView } from './components/student/StudentAchievementsView.js';
import { StudentProgressView } from './components/student/StudentProgressView.js';
import { StudentAIInsightsView } from './components/student/StudentAIInsightsView.js';
import { StudentReportsView } from './components/student/StudentReportsView.js';

// Faculty Portal Views
import { FacultyDashboard } from './components/faculty/FacultyDashboard.js';
import { FacultyStudentsView } from './components/faculty/FacultyStudentsView.js';
import { FacultyAttendanceView } from './components/faculty/FacultyAttendanceView.js';
import { FacultyMarksView } from './components/faculty/FacultyMarksView.js';
import { FacultyResultsView } from './components/faculty/FacultyResultsView.js';
import { FacultyAchievementsView } from './components/faculty/FacultyAchievementsView.js';
import { FacultyProgressView } from './components/faculty/FacultyProgressView.js';
import { FacultyAIInsightsView } from './components/faculty/FacultyAIInsightsView.js';
import { FacultyReportsView } from './components/faculty/FacultyReportsView.js';
import { FacultyAuditLogsView } from './components/faculty/FacultyAuditLogsView.js';
import { ProfileView } from './components/common/ProfileView.js';

// COE & Admin Views
import { COEDashboard } from './components/coe/COEDashboard.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { DepartmentDirectoryDashboard } from './components/common/DepartmentDirectoryDashboard.js';

const MainLayout: React.FC = () => {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const tab = segments[1];
      if (tab === 'academic-analytics') return 'ai-insights';
      return tab;
    }
    return 'dashboard';
  });
  const [drilldownStudentId, setDrilldownStudentId] = useState<string | undefined>(undefined);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  // Sync URL changes and popstate events
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);

      // Extract sub-tab if specified (e.g. /student/attendance -> attendance)
      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 2) {
        const tab = segments[1];
        if (tab === 'academic-analytics') {
          setActiveTab('ai-insights');
        } else {
          setActiveTab(tab);
        }
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Enforce role-based URL redirection
  useEffect(() => {
    if (!loading && user && role) {
      const expectedPrefix = `/${role.toLowerCase()}`;
      const path = window.location.pathname;

      if (path === '/' || path === '/login' || !path.startsWith(expectedPrefix)) {
        const target = getDashboardPath(role);
        window.history.replaceState({}, '', target);
        setCurrentPath(target);
        setActiveTab('dashboard');
      }
    }
  }, [loading, user, role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Authenticating ERP session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    if (role) {
      const newPath = `/${role.toLowerCase()}/${tab}`;
      window.history.pushState({}, '', newPath);
      setCurrentPath(newPath);
    }
  };

  const handleFacultyNavigation = (tab: string, studentId?: string) => {
    handleTabSelect(tab);
    if (studentId) {
      setDrilldownStudentId(studentId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-900 font-sans">
      {/* Sticky Top Navbar */}
      <Navbar onSelectTab={handleTabSelect} />

      {/* Body: Sidebar + Main Content Container */}
      <div className="flex-1 flex flex-row overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={handleTabSelect} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* 1. ADMIN Portal View - Strictly Dedicated Administrative Nodes */}
          {role === 'ADMIN' && (
            <>
              {activeTab === 'departments' && <DepartmentDirectoryDashboard />}
              {activeTab === 'profile' && <ProfileView />}
              {activeTab !== 'departments' && activeTab !== 'profile' && (
                <AdminDashboard activeTab={activeTab} onSelectTab={handleTabSelect} />
              )}
            </>
          )}

          {/* 2. COE Portal View */}
          {role === 'COE' && (
            <>
              {activeTab === 'dashboard' && <COEDashboard />}
              {activeTab === 'departments' && <DepartmentDirectoryDashboard />}
              {activeTab === 'results' && <COEDashboard />}
              {activeTab === 'students' && (
                <FacultyStudentsView
                  onNavigateToStudentProgress={(stuId) => handleFacultyNavigation('academic-progress', stuId)}
                  onNavigateToAI={(stuId) => handleFacultyNavigation('ai-insights', stuId)}
                />
              )}
              {activeTab === 'academic-progress' && (
                <FacultyProgressView
                  initialStudentId={drilldownStudentId}
                  onNavigateToAI={(stuId) => handleFacultyNavigation('ai-insights', stuId)}
                />
              )}
              {activeTab === 'reports' && <FacultyReportsView />}
              {activeTab === 'audit-logs' && <FacultyAuditLogsView />}
            </>
          )}

          {/* 3. FACULTY Portal Views */}
          {role === 'FACULTY' && (
            <>
              {activeTab === 'dashboard' && (
                <FacultyDashboard onNavigate={handleFacultyNavigation} />
              )}
              {activeTab === 'departments' && <DepartmentDirectoryDashboard />}
              {activeTab === 'students' && (
                <FacultyStudentsView
                  onNavigateToStudentProgress={(stuId) => handleFacultyNavigation('academic-progress', stuId)}
                  onNavigateToAI={(stuId) => handleFacultyNavigation('ai-insights', stuId)}
                />
              )}
              {activeTab === 'attendance' && <FacultyAttendanceView />}
              {activeTab === 'marks' && <FacultyMarksView />}
              {activeTab === 'results' && <FacultyResultsView />}
              {activeTab === 'achievements' && <FacultyAchievementsView />}
              {activeTab === 'academic-progress' && (
                <FacultyProgressView
                  initialStudentId={drilldownStudentId}
                  onNavigateToAI={(stuId) => handleFacultyNavigation('ai-insights', stuId)}
                />
              )}
              {(activeTab === 'ai-insights' || activeTab === 'academic-analytics') && (
                <FacultyAIInsightsView initialStudentId={drilldownStudentId} />
              )}
              {activeTab === 'reports' && <FacultyReportsView />}
              {activeTab === 'audit-logs' && <FacultyAuditLogsView />}
              {activeTab === 'profile' && <ProfileView />}
              {![
                'dashboard',
                'departments',
                'students',
                'attendance',
                'marks',
                'results',
                'achievements',
                'academic-progress',
                'ai-insights',
                'academic-analytics',
                'reports',
                'audit-logs',
                'profile',
              ].includes(activeTab) && (
                <FacultyDashboard onNavigate={handleFacultyNavigation} />
              )}
            </>
          )}

          {/* 4. STUDENT Portal Views (Strictly Read-Only) */}
          {role === 'STUDENT' && (
            <>
              {activeTab === 'departments' && <DepartmentDirectoryDashboard />}
              {activeTab === 'dashboard' && (
                <StudentDashboard onNavigate={handleTabSelect} />
              )}
              {(activeTab === 'my-profile' || activeTab === 'profile') && <StudentProfileView />}
              {activeTab === 'attendance' && <StudentAttendanceView />}
              {activeTab === 'marks' && <StudentMarksView />}
              {activeTab === 'results' && <StudentResultsView />}
              {activeTab === 'achievements' && <StudentAchievementsView />}
              {activeTab === 'academic-progress' && <StudentProgressView />}
              {(activeTab === 'ai-insights' || activeTab === 'academic-analytics') && <StudentAIInsightsView />}
              {activeTab === 'reports' && <StudentReportsView />}
              {![
                'dashboard',
                'my-profile',
                'profile',
                'attendance',
                'marks',
                'results',
                'achievements',
                'academic-progress',
                'ai-insights',
                'academic-analytics',
                'reports',
              ].includes(activeTab) && (
                <StudentDashboard onNavigate={handleTabSelect} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
