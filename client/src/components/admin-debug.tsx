import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient, setAuthToken } from "@/lib/queryClient";

export function AdminDebug() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const refreshAuth = useMutation({
    mutationFn: async () => {
      // Clear existing token first
      localStorage.removeItem('authToken');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "yourmama@gmail.com"
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      if (data.token) {
        setAuthToken(data.token);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setTimeout(() => window.location.reload(), 100);
    }
  });

  const testAdminAccess = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
            Token: {localStorage.getItem('authToken') ? 'Present' : 'Missing'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => refreshAuth.mutate()}
            disabled={refreshAuth.isPending}
            size="sm"
          >
            {refreshAuth.isPending ? "Refreshing..." : "Refresh Admin Token"}
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