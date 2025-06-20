import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Availability } from "@shared/schema";

interface AvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface DayAvailability {
  dayOfWeek: number;
  timeSlots: TimeSlot[];
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIME_OPTIONS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];

export function AvailabilityModal({ open, onOpenChange }: AvailabilityModalProps) {
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>([]);
  const { toast } = useToast();

  const { data: existingAvailability, isLoading } = useQuery({
    queryKey: ["/api/availability"],
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (availability: any[]) => {
      return apiRequest("/api/availability", {
        method: "POST",
        body: JSON.stringify({ availability }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Availability Updated",
        description: "Your availability preferences have been saved successfully!",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (existingAvailability && open) {
      // Convert existing availability to our format
      const groupedByDay = DAYS.map(day => ({
        dayOfWeek: day.value,
        timeSlots: existingAvailability
          .filter((avail: Availability) => avail.dayOfWeek === day.value)
          .map((avail: Availability) => ({
            startTime: avail.startTime || "09:00",
            endTime: avail.endTime || "17:00",
            isAvailable: avail.isAvailable ?? true,
          }))
      }));
      
      setWeeklyAvailability(groupedByDay);
    } else if (open && !isLoading) {
      // Initialize with empty availability for each day
      setWeeklyAvailability(DAYS.map(day => ({
        dayOfWeek: day.value,
        timeSlots: []
      })));
    }
  }, [existingAvailability, open, isLoading]);

  const addTimeSlot = (dayOfWeek: number) => {
    setWeeklyAvailability(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              timeSlots: [
                ...day.timeSlots,
                { startTime: "09:00", endTime: "17:00", isAvailable: true }
              ]
            }
          : day
      )
    );
  };

  const removeTimeSlot = (dayOfWeek: number, index: number) => {
    setWeeklyAvailability(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              timeSlots: day.timeSlots.filter((_, i) => i !== index)
            }
          : day
      )
    );
  };

  const updateTimeSlot = (dayOfWeek: number, index: number, field: keyof TimeSlot, value: any) => {
    setWeeklyAvailability(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              timeSlots: day.timeSlots.map((slot, i) => 
                i === index ? { ...slot, [field]: value } : slot
              )
            }
          : day
      )
    );
  };

  const handleSave = () => {
    // Convert to API format
    const availability: any[] = [];
    
    weeklyAvailability.forEach(day => {
      day.timeSlots.forEach(slot => {
        availability.push({
          dayOfWeek: day.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
        });
      });
    });

    saveMutation.mutate(availability);
  };

  const setQuickAvailability = (preset: string) => {
    let newAvailability: DayAvailability[] = [];
    
    switch (preset) {
      case "business_hours":
        newAvailability = DAYS.slice(1, 6).map(day => ({
          dayOfWeek: day.value,
          timeSlots: [{ startTime: "09:00", endTime: "17:00", isAvailable: true }]
        }));
        // Add empty slots for weekend
        newAvailability.push(
          { dayOfWeek: 0, timeSlots: [] },
          { dayOfWeek: 6, timeSlots: [] }
        );
        break;
      case "flexible":
        newAvailability = DAYS.map(day => ({
          dayOfWeek: day.value,
          timeSlots: [
            { startTime: "09:00", endTime: "12:00", isAvailable: true },
            { startTime: "14:00", endTime: "18:00", isAvailable: true }
          ]
        }));
        break;
      case "evenings":
        newAvailability = DAYS.slice(1, 6).map(day => ({
          dayOfWeek: day.value,
          timeSlots: [{ startTime: "18:00", endTime: "20:00", isAvailable: true }]
        }));
        newAvailability.push(
          { dayOfWeek: 0, timeSlots: [] },
          { dayOfWeek: 6, timeSlots: [] }
        );
        break;
    }
    
    setWeeklyAvailability(newAvailability);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Manage Your Availability
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Quick Setup</Label>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickAvailability("business_hours")}
              >
                Business Hours (9-5 Weekdays)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickAvailability("flexible")}
              >
                Flexible (Mornings & Afternoons)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickAvailability("evenings")}
              >
                Evenings Only
              </Button>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Weekly Schedule</Label>
            <div className="grid gap-4">
              {DAYS.map(day => {
                const dayAvailability = weeklyAvailability.find(d => d.dayOfWeek === day.value);
                
                return (
                  <div key={day.value} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-900">{day.label}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day.value)}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Time
                      </Button>
                    </div>
                    
                    {dayAvailability?.timeSlots.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">No availability set</p>
                    ) : (
                      <div className="space-y-2">
                        {dayAvailability?.timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Select
                                value={slot.startTime}
                                onValueChange={(value) => updateTimeSlot(day.value, index, "startTime", value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <span className="text-slate-600">to</span>
                              
                              <Select
                                value={slot.endTime}
                                onValueChange={(value) => updateTimeSlot(day.value, index, "endTime", value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={slot.isAvailable}
                                onCheckedChange={(checked) => updateTimeSlot(day.value, index, "isAvailable", checked)}
                              />
                              <Label className="text-sm">Available</Label>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeSlot(day.value, index)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Availability Summary</h4>
            <div className="flex flex-wrap gap-2">
              {weeklyAvailability.map(day => {
                const dayLabel = DAYS.find(d => d.value === day.dayOfWeek)?.label;
                const availableSlots = day.timeSlots.filter(slot => slot.isAvailable);
                
                if (availableSlots.length === 0) return null;
                
                return (
                  <Badge key={day.dayOfWeek} variant="secondary" className="text-xs">
                    {dayLabel}: {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="min-w-[120px]"
            >
              {saveMutation.isPending ? "Saving..." : "Save Availability"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}