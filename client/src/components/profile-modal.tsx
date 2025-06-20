import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export function ProfileModal({ open, onOpenChange, user }: ProfileModalProps) {
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [company, setCompany] = useState(user?.company || "");
  const [industry, setIndustry] = useState(user?.industry || "");
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || "");
  const [networkingGoals, setNetworkingGoals] = useState<string[]>(user?.profileQuestions?.networkingGoals || []);
  const [availabilityPreferences, setAvailabilityPreferences] = useState<string[]>(user?.profileQuestions?.availabilityPreferences || []);
  const [interests, setInterests] = useState<string[]>(user?.profileQuestions?.interests || []);
  
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", "/api/user/profile", {
        jobTitle: data.jobTitle,
        company: data.company,
        industry: data.industry,
        experienceLevel: data.experienceLevel,
      });
      
      return apiRequest("POST", "/api/user/profile-questions", {
        networkingGoals: data.networkingGoals,
        availabilityPreferences: data.availabilityPreferences,
        interests: data.interests,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNetworkingGoalChange = (goal: string, checked: boolean) => {
    if (checked) {
      setNetworkingGoals([...networkingGoals, goal]);
    } else {
      setNetworkingGoals(networkingGoals.filter(g => g !== goal));
    }
  };

  const handleAvailabilityChange = (availability: string, checked: boolean) => {
    if (checked) {
      setAvailabilityPreferences([...availabilityPreferences, availability]);
    } else {
      setAvailabilityPreferences(availabilityPreferences.filter(a => a !== availability));
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      jobTitle,
      company,
      industry,
      experienceLevel,
      networkingGoals,
      availabilityPreferences,
      interests,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Complete Your Profile
          </DialogTitle>
          <p className="text-slate-600">
            Help us find better matches by answering a few questions
          </p>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Professional Background */}
          <div>
            <Label className="text-sm font-semibold text-slate-900">
              What's your current role?
            </Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Product Manager, Software Engineer"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-900">
              Company
            </Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google, Microsoft, Startup Inc."
              className="mt-2"
            />
          </div>

          {/* Industry */}
          <div>
            <Label className="text-sm font-semibold text-slate-900 mb-3 block">
              Which industry do you work in?
            </Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Networking Goals */}
          <div>
            <Label className="text-sm font-semibold text-slate-900 mb-3 block">
              What are your networking goals? (Select all that apply)
            </Label>
            <div className="space-y-2">
              {[
                { value: "career_advancement", label: "Career advancement" },
                { value: "knowledge_sharing", label: "Knowledge sharing" },
                { value: "finding_mentorship", label: "Finding mentorship" },
                { value: "business_opportunities", label: "Business opportunities" },
                { value: "building_relationships", label: "Building professional relationships" },
              ].map((goal) => (
                <div key={goal.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal.value}
                    checked={networkingGoals.includes(goal.value)}
                    onCheckedChange={(checked) => handleNetworkingGoalChange(goal.value, checked as boolean)}
                  />
                  <Label htmlFor={goal.value} className="text-slate-700">
                    {goal.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <Label className="text-sm font-semibold text-slate-900 mb-3 block">
              Years of professional experience
            </Label>
            <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "0-2", label: "0-2 years" },
                  { value: "3-5", label: "3-5 years" },
                  { value: "6-10", label: "6-10 years" },
                  { value: "10+", label: "10+ years" },
                ].map((exp) => (
                  <div key={exp.value} className="flex items-center space-x-2 p-3 border border-slate-300 rounded-lg">
                    <RadioGroupItem value={exp.value} id={exp.value} />
                    <Label htmlFor={exp.value}>{exp.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Availability Preferences */}
          <div>
            <Label className="text-sm font-semibold text-slate-900 mb-3 block">
              When are you typically available for networking meetings?
            </Label>
            <div className="space-y-2">
              {[
                { value: "weekday_mornings", label: "Weekday mornings (9am-12pm)" },
                { value: "weekday_afternoons", label: "Weekday afternoons (1pm-5pm)" },
                { value: "weekday_evenings", label: "Weekday evenings (6pm-8pm)" },
                { value: "weekend_mornings", label: "Weekend mornings" },
              ].map((avail) => (
                <div key={avail.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={avail.value}
                    checked={availabilityPreferences.includes(avail.value)}
                    onCheckedChange={(checked) => handleAvailabilityChange(avail.value, checked as boolean)}
                  />
                  <Label htmlFor={avail.value} className="text-slate-700">
                    {avail.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateProfileMutation.isPending}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
