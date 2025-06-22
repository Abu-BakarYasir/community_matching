import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">DAA Monthly Matching</CardTitle>
          <CardDescription className="text-center">
            Connect with professionals for meaningful networking opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 text-center">
              Join our professional networking platform to get matched with like-minded professionals every month.
            </p>
          </div>
          <Button 
            className="w-full" 
            onClick={() => window.location.href = '/dev-login'}
          >
            Sign In to Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}