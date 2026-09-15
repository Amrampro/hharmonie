// client/src/routes/RequireAdmin.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  // Not logged in => redirect to login
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // Logged in but not admin => redirect home (or 403 page)
  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
