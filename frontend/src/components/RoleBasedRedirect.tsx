import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Redirect logic is handled in Dashboard component
  }, [user]);

  // Default redirect to dashboard, Dashboard component will handle superadmin redirect
  return <Navigate to="/dashboard" replace />;
};

export default RoleBasedRedirect;




