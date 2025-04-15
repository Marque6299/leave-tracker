import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  allowedRoles = [], 
  redirectPath = '/login' 
}) => {
  const { isAuthenticated, hasRole, loading, sessionChecked } = useAuth();

  // Show loading state if authentication check is in progress
  if (loading || !sessionChecked) {
    // Return a loading indicator or null
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }

  // If roles are specified, check if user has at least one of the required roles
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has the required role(s), render the protected content
  return <Outlet />;
};

export default ProtectedRoute; 