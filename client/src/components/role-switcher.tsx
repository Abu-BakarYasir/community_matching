import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  organizationId: number;
  organizationName: string;
}

const testUsers: TestUser[] = [
  {
    id: "test-super-admin",
    email: "superadmin@matches.community",
    firstName: "Super",
    lastName: "Admin",
    isAdmin: false,
    isSuperAdmin: true,
    organizationId: 0,
    organizationName: "Platform"
  },
  {
    id: "test-daa-admin",
    email: "admin@daa.community",
    firstName: "DAA",
    lastName: "Admin",
    isAdmin: true,
    isSuperAdmin: false,
    organizationId: 2,
    organizationName: "DAA"
  },
  {
    id: "test-daa-user1",
    email: "user1@daa.community",
    firstName: "John",
    lastName: "Doe",
    isAdmin: false,
    isSuperAdmin: false,
    organizationId: 2,
    organizationName: "DAA"
  },
  {
    id: "test-daa-user2",
    email: "user2@daa.community",
    firstName: "Jane",
    lastName: "Smith",
    isAdmin: false,
    isSuperAdmin: false,
    organizationId: 2,
    organizationName: "DAA"
  }
];

export function RoleSwitcher() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<TestUser | null>(null);

  const switchUserMutation = useMutation({
    mutationFn: async (user: TestUser) => {
      const response = await fetch(`/api/test/switch-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to switch user: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, user) => {
      setCurrentUser(user);
      // Invalidate all queries to refetch with new user context
      queryClient.invalidateQueries();
      toast({
        title: "User Switched",
        description: `Now testing as ${user.firstName} ${user.lastName} (${getRoleLabel(user)})`,
      });
      // Refresh the page to update the UI completely
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error) => {
      toast({
        title: "Switch Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearTestMode = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/test/clear-user`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear test mode: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setCurrentUser(null);
      queryClient.invalidateQueries();
      toast({
        title: "Test Mode Cleared",
        description: "Back to normal authentication",
      });
      setTimeout(() => window.location.reload(), 500);
    }
  });

  const getRoleLabel = (user: TestUser) => {
    if (user.isSuperAdmin) return "Super Admin";
    if (user.isAdmin) return "Community Admin";
    return "Community Member";
  };

  const getRoleColor = (user: TestUser) => {
    if (user.isSuperAdmin) return "bg-purple-500";
    if (user.isAdmin) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Multi-Role Testing System</CardTitle>
        <CardDescription>
          Switch between different user roles to test the multi-tenant system without multiple accounts.
          This is only available in development mode.
        </CardDescription>
        {currentUser && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
            <span className="text-sm font-medium">Currently testing as:</span>
            <Badge className={getRoleColor(currentUser)}>
              {currentUser.firstName} {currentUser.lastName} - {getRoleLabel(currentUser)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearTestMode.mutate()}
              disabled={clearTestMode.isPending}
            >
              Clear Test Mode
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testUsers.map((user) => (
            <div key={user.id} className="p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                  <Badge className={getRoleColor(user)}>
                    {getRoleLabel(user)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">Org: {user.organizationName}</p>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => switchUserMutation.mutate(user)}
                  disabled={switchUserMutation.isPending || currentUser?.id === user.id}
                >
                  {currentUser?.id === user.id ? "Current User" : "Switch To"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Testing Scenarios:</h4>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• <strong>Super Admin:</strong> Access /super-admin dashboard, manage organizations</li>
            <li>• <strong>Community Admin:</strong> Access /admin dashboard, manage DAA community</li>
            <li>• <strong>Community Members:</strong> Use /dashboard, see only DAA organization data</li>
            <li>• <strong>Signup Flow:</strong> Test /signup/daa as different user types</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}