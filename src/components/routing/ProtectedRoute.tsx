import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-40 rounded border bg-card" />
          <div className="h-40 rounded border bg-card" />
          <div className="h-40 rounded border bg-card" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
