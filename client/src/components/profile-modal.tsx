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
  const [networkingGoals, setNetworkingGoals] = useState<string[]>(user?.profileQuestions?.networkingGoals || []);
  
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", "/api/user/profile", {
        jobTitle: data.jobTitle,
        company: data.company,
        industry: data.industry,
      });
      
      return apiRequest("POST", "/api/user/profile-questions", {
        networkingGoals: data.networkingGoals,
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



  const handleSave = () => {
    updateProfileMutation.mutate({
      jobTitle,
      company,
      industry,
      networkingGoals,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Help us find better matches by answering a few questions
          </DialogDescription>
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

          {/* Monthly Focus */}
          <div>
            <Label className="text-sm font-semibold text-slate-900 mb-3 block">
              What do you want to focus on this month? (Select all that apply)
            </Label>
            <div className="space-y-2">
              {[
                { value: "learning-technical-skills", label: "Learning Technical Skills" },
                { value: "building-data-projects", label: "Building Data Projects" },
                { value: "job-hunting", label: "Job Hunting" },
                { value: "networking", label: "Networking" },
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
