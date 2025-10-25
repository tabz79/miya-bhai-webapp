import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  const isAdmin = user && profile?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
