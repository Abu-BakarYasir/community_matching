import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Heart, Sparkles, CheckCircle, ArrowRight, Network, Coffee, MessageCircle, Star } from "lucide-react";
import { useState } from "react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [communitySize, setCommunitySize] = useState("");
  const [challenges, setChallenges] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, redirect to the existing auth flow
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-200">
            <Sparkles className="w-4 h-4 mr-2" />
            Give Your Community Life
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Community Into a
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 block">
              Connected Network
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            No effort on your end. No headaches. Just magical moments as your community members 
            naturally connect, expand their networks, and build meaningful relationships.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Zero setup required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Automated matching
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Instant community value
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Community Members Feel Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Watch as your community transforms from passive observers to active participants, 
                forming genuine connections and supporting each other's growth.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Expand Their Networks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Every member discovers new opportunities, mentors, collaborators, and friends 
                they never would have met otherwise. Professional growth happens naturally.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Create Magical Moments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Those serendipitous conversations that lead to life-changing opportunities, 
                partnerships, and friendships. Your community becomes a catalyst for success.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Value Proposition */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 mb-16 border border-white/20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Perfect Community Add-On
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Zero Effort Setup</h3>
                    <p className="text-gray-600">Integrate in minutes. We handle everything from matching algorithms to meeting scheduling.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">No Management Headaches</h3>
                    <p className="text-gray-600">Automated monthly matching, email notifications, and calendar integration. Set it and forget it.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Instant Community Value</h3>
                    <p className="text-gray-600">Members immediately see the benefit of being part of your community. Retention and engagement skyrocket.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-2xl text-center">
                <Coffee className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold text-purple-900">1-on-1 Meetings</p>
                <p className="text-sm text-purple-700">Meaningful connections</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl text-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-900">Smart Matching</p>
                <p className="text-sm text-blue-700">AI-powered compatibility</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-900">Community Growth</p>
                <p className="text-sm text-green-700">Stronger together</p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-6 rounded-2xl text-center">
                <Star className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="font-semibold text-orange-900">Member Delight</p>
                <p className="text-sm text-orange-700">Unexpected value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Up Form */}
        <Card className="max-w-2xl mx-auto border-0 shadow-2xl bg-white">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Ready to Give Your Community Life?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Join forward-thinking community managers who are creating magical networking experiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Your Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@community.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="communityName" className="text-sm font-medium text-gray-700">Community Name *</Label>
                  <Input
                    id="communityName"
                    type="text"
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    placeholder="Awesome Professionals"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="communitySize" className="text-sm font-medium text-gray-700">Community Size</Label>
                <Input
                  id="communitySize"
                  type="text"
                  value={communitySize}
                  onChange={(e) => setCommunitySize(e.target.value)}
                  placeholder="e.g., 50-200 members"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="challenges" className="text-sm font-medium text-gray-700">
                  What's your biggest community engagement challenge?
                </Label>
                <Textarea
                  id="challenges"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Tell us what you'd love to solve..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 text-lg"
              >
                Get Started - Transform Your Community
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-sm text-gray-500 text-center">
                No credit card required • Setup in under 10 minutes • Cancel anytime
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">Trusted by community managers at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-700">TechCommunity</div>
            <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-700">DesignersUnited</div>
            <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-700">StartupNetwork</div>
            <div className="bg-gray-100 px-6 py-3 rounded-lg font-semibold text-gray-700">DataProfessionals</div>
          </div>
        </div>
      </div>
    </div>
  );
}