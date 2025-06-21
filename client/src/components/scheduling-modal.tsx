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
    mutationFn: (meetingData: any) => {
      if (match?.meeting) {
        // Update existing meeting
        return apiRequest("PATCH", `/api/meetings/${match.meeting.id}`, meetingData);
      } else {
        // Create new meeting
        return apiRequest("POST", "/api/meetings", meetingData);
      }
    },
    onSuccess: () => {
      toast({
        title: match?.meeting ? "Meeting Rescheduled" : "Meeting Scheduled",
        description: match?.meeting ? "Your meeting has been rescheduled successfully!" : "Your meeting has been scheduled successfully!",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (match?.meeting ? "Failed to reschedule meeting" : "Failed to schedule meeting"),
        variant: "destructive",
      });
    },
  });

  const handleScheduleMeeting = () => {
    if (!match) return;

    // Auto-schedule for next week at 2 PM if no time selected
    let scheduledDateTime;
    if (selectedDate && selectedTime) {
      scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
    } else {
      scheduledDateTime = new Date();
      scheduledDateTime.setDate(scheduledDateTime.getDate() + 7);
      scheduledDateTime.setHours(14, 0, 0, 0); // 2 PM next week
    }

    scheduleMutation.mutate({
      matchId: match.id,
      scheduledAt: scheduledDateTime.toISOString(),
      meetingType,
      duration: 30,
      location: meetingType === "coffee" ? "TBD" : undefined,
      meetingLink: meetingType === "video" ? "https://meet.google.com/wnf-cjab-twp" : undefined,
      status: "scheduled"
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
            {match?.meeting 
              ? `Reschedule Meeting with ${otherUser?.firstName} ${otherUser?.lastName}`
              : `Schedule Meeting with ${otherUser?.firstName} ${otherUser?.lastName}`
            }
          </DialogTitle>
        </DialogHeader>
        
        {!otherUser ? (
          <div className="text-center py-8">
            <p className="text-slate-600">No valid match data available. Please try again later.</p>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Current Meeting Info (if exists) */}
          {match?.meeting && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Current Meeting Details</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Date & Time:</strong> {new Date(match.meeting.scheduledAt).toLocaleDateString()} at {new Date(match.meeting.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p><strong>Duration:</strong> {match.meeting.duration} minutes</p>
                <p><strong>Type:</strong> {match.meeting.meetingType === 'video' ? 'Video Call' : 'Coffee Chat'}</p>
                {match.meeting.meetingLink && (
                  <p><strong>Link:</strong> <a href={match.meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">{match.meeting.meetingLink}</a></p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">Use the form below to update the meeting time and details</p>
              </div>
            </div>
          )}

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

          {/* Auto-Schedule Info */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Auto-Schedule:</strong> Click "Auto-Schedule Meeting" to automatically set up a meeting for next week at 2 PM, or select a specific time above.
            </p>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleMeeting}
              disabled={scheduleMutation.isPending}
              className="min-w-[140px] bg-blue-600 hover:bg-blue-700"
            >
              {scheduleMutation.isPending 
                ? (match?.meeting ? "Rescheduling..." : "Scheduling...") 
                : selectedDate && selectedTime 
                  ? (match?.meeting ? "Confirm Reschedule" : "Confirm Meeting")
                  : (match?.meeting ? "Auto-Reschedule" : "Auto-Schedule Meeting")
              }
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}