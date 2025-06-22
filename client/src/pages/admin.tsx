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
  const [matchingDay, setMatchingDay] = useState("1");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userAvailability, setUserAvailability] = useState<any[]>([]);
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
    onSuccess: (response) => {
      console.log("Settings update response:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
      toast({
        title: "Settings Updated",
        description: "Matching settings have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Settings update error:", error);
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

  const deleteMeeting = useMutation({
    mutationFn: (meetingId: number) => apiRequest("DELETE", `/api/admin/meetings/${meetingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meetings"] });
      toast({
        title: "Meeting Deleted",
        description: "Meeting has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAllUsers = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/admin/users"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meetings"] });
      toast({
        title: "Users Deleted",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete users. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAllMatches = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/admin/matches"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meetings"] });
      toast({
        title: "Matches Deleted",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete matches. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAllMeetings = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/admin/meetings"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meetings"] });
      toast({
        title: "Meetings Deleted",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete meetings. Please try again.",
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

  const handleEditUser = async (user: any) => {
    setEditingUser(user);
    // Reset state first
    setUserAvailability([]);
    
    // Fetch user's availability from database
    try {
      const response = await apiRequest("GET", `/api/availability?userId=${user.id}`);
      console.log('Fetched availability for user', user.id, ':', response);
      
      // Ensure response is an array
      if (Array.isArray(response)) {
        setUserAvailability(response);
      } else {
        console.warn('Availability response is not an array:', response);
        setUserAvailability([]);
      }
    } catch (error) {
      console.error('Failed to fetch user availability:', error);
      setUserAvailability([]);
    }
  };

  const updateAvailability = (dayOfWeek: number, field: string, value: any) => {
    setUserAvailability(prev => {
      const existing = prev.find(a => a.dayOfWeek === dayOfWeek);
      if (existing) {
        return prev.map(a => 
          a.dayOfWeek === dayOfWeek 
            ? { ...a, [field]: value }
            : a
        );
      } else {
        return [...prev, {
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
          [field]: value
        }];
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' MT';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Denver',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' MT';
  };

  const getOrganizationSlug = () => {
    // Get organization slug from user data or settings
    return user?.organizationName?.toLowerCase() || 'daa';
  };

  const getInviteLink = () => {
    const slug = getOrganizationSlug();
    return `${window.location.origin}/signup/${slug}`;
  };

  const copyInviteLink = async () => {
    const inviteLink = getInviteLink();
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast({
        title: "Link Copied",
        description: "Community invite link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {user?.organizationName || "Community"} Dashboard
          </h2>
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

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="emails">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>App Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      value={settings?.appName || "DAA Matches"}
                      onChange={(e) => updateSettings.mutate({ appName: e.target.value })}
                      className="mt-2"
                      placeholder="Enter application name"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Name displayed throughout the application
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultFirstName">Default First Name</Label>
                    <Input
                      id="defaultFirstName"
                      value={settings?.defaultFirstName || "User"}
                      onChange={(e) => updateSettings.mutate({ defaultFirstName: e.target.value })}
                      className="mt-2"
                      placeholder="Enter default first name"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Default first name for new users (instead of extracting from email)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultLastName">Default Last Name</Label>
                    <Input
                      id="defaultLastName"
                      value={settings?.defaultLastName || ""}
                      onChange={(e) => updateSettings.mutate({ defaultLastName: e.target.value })}
                      className="mt-2"
                      placeholder="Enter default last name (optional)"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Default last name for new users (leave empty if not needed)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="googleMeetLink">Default Google Meet Link</Label>
                    <Input
                      id="googleMeetLink"
                      value={settings?.googleMeetLink || "https://meet.google.com/wnf-cjab-twp"}
                      onChange={(e) => updateSettings.mutate({ googleMeetLink: e.target.value })}
                      className="mt-2"
                      placeholder="Enter Google Meet link"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Default meeting link used for all scheduled meetings
                    </p>
                  </div>

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

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Prevent Meeting Overlaps</Label>
                      <p className="text-sm text-slate-600">Only allow one meeting at a time per user</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => updateSettings.mutate({ preventMeetingOverlap: !settings?.preventMeetingOverlap })}
                      disabled={updateSettings.isPending}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out p-1 ${
                        settings?.preventMeetingOverlap 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-slate-300 hover:bg-slate-400"
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                        settings?.preventMeetingOverlap ? "translate-x-8" : "translate-x-0"
                      }`}>
                        <span className={`flex items-center justify-center w-full h-full text-xs font-bold ${
                          settings?.preventMeetingOverlap ? "text-green-600" : "text-slate-600"
                        }`}>
                          {updateSettings.isPending ? "..." : (settings?.preventMeetingOverlap ? "ON" : "OFF")}
                        </span>
                      </div>
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="monthlyGoals">Monthly Focus Goals</Label>
                    <div className="mt-2 space-y-2">
                      {(settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]).map((goal, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={goal}
                            onChange={(e) => {
                              const newGoals = [...(settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"])];
                              newGoals[index] = e.target.value;
                              updateSettings.mutate({ monthlyGoals: newGoals });
                            }}
                            className="flex-1"
                            placeholder="Enter goal option"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newGoals = (settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]).filter((_, i) => i !== index);
                              updateSettings.mutate({ monthlyGoals: newGoals });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newGoals = [...(settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]), "New Goal"];
                          updateSettings.mutate({ monthlyGoals: newGoals });
                        }}
                      >
                        Add Goal
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Options users can select for their monthly networking focus</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={handleUpdateMatchingDay}
                      disabled={updateSettings.isPending}
                    >
                      {updateSettings.isPending ? "Updating..." : "Save Matching Day"}
                    </Button>
                    {updateSettings.isPending && (
                      <div className="text-sm text-blue-600">Saving settings...</div>
                    )}
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Current matching day: {settings?.matchingDay || matchingDay}
                  </p>
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

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete ALL users? This will delete all non-admin users and cannot be undone.")) {
                        deleteAllUsers.mutate();
                      }
                    }}
                    disabled={deleteAllUsers.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteAllUsers.isPending ? "Deleting..." : "Delete All Users"}
                  </Button>
                </div>
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
                    {filteredUsers.map((user: any) => (
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
                        <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
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
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete ALL matches? This will delete all match data and cannot be undone.")) {
                          deleteAllMatches.mutate();
                        }
                      }}
                      disabled={deleteAllMatches.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteAllMatches.isPending ? "Deleting..." : "Delete All Matches"}
                    </Button>
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
                        <TableCell>{formatDateTime(match.createdAt)}</TableCell>
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
            <div className="rounded-lg border">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Meeting Management</h3>
                    <p className="text-sm text-gray-600">Manage all scheduled meetings between matched users</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete ALL meetings? This will delete all scheduled meetings and cannot be undone.")) {
                        deleteAllMeetings.mutate();
                      }
                    }}
                    disabled={deleteAllMeetings.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteAllMeetings.isPending ? "Deleting..." : "Delete All Meetings"}
                  </Button>
                </div>
              </div>
              
              {meetings && meetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Participants</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Scheduled Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Match Score</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Meeting Link</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {meetings.map((meeting: any) => (
                        <tr key={meeting.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="font-medium text-sm">
                                  {meeting.match.user1.firstName} {meeting.match.user1.lastName}
                                </div>
                                <div className="text-xs text-gray-500">{meeting.match.user1.email}</div>
                              </div>
                              <span className="text-gray-400">↔</span>
                              <div>
                                <div className="font-medium text-sm">
                                  {meeting.match.user2.firstName} {meeting.match.user2.lastName}
                                </div>
                                <div className="text-xs text-gray-500">{meeting.match.user2.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {meeting.scheduledAt ? formatDateTime(meeting.scheduledAt) : 'Not scheduled'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              meeting.status === 'scheduled' 
                                ? 'bg-green-100 text-green-800'
                                : meeting.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {meeting.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <span className="font-medium">{meeting.match.matchScore}%</span>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${meeting.match.matchScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <a 
                              href="https://meet.google.com/wnf-cjab-twp" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline"
                            >
                              Join Meeting
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('Edit meeting:', meeting.id);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete this meeting? This action cannot be undone.`)) {
                                    deleteMeeting.mutate(meeting.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h3>
                  <p className="text-gray-500">Meetings will appear here once users schedule them through matches.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>App Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      value={settings?.appName || "DAA Matches"}
                      onChange={(e) => updateSettings.mutate({ appName: e.target.value })}
                      className="mt-2"
                      placeholder="Enter application name"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Name displayed throughout the application
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultFirstName">Default First Name</Label>
                    <Input
                      id="defaultFirstName"
                      value={settings?.defaultFirstName || "User"}
                      onChange={(e) => updateSettings.mutate({ defaultFirstName: e.target.value })}
                      className="mt-2"
                      placeholder="Enter default first name"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Default first name for new users (instead of extracting from email)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultLastName">Default Last Name</Label>
                    <Input
                      id="defaultLastName"
                      value={settings?.defaultLastName || ""}
                      onChange={(e) => updateSettings.mutate({ defaultLastName: e.target.value })}
                      className="mt-2"
                      placeholder="Enter default last name (optional)"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Default last name for new users (leave empty if not needed)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="googleMeetLink">Default Google Meet Link</Label>
                    <Input
                      id="googleMeetLink"
                      value={settings?.googleMeetLink || "https://meet.google.com/wnf-cjab-twp"}
                      onChange={(e) => updateSettings.mutate({ googleMeetLink: e.target.value })}
                      className="mt-2"
                      placeholder="Enter Google Meet link"
                    />
                    <p className="text-sm text-slate-600 mt-1">
                      Default meeting link used for all scheduled meetings
                    </p>
                  </div>

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

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Prevent Meeting Overlaps</Label>
                      <p className="text-sm text-slate-600">Only allow one meeting at a time per user</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => updateSettings.mutate({ preventMeetingOverlap: !settings?.preventMeetingOverlap })}
                      disabled={updateSettings.isPending}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out p-1 ${
                        settings?.preventMeetingOverlap 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-slate-300 hover:bg-slate-400"
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                        settings?.preventMeetingOverlap ? "translate-x-8" : "translate-x-0"
                      }`}>
                        <span className={`flex items-center justify-center w-full h-full text-xs font-bold ${
                          settings?.preventMeetingOverlap ? "text-green-600" : "text-slate-600"
                        }`}>
                          {updateSettings.isPending ? "..." : (settings?.preventMeetingOverlap ? "ON" : "OFF")}
                        </span>
                      </div>
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="monthlyGoals">Monthly Focus Goals</Label>
                    <div className="mt-2 space-y-2">
                      {(settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]).map((goal, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={goal}
                            onChange={(e) => {
                              const newGoals = [...(settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"])];
                              newGoals[index] = e.target.value;
                              updateSettings.mutate({ monthlyGoals: newGoals });
                            }}
                            className="flex-1"
                            placeholder="Enter goal option"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newGoals = (settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]).filter((_, i) => i !== index);
                              updateSettings.mutate({ monthlyGoals: newGoals });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newGoals = [...(settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]), "New Goal"];
                          updateSettings.mutate({ monthlyGoals: newGoals });
                        }}
                      >
                        Add Goal
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Options users can select for their monthly networking focus</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={handleUpdateMatchingDay}
                      disabled={updateSettings.isPending}
                    >
                      {updateSettings.isPending ? "Updating..." : "Save Matching Day"}
                    </Button>
                    {updateSettings.isPending && (
                      <div className="text-sm text-blue-600">Saving settings...</div>
                    )}
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Current matching day: {settings?.matchingDay || matchingDay}
                  </p>
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

          <TabsContent value="emails" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Customize email templates for match notifications and meeting reminders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Match Notification Subject</label>
                    <input
                      type="text"
                      defaultValue="🎯 New Match Found - DAA Monthly Matching"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email subject line"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Email Content Template</label>
                    <textarea
                      rows={12}
                      defaultValue="Hi FIRST_NAME,

Great news! We've found you a networking match based on your professional profile and goals.

Your Match:
PARTNER_NAME - PARTNER_TITLE at PARTNER_COMPANY
Industry: PARTNER_INDUSTRY

Match Score: MATCH_SCORE%

This match was made based on your professional backgrounds, networking goals, and industry compatibility.

Best regards,
The DAA Monthly Matching Team"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Email template content (use variables for dynamic content)"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Available Variables:</strong><br/>
                    FIRST_NAME, LAST_NAME, PARTNER_NAME, PARTNER_TITLE, PARTNER_COMPANY, PARTNER_INDUSTRY, MATCH_SCORE
                  </div>
                  
                  <div className="flex gap-3">
                    <Button>Save Template</Button>
                    <Button variant="outline">Preview Email</Button>
                    <Button variant="outline">Send Test Email</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              try {
                // Update user profile
                await apiRequest("PATCH", `/api/admin/users/${editingUser.id}`, editingUser);
                
                // Update availability
                console.log('Updating availability:', userAvailability);
                for (const avail of userAvailability) {
                  if (avail.id) {
                    // Update existing
                    await apiRequest("PATCH", `/api/availability/${avail.id}`, avail);
                  } else {
                    // Create new
                    await apiRequest("POST", `/api/availability`, {
                      ...avail,
                      userId: editingUser.id
                    });
                  }
                }
                
                // Close modal and refresh data
                setEditingUser(null);
                queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                
                toast({
                  title: "User Updated",
                  description: "User profile and availability updated successfully.",
                });
              } catch (error) {
                console.error('Failed to update user:', error);
                toast({
                  title: "Update Failed",
                  description: "Failed to update user. Please try again.",
                  variant: "destructive",
                });
              }
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

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Weekly Availability</h4>
                  <div className="space-y-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                      const dayOfWeek = index + 1;
                      const availability = Array.isArray(userAvailability) ? userAvailability.find(a => a.dayOfWeek === dayOfWeek) : null;
                      
                      return (
                        <div key={day} className="flex items-center space-x-3 text-sm">
                          <div className="w-20 font-medium">{day}</div>
                          <input
                            type="checkbox"
                            checked={availability?.isAvailable || false}
                            onChange={(e) => updateAvailability(dayOfWeek, 'isAvailable', e.target.checked)}
                            className="rounded"
                          />
                          {availability?.isAvailable && (
                            <>
                              <input
                                type="time"
                                value={availability?.startTime || '09:00'}
                                onChange={(e) => updateAvailability(dayOfWeek, 'startTime', e.target.value)}
                                className="px-2 py-1 border rounded text-sm"
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={availability?.endTime || '17:00'}
                                onChange={(e) => updateAvailability(dayOfWeek, 'endTime', e.target.value)}
                                className="px-2 py-1 border rounded text-sm"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
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