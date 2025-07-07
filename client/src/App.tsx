import React from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import SuperAdmin from "@/pages/super-admin";
import Profile from "@/pages/profile";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import TestRoles from "@/pages/test-roles";
import CommunitySignup from "@/pages/community-signup";
import { queryClient } from "@/lib/queryClient";

function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  if (!user || !user.isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-red-600">Admin access required</div>
    </div>;
  }

  return <Admin />;
}

function SuperAdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  if (!user || !user.isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-red-600">Super admin access required</div>
    </div>;
  }

  return <SuperAdmin />;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Router state:', { isAuthenticated, isLoading, user });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Community pages - always accessible */}
      <Route path="/community/:slug">
        <CommunitySignup />
      </Route>
      <Route path="/admin">
        {isAuthenticated && user?.isAdmin ? <Admin /> : <AdminRoute />}
      </Route>
      <Route path="/super-admin">
        {isAuthenticated && user?.isSuperAdmin ? <SuperAdmin /> : <SuperAdminRoute />}
      </Route>
      <Route path="/profile">
        {isAuthenticated ? <Profile /> : <Landing />}
      </Route>
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/test-roles">
        {isAuthenticated ? <TestRoles /> : <Landing />}
      </Route>
      <Route path="/register">
        <Landing />
      </Route>
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>
      <Route component={() => <div>404 - Page not found</div>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;