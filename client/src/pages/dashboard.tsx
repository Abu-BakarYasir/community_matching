import { useState } from "react";
import { Header } from "@/components/header";
import { SchedulingModal } from "@/components/scheduling-modal";
import { ProfileModal } from "@/components/profile-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, Clock, Handshake, ArrowRight, Video, Coffee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { MatchWithUsers, MeetingWithMatch } from "@shared/schema";

export default function Dashboard() {
  const [selectedMatch, setSelectedMatch] = useState<MatchWithUsers | null>(null);
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
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

  const recentMatches = matches.slice(0, 3);
  const upcomingMeetings = meetings
    .filter((m: MeetingWithMatch) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date())
    .slice(0, 2);

  const handleScheduleMatch = (match: MatchWithUsers) => {
    setSelectedMatch(match);
    setSchedulingOpen(true);
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
    return match.user1.email === user?.email ? match.user2 : match.user1;
  };

  const getProfileCompletion = () => {
    if (!user) return 0;
    
    let completion = 0;
    if (user.firstName && user.lastName) completion += 20;
    if (user.email) completion += 20;
    if (user.jobTitle) completion += 20;
    if (user.company) completion += 15;
    if (user.industry) completion += 15;
    if (user.profileQuestions?.networkingGoals?.length) completion += 10;
    
    return Math.min(100, completion);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-slate-600">Here's your networking activity for this month.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Matches</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.totalMatches || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Meetings Scheduled</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.scheduledMeetings || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending Responses</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.pendingResponses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Handshake className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Connections Made</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.connections || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Matches */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Your Recent Matches</CardTitle>
                  {matches.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      New matches available
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No matches yet</h3>
                    <p className="text-slate-600 mb-4">
                      Complete your profile to get better matches in the next monthly cycle.
                    </p>
                    <Button onClick={() => setProfileOpen(true)}>
                      Complete Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMatches.map((match: MatchWithUsers) => {
                      const otherUser = getOtherUser(match);
                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={otherUser.profileImageUrl} />
                              <AvatarFallback>
                                {getInitials(otherUser.firstName, otherUser.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {otherUser.firstName} {otherUser.lastName}
                              </h4>
                              <p className="text-sm text-slate-600">{otherUser.jobTitle}</p>
                              <p className="text-sm text-slate-500">{otherUser.company}</p>
                              <Badge className={`text-xs mt-1 ${getMatchScoreClass(match.matchScore || 0)}`}>
                                {match.matchScore}% Match
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                            {match.status === 'pending' && (
                              <Button 
                                size="sm"
                                onClick={() => handleScheduleMatch(match)}
                              >
                                Schedule Meeting
                              </Button>
                            )}
                            {match.status === 'meeting_scheduled' && (
                              <Badge variant="secondary">Meeting Scheduled</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {matches.length > 3 && (
                      <div className="text-center mt-6">
                        <Button variant="link" className="text-primary">
                          View All Matches <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No upcoming meetings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMeetings.map((meeting: MeetingWithMatch) => {
                      const otherUser = getOtherUser(meeting.match);
                      const meetingDate = new Date(meeting.scheduledAt);
                      const isToday = meetingDate.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={meeting.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            isToday ? 'bg-primary/5 border-primary/20' : 'bg-slate-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isToday ? 'bg-primary/10' : 'bg-slate-200'
                          }`}>
                            {meeting.meetingType === 'video' ? (
                              <Video className={`h-4 w-4 ${isToday ? 'text-primary' : 'text-slate-600'}`} />
                            ) : (
                              <Coffee className={`h-4 w-4 ${isToday ? 'text-primary' : 'text-slate-600'}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {otherUser.firstName} {otherUser.lastName}
                            </p>
                            <p className="text-sm text-slate-600">
                              {isToday ? 'Today' : 'Tomorrow'}, {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className={`text-xs ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                              {meeting.meetingType === 'video' ? 'Video Call' : 'Coffee Chat'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {/* TODO: Manage availability */}}
                >
                  Manage Availability
                </Button>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Strength</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Profile Completion</span>
                    <span className="text-sm font-medium text-slate-900">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                  <div className="space-y-2 mt-4">
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
                        Networking preferences set
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={() => setProfileOpen(true)}
                >
                  Complete Profile
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Matching Status */}
            <Card className="networking-gradient text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Next Matching Round</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Your profile will be included in the next monthly matching cycle.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Days remaining:</span>
                  <span className="text-2xl font-bold">{daysRemaining}</span>
                </div>
                <Progress 
                  value={(30 - daysRemaining) / 30 * 100} 
                  className="mt-3 [&>div]:bg-white" 
                />
              </CardContent>
            </Card>
          </div>
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
    </div>
  );
}
