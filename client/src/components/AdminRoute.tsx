
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; 

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
