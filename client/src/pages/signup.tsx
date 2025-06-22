import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Heart, ArrowRight } from "lucide-react";

export default function Signup() {
  const [location, setLocation] = useLocation();
  const [organizationSlug, setOrganizationSlug] = useState<string>("");

  // Extract organization slug from URL path
  useEffect(() => {
    const path = location;
    const match = path.match(/^\/signup\/([^\/]+)$/);
    if (match) {
      setOrganizationSlug(match[1]);
    } else {
      // Redirect to landing if no valid organization slug
      setLocation("/");
    }
  }, [location, setLocation]);

  // Fetch organization details
  const { data: organization, isLoading, error } = useQuery({
    queryKey: ["/api/organizations", organizationSlug],
    enabled: !!organizationSlug,
  });

  const handleSignup = () => {
    // Redirect to Replit Auth with organization context
    window.location.href = `/api/login?org=${organizationSlug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Community Not Found</CardTitle>
            <CardDescription>
              The community you're looking for doesn't exist or is no longer active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                {organization.name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                Community Signup
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Join {organization.name}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with like-minded professionals in your field. Get matched monthly for meaningful networking conversations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center border-blue-200 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Smart Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our algorithm matches you with professionals based on your goals, industry, and interests.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Monthly Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get one meaningful connection each month. Schedule and join video calls at your convenience.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200 hover:border-green-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Grow Your Network</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Build lasting professional relationships and expand your career opportunities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-orange-500 border-0 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Ready to Get Started?</CardTitle>
            <CardDescription className="text-blue-100">
              Join {organization.name} and start building meaningful professional connections today.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleSignup}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Sign Up with Replit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-blue-100 mt-4">
              Sign up is free and takes less than 2 minutes
            </p>
          </CardContent>
        </Card>

        {/* How it Works */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-lg mb-2">Complete Your Profile</h4>
              <p className="text-gray-600">
                Tell us about your professional background, goals, and interests.
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-lg mb-2">Get Matched</h4>
              <p className="text-gray-600">
                Each month, we'll match you with a compatible professional from your community.
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-lg mb-2">Meet & Connect</h4>
              <p className="text-gray-600">
                Schedule a video call and start building meaningful professional relationships.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 {organization.name}. Powered by Matches.Community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}