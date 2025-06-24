import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Heart, Settings, Play, RefreshCw, Trash2, Edit, Copy, Link } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["/api/admin/matches"],
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["/api/admin/meetings"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  // Ensure all data is arrays
  const safeUsers = Array.isArray(users) ? users : [];
  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeMeetings = Array.isArray(meetings) ? meetings : [];

  const filteredUsers = safeUsers.filter((user: any) => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest("PATCH", "/api/admin/settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const triggerMatching = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/trigger-matching", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/matches"] });
      toast({
        title: "Matching completed",
        description: `Created ${data.matchCount} matches successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Matching failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User has been removed from the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInviteLink = () => {
    const baseUrl = window.location.origin;
    const orgData = user?.organization || user;
    const orgSlug = orgData?.slug || 'daa';
    return `${baseUrl}/signup/${orgSlug}`;
  };

  const copyInviteLink = async () => {
    const link = getInviteLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast({
        title: "Link copied!",
        description: "Community invite link copied to clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUser.mutate(userId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {user?.organizationName || "DAA"} Dashboard
          </h1>
          <p className="text-slate-600">
            Manage users, matches, and system settings.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeUsers.length}</div>
              <p className="text-xs text-slate-600">
                +{safeUsers.filter((u: any) => new Date(u.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Heart className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeMatches.length}</div>
              <p className="text-xs text-slate-600">
                +{safeMatches.filter((m: any) => new Date(m.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeMeetings.length}</div>
              <p className="text-xs text-slate-600">
                +{safeMeetings.filter((m: any) => new Date(m.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Settings className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-slate-600">
                Next matching: Day {settings?.matchingDay || 1}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="emails">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Invite Link</CardTitle>
                  <CardDescription>
                    Share this link with community members to join your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border">
                    <Link className="h-4 w-4 text-slate-500" />
                    <code className="flex-1 text-sm font-mono text-slate-700 break-all">
                      {getInviteLink()}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyInviteLink}
                      className="flex items-center space-x-2 shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                      <span>{copiedLink ? "Copied!" : "Copy"}</span>
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">
                    New members who sign up using this link will automatically join the {user?.organizationName || "DAA"} community and can participate in monthly matching rounds.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Community Name</Label>
                    <Input
                      id="appName"
                      value={settings?.appName || "DAA Community"}
                      onChange={(e) => updateSettings.mutate({ appName: e.target.value })}
                      className="mt-2"
                      placeholder="Enter community name"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Name displayed throughout the application
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="matchingDay">Monthly Matching Day</Label>
                    <Select
                      value={settings?.matchingDay?.toString() || "1"}
                      onValueChange={(value) => updateSettings.mutate({ matchingDay: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select matching day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Day {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-600 mt-1">
                      Day of the month when matching occurs
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={() => triggerMatching.mutate()}
                      disabled={triggerMatching.isPending}
                      className="w-full"
                      variant="default"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {triggerMatching.isPending ? "Running..." : "Run Monthly Matching"}
                    </Button>
                    <p className="text-sm text-slate-600 mt-2">
                      Manually trigger the monthly matching algorithm for all opted-in users
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage community members and their profiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.jobTitle || "Not specified"}</TableCell>
                        <TableCell>{user.company || "Not specified"}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                            >
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

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Match History</CardTitle>
                <CardDescription>
                  View all matches created by the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User 1</TableHead>
                      <TableHead>User 2</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeMatches.map((match: any) => (
                      <TableRow key={match.id}>
                        <TableCell>
                          {match.user1?.firstName} {match.user1?.lastName}
                        </TableCell>
                        <TableCell>
                          {match.user2?.firstName} {match.user2?.lastName}
                        </TableCell>
                        <TableCell>{match.matchScore}%</TableCell>
                        <TableCell>
                          <Badge variant={match.meeting ? "default" : "secondary"}>
                            {match.meeting ? "Meeting Scheduled" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(match.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Schedule</CardTitle>
                <CardDescription>
                  View all scheduled meetings between matched users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participants</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Meeting Link</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeMeetings.map((meeting: any) => (
                      <TableRow key={meeting.id}>
                        <TableCell>
                          {meeting.match?.user1?.firstName} {meeting.match?.user1?.lastName} & {meeting.match?.user2?.firstName} {meeting.match?.user2?.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(meeting.scheduledAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{meeting.duration} minutes</TableCell>
                        <TableCell>
                          <a
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Join Meeting
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Scheduled</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Manage automated email notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Email templates are automatically generated based on your community settings.
                  Match notifications and meeting reminders are sent using your community name and branding.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}