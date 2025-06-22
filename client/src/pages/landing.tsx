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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-orange-100 text-orange-700 hover:bg-orange-200" style={{ backgroundColor: '#fed7aa', color: '#f97316' }}>
            <Sparkles className="w-4 h-4 mr-2" />
            Give Your Community Life
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ color: '#1e293b' }}>
            Transform Your Community Into a
            <span className="text-transparent bg-clip-text bg-gradient-to-r block" style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #0891b2)' }}>
              Connected Network
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-8 leading-relaxed" style={{ color: '#6b7280' }}>
            No effort on your end. No headaches. Just magical moments as your community members 
            naturally connect, expand their networks, and build meaningful relationships.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: '#6b7280' }}>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" style={{ color: '#f97316' }} />
              Zero setup required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" style={{ color: '#f97316' }} />
              Automated matching
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" style={{ color: '#f97316' }} />
              Instant community value
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(to right, #f97316, #fb923c)' }}>
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Community Members Feel Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center" style={{ color: '#6b7280' }}>
                Watch as your community transforms from passive observers to active participants, 
                forming genuine connections and supporting each other's growth.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(to right, #2563eb, #3b82f6)' }}>
                <Network className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Expand Their Networks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center" style={{ color: '#6b7280' }}>
                Every member discovers new opportunities, mentors, collaborators, and friends 
                they never would have met otherwise. Professional growth happens naturally.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(to right, #0891b2, #06b6d4)' }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Create Magical Moments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center" style={{ color: '#6b7280' }}>
                Those serendipitous conversations that lead to life-changing opportunities, 
                partnerships, and friendships. Your community becomes a catalyst for success.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Value Proposition */}
        <div className="rounded-3xl p-8 md:p-12 mb-16 border" style={{ backgroundColor: '#fefefe', borderColor: '#e2e8f0' }}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#1e293b' }}>
                The Perfect Community Add-On
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1e293b' }}>Zero Effort Setup</h3>
                    <p style={{ color: '#6b7280' }}>Integrate in minutes. We handle everything from matching algorithms to meeting scheduling.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1e293b' }}>No Management Headaches</h3>
                    <p style={{ color: '#6b7280' }}>Automated monthly matching, email notifications, and calendar integration. Set it and forget it.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1e293b' }}>Instant Community Value</h3>
                    <p style={{ color: '#6b7280' }}>Members immediately see the benefit of being part of your community. Retention and engagement skyrocket.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)' }}>
                <Coffee className="w-8 h-8 mx-auto mb-2" style={{ color: '#2563eb' }} />
                <p className="font-semibold" style={{ color: '#1e293b' }}>1-on-1 Meetings</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>Meaningful connections</p>
              </div>
              <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(to bottom right, #fed7aa, #fb923c20)' }}>
                <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#f97316' }} />
                <p className="font-semibold" style={{ color: '#1e293b' }}>Smart Matching</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>AI-powered compatibility</p>
              </div>
              <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(to bottom right, #cffafe, #a5f3fc)' }}>
                <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#0891b2' }} />
                <p className="font-semibold" style={{ color: '#1e293b' }}>Community Growth</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>Stronger together</p>
              </div>
              <div className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(to bottom right, #fed7aa, #fb923c20)' }}>
                <Star className="w-8 h-8 mx-auto mb-2" style={{ color: '#f97316' }} />
                <p className="font-semibold" style={{ color: '#1e293b' }}>Member Delight</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>Unexpected value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Up Form */}
        <Card className="max-w-2xl mx-auto border-0 shadow-2xl" style={{ backgroundColor: '#fefefe' }}>
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold mb-2" style={{ color: '#1e293b' }}>
              Ready to Give Your Community Life?
            </CardTitle>
            <CardDescription className="text-lg" style={{ color: '#6b7280' }}>
              Join forward-thinking community managers who are creating magical networking experiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#1e293b' }}>Your Email *</Label>
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
                  <Label htmlFor="communityName" className="text-sm font-medium" style={{ color: '#1e293b' }}>Community Name *</Label>
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
                <Label htmlFor="communitySize" className="text-sm font-medium" style={{ color: '#1e293b' }}>Community Size</Label>
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
                <Label htmlFor="challenges" className="text-sm font-medium" style={{ color: '#1e293b' }}>
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
                className="w-full text-white font-semibold py-3 text-lg hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(to right, #f97316, #fb923c)' }}
              >
                Get Started - Transform Your Community
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-sm text-center" style={{ color: '#6b7280' }}>
                No credit card required • Setup in under 10 minutes • Cancel anytime
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <div className="text-center mt-16">
          <p className="mb-6" style={{ color: '#6b7280' }}>Trusted by community managers at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>TechCommunity</div>
            <div className="px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>DesignersUnited</div>
            <div className="px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>StartupNetwork</div>
            <div className="px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>DataProfessionals</div>
          </div>
        </div>
      </div>
    </div>
  );
}