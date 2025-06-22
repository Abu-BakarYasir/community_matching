import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function AdminDebug() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const refreshAuth = useMutation({
    mutationFn: async () => {
      // Redirect to Replit login
      window.location.href = '/api/login';
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  });

  const testAdminAccess = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Admin access failed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Admin access successful:', data);
    },
    onError: (error) => {
      console.error('Admin access failed:', error);
    }
  });

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Admin Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            Current User: {user?.email} (Admin: {user?.isAdmin ? 'Yes' : 'No'})
          </p>
          <p className="text-sm text-gray-600">
            Authentication: Replit Auth (Session-based)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => refreshAuth.mutate()}
            disabled={refreshAuth.isPending}
            size="sm"
          >
            {refreshAuth.isPending ? "Redirecting..." : "Login via Replit"}
          </Button>
          
          <Button 
            onClick={() => testAdminAccess.mutate()}
            disabled={testAdminAccess.isPending}
            variant="outline"
            size="sm"
          >
            Test Admin Access
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}