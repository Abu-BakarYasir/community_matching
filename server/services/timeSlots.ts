import { storage } from "../storage";
import type { Availability } from "@shared/schema";

interface TimeSlot {
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  dayName: string;
}

export class TimeSlotService {
  // Find overlapping available time slots between two users
  async findMutualAvailability(user1Id: number, user2Id: number): Promise<TimeSlot[]> {
    const user1Availability = await storage.getAvailability(user1Id);
    const user2Availability = await storage.getAvailability(user2Id);
    
    const mutualSlots: TimeSlot[] = [];
    
    // Group availability by day of week
    const user1ByDay = this.groupByDay(user1Availability);
    const user2ByDay = this.groupByDay(user2Availability);
    
    // Find overlapping time slots for each day
    for (let day = 1; day <= 7; day++) {
      const user1DaySlots = user1ByDay[day] || [];
      const user2DaySlots = user2ByDay[day] || [];
      
      for (const slot1 of user1DaySlots) {
        for (const slot2 of user2DaySlots) {
          const overlap = this.findTimeOverlap(slot1, slot2);
          if (overlap) {
            mutualSlots.push({
              ...overlap,
              dayOfWeek: day,
              dayName: this.getDayName(day)
            });
          }
        }
      }
    }
    
    return mutualSlots.slice(0, 3); // Return top 3 suggestions
  }
  
  // Get suggested meeting times for the next 2 weeks
  async getSuggestedMeetingTimes(user1Id: number, user2Id: number): Promise<{ date: string; time: string; dayName: string }[]> {
    const mutualSlots = await this.findMutualAvailability(user1Id, user2Id);
    
    if (mutualSlots.length === 0) {
      return [];
    }
    
    const suggestions: { date: string; time: string; dayName: string }[] = [];
    const today = new Date();
    
    // Look for the next 14 days
    for (let i = 1; i <= 14; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dayOfWeek = targetDate.getDay() || 7; // Convert Sunday (0) to 7
      
      const availableSlots = mutualSlots.filter(slot => slot.dayOfWeek === dayOfWeek);
      
      for (const slot of availableSlots) {
        // Suggest meetings at the start of available slots
        const timeSlots = this.generateTimeSlots(slot.startTime, slot.endTime);
        
        for (const time of timeSlots.slice(0, 2)) { // Max 2 times per day
          suggestions.push({
            date: targetDate.toISOString().split('T')[0],
            time,
            dayName: slot.dayName
          });
        }
        
        if (suggestions.length >= 5) break; // Max 5 suggestions
      }
      
      if (suggestions.length >= 5) break;
    }
    
    return suggestions;
  }
  
  private groupByDay(availability: Availability[]): { [day: number]: Availability[] } {
    const grouped: { [day: number]: Availability[] } = {};
    
    for (const slot of availability) {
      if (slot.isAvailable) {
        if (!grouped[slot.dayOfWeek]) {
          grouped[slot.dayOfWeek] = [];
        }
        grouped[slot.dayOfWeek].push(slot);
      }
    }
    
    return grouped;
  }
  
  private findTimeOverlap(slot1: Availability, slot2: Availability): { startTime: string; endTime: string } | null {
    const start1 = this.timeToMinutes(slot1.startTime);
    const end1 = this.timeToMinutes(slot1.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);
    
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    
    // Require at least 30 minutes overlap
    if (overlapEnd - overlapStart >= 30) {
      return {
        startTime: this.minutesToTime(overlapStart),
        endTime: this.minutesToTime(overlapEnd)
      };
    }
    
    return null;
  }
  
  private generateTimeSlots(startTime: string, endTime: string): string[] {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const slots: string[] = [];
    
    // Generate 30-minute slots
    for (let time = start; time <= end - 30; time += 30) {
      slots.push(this.minutesToTime(time));
    }
    
    return slots;
  }
  
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  
  private getDayName(dayOfWeek: number): string {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek];
  }
}

export const timeSlotService = new TimeSlotService();