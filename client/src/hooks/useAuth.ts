import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh auth state
  });

  // Log auth state for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth state:', { user, isLoading, error, isAuthenticated: !!user });
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}