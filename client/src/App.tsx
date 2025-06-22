import React from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import Landing from "@/pages/landing";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/admin" component={AdminRoute} />
        </>
      )}
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