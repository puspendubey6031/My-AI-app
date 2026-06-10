import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

const AdminRoute = (props: any) => {
  const { dbUser, authLoading } = useAuth();

  if (authLoading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!dbUser || dbUser.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return <Route {...props} />;
};

export default AdminRoute;
