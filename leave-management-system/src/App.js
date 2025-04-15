import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Auth Context Provider
import { AuthProvider } from './context/AuthContext';

// Components
import MainNavigation from './components/MainNavigation';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import LeaveRequests from './pages/LeaveRequests';
import Approvals from './pages/Approvals';
import UserProfile from './pages/UserProfile';
import TeamCalendar from './pages/TeamCalendar';
import TeamManagement from './pages/TeamManagement';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';

// Admin Pages
import AdminUsers from './pages/admin/Users';
import AdminDepartments from './pages/admin/Departments';
import AdminLeaveTypes from './pages/admin/LeaveTypes';
import AdminReports from './pages/admin/Reports';

// Public page that shows if not logged in
import Landing from './pages/Landing';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainNavigation />
        <Container className="py-4 main-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Landing page for non-authenticated users */}
            <Route 
              path="/" 
              element={
                <LandingOrDashboard />
              } 
            />
            
            {/* Protected Routes for All Authenticated Users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leave-requests" element={<LeaveRequests />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            
            {/* Protected Routes for Supervisors */}
            <Route element={<ProtectedRoute allowedRoles={['supervisor', 'admin']} />}>
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/team-calendar" element={<TeamCalendar />} />
              <Route path="/team-management" element={<TeamManagement />} />
            </Route>
            
            {/* Protected Routes for Admins */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
              <Route path="/admin/leave-types" element={<AdminLeaveTypes />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
            
            {/* Catch-all for non-existent routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  );
}

// Helper component to redirect to dashboard if authenticated
function LandingOrDashboard() {
  // This would normally use the useAuth hook, but for demonstration we're just creating a simple component
  // The real implementation would check if the user is authenticated and redirect accordingly
  return <Landing />;
}

export default App; 