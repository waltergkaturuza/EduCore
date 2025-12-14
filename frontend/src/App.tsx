import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme/theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Assessments from './pages/Assessments';
import Fees from './pages/Fees';
import Classes from './pages/Classes';
import Messages from './pages/Messages';
import LMS from './pages/LMS';
import PlatformAnalytics from './pages/PlatformAnalytics';
import PlatformDashboard from './pages/superadmin/PlatformDashboard';
import TenantManagementEnhanced from './pages/superadmin/TenantManagementEnhanced';
import SubscriptionBilling from './pages/superadmin/SubscriptionBilling';
import RevenueAnalytics from './pages/superadmin/RevenueAnalytics';
import SystemMonitoring from './pages/superadmin/SystemMonitoring';
import SupportTickets from './pages/superadmin/SupportTickets';
import FeatureFlags from './pages/superadmin/FeatureFlags';
import Communications from './pages/superadmin/Communications';
import ExecutiveDashboard from './pages/schooladmin/ExecutiveDashboard';
import SchoolProfile from './pages/schooladmin/SchoolProfile';
import AdmissionsPipeline from './pages/schooladmin/AdmissionsPipeline';
import StudentRecords from './pages/schooladmin/StudentRecords';
import TimetableManagement from './pages/schooladmin/TimetableManagement';
import AttendanceIntelligence from './pages/schooladmin/AttendanceIntelligence';
import ExamLifecycle from './pages/schooladmin/ExamLifecycle';
import FinanceFees from './pages/schooladmin/FinanceFees';
import StaffHCM from './pages/schooladmin/StaffHCM';
import CommunicationHub from './pages/schooladmin/CommunicationHub';
import ReportsAnalytics from './pages/schooladmin/ReportsAnalytics';
import MinistryExports from './pages/schooladmin/MinistryExports';
import TeacherDashboard from './pages/teachers/TeacherDashboard';
import MyClasses from './pages/teachers/MyClasses';
import LessonPlanner from './pages/teachers/LessonPlanner';
import AttendanceManagement from './pages/teachers/AttendanceManagement';
import Gradebook from './pages/teachers/Gradebook';
import TeacherAnalytics from './pages/teachers/TeacherAnalytics';
import ParentCommunication from './pages/teachers/ParentCommunication';
import CPDDashboard from './pages/teachers/CPDDashboard';
import ClassWorkspace from './pages/teachers/ClassWorkspace';
import Classwork from './pages/teachers/Classwork';
import PrivateRoute from './components/PrivateRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router future={{ v7_startTransition: true }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <PrivateRoute>
                    <Students />
                  </PrivateRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <PrivateRoute>
                    <Classes />
                  </PrivateRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <PrivateRoute>
                    <Attendance />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assessments"
                element={
                  <PrivateRoute>
                    <Assessments />
                  </PrivateRoute>
                }
              />
              <Route
                path="/fees"
                element={
                  <PrivateRoute>
                    <Fees />
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <PrivateRoute>
                    <Messages />
                  </PrivateRoute>
                }
              />
              <Route
                path="/lms"
                element={
                  <PrivateRoute>
                    <LMS />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin"
                element={
                  <PrivateRoute>
                    <PlatformDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/tenants"
                element={
                  <PrivateRoute>
                    <TenantManagementEnhanced />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/subscriptions"
                element={
                  <PrivateRoute>
                    <SubscriptionBilling />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/revenue"
                element={
                  <PrivateRoute>
                    <RevenueAnalytics />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/monitoring"
                element={
                  <PrivateRoute>
                    <SystemMonitoring />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/support"
                element={
                  <PrivateRoute>
                    <SupportTickets />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/features"
                element={
                  <PrivateRoute>
                    <FeatureFlags />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/communications"
                element={
                  <PrivateRoute>
                    <Communications />
                  </PrivateRoute>
                }
              />
              <Route
                path="/superadmin/analytics"
                element={
                  <PrivateRoute>
                    <PlatformAnalytics />
                  </PrivateRoute>
                }
              />
              {/* School Admin Routes */}
              <Route
                path="/schooladmin/dashboard"
                element={
                  <PrivateRoute>
                    <ExecutiveDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/profile"
                element={
                  <PrivateRoute>
                    <SchoolProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/admissions"
                element={
                  <PrivateRoute>
                    <AdmissionsPipeline />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/students"
                element={
                  <PrivateRoute>
                    <StudentRecords />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/timetable"
                element={
                  <PrivateRoute>
                    <TimetableManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/attendance"
                element={
                  <PrivateRoute>
                    <AttendanceIntelligence />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/exams"
                element={
                  <PrivateRoute>
                    <ExamLifecycle />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/finance"
                element={
                  <PrivateRoute>
                    <FinanceFees />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/staff"
                element={
                  <PrivateRoute>
                    <StaffHCM />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/communications"
                element={
                  <PrivateRoute>
                    <CommunicationHub />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/reports"
                element={
                  <PrivateRoute>
                    <ReportsAnalytics />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/exports"
                element={
                  <PrivateRoute>
                    <MinistryExports />
                  </PrivateRoute>
                }
              />
              <Route
                path="/schooladmin/ministry"
                element={
                  <PrivateRoute>
                    <MinistryExports />
                  </PrivateRoute>
                }
              />
              {/* Teacher Routes */}
              <Route
                path="/teacher/dashboard"
                element={
                  <PrivateRoute>
                    <TeacherDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/classes"
                element={
                  <PrivateRoute>
                    <MyClasses />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/lesson-planner"
                element={
                  <PrivateRoute>
                    <LessonPlanner />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/attendance"
                element={
                  <PrivateRoute>
                    <AttendanceManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/assignments"
                element={
                  <PrivateRoute>
                    <Classwork />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/classwork"
                element={
                  <PrivateRoute>
                    <Classwork />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/gradebook"
                element={
                  <PrivateRoute>
                    <Gradebook />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/analytics"
                element={
                  <PrivateRoute>
                    <TeacherAnalytics />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/parents"
                element={
                  <PrivateRoute>
                    <ParentCommunication />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/cpd"
                element={
                  <PrivateRoute>
                    <CPDDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teacher/classes/:classId"
                element={
                  <PrivateRoute>
                    <ClassWorkspace />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

