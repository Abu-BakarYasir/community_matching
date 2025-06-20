import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Heart, Settings, Play, RefreshCw, Trash2, Edit } from "lucide-react";

export default function Admin() {
  const [matchingDay, setMatchingDay] = useState("1");
  const [editingUser, setEditingUser] = useState<any>(null);
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

  const triggerMatching = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/trigger-matching"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/matches"] });
      toast({
        title: "Matching Triggered",
        description: "Monthly matching process has been started successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Matching Failed",
        description: "Failed to trigger matching process. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSettings = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Matching settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateMatchingDay = () => {
    updateSettings.mutate({ matchingDay: parseInt(matchingDay) });
  };

  const deleteUser = useMutation({
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/admin/users/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "User profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMatch = useMutation({
    mutationFn: (matchId: number) => apiRequest("DELETE", `/api/admin/matches/${matchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/matches"] });
      toast({
        title: "Match Deleted",
        description: "Match has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      deleteUser.mutate(userId);
    }
  };

  const handleDeleteMatch = (matchId: number, matchName: string) => {
    if (confirm(`Are you sure you want to delete the match between ${matchName}? This action cannot be undone.`)) {
      deleteMatch.mutate(matchId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
          <p className="text-slate-600">Manage users, matches, and system settings.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-slate-600">
                {users.filter((u: any) => u.isActive).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Heart className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.length}</div>
              <p className="text-xs text-slate-600">
                This month: {matches.filter((m: any) => new Date(m.createdAt).getMonth() === new Date().getMonth()).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
              <p className="text-xs text-slate-600">
                Upcoming: {meetings.filter((m: any) => new Date(m.scheduledAt) > new Date()).length}
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.company || "—"}</TableCell>
                        <TableCell>{user.industry || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
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
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
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
                <div className="flex justify-between items-center">
                  <CardTitle>Match History</CardTitle>
                  <Button 
                    onClick={() => triggerMatching.mutate()}
                    disabled={triggerMatching.isPending}
                  >
                    {triggerMatching.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Trigger Matching
                  </Button>
                </div>
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
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Meeting</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match: any) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {match.user1?.firstName} {match.user1?.lastName}
                        </TableCell>
                        <TableCell className="font-medium">
                          {match.user2?.firstName} {match.user2?.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{match.matchScore}%</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={match.status === 'active' ? 'default' : 'secondary'}>
                            {match.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(match.createdAt)}</TableCell>
                        <TableCell>
                          {match.meeting ? (
                            <Badge variant="default">Scheduled</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
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
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participants</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Meeting Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((meeting: any) => (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium">
                          {meeting.match?.user1?.firstName} {meeting.match?.user1?.lastName}
                          {" & "}
                          {meeting.match?.user2?.firstName} {meeting.match?.user2?.lastName}
                        </TableCell>
                        <TableCell>{formatDateTime(meeting.scheduledAt)}</TableCell>
                        <TableCell>
                          <a 
                            href={meeting.meetingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Join Meeting
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            meeting.status === 'scheduled' ? 'default' :
                            meeting.status === 'completed' ? 'secondary' : 'destructive'
                          }>
                            {meeting.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(meeting.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Matching Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="matchingDay">Monthly Matching Day</Label>
                    <Select value={matchingDay} onValueChange={setMatchingDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day of month" />
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
                      The day of each month when automatic matching runs
                    </p>
                  </div>

                  <Button 
                    onClick={handleUpdateMatchingDay}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? "Updating..." : "Update Settings"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Weights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Industry Match: {settings?.weights?.industry || 35}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings?.weights?.industry || 35}
                      onChange={(e) => {
                        const newWeights = {
                          ...settings?.weights,
                          industry: parseInt(e.target.value)
                        };
                        updateSettings.mutate({ weights: newWeights });
                      }}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>Company Type: {settings?.weights?.company || 20}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={settings?.weights?.company || 20}
                      onChange={(e) => {
                        const newWeights = {
                          ...settings?.weights,
                          company: parseInt(e.target.value)
                        };
                        updateSettings.mutate({ weights: newWeights });
                      }}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>Networking Goals: {settings?.weights?.networkingGoals || 30}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings?.weights?.networkingGoals || 30}
                      onChange={(e) => {
                        const newWeights = {
                          ...settings?.weights,
                          networkingGoals: parseInt(e.target.value)
                        };
                        updateSettings.mutate({ weights: newWeights });
                      }}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>Job Title: {settings?.weights?.jobTitle || 15}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings?.weights?.jobTitle || 15}
                      onChange={(e) => {
                        const newWeights = {
                          ...settings?.weights,
                          jobTitle: parseInt(e.target.value)
                        };
                        updateSettings.mutate({ weights: newWeights });
                      }}
                      className="w-full mt-2"
                    />
                  </div>

                  <p className="text-xs text-slate-600">
                    Weights determine how much each factor influences match scores. 
                    Each user gets exactly one match per period. With odd numbers, one user may remain unmatched.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Trigger Monthly Matching</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Run the matching algorithm. Each user gets one match per period. With odd numbers of users, one may remain unmatched and will be notified.
                    </p>
                    <Button 
                      onClick={() => triggerMatching.mutate()}
                      disabled={triggerMatching.isPending}
                      variant="outline"
                    >
                      {triggerMatching.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {triggerMatching.isPending ? "Running..." : "Run Matching Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateUser.mutate(editingUser);
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editingUser.firstName || ""}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editingUser.lastName || ""}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={editingUser.jobTitle || ""}
                    onChange={(e) => setEditingUser({...editingUser, jobTitle: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={editingUser.company || ""}
                    onChange={(e) => setEditingUser({...editingUser, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    value={editingUser.industry || ""} 
                    onValueChange={(value) => setEditingUser({...editingUser, industry: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Non-profit">Non-profit</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={editingUser.bio || ""}
                    onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                    placeholder="Professional bio..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={editingUser.linkedinUrl || ""}
                    onChange={(e) => setEditingUser({...editingUser, linkedinUrl: e.target.value})}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={editingUser.isActive ? "active" : "inactive"} 
                    onValueChange={(value) => setEditingUser({...editingUser, isActive: value === "active"})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}