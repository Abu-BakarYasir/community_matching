import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Linkedin } from "lucide-react";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export function ProfileModal({ open, onOpenChange, user }: ProfileModalProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [networkingGoals, setNetworkingGoals] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setJobTitle(user.jobTitle || "");
      setCompany(user.company || "");
      setIndustry(user.industry || "");
      setBio(user.bio || "");
      setLinkedinUrl(user.linkedinUrl || "");
      setNetworkingGoals(user.profileQuestions?.networkingGoals || []);
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/user/profile", {
        jobTitle,
        company,
        industry,
        bio,
        linkedinUrl
      });
      
      return apiRequest("POST", "/api/user/profile-questions", {
        networkingGoals
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
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate();
  };

  const handleNetworkingGoalToggle = (goal: string) => {
    setNetworkingGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your professional information and networking preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Data Scientist"
              />
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Non-profit">Non-profit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself, your interests, and what you're looking to achieve through networking..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="linkedinUrl"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Monthly Focus Goals</Label>
              <p className="text-sm text-slate-600 mb-3">
                What are you hoping to achieve this month? (Select all that apply)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "learning_technical_skills", label: "Learning Technical Skills" },
                  { value: "building-data-projects", label: "Building Data Projects" },
                  { value: "job_hunting", label: "Job Hunting" },
                  { value: "networking", label: "General Networking" },
                  { value: "business_opportunities", label: "Business Opportunities" },
                  { value: "mentorship", label: "Finding Mentorship" }
                ].map((goal) => (
                  <div key={goal.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={goal.value}
                      checked={networkingGoals.includes(goal.value)}
                      onChange={() => handleNetworkingGoalToggle(goal.value)}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor={goal.value} className="text-sm font-normal">
                      {goal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}