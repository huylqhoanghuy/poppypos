import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the attempted URL for later redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles if specified
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      // User doesn't have required role, redirect to dashboard or unauthorized
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
