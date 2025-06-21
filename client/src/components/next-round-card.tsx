import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, Users } from "lucide-react";

interface NextRoundCardProps {
  user: any;
}

export function NextRoundCard({ user }: NextRoundCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculate next first Monday of the month
  const getNextMatchingDate = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // First, try current month
    let targetMonth = currentMonth;
    let targetYear = currentYear;
    
    // Find first Monday of the target month
    const firstOfMonth = new Date(targetYear, targetMonth, 1);
    const firstMonday = new Date(firstOfMonth);
    
    // Calculate days until Monday (1 = Monday, 0 = Sunday)
    const dayOfWeek = firstOfMonth.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    firstMonday.setDate(1 + daysUntilMonday);
    
    // If first Monday has passed this month, go to next month
    if (firstMonday <= now) {
      targetMonth = (currentMonth + 1) % 12;
      if (targetMonth === 0) {
        targetYear = currentYear + 1;
      }
      
      const nextFirstOfMonth = new Date(targetYear, targetMonth, 1);
      const nextFirstMonday = new Date(nextFirstOfMonth);
      const nextDayOfWeek = nextFirstOfMonth.getDay();
      const nextDaysUntilMonday = nextDayOfWeek === 0 ? 1 : (8 - nextDayOfWeek) % 7;
      nextFirstMonday.setDate(1 + nextDaysUntilMonday);
      
      return nextFirstMonday;
    }
    
    return firstMonday;
  };

  useEffect(() => {
    const updateCountdown = () => {
      const nextDate = getNextMatchingDate();
      const now = new Date();
      const diff = nextDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const nextMatchingDate = getNextMatchingDate();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isOptedIn = user?.isActive;
  const hasRequiredProfile = user?.jobTitle && user?.company && user?.industry;
  const isEligible = isOptedIn && hasRequiredProfile;

  const getStatusIcon = () => {
    if (isEligible) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOptedIn) {
      return "Not participating - toggle opt-in to join";
    } else if (!hasRequiredProfile) {
      return "Profile incomplete - complete to participate";
    } else {
      return "Ready for matching!";
    }
  };

  const getStatusBadge = () => {
    if (isEligible) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Participating</Badge>;
    } else if (!isOptedIn) {
      return <Badge variant="secondary">Opted Out</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Profile Needed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date and Countdown */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          {formatDate(nextMatchingDate)}
        </h3>
        
        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-slate-900">{timeRemaining.days}</div>
            <div className="text-sm text-slate-600">Days</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-slate-900">{timeRemaining.hours}</div>
            <div className="text-sm text-slate-600">Hours</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-slate-900">{timeRemaining.minutes}</div>
            <div className="text-sm text-slate-600">Minutes</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-slate-900">{timeRemaining.seconds}</div>
            <div className="text-sm text-slate-600">Seconds</div>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="font-medium">Your Status</div>
            <div className="text-sm text-slate-600">{getStatusText()}</div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Time until matching</span>
          <span className="text-slate-600">
            {timeRemaining.days > 0 ? `${timeRemaining.days}d ${timeRemaining.hours}h` : 
             timeRemaining.hours > 0 ? `${timeRemaining.hours}h ${timeRemaining.minutes}m` :
             `${timeRemaining.minutes}m ${timeRemaining.seconds}s`}
          </span>
        </div>
        <Progress 
          value={Math.max(0, 100 - ((timeRemaining.days * 24 + timeRemaining.hours) / (31 * 24)) * 100)} 
          className="h-2"
        />
      </div>

      {/* Quick Info */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
        <Users className="h-4 w-4" />
        <span>Matches are created on the first Monday of each month</span>
      </div>
    </div>
  );
}