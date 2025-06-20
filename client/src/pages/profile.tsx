import { useState } from "react";
import { Header } from "@/components/header";
import { ProfileModal } from "@/components/profile-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building, Briefcase, Calendar, MapPin, Linkedin, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Profile</h2>
          <p className="text-slate-600">View and manage your professional information.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <p className="text-slate-600">{user.jobTitle || "No job title set"}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-700">{user.email}</span>
                </div>
                
                {user.jobTitle && (
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-700">{user.jobTitle}</span>
                  </div>
                )}
                
                {user.company && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-700">{user.company}</span>
                  </div>
                )}
                
                {user.industry && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <Badge variant="secondary">{user.industry}</Badge>
                  </div>
                )}
                
                {user.linkedinUrl && (
                  <div className="flex items-center space-x-3">
                    <Linkedin className="h-5 w-5 text-slate-400" />
                    <a 
                      href={user.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                
                {user.bio && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-600">Bio:</span>
                    <p className="text-slate-900 text-sm leading-relaxed">{user.bio}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-700">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={() => setProfileModalOpen(true)}
                className="mt-6"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Networking Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Matches</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Meetings Scheduled</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Active Status</span>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <ProfileModal 
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        user={user}
      />
    </div>
  );
}