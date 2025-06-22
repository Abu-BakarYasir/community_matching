import { useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building, Users, Settings, Shield, Plus, Edit, Trash2, Crown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdmin() {
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const { toast } = useToast();

  // Fetch all organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/super-admin/organizations"],
  });

  // Fetch all users across all organizations
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/super-admin/users"],
  });

  // Fetch platform statistics
  const { data: platformStats } = useQuery({
    queryKey: ["/api/super-admin/stats"],
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (orgData: { name: string; slug: string; description?: string }) => {
      return apiRequest("/api/super-admin/organizations", "POST", orgData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/organizations"] });
      setNewOrgName("");
      setNewOrgSlug("");
      setNewOrgDescription("");
      toast({ title: "Organization created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating organization", description: error.message, variant: "destructive" });
    },
  });

  // Toggle super admin mutation
  const toggleSuperAdminMutation = useMutation({
    mutationFn: async ({ userId, isSuperAdmin }: { userId: string; isSuperAdmin: boolean }) => {
      return apiRequest(`/api/super-admin/users/${userId}/super-admin`, "PATCH", { isSuperAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
      toast({ title: "Super admin status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating super admin status", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgSlug) return;
    
    createOrgMutation.mutate({
      name: newOrgName,
      slug: newOrgSlug,
      description: newOrgDescription,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8" style={{ color: '#f97316' }} />
            <div>
              <h2 className="text-3xl font-bold" style={{ color: '#1e293b' }}>
                Super Admin Dashboard
              </h2>
              <p style={{ color: '#6b7280' }}>
                Manage the entire Matches.Community SaaS platform
              </p>
            </div>
          </div>
        </div>

        {/* Platform Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card style={{ backgroundColor: '#fefefe' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Total Organizations
              </CardTitle>
              <Building className="h-4 w-4" style={{ color: '#2563eb' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>
                {organizations.length}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#fefefe' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Total Users
              </CardTitle>
              <Users className="h-4 w-4" style={{ color: '#f97316' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>
                {allUsers.length}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#fefefe' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Active Communities
              </CardTitle>
              <Settings className="h-4 w-4" style={{ color: '#0891b2' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>
                {organizations.filter((org: any) => org.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#fefefe' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Super Admins
              </CardTitle>
              <Shield className="h-4 w-4" style={{ color: '#f97316' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>
                {allUsers.filter((user: any) => user.isSuperAdmin).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Platform Users</TabsTrigger>
            <TabsTrigger value="settings">Platform Settings</TabsTrigger>
          </TabsList>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold" style={{ color: '#1e293b' }}>
                Organizations
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button style={{ background: 'linear-gradient(to right, #f97316, #fb923c)' }} className="text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrganization} className="space-y-4">
                    <div>
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Tech Community"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="orgSlug">URL Slug</Label>
                      <Input
                        id="orgSlug"
                        value={newOrgSlug}
                        onChange={(e) => setNewOrgSlug(e.target.value)}
                        placeholder="tech-community"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="orgDescription">Description</Label>
                      <Textarea
                        id="orgDescription"
                        value={newOrgDescription}
                        onChange={(e) => setNewOrgDescription(e.target.value)}
                        placeholder="A community for tech professionals..."
                        rows={3}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full text-white"
                      style={{ background: 'linear-gradient(to right, #f97316, #fb923c)' }}
                      disabled={createOrgMutation.isPending}
                    >
                      {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card style={{ backgroundColor: '#fefefe' }}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org: any) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="font-mono text-sm">{org.slug}</TableCell>
                        <TableCell>
                          <Badge variant={org.isActive ? "default" : "secondary"}>
                            {org.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(org.createdAt)}</TableCell>
                        <TableCell>
                          {allUsers.filter((user: any) => user.organizationId === org.id).length}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <h3 className="text-xl font-semibold" style={{ color: '#1e293b' }}>
              Platform Users
            </h3>

            <Card style={{ backgroundColor: '#fefefe' }}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user: any) => {
                      const userOrg = organizations.find((org: any) => org.id === user.organizationId);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm" style={{ color: '#6b7280' }}>{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {userOrg ? userOrg.name : "No Organization"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {user.isSuperAdmin && (
                                <Badge style={{ backgroundColor: '#f97316', color: 'white' }}>
                                  Super Admin
                                </Badge>
                              )}
                              {user.isAdmin && (
                                <Badge style={{ backgroundColor: '#2563eb', color: 'white' }}>
                                  Community Admin
                                </Badge>
                              )}
                              {!user.isAdmin && !user.isSuperAdmin && (
                                <Badge variant="secondary">Member</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleSuperAdminMutation.mutate({
                                userId: user.id,
                                isSuperAdmin: !user.isSuperAdmin
                              })}
                              disabled={toggleSuperAdminMutation.isPending}
                            >
                              {user.isSuperAdmin ? "Remove Super Admin" : "Make Super Admin"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h3 className="text-xl font-semibold" style={{ color: '#1e293b' }}>
              Platform Settings
            </h3>

            <Card style={{ backgroundColor: '#fefefe' }}>
              <CardHeader>
                <CardTitle>Global Platform Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    defaultValue="Matches.Community"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    defaultValue="support@matches.community"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxOrgsPerPlan">Max Organizations per Plan</Label>
                  <Input
                    id="maxOrgsPerPlan"
                    type="number"
                    defaultValue="10"
                    className="mt-1"
                  />
                </div>
                <Button 
                  className="text-white"
                  style={{ background: 'linear-gradient(to right, #2563eb, #3b82f6)' }}
                >
                  Save Platform Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}