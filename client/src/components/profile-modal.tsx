import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Linkedin, Camera, Upload, Calendar, Clock } from "lucide-react";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export function ProfileModal({ open, onOpenChange, user }: ProfileModalProps) {
  // Check if this is a first-time user completing their profile
  const isFirstTimeSetup = !user?.jobTitle || !user?.company || !user?.industry;
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [networkingGoals, setNetworkingGoals] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Get admin settings to load monthly goals options
  const { data: adminSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  const { data: userAvailability = [] } = useQuery({
    queryKey: ["/api/availability"],
  });

  useEffect(() => {
    if (user) {
      console.log("Profile modal user data:", user);
      setJobTitle(user?.jobTitle || "");
      setCompany(user?.company || "");
      setIndustry(user?.industry || "");
      setBio(user?.bio || "");
      setLinkedinUrl(user?.linkedinUrl || "");
      setNetworkingGoals(user?.profileQuestions?.networkingGoals || []);
      setProfileImageUrl(user?.profileImageUrl || "");
    }
  }, [user]);

  useEffect(() => {
    if (userAvailability && userAvailability.length > 0) {
      setAvailability(userAvailability);
    }
  }, [userAvailability]);

  const uploadProfileImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setProfileImageUrl(data.profileImageUrl);
      toast({
        title: "Profile picture uploaded",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture.",
      });
    }
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/user/profile", {
        jobTitle,
        company,
        industry,
        bio,
        linkedinUrl,
        profileImageUrl
      });
      
      await apiRequest("POST", "/api/user/profile-questions", {
        networkingGoals
      });

      // Save availability
      if (availability.length > 0) {
        for (const avail of availability) {
          await apiRequest("POST", "/api/availability", avail);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      
      toast({
        title: isFirstTimeSetup ? "Welcome to DAA Matches!" : "Profile Updated",
        description: isFirstTimeSetup 
          ? "Your profile is complete. You can now start networking!" 
          : "Your profile has been successfully updated.",
      });
      
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating profile",
        description: "There was an error updating your profile. Please try again.",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
        });
        return;
      }
      uploadProfileImage.mutate(file);
    }
  };

  const handleNetworkingGoalToggle = (goal: string) => {
    setNetworkingGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleAvailabilityToggle = (dayOfWeek: number) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.dayOfWeek === dayOfWeek);
      if (existing) {
        return prev.filter(a => a.dayOfWeek !== dayOfWeek);
      } else {
        return [...prev, {
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true
        }];
      }
    });
  };

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev =>
      prev.map(a =>
        a.dayOfWeek === dayOfWeek
          ? { ...a, [field]: value }
          : a
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isFirstTimeSetup ? "Complete Your Profile" : "Edit Profile"}
          </DialogTitle>
          <DialogDescription>
            {isFirstTimeSetup ? (
              <>
                Welcome to DAA Matches! Please complete your profile to get started with networking.
                <br />
                <span className="text-sm text-red-600 mt-2 block">
                  * Required fields must be completed to continue
                </span>
              </>
            ) : (
              "Update your profile information and availability for networking meetings."
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Profile Info
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule {isFirstTimeSetup && "(Optional)"}
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-slate-600 text-center">
                  Click to upload profile picture (max 5MB)
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">
                    Job Title {isFirstTimeSetup && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Data Analyst"
                    required={isFirstTimeSetup}
                  />
                </div>
                <div>
                  <Label htmlFor="company">
                    Company {isFirstTimeSetup && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Tech Corp"
                    required={isFirstTimeSetup}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="industry">
                  Industry {isFirstTimeSetup && <span className="text-red-500">*</span>}
                </Label>
                <Select value={industry} onValueChange={setIndustry} required={isFirstTimeSetup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Non-profit">Non-profit</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile URL
                </Label>
                <Input
                  id="linkedinUrl"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself and your professional interests..."
                  rows={3}
                />
              </div>

              {/* Monthly Focus Goals */}
              <div>
                <Label>Monthly Focus Goals</Label>
                <p className="text-sm text-slate-600 mb-3">
                  Select what you're focusing on this month (choose all that apply)
                </p>
                <div className="flex flex-wrap gap-2">
                  {(adminSettings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]).map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleNetworkingGoalToggle(goal)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        networkingGoals.includes(goal)
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div>
                <Label className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4" />
                  Weekly Availability
                </Label>
                <p className="text-sm text-slate-600 mb-4">
                  Select the days and times when you're available for networking meetings. You can skip this for now and set it up later.
                </p>
                
                <div className="space-y-3">
                  {[
                    { value: 1, label: "Monday" },
                    { value: 2, label: "Tuesday" },
                    { value: 3, label: "Wednesday" },
                    { value: 4, label: "Thursday" },
                    { value: 5, label: "Friday" },
                    { value: 6, label: "Saturday" },
                    { value: 0, label: "Sunday" }
                  ].map((day) => {
                    const dayAvailability = availability.find(a => a.dayOfWeek === day.value);
                    const isAvailable = !!dayAvailability;
                    
                    return (
                      <div key={day.value} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleAvailabilityToggle(day.value)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isAvailable
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "border-slate-300 hover:border-slate-400"
                            }`}
                          >
                            {isAvailable && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <span className="font-medium text-slate-900 min-w-0 flex-1">{day.label}</span>
                        </div>
                        
                        {isAvailable && (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={dayAvailability?.startTime || "09:00"}
                              onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                              className="w-24"
                            />
                            <span className="text-slate-500">to</span>
                            <Input
                              type="time"
                              value={dayAvailability?.endTime || "17:00"}
                              onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Form Actions */}
            {isFirstTimeSetup && (
              <p className="text-sm text-slate-600 mb-2">
                Please complete the required fields (*) to continue.
              </p>
            )}
            <div className="flex justify-end space-x-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {isFirstTimeSetup ? "Skip for Now" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={updateProfile.isPending || (isFirstTimeSetup && (!jobTitle || !company || !industry))}
                className={isFirstTimeSetup ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {updateProfile.isPending 
                  ? "Saving..." 
                  : isFirstTimeSetup 
                    ? "Complete Profile & Continue" 
                    : "Save Changes"
                }
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}