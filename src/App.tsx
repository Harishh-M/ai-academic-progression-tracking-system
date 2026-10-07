import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
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

const MainLayout: React.FC = () => {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [drilldownStudentId, setDrilldownStudentId] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Authenticating ERP session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleFacultyNavigation = (tab: string, studentId?: string) => {
    setActiveTab(tab);
    if (studentId) {
      setDrilldownStudentId(studentId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900 font-sans">
      {/* Sticky Top Navbar with Quick Switcher & User Profile */}
      <Navbar onSelectTab={setActiveTab} />

      {/* Body: Sidebar + Main Content Container */}
      <div className="flex-1 flex flex-row overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Faculty Views */}
          {role === 'FACULTY' && (
            <>
              {activeTab === 'dashboard' && (
                <FacultyDashboard onNavigate={handleFacultyNavigation} />
              )}
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
              {activeTab === 'ai-insights' && (
                <FacultyAIInsightsView initialStudentId={drilldownStudentId} />
              )}
              {activeTab === 'reports' && <FacultyReportsView />}
              {activeTab === 'audit-logs' && <FacultyAuditLogsView />}
              {activeTab === 'profile' && <ProfileView />}
            </>
          )}

          {/* Student Views (Strict Read-Only) */}
          {role === 'STUDENT' && (
            <>
              {activeTab === 'dashboard' && (
                <StudentDashboard onNavigate={setActiveTab} />
              )}
              {activeTab === 'my-profile' && <StudentProfileView />}
              {activeTab === 'attendance' && <StudentAttendanceView />}
              {activeTab === 'marks' && <StudentMarksView />}
              {activeTab === 'results' && <StudentResultsView />}
              {activeTab === 'achievements' && <StudentAchievementsView />}
              {activeTab === 'academic-progress' && <StudentProgressView />}
              {activeTab === 'ai-insights' && <StudentAIInsightsView />}
              {activeTab === 'reports' && <StudentReportsView />}
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
