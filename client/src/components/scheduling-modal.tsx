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

  // Get the other user in the match
  const otherUser = match && match.user1 && match.user2 && currentUser 
    ? (match.user1.email === currentUser.email ? match.user2 : match.user1)
    : null;

  const { data: otherUserAvailability } = useQuery({
    queryKey: ["/api/availability", otherUser?.id],
    enabled: !!otherUser?.id,
  });

  const { data: currentUserAvailability } = useQuery({
    queryKey: ["/api/availability"],
  });

  // Get available times based on both users' availability
  const getAvailableTimes = () => {
    if (!selectedDate || !otherUserAvailability || !currentUserAvailability) {
      return ["09:00", "10:30", "14:00", "15:30", "16:00"]; // Fallback times
    }

    const dayOfWeek = selectedDate.getDay();
    
    // Get both users' availability for the selected day
    const currentUserSlots = currentUserAvailability.filter((slot: any) => 
      slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );
    const otherUserSlots = otherUserAvailability.filter((slot: any) => 
      slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );
    
    // Find overlapping time slots
    const overlappingTimes: string[] = [];
    
    currentUserSlots.forEach((currentSlot: any) => {
      otherUserSlots.forEach((otherSlot: any) => {
        // Simple overlap check - if start/end times match or overlap
        const currentStart = currentSlot.startTime;
        const currentEnd = currentSlot.endTime;
        const otherStart = otherSlot.startTime;
        const otherEnd = otherSlot.endTime;
        
        // If there's any overlap, add some time options
        if (currentStart <= otherEnd && currentEnd >= otherStart) {
          const startTime = currentStart > otherStart ? currentStart : otherStart;
          const endTime = currentEnd < otherEnd ? currentEnd : otherEnd;
          
          // Add hourly slots within the overlap
          let current = startTime;
          while (current < endTime) {
            if (!overlappingTimes.includes(current)) {
              overlappingTimes.push(current);
            }
            // Increment by 30 minutes
            const [hours, minutes] = current.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + 30;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            current = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
          }
        }
      });
    });
    
    return overlappingTimes.length > 0 ? overlappingTimes.sort() : ["09:00", "10:30", "14:00", "15:30", "16:00"];
  };

  const availableTimes = getAvailableTimes();

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
            <h3 className="text-lg font-semibold mb-3">
              Available Times
              {selectedDate && (
                <span className="text-sm font-normal text-slate-600 ml-2">
                  (Based on both users' availability)
                </span>
              )}
            </h3>
            {availableTimes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <p className="text-slate-600">No overlapping availability found for this date.</p>
                <p className="text-sm text-slate-500 mt-1">Try selecting a different date or coordinate directly.</p>
              </div>
            ) : (
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
            )}
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