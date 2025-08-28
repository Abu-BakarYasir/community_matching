import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function CommunitySignup() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

  const {
    data: organization,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/organizations/${slug}`],
    enabled: !!slug,
    retry: 1,
  });

  useEffect(() => {
    console.log("organization -> ", organization);
  }, [organization]);

  console.log(
    "Community signup - slug:",
    slug,
    "organization:",
    organization,
    "isLoading:",
    isLoading,
    "error:",
    error,
  );

  const handleSignIn = () => {
    // Redirect to Replit Auth with the organization slug as state
    window.location.href = `/api/login?organization=${slug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
              The community you're looking for doesn't exist or isn't available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {organization.settings?.appName || organization.name} Matches
            </CardTitle>
            <CardDescription className="text-gray-600 mt-3 text-base">
              Join your community on Matches! Sign up to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={handleSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
            >
              Sign Up / Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
