import { useState } from "react";
import { Header } from "@/components/header";
import { SchedulingModal } from "@/components/scheduling-modal";
import { ProfileModal } from "@/components/profile-modal";
import { AvailabilityModal } from "@/components/availability-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, Clock, Handshake, ArrowRight, Video, Coffee, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { MatchWithUsers, MeetingWithMatch } from "@shared/schema";

export default function Dashboard() {
  const [selectedMatch, setSelectedMatch] = useState<MatchWithUsers | null>(null);
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

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
    if (!match.user1 || !match.user2 || !user) return null;
    return match.user1.email === user.email ? match.user2 : match.user1;
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



        <div className="space-y-8">
          {/* Next Matching Round - Top Priority */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Next Matching Round</h3>
                  <p className="text-slate-600 mb-1">Monthly matches are generated on the 1st of each month</p>
                  <p className="text-sm text-slate-500">
                    Next round: <span className="font-medium">July 1st, 2025</span>
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{daysRemaining}</div>
                  <div className="text-sm text-slate-600">days left</div>
                </div>
              </div>
              {profileCompletion < 100 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Complete your profile to participate in the next matching round!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings - Second Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No meetings scheduled</p>
                  <p className="text-sm text-slate-400 mt-1">Schedule meetings with your matches!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting: MeetingWithMatch) => {
                    const otherUser = getOtherUser(meeting.match);
                    if (!otherUser) return null;
                    
                    const meetingDate = new Date(meeting.scheduledAt);
                    const isToday = meetingDate.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={meeting.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border ${
                          isToday ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isToday ? 'bg-primary/10' : 'bg-slate-200'
                        }`}>
                          {meeting.meetingType === 'video' ? (
                            <Video className={`h-5 w-5 ${isToday ? 'text-primary' : 'text-slate-600'}`} />
                          ) : (
                            <Coffee className={`h-5 w-5 ${isToday ? 'text-primary' : 'text-slate-600'}`} />
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
                        {meeting.meetingLink && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(meeting.meetingLink, '_blank')}
                          >
                            Join Meeting
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Combined Profile & Availability */}
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
                {/* Profile Completion */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Profile Completion</span>
                    <span className="text-sm font-medium text-slate-900">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                  <div className="grid grid-cols-1 gap-2 mt-3">
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
                  </div>
                </div>

                {/* Weekly Availability Preview */}
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Weekly Schedule</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <div key={day} className="text-center">
                        <div className="text-xs font-medium text-slate-600 mb-1">{day}</div>
                        <div className="h-8 rounded border bg-slate-50 border-slate-200" />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-sm text-slate-500">Set your schedule to help others book meetings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No matches yet</p>
                    <p className="text-sm text-slate-400 mt-1">Complete your profile to get matched!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMatches.map((match: MatchWithUsers) => {
                      const otherUser = getOtherUser(match);
                      if (!otherUser) return null;
                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={otherUser.profileImageUrl} />
                              <AvatarFallback>
                                {getInitials(otherUser.firstName, otherUser.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-900">
                                {otherUser.firstName} {otherUser.lastName}
                              </p>
                              <p className="text-sm text-slate-500">{otherUser.jobTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{match.matchScore}% match</Badge>
                            {match.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleScheduleMatch(match)}
                              >
                                Schedule
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

      <AvailabilityModal 
        open={availabilityOpen}
        onOpenChange={setAvailabilityOpen}
      />
    </div>
  );
}
