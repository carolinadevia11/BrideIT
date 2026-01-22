import { CalendarEvent, ChangeRequest, BridgetteAlternative } from '@/types/calendar';
import { FamilyProfile } from '@/types/family';

export const US_TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MT - no DST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'Europe/Berlin', label: 'Central Europe (CET)' },
];

export const eventColors = {
  custody: 'bg-[hsl(217,92%,95%)] text-[hsl(217,92%,25%)] border-[hsl(217,92%,80%)]',
  holiday: 'bg-[hsl(45,100%,95%)] text-[hsl(45,100%,30%)] border-[hsl(45,100%,80%)]',
  school: 'bg-[hsl(160,80%,95%)] text-[hsl(160,80%,30%)] border-[hsl(160,80%,80%)]',
  medical: 'bg-[hsl(340,100%,95%)] text-[hsl(340,100%,30%)] border-[hsl(340,100%,80%)]',
  activity: 'bg-[hsl(30,100%,95%)] text-[hsl(30,100%,30%)] border-[hsl(30,100%,80%)]'
};

export const statusColors = {
  pending: 'bg-[hsl(45,100%,95%)] text-[hsl(45,100%,30%)] border-[hsl(45,100%,80%)]',
  approved: 'bg-[hsl(160,80%,95%)] text-[hsl(160,80%,30%)] border-[hsl(160,80%,80%)]',
  disputed: 'bg-bridge-red text-white border-bridge-red',
  paid: 'bg-[hsl(217,92%,95%)] text-[hsl(217,92%,25%)] border-[hsl(217,92%,80%)]'
};

export const impactColors = {
  minimal: 'bg-green-100 text-green-800 border-green-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

export const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const hasTimeZoneInfo = (value: string) => /([zZ]|[+-]\d{2}:\d{2})$/.test(value);

export const parseApiDate = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const normalized = hasTimeZoneInfo(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateTime = (value: Date | string | null | undefined, timeZone: string): string => {
  const dateObj = parseApiDate(value);
  if (!dateObj) return '—';
  
  // Validate timezone
  const validTimeZone = timeZone && US_TIME_ZONES.some(tz => tz.value === timeZone) 
    ? timeZone 
    : 'America/New_York';
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: validTimeZone,
      timeZoneName: 'short',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateObj.toLocaleString('en-US', { timeZone: validTimeZone });
  }
};

export const formatTimeOnly = (value: Date | undefined, timeZone: string): string => {
  if (!value) return '';
  
  const validTimeZone = timeZone && US_TIME_ZONES.some(tz => tz.value === timeZone) 
    ? timeZone 
    : 'America/New_York';
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: validTimeZone,
    }).format(value);
  } catch (error) {
    console.error('Error formatting time:', error);
    return value.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: validTimeZone 
    });
  }
};

export const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

// IMPORTANT: This is now a fallback if the AI service fails.
// The primary source of alternatives is now the AI backend.
export const generateBridgetteAlternatives = (request: ChangeRequest, currentMonth: Date): BridgetteAlternative[] => {
    const alternatives: BridgetteAlternative[] = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = monthNames[currentMonth.getMonth()];

    if (request.type === 'swap') {
      // Alternative 1: Partial swap (just Saturday instead of whole weekend)
      alternatives.push({
        id: '1',
        type: 'partial-swap',
        title: 'Partial Weekend Swap',
        description: `Instead of swapping entire weekends, what if ${request.requestedBy === 'mom' ? 'your co-parent' : 'you'} just takes Saturday ${request.originalDate}th and you keep Sunday? This maintains most of your original schedule.`,
        impact: 'minimal',
        suggestion: 'This keeps the custody balance almost identical and reduces disruption to the routine.',
        actionText: 'Suggest Partial Swap',
        originalRequestId: request.id
      });

      // Alternative 2: Different weekend entirely
      const alternativeDate = request.originalDate + 7; // Next weekend
      alternatives.push({
        id: '2',
        type: 'different-date',
        title: 'Different Weekend Option',
        description: `What about ${currentMonthName} ${alternativeDate}th instead? This avoids conflicts with the current schedule and maintains the custody agreement balance.`,
        impact: 'low',
        suggestion: 'This option keeps all existing arrangements intact while still helping with the schedule challenge.',
        actionText: 'Suggest Alternative Date',
        originalRequestId: request.id
      });

      // Alternative 3: Makeup time
      alternatives.push({
        id: '3',
        type: 'makeup-time',
        title: 'Makeup Time Solution',
        description: `${request.requestedBy === 'mom' ? 'Your co-parent' : 'You'} could take an extra day during the week (like Wednesday evening) to make up for missing the weekend. This maintains custody balance.`,
        impact: 'low',
        suggestion: 'This approach preserves weekend plans while ensuring fair custody time distribution.',
        actionText: 'Suggest Makeup Time',
        originalRequestId: request.id
      });
    } else if (request.type === 'modify') {
      // Alternative 1: Split the appointment
      alternatives.push({
        id: '4',
        type: 'split-event',
        title: 'Coordinate During Transition',
        description: `Since the appointment is during ${request.requestedBy === 'mom' ? 'your co-parent\'s' : 'your'} custody time, what if you both go together? This shows co-parenting cooperation.`,
        impact: 'minimal',
        suggestion: 'Joint attendance at medical appointments demonstrates unified parenting and is often appreciated by healthcare providers.',
        actionText: 'Suggest Joint Attendance',
        originalRequestId: request.id
      });

      // Alternative 2: Different day that works for both
      const betterDate = request.originalDate - 1; // Day before
      alternatives.push({
        id: '5',
        type: 'different-date',
        title: 'Better Timing Option',
        description: `What about ${currentMonthName} ${betterDate}th instead? This would be during your custody time and avoid any Christmas Eve conflicts.`,
        impact: 'minimal',
        suggestion: 'This timing works better with your custody schedule and avoids holiday conflicts.',
        actionText: 'Suggest Better Date',
        originalRequestId: request.id
      });

      // Alternative 3: Communication help
      alternatives.push({
        id: '6',
        type: 'communication-help',
        title: 'Improved Communication',
        description: `I can help draft a message explaining the situation and asking for cooperation. Sometimes a well-worded explanation can resolve conflicts.`,
        impact: 'minimal',
        suggestion: 'Clear, respectful communication often resolves scheduling conflicts without changing custody arrangements.',
        actionText: 'Get Communication Help',
        originalRequestId: request.id
      });
    } else if (request.type === 'cancel') {
      // Alternative 1: Reschedule instead of cancel
      alternatives.push({
        id: '7',
        type: 'different-date',
        title: 'Reschedule Instead',
        description: `Instead of canceling, what if we reschedule ${request.originalEvent.title} to a date that works better for everyone?`,
        impact: 'low',
        suggestion: 'Rescheduling maintains the custody balance and ensures Emma doesn\'t miss important activities.',
        actionText: 'Help Reschedule',
        originalRequestId: request.id
      });

      // Alternative 2: Makeup time
      alternatives.push({
        id: '8',
        type: 'makeup-time',
        title: 'Schedule Makeup Time',
        description: `If this event must be canceled, I can help calculate makeup time to ensure the custody agreement balance is maintained.`,
        impact: 'low',
        suggestion: 'Makeup time preserves the legal custody arrangement and shows good faith co-parenting.',
        actionText: 'Calculate Makeup Time',
        originalRequestId: request.id
      });
    }

    return alternatives;
};

// Helper for getParentDisplayName which is needed for email generation
export const getParentDisplayName = (
  role: 'mom' | 'dad' | 'both', 
  familyProfile: FamilyProfile | null,
  currentUser: { email: string; firstName?: string; lastName?: string } | undefined
): string => {
    if (role === 'both') return 'Both Parents';

    if (!familyProfile) {
      // If no family profile yet, assume current user is Parent 1 (mom/primary)
      if (role === 'mom' && currentUser?.firstName) {
        return currentUser.firstName;
      }
      return role === 'mom' ? 'Parent 1' : 'Parent 2';
    }
    const parent =
      role === 'mom' ? familyProfile.parent1 : familyProfile.parent2;
    
    if (parent?.firstName) {
      return `${parent.firstName} ${parent.lastName || ''}`.trim();
    }
    
    // Fallback if parent record exists but missing name
    if (role === 'mom' && currentUser?.email === familyProfile.parent1?.email && currentUser?.firstName) {
      return currentUser.firstName;
    }
    
    return role === 'mom' ? 'Parent 1' : 'Parent 2';
};
export const getParentEmailAddress = (
  role: 'mom' | 'dad',
  familyProfile: FamilyProfile | null
): string | undefined => {
  if (!familyProfile) return undefined;
  const parent = role === 'mom' ? familyProfile.parent1 : familyProfile.parent2;
  return parent?.email || undefined;
};
export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const isEventCreator = (
  event: CalendarEvent | null,
  currentUser: { email: string } | undefined
): boolean => {
  if (!event || !currentUser?.email) return false;
  return event.createdByEmail?.toLowerCase() === currentUser.email.toLowerCase();
};