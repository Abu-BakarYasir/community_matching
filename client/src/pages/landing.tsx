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
      {/* Header Navigation */}
      <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center relative">
              {/* Network nodes representing the logo */}
              <div className="relative w-8 h-6">
                <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: '#2563eb', top: '0px', left: '0px' }}></div>
                <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316', top: '0px', right: '0px' }}></div>
                <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: '#0891b2', bottom: '0px', left: '6px' }}></div>
                <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: '#2563eb', bottom: '0px', right: '6px' }}></div>
                <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
                  <line x1="4" y1="4" x2="12" y2="12" stroke="#e2e8f0" strokeWidth="1"/>
                  <line x1="20" y1="4" x2="12" y2="12" stroke="#e2e8f0" strokeWidth="1"/>
                  <line x1="12" y1="20" x2="12" y2="12" stroke="#e2e8f0" strokeWidth="1"/>
                  <line x1="20" y1="20" x2="12" y2="12" stroke="#e2e8f0" strokeWidth="1"/>
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold" style={{ color: '#1e293b' }}>Matches.Community</span>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <Button 
              className="text-white font-semibold px-6 py-2 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #f97316, #fb923c)' }}
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started
            </Button>
            <button 
              className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#2563eb' }}
              onClick={() => window.location.href = '/api/login'}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ color: '#1e293b' }}>
            Bring your community
            <span className="text-transparent bg-clip-text bg-gradient-to-r block" style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #0891b2)' }}>
              to life
            </span>
          </h1>
          <p className="text-2xl font-medium max-w-4xl mx-auto mb-6 leading-relaxed" style={{ color: '#2563eb' }}>
            Watch your community transform as members discover each other through magical 1:1 conversations – completely automatically.
          </p>
          <p className="text-xl max-w-3xl mx-auto mb-8 leading-relaxed" style={{ color: '#6b7280' }}>
            No scheduling headaches. No awkward outreach. Just meaningful connections happening naturally while you focus on what matters most.
          </p>
          <Button 
            className="text-white font-semibold px-8 py-4 text-lg hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(to right, #f97316, #fb923c)' }}
            onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Spark the magic in your community
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Problem/Solution Section */}
        <div className="rounded-3xl p-8 md:p-12 mb-16 border" style={{ backgroundColor: '#fefefe', borderColor: '#e2e8f0' }}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-8" style={{ color: '#1e293b' }}>
              Your community has incredible people. They just don't know each other yet.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1e293b' }}>The reality:</h3>
              <p className="text-lg mb-6" style={{ color: '#6b7280' }}>
                Your members scroll past each other in channels. They attend group events but leave without making real connections. 
                Amazing people with shared interests remain strangers.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#2563eb' }}>The magic:</h3>
              <p className="text-lg" style={{ color: '#6b7280' }}>
                Matches.Community quietly works behind the scenes, creating serendipitous coffee chats, meaningful collaborations, 
                and genuine friendships. Your community transforms from a place people visit to a place they belong.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1e293b' }}>
              From quiet community to thriving network
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🌟</span>
                  <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Members Feel the Magic</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#6b7280' }}>
                  Instead of wondering "who should I talk to?" your members receive delightful calendar invites for coffee chats 
                  with fascinating people they never would have met otherwise.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🚀</span>
                  <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Networks Expand Naturally</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#6b7280' }}>
                  Watch introverted members blossom into connectors. See new collaborations emerge. Your community becomes 
                  the catalyst for career changes, friendships, and breakthrough ideas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">✨</span>
                  <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Serendipity at Scale</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#6b7280' }}>
                  That magical moment when two perfect strangers realize they're working on complementary projects? 
                  We create hundreds of these moments, automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">💫</span>
                  <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Zero Effort, Maximum Impact</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#6b7280' }}>
                  Set it up once, then watch your community come alive. No manual matching. No scheduling coordination. 
                  No awkward introductions. Just pure connection magic.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1e293b' }}>
              Three steps to a thriving community
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2563eb' }}>
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Connect & Configure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center" style={{ color: '#6b7280' }}>
                  Link your existing community platform (Slack, Discord, or custom). Set preferences for matching frequency and conversation prompts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f97316' }}>
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Magic Happens</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center" style={{ color: '#6b7280' }}>
                  Our intelligent system pairs members based on interests, availability, and connection goals. Calendar invites appear automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#fefefe' }}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#0891b2' }}>
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <CardTitle className="text-xl" style={{ color: '#1e293b' }}>Watch the Transformation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center" style={{ color: '#6b7280' }}>
                  Members start having those "How did we not meet sooner?" conversations. Your community feels electric with new energy and excitement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="rounded-3xl p-8 md:p-12 mb-16 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1e293b' }}>
              Communities come alive with Matches
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{ backgroundColor: '#fefefe' }}>
              <CardContent className="p-6">
                <p className="text-lg mb-4" style={{ color: '#6b7280' }}>
                  "Our Slack went from silent to buzzing with new collaborations. Members are genuinely excited to be part of our community again."
                </p>
                <div className="text-sm">
                  <p className="font-semibold" style={{ color: '#1e293b' }}>Sarah Chen</p>
                  <p style={{ color: '#6b7280' }}>Head of Community at TechFlow</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{ backgroundColor: '#fefefe' }}>
              <CardContent className="p-6">
                <p className="text-lg mb-4" style={{ color: '#6b7280' }}>
                  "We've seen introverted engineers become community champions. The connections are so natural, people think it's magic."
                </p>
                <div className="text-sm">
                  <p className="font-semibold" style={{ color: '#1e293b' }}>Marcus Rodriguez</p>
                  <p style={{ color: '#6b7280' }}>Developer Relations Lead</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{ backgroundColor: '#fefefe' }}>
              <CardContent className="p-6">
                <p className="text-lg mb-4" style={{ color: '#6b7280' }}>
                  "Three months in, and we have members organizing meetups, starting side projects together, and genuinely caring about each other's success."
                </p>
                <div className="text-sm">
                  <p className="font-semibold" style={{ color: '#1e293b' }}>Lisa Park</p>
                  <p style={{ color: '#6b7280' }}>Community Manager at GrowthCorp</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transformation Section */}
        <div className="rounded-3xl p-8 md:p-12 mb-16 border" style={{ backgroundColor: '#fefefe', borderColor: '#e2e8f0' }}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1e293b' }}>
              From dormant to electric
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6" style={{ color: '#6b7280' }}>Before Matches.Community:</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#6b7280' }}></div>
                  <p style={{ color: '#6b7280' }}>Members lurk in channels without engaging</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#6b7280' }}></div>
                  <p style={{ color: '#6b7280' }}>Great people remain isolated in their corners</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#6b7280' }}></div>
                  <p style={{ color: '#6b7280' }}>Group events feel surface-level and transactional</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#6b7280' }}></div>
                  <p style={{ color: '#6b7280' }}>You constantly worry about member retention</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#6b7280' }}></div>
                  <p style={{ color: '#6b7280' }}>Energy feels flat despite your best efforts</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6" style={{ color: '#2563eb' }}>After Matches.Community:</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <p style={{ color: '#1e293b' }}>Spontaneous conversations spark collaborations</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <p style={{ color: '#1e293b' }}>Members actively introduce friends to the community</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <p style={{ color: '#1e293b' }}>Events become reunions for existing connections</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <p style={{ color: '#1e293b' }}>Retention improves as members feel truly connected</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#f97316' }} />
                  <p style={{ color: '#1e293b' }}>Your community buzzes with authentic excitement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <Card id="signup" className="max-w-4xl mx-auto border-0 shadow-2xl" style={{ backgroundColor: '#fefefe' }}>
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-bold mb-4" style={{ color: '#1e293b' }}>
              Ready to watch your community come alive?
            </CardTitle>
            <CardDescription className="text-xl mb-6" style={{ color: '#6b7280' }}>
              Join hundreds of community leaders who've discovered the magic of effortless connections.
            </CardDescription>
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-lg" style={{ color: '#6b7280' }}>
                Your members are waiting to meet each other. They just need a little help finding their way.
              </p>
              <p className="text-lg" style={{ color: '#6b7280' }}>
                The conversations that will change careers, spark friendships, and create breakthrough collaborations are one click away.
              </p>
            </div>
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

              <div className="text-center">
                <Button 
                  type="submit"
                  className="text-white font-semibold px-12 py-4 text-xl hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(to right, #f97316, #fb923c)' }}
                >
                  Start the magic today
                  <Sparkles className="w-6 h-6 ml-2" />
                </Button>
                
                <p className="text-lg mt-4" style={{ color: '#2563eb' }}>
                  30-day free trial. See the transformation yourself.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}