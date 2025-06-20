import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import Dashboard from "@/pages/dashboard";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Register />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AuthWrapper>
          <Dashboard />
        </AuthWrapper>
      )} />
      <Route path="/dashboard" component={() => (
        <AuthWrapper>
          <Dashboard />
        </AuthWrapper>
      )} />
      <Route path="/profile" component={() => (
        <AuthWrapper>
          <Profile />
        </AuthWrapper>
      )} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
