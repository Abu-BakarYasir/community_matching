import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Welcome to NetworkMatch!",
        description: "Your account has been created successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your email and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate({ email });
    } else {
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }
      
      registerMutation.mutate({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    }
  };

  const isPending = registerMutation.isPending || loginMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <h1 className="text-3xl font-bold text-primary">NetworkMatch</h1>
            <p className="text-slate-600 mt-2">Professional One-on-One Networking</p>
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? "Welcome Back" : "Get Started"}
          </CardTitle>
          <p className="text-slate-600">
            {isLogin 
              ? "Sign in to your account" 
              : "Create your account to start networking"
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isPending}
              />
            </div>
            
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                    disabled={isPending}
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    required
                    disabled={isPending}
                  />
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isPending}
            >
              {isPending 
                ? (isLogin ? "Signing in..." : "Creating account...") 
                : (isLogin ? "Sign In" : "Create Account")
              }
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isPending}
              className="text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
          
          {!isLogin && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Complete your profile with professional details</li>
                <li>• Get matched monthly with compatible professionals</li>
                <li>• Schedule meetings directly through the platform</li>
                <li>• Build meaningful professional relationships</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
