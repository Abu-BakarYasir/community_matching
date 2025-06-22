import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { SchedulingModal } from "@/components/scheduling-modal";
import { ProfileModal } from "@/components/profile-modal";
import { AvailabilityModal } from "@/components/availability-modal";
import { AdminDebug } from "@/components/admin-debug";
import { NextRoundCard } from "@/components/next-round-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, Clock, Handshake, ArrowRight, Video, Coffee, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MatchWithUsers, MeetingWithMatch } from "@shared/schema";

export default function Dashboard() {
  const [selectedMatch, setSelectedMatch] = useState<MatchWithUsers | null>(null);
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: userAvailability } = useQuery({
    queryKey: ["/api/availability"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["/api/matches"],
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["/api/meetings"],
  });

  const recentMatches = Array.isArray(matches) ? matches.slice(0, 3) : [];
  const upcomingMeetings = Array.isArray(meetings) 
    ? meetings.filter((m: MeetingWithMatch) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()).slice(0, 2)
    : [];

  const handleScheduleMatch = (match: MatchWithUsers) => {
    setSelectedMatch(match);
    setSchedulingOpen(true);
  };

  const { toast } = useToast();

  const optToggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      console.log('Toggling opt-in status to:', isActive);
      return apiRequest("PATCH", "/api/user/opt-status", { isActive });
    },
    onSuccess: (data, variables) => {
      console.log('Opt-in toggle successful:', data);
      // Refetch user data to get updated status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: variables ? "Opted In" : "Opted Out",
        description: variables 
          ? "You'll be included in the next matching round!" 
          : "You won't be included in future matches until you opt back in.",
      });
    },
    onError: (error) => {
      console.error('Opt-in toggle error:', error);
      toast({
        title: "Error",
        description: "Failed to update opt-in status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOptToggle = () => {
    optToggleMutation.mutate(!user?.isActive);
  };

  const getMatchScoreClass = (score: number) => {
    if (score >= 90) return "match-score-high";
    if (score >= 75) return "match-score-medium";
    return "match-score-low";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getOtherUser = (match: MatchWithUsers) => {
    if (!match.user1 || !match.user2 || !user) return null;
    return match.user1.email === user.email ? match.user2 : match.user1;
  };

  const getProfileCompletion = () => {
    if (!user) return 0;
    
    let completed = 0;
    const total = 4;
    
    if (user.firstName && user.lastName) completed++;
    if (user.jobTitle && user.company && user.industry) completed++;
    if (user.profileQuestions?.networkingGoals?.length) completed++;
    if (userAvailability && userAvailability.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const profileCompletion = getProfileCompletion();

  // Calculate days remaining for next matching (assuming monthly on 1st)
  const getDaysUntilNextMatching = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysUntilNextMatching();

  // Get all matches (they now include meeting info)
  const allMatches = Array.isArray(matches) ? matches : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.email === 'yourmama@gmail.com' && <AdminDebug />}
        {/* Welcome Section with Opt-in Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={`${user.firstName}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Welcome back, {user?.firstName}!
                </h2>
                <p className="text-slate-600">Here's your networking activity for this month.</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {user?.isActive ? "Opted In" : "Opted Out"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.isActive ? "You'll be included in matches" : "You won't be matched"}
                </p>
              </div>
              <div
                onClick={handleOptToggle}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out cursor-pointer flex items-center ${
                  user?.isActive 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-slate-300 hover:bg-slate-400"
                } ${optToggleMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`absolute w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center ${
                  user?.isActive ? "translate-x-7" : "translate-x-0.5"
                }`}>
                  <span className={`text-xs font-bold ${
                    user?.isActive ? "text-green-600" : "text-slate-600"
                  }`}>
                    {optToggleMutation.isPending ? "..." : (user?.isActive ? "ON" : "OFF")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="space-y-8">
          {/* This Round's Matches & Meetings - Top Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">This Round's Matches & Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              {allMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No matches yet</p>
                  <p className="text-sm text-slate-400 mt-1">Complete your profile to get matched with other professionals!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allMatches.map((match: MatchWithUsers) => {
                    const otherUser = getOtherUser(match);
                    if (!otherUser) return null;
                    
                    const hasMeeting = match.meeting && match.meeting.status === 'scheduled';
                    const meeting = match.meeting;
                    

                    

                    const meetingDate = hasMeeting ? new Date(match.meeting.scheduledAt) : null;
                    const isToday = meetingDate ? meetingDate.toDateString() === new Date().toDateString() : false;
                    const isUpcoming = meetingDate ? meetingDate > new Date() : false;
                    
                    return (
                      <div
                        key={match.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          isToday 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' 
                            : hasMeeting && isUpcoming
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                            : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {/* Main content area */}
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isToday 
                              ? 'bg-blue-100 dark:bg-blue-800' 
                              : hasMeeting 
                              ? 'bg-green-100 dark:bg-green-800' 
                              : 'bg-blue-100 dark:bg-blue-900'
                          }`}>
                            {hasMeeting ? (
                              match.meeting?.meetingType === 'video' ? (
                                <Video className={`h-5 w-5 ${isToday ? 'text-blue-600' : 'text-green-600'}`} />
                              ) : (
                                <Coffee className={`h-5 w-5 ${isToday ? 'text-blue-600' : 'text-green-600'}`} />
                              )
                            ) : (
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {otherUser.firstName.charAt(0)}{otherUser.lastName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {otherUser.firstName} {otherUser.lastName}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {match.matchScore}% Match
                              </Badge>
                              {hasMeeting && (
                                <Badge 
                                  variant="secondary" 
                                  className={
                                    isToday 
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
                                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  }
                                >
                                  {isToday ? 'Today' : 'Scheduled'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {otherUser.jobTitle || 'Professional'} {otherUser.company ? `at ${otherUser.company}` : ''}
                            </p>
                            {hasMeeting && meetingDate && (
                              <div className="mt-2 space-y-1">
                                <p className={`text-sm font-medium ${
                                  isToday 
                                    ? 'text-blue-700 dark:text-blue-300' 
                                    : 'text-green-700 dark:text-green-300'
                                }`}>
                                  Meeting Scheduled: {isToday ? 'Today' : meetingDate.toLocaleDateString()} at {meetingDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Duration: {match.meeting?.duration}min • Type: {match.meeting?.meetingType === 'video' ? 'Video Call' : 'Coffee Chat'}
                                </p>
                                {match.meeting?.meetingLink && (
                                  <p className="text-xs">
                                    <span className="text-slate-500">Link: </span>
                                    <a 
                                      href={match.meeting.meetingLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {match.meeting.meetingLink.includes('meet.google.com') ? 'Google Meet' : 'Meeting Link'}
                                    </a>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action buttons below content */}
                        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                          {hasMeeting ? (
                            <>
                              <Button
                                onClick={() => window.open(match.meeting?.meetingLink, '_blank')}
                                size="sm"
                                className={`${
                                  isToday 
                                    ? "bg-blue-600 hover:bg-blue-700" 
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {isToday ? 'Join Now' : 'Join'}
                              </Button>
                              <Button
                                onClick={() => {
                                  if (!meeting) {
                                    console.error('No meeting data available');
                                    return;
                                  }
                                  
                                  console.log('🗓️ Add to Calendar clicked for meeting:', meeting.id);
                                  
                                  // Create Google Calendar URL
                                  const startDate = new Date(meeting.scheduledAt);
                                  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour meeting
                                  
                                  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
                                  const formatForGoogle = (date: Date) => {
                                    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
                                  };
                                  
                                  const title = `DAA Matches Meeting with ${otherUser.firstName} ${otherUser.lastName}`;
                                  const details = `Networking meeting scheduled through DAA Matches.

Meeting Link: ${meeting.meetingLink}
Match Score: ${match.matchScore}%

Looking forward to connecting!`;
                                  
                                  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(meeting.meetingLink)}&ctz=America/New_York`;
                                  
                                  console.log('Opening Google Calendar:', googleCalendarUrl);
                                  
                                  // Open Google Calendar in new tab
                                  window.open(googleCalendarUrl, '_blank');
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Add to Calendar
                              </Button>
                              <Button
                                onClick={() => handleScheduleMatch(match)}
                                size="sm"
                                variant="outline"
                              >
                                Edit
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleScheduleMatch(match)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Schedule Meeting
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Round's Matches Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next Round's Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NextRoundCard user={user} />
            </CardContent>
          </Card>

          {/* Profile & Availability - Moved to Bottom */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Profile & Availability</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setProfileOpen(true)}
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAvailabilityOpen(true)}
                  >
                    Set Schedule
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Job Title:</span>
                    <p className={user?.jobTitle ? 'text-slate-600' : 'text-slate-400'}>
                      {user?.jobTitle || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Company:</span>
                    <p className={user?.company ? 'text-slate-600' : 'text-slate-400'}>
                      {user?.company || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Industry:</span>
                    <p className={user?.industry ? 'text-slate-600' : 'text-slate-400'}>
                      {user?.industry || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Monthly Focus:</span>
                    <p className={user?.profileQuestions?.networkingGoals?.length ? 'text-slate-600' : 'text-slate-400'}>
                      {user?.profileQuestions?.networkingGoals?.length > 0 
                        ? `${user.profileQuestions.networkingGoals.length} goals selected`
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Profile Completion</span>
                    <span className="text-sm text-slate-600">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="mb-3" />
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user?.firstName ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className={user?.firstName ? 'text-slate-600' : 'text-slate-400'}>
                        Basic info completed
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user?.jobTitle ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className={user?.jobTitle ? 'text-slate-600' : 'text-slate-400'}>
                        Professional details added
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user?.profileQuestions?.networkingGoals?.length ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className={user?.profileQuestions?.networkingGoals?.length ? 'text-slate-600' : 'text-slate-400'}>
                        Monthly focus selected
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${userAvailability && userAvailability.length > 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className={userAvailability && userAvailability.length > 0 ? 'text-slate-600' : 'text-slate-400'}>
                        Schedule availability set
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <SchedulingModal 
        match={selectedMatch}
        open={schedulingOpen}
        onOpenChange={setSchedulingOpen}
      />

      <ProfileModal 
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
      />

      <AvailabilityModal 
        open={availabilityOpen}
        onOpenChange={setAvailabilityOpen}
      />
    </div>
  );
}
