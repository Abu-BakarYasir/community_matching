import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, Coffee } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MatchWithUsers } from "@shared/schema";

interface SchedulingModalProps {
  match: MatchWithUsers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchedulingModal({ match, open, onOpenChange }: SchedulingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [meetingType, setMeetingType] = useState<string>("video");
  const { toast } = useToast();

  const scheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/meetings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Meeting Scheduled!",
        description: "You'll receive a calendar invite and email confirmation shortly.",
      });
      
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setMeetingType("video");
  };

  const handleSchedule = () => {
    if (!match || !selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    scheduleMutation.mutate({
      matchId: match.id,
      scheduledAt: scheduledAt.toISOString(),
      meetingType,
      duration: 30,
      meetingLink: meetingType === "video" ? "https://zoom.us/j/example" : undefined,
    });
  };

  const availableTimes = [
    "09:00", "10:30", "14:00", "15:30", "16:00"
  ];

  const otherUser = match?.user1.id === match?.user2.id ? match.user2 : 
                   match ? (match.user1.email !== localStorage.getItem('currentUserEmail') ? match.user1 : match.user2) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Schedule Meeting
          </DialogTitle>
          <p className="text-slate-600">
            Choose a time that works for both you and {otherUser?.firstName} {otherUser?.lastName}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Calendar */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Select Date</h4>
            <div className="bg-slate-50 rounded-xl p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Time slots and meeting type */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4">
              Available Times {selectedDate && `- ${selectedDate.toLocaleDateString()}`}
            </h4>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  className="p-3 text-sm font-medium"
                  onClick={() => setSelectedTime(time)}
                  disabled={!selectedDate}
                >
                  {time}
                </Button>
              ))}
            </div>

            {/* Meeting Type Selection */}
            <div>
              <h5 className="text-sm font-semibold text-slate-900 mb-3">Meeting Type</h5>
              <RadioGroup value={meetingType} onValueChange={setMeetingType} className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary rounded-lg">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video" className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4" />
                      <div>
                        <div className="font-medium text-slate-900">Video Call (30 min)</div>
                        <div className="text-sm text-slate-600">Zoom meeting link will be provided</div>
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <RadioGroupItem value="coffee" id="coffee" />
                  <Label htmlFor="coffee" className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Coffee className="h-4 w-4" />
                      <div>
                        <div className="font-medium text-slate-900">Coffee Chat (45 min)</div>
                        <div className="text-sm text-slate-600">In-person meeting at mutual location</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-8">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={scheduleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSchedule}
                disabled={!selectedDate || !selectedTime || scheduleMutation.isPending}
              >
                {scheduleMutation.isPending ? "Scheduling..." : "Confirm Meeting"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
