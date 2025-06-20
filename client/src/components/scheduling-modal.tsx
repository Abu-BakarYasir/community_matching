import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, Coffee } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const scheduleMutation = useMutation({
    mutationFn: (meetingData: any) => apiRequest("/api/meetings", {
      method: "POST",
      body: JSON.stringify(meetingData),
    }),
    onSuccess: () => {
      toast({
        title: "Meeting Scheduled",
        description: "Your meeting has been scheduled successfully!",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  const handleScheduleMeeting = () => {
    if (!selectedDate || !selectedTime || !match) return;

    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    scheduledDateTime.setHours(hours, minutes);

    scheduleMutation.mutate({
      matchId: match.id,
      scheduledAt: scheduledDateTime.toISOString(),
      meetingType,
      duration: 30,
      location: meetingType === "coffee" ? "TBD" : undefined,
      meetingLink: meetingType === "video" ? "https://zoom.us/j/example" : undefined,
    });
  };

  const availableTimes = [
    "09:00", "10:30", "14:00", "15:30", "16:00"
  ];

  // Get the other user in the match
  const otherUser = match && match.user1 && match.user2 && currentUser 
    ? (match.user1.email === currentUser.email ? match.user2 : match.user1)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {otherUser ? `Schedule Meeting with ${otherUser.firstName} ${otherUser.lastName}` : 'Schedule Meeting'}
          </DialogTitle>
        </DialogHeader>
        
        {!otherUser ? (
          <div className="text-center py-8">
            <p className="text-slate-600">No valid match data available. Please try again later.</p>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Match Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {otherUser.firstName.charAt(0)}{otherUser.lastName.charAt(0)}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{otherUser.firstName} {otherUser.lastName}</h3>
                <p className="text-slate-600">{otherUser.jobTitle} at {otherUser.company}</p>
                <Badge className="mt-1">
                  {match.matchScore}% Match
                </Badge>
              </div>
            </div>
          </div>

          {/* Meeting Type Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Meeting Type</h3>
            <RadioGroup value={meetingType} onValueChange={setMeetingType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center space-x-2 cursor-pointer">
                  <Video className="h-4 w-4" />
                  <span>Video Call</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="coffee" id="coffee" />
                <Label htmlFor="coffee" className="flex items-center space-x-2 cursor-pointer">
                  <Coffee className="h-4 w-4" />
                  <span>Coffee Chat</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Date</h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date < new Date(Date.now() - 86400000)}
                className="rounded-md border"
              />
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Times</h3>
            <div className="grid grid-cols-3 gap-3">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => setSelectedTime(time)}
                  className="h-12"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleMeeting}
              disabled={!selectedDate || !selectedTime || scheduleMutation.isPending}
              className="min-w-[120px]"
            >
              {scheduleMutation.isPending ? "Scheduling..." : "Confirm Meeting"}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}