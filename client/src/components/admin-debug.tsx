import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function AdminDebug() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const refreshAuth = useMutation({
    mutationFn: async () => {
      // Clear existing token first
      localStorage.removeItem('authToken');
      
      const response = await apiRequest("POST", "/api/auth/login", {
        email: "yourmama@gmail.com"
      });
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setTimeout(() => window.location.reload(), 100);
    }
  });

  const testAdminAccess = useMutation({
    mutationFn: () => apiRequest("GET", "/api/admin/settings"),
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