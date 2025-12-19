import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Edit3, ArrowRightLeft, Clock, CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, User, Mail, FileText, Lightbulb, SkipForward, ThumbsUp, MessageCircle, DollarSign, Trash2, Loader2 } from 'lucide-react';
import { calendarAPI, expensesAPI, documentsAPI, familyAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import BridgetteAvatar from './BridgetteAvatar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const US_TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MT - no DST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'Europe/Berlin', label: 'Central Europe (CET)' },
];

interface CalendarEvent {
  id: string;
  date: number;
  fullDate: Date;
  type: 'custody' | 'holiday' | 'school' | 'medical' | 'activity';
  title: string;
  parent?: 'mom' | 'dad' | 'both';
  isSwappable?: boolean;
  hasTime?: boolean;
  createdByEmail?: string;
}

interface DayExpense {
  id: string;
  description: string;
  amount?: number;
  status?: string;
  date: Date;
}

interface DayDocument {
  id: string;
  name: string;
  type?: string;
  folder?: string;
  uploadDate: Date;
}

interface ChangeRequest {
  id: string;
  type: 'swap' | 'modify' | 'cancel';
  requestedBy: 'mom' | 'dad';
  requestedByEmail: string;
  originalDate: number;
  newDate?: number;
  swapWithDate?: number;
  swapEventId?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  consequences: string[];
  originalEvent: CalendarEvent;
  affectedEvents: CalendarEvent[];
  approvedBy?: 'mom' | 'dad';
  approvedAt?: Date;
}

interface BridgetteAlternative {
  id: string;
  type: 'partial-swap' | 'different-date' | 'makeup-time' | 'split-event' | 'communication-help';
  title: string;
  description: string;
  impact: 'minimal' | 'low' | 'medium';
  suggestion: string;
  actionText: string;
  originalRequestId: string;
}

interface EmailNotification {
  id: string;
  to: string[];
  subject: string;
  content: string;
  timestamp: Date;
  changeRequest: ChangeRequest;
}

import { FamilyProfile } from '@/types/family';

interface CalendarViewProps {
  familyProfile: FamilyProfile | null;
  currentUser?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  onNavigateToMessages?: () => void;
}

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hasTimeZoneInfo = (value: string) => /([zZ]|[+-]\d{2}:\d{2})$/.test(value);

const parseApiDate = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const normalized = hasTimeZoneInfo(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  familyProfile,
  currentUser,
  onNavigateToMessages,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showBridgetteAlternatives, setShowBridgetteAlternatives] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [changeType, setChangeType] = useState<'swap' | 'modify' | 'cancel'>('swap');
  const [swapDate, setSwapDate] = useState<number | null>(null);
  const [newDate, setNewDate] = useState<number | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<EmailNotification | null>(null);
  const [declinedRequest, setDeclinedRequest] = useState<ChangeRequest | null>(null);
  const [bridgetteAlternatives, setBridgetteAlternatives] = useState<BridgetteAlternative[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingCustody, setIsLoadingCustody] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(() =>
    formatDateInputValue(new Date())
  );
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventType, setNewEventType] =
    useState<CalendarEvent["type"]>("custody");
  const [newEventParent, setNewEventParent] = useState<"mom" | "dad" | "both">(
    "both"
  );
  const [newEventSwappable, setNewEventSwappable] = useState(true);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const today = new Date().getDate();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayOptions, setShowDayOptions] = useState(false);
  const [isMaterializing, setIsMaterializing] = useState(false);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [expensesByDay, setExpensesByDay] = useState<Record<string, DayExpense[]>>({});
  const [documentsByDay, setDocumentsByDay] = useState<Record<string, DayDocument[]>>({});
  const [custodyAgreement, setCustodyAgreement] = useState<any>(null);
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('calendarTimeZone') || 'America/New_York';
    }
    return 'America/New_York';
  });

  const getParentRoleForEmail = (email?: string | null): 'mom' | 'dad' => {
    if (!email || !familyProfile) return 'mom';
    const normalized = email.toLowerCase();
    if (familyProfile.parent1?.email?.toLowerCase() === normalized) {
      return 'mom';
    }
    return 'dad';
  };

  const mapParentLabel = (value?: string): 'mom' | 'dad' | 'both' | undefined => {
    if (!value) return undefined;
    if (value === 'mom' || value === 'dad' || value === 'both') {
      return value;
    }
    const normalized = value.toLowerCase();
    if (normalized.includes('both')) return 'both';
    if (normalized.includes('mom') || normalized.includes('parent1')) return 'mom';
    return 'dad';
  };

  const getParentDisplayName = (role: 'mom' | 'dad' | 'both'): string => {
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
    
    // Fallback if parent record exists but missing name (shouldn't happen with valid profile)
    if (role === 'mom' && currentUser?.email === familyProfile.parent1?.email && currentUser?.firstName) {
      return currentUser.firstName;
    }
    
    return role === 'mom' ? 'Parent 1' : 'Parent 2';
  };

  const getParentEmailAddress = (role: 'mom' | 'dad'): string | undefined => {
    if (!familyProfile) return undefined;
    const parent = role === 'mom' ? familyProfile.parent1 : familyProfile.parent2;
    return parent?.email || undefined;
  };

  const isEventCreator = (event: CalendarEvent | null): boolean => {
    if (!event || !currentUser?.email) return false;
    return event.createdByEmail?.toLowerCase() === currentUser.email.toLowerCase();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarTimeZone', selectedTimeZone);
    }
  }, [selectedTimeZone]);

  const formatDateTime = (value?: Date | string | null): string => {
    const dateObj = parseApiDate(value);
    if (!dateObj) return '—';
    
    // Validate timezone
    const timeZone = selectedTimeZone && US_TIME_ZONES.some(tz => tz.value === selectedTimeZone) 
      ? selectedTimeZone 
      : 'America/New_York';
    
    try {
      // Use more compatible options instead of dateStyle/timeStyle
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timeZone,
        timeZoneName: 'short',
      }).format(dateObj);
    } catch (error) {
      // Fallback to basic formatting if Intl.DateTimeFormat fails
      console.error('Error formatting date:', error);
      return dateObj.toLocaleString('en-US', { timeZone: timeZone });
    }
  };

  const selectedTimeZoneLabel =
    US_TIME_ZONES.find((tz) => tz.value === selectedTimeZone)?.label || 'Eastern (ET)';

  const getDayKey = (date: Date) => formatDateInputValue(date);

  const formatTimeOnly = (value?: Date): string => {
    if (!value) return '';
    
    // Validate timezone
    const timeZone = selectedTimeZone && US_TIME_ZONES.some(tz => tz.value === selectedTimeZone) 
      ? selectedTimeZone 
      : 'America/New_York';
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timeZone,
      }).format(value);
    } catch (error) {
      // Fallback to basic formatting if Intl.DateTimeFormat fails
      console.error('Error formatting time:', error);
      return value.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: timeZone 
      });
    }
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const buildRecipientEmails = (): string[] => {
    const recipients = [
      getParentEmailAddress('mom'),
      getParentEmailAddress('dad'),
    ].filter((email): email is string => Boolean(email));

    if (!recipients.length && currentUser?.email) {
      recipients.push(currentUser.email);
    }

    return recipients;
  };

  const buildApiConsequences = (
    requestType: ChangeRequest['type'],
    originalEvent: CalendarEvent,
    newDate?: number,
    swapEvent?: CalendarEvent
  ): string[] => {
    const consequences: string[] = [];
    if (requestType === 'swap' && swapEvent) {
      consequences.push(
        `${originalEvent.title} moves from ${originalEvent.date} to ${swapEvent.date}`
      );
      consequences.push(
        `${swapEvent.title} moves from ${swapEvent.date} to ${originalEvent.date}`
      );
    } else if (requestType === 'modify' && newDate) {
      consequences.push(
        `${originalEvent.title} moves from ${originalEvent.date} to ${newDate}`
      );
    } else if (requestType === 'cancel') {
      consequences.push(`${originalEvent.title} on ${originalEvent.date} will be cancelled`);
    }
    return consequences;
  };

  const hasSpecificTime = (dateObj: Date): boolean => {
    return !(
      dateObj.getHours() === 0 &&
      dateObj.getMinutes() === 0 &&
      dateObj.getSeconds() === 0
    );
  };

  const buildCalendarEventFromSnapshot = (
    id: string,
    title: string,
    type: string,
    parent?: string,
    isoDate?: string
  ): CalendarEvent => {
    const dateObj = parseApiDate(isoDate) ?? new Date();
    return {
      id,
      title,
      type: (type as CalendarEvent['type']) || 'custody',
      parent: mapParentLabel(parent),
      isSwappable: true,
      date: dateObj.getDate(),
      fullDate: dateObj,
      hasTime: hasSpecificTime(dateObj),
    };
  };

  const mapChangeRequestFromApi = (apiRequest: any): ChangeRequest => {
    const originalEvent = buildCalendarEventFromSnapshot(
      apiRequest.event_id,
      apiRequest.eventTitle || 'Schedule Event',
      apiRequest.eventType || 'custody',
      apiRequest.eventParent,
      apiRequest.eventDate
    );

    const swapEvent = (apiRequest.swapEventId || apiRequest.swapEventDate)
      ? buildCalendarEventFromSnapshot(
          apiRequest.swapEventId || 'virtual-swap',
          apiRequest.swapEventTitle || 'Custody Day',
          apiRequest.eventType || 'custody',
          apiRequest.eventParent,
          apiRequest.swapEventDate
        )
      : undefined;

    const newDateObj = apiRequest.newDate ? parseApiDate(apiRequest.newDate) ?? undefined : undefined;

    return {
      id: apiRequest.id,
      type: (apiRequest.requestType || 'modify') as ChangeRequest['type'],
      requestedBy: getParentRoleForEmail(apiRequest.requestedBy_email),
      requestedByEmail: apiRequest.requestedBy_email,
      originalDate: originalEvent.date,
      newDate: newDateObj?.getDate(),
      swapWithDate: swapEvent?.date,
      swapEventId: apiRequest.swapEventId,
      reason: apiRequest.reason || '',
      status: apiRequest.status || 'pending',
      timestamp: parseApiDate(apiRequest.createdAt) ?? new Date(),
      consequences: buildApiConsequences(
        (apiRequest.requestType || 'modify') as ChangeRequest['type'],
        originalEvent,
        newDateObj?.getDate(),
        swapEvent
      ),
      originalEvent,
      affectedEvents: swapEvent ? [originalEvent, swapEvent] : [originalEvent],
      approvedBy: apiRequest.resolvedBy_email
        ? getParentRoleForEmail(apiRequest.resolvedBy_email)
        : undefined,
      approvedAt: apiRequest.updatedAt ? parseApiDate(apiRequest.updatedAt) ?? undefined : undefined,
    };
  };

  const [emailHistory, setEmailHistory] = useState<EmailNotification[]>([]);

  // Load events immediately, then expenses and documents for better UX
  useEffect(() => {
    const loadAllData = async () => {
      // Load events first so calendar appears immediately
      await loadEvents();
      // Then load other data in parallel (non-blocking)
      Promise.all([
        // Other data loading calls can go here
      ]).catch((error) => {
        console.error('Error loading ancillary data:', error);
      });
    };
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]); // Functions depend on currentMonth which is in the dependency array

  useEffect(() => {
    loadChangeRequests();
  }, [familyProfile]);

  // Auto-refresh data every 5 seconds to ensure real-time sync
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadEvents(true);
      loadChangeRequests(true);
    }, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const loadEvents = async (background = false) => {
    if (!background) setIsLoadingEvents(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // API expects 1-12
      const response = await calendarAPI.getEvents(year, month);
      
      // Transform backend events to frontend format
      const transformedEvents: CalendarEvent[] = response
        .map((event: any) => {
          const eventDate = parseApiDate(event.date);
          if (!eventDate) return null;
          return {
            id: event.id,
            date: eventDate.getDate(),
            fullDate: eventDate,
            type: event.type as 'custody' | 'holiday' | 'school' | 'medical' | 'activity',
            title: event.title,
            parent: event.parent as 'mom' | 'dad' | 'both' | undefined,
            isSwappable: event.isSwappable ?? false,
            hasTime: hasSpecificTime(eventDate),
            createdByEmail: event.createdBy_email,
          } as CalendarEvent;
        })
        .filter((event): event is CalendarEvent => Boolean(event));
      
      setEvents(transformedEvents);
    } catch (error: any) {
      // Handle empty states gracefully - don't show error toasts
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No events')) {
        // Empty state - not an error, just set empty array
        setEvents([]);
      } else {
        console.error('Error loading events:', error);
        // Only log real errors, don't show toast
        setEvents([]);
      }
    } finally {
      if (!background) setIsLoadingEvents(false);
    }
  };



  const loadChangeRequests = async (background = false) => {
    if (!background) setIsLoadingRequests(true);
    try {
      const response = await calendarAPI.getChangeRequests();
      const mapped: ChangeRequest[] = response.map((req: any) =>
        mapChangeRequestFromApi(req)
      );
      setChangeRequests(mapped);
    } catch (error: any) {
      // Handle empty states gracefully - don't show error toasts
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No change requests')) {
        // Empty state - not an error, just set empty array
        setChangeRequests([]);
      } else {
        console.error('Error loading change requests:', error);
        // Only log real errors, don't show toast
        setChangeRequests([]);
      }
    } finally {
      if (!background) setIsLoadingRequests(false);
    }
  };

  // Event colors using new theme (#084dbd blue, #FFBF00 yellow, light parrot)
  const eventColors = {
    custody: 'bg-[hsl(217,92%,95%)] text-[hsl(217,92%,25%)] border-[hsl(217,92%,80%)]', // Primary Blue (#084dbd)
    holiday: 'bg-[hsl(45,100%,95%)] text-[hsl(45,100%,30%)] border-[hsl(45,100%,80%)]', // Secondary Yellow/Gold (#FFBF00)
    school: 'bg-[hsl(160,80%,95%)] text-[hsl(160,80%,30%)] border-[hsl(160,80%,80%)]', // Light Parrot/Teal
    medical: 'bg-[hsl(340,100%,95%)] text-[hsl(340,100%,30%)] border-[hsl(340,100%,80%)]', // Pink/Rose
    activity: 'bg-[hsl(30,100%,95%)] text-[hsl(30,100%,30%)] border-[hsl(30,100%,80%)]' // Orange
  };

  // Status colors using new theme
  const statusColors = {
    pending: 'bg-[hsl(45,100%,95%)] text-[hsl(45,100%,30%)] border-[hsl(45,100%,80%)]', // Secondary Yellow/Gold (#FFBF00)
    approved: 'bg-[hsl(160,80%,95%)] text-[hsl(160,80%,30%)] border-[hsl(160,80%,80%)]', // Light Parrot/Teal
    disputed: 'bg-bridge-red text-white border-bridge-red',
    paid: 'bg-[hsl(217,92%,95%)] text-[hsl(217,92%,25%)] border-[hsl(217,92%,80%)]' // Primary Blue (#084dbd)
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    disputed: AlertTriangle,
    paid: CalendarIcon
  };

  const impactColors = {
    minimal: 'bg-green-100 text-green-800 border-green-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  // Get pending requests count and determine Bridgette's message
  const pendingRequestsCount = changeRequests.filter(r => r.status === 'pending').length;
  const urgentRequests = changeRequests.filter(r => r.status === 'pending' && 
    (new Date().getTime() - r.timestamp.getTime()) > 24 * 60 * 60 * 1000 // Older than 24 hours
  ).length;

  const getBridgetteMessage = () => {
    if (urgentRequests > 0) {
      return {
        message: `🚨 URGENT: You have ${urgentRequests} pending request${urgentRequests > 1 ? 's' : ''} that need${urgentRequests === 1 ? 's' : ''} immediate attention! These have been waiting over 24 hours and could affect your custody schedule.`,
        isAlert: true,
        expression: 'thinking' as 'thinking' | 'encouraging' | 'balanced'
      };
    } else if (pendingRequestsCount > 0) {
      return {
        message: `⚠️ ATTENTION: You have ${pendingRequestsCount} pending schedule change request${pendingRequestsCount > 1 ? 's' : ''} waiting for your response. Please review ${pendingRequestsCount === 1 ? 'it' : 'them'} to keep your co-parenting schedule on track!`,
        isAlert: true,
        expression: 'encouraging' as 'thinking' | 'encouraging' | 'balanced'
      };
    } else if (emailHistory.length > 0) {
      return {
        message: `Great job staying on top of your schedule changes! I've sent ${emailHistory.length} documentation email${emailHistory.length > 1 ? 's' : ''} to both parents. Everything is organized and legally documented! 📧✨`,
        isAlert: false,
        expression: 'encouraging' as 'thinking' | 'encouraging' | 'balanced'
      };
    } else {
      return {
        message: `Your calendar looks great! I'm here to help with any schedule changes or conflicts. Remember, I can automatically generate legal documentation when changes are approved! 📅⚖️`,
        isAlert: false,
        expression: 'encouraging' as 'thinking' | 'encouraging' | 'balanced'
      };
    }
  };

  const bridgetteInfo = getBridgetteMessage();

  const generateBridgetteAlternatives = (request: ChangeRequest): BridgetteAlternative[] => {
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

  const generateApprovalEmail = (request: ChangeRequest): EmailNotification => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentMonthName = monthNames[currentMonth.getMonth()];
    const currentYear = currentMonth.getFullYear();
    const parent1Name = getParentDisplayName('mom');
    const parent2Name = getParentDisplayName('dad');
    const parent1Signature = parent1Name.toUpperCase();
    const parent2Signature = parent2Name.toUpperCase();
    const recipientList = buildRecipientEmails();
    const fallbackRecipients = ['notifications@bridge.local'];
    
    const requestedByName = getParentDisplayName(request.requestedBy);
    const approvedByName = request.approvedBy
      ? getParentDisplayName(request.approvedBy)
      : getParentDisplayName(request.requestedBy === 'mom' ? 'dad' : 'mom');
    
    const formatDate = (date: number) => `${currentMonthName} ${date}, ${currentYear}`;
    
    let changeDescription = '';
    let contractImpact = '';
    
    if (request.type === 'swap' && request.swapWithDate) {
      const originalEvent = request.originalEvent;
      const swapEvent = request.affectedEvents.find(e => e.date === request.swapWithDate);
      
      changeDescription = `
        <strong>SCHEDULE SWAP APPROVED</strong><br/>
        • ${originalEvent.title} moved from ${formatDate(request.originalDate)} to ${formatDate(request.swapWithDate)}<br/>
        • ${swapEvent?.title} moved from ${formatDate(request.swapWithDate)} to ${formatDate(request.originalDate)}
      `;
      
      contractImpact = `
        This change maintains the overall custody balance as outlined in your divorce agreement. 
        The total number of custody days for each parent remains unchanged, only the specific dates have been exchanged.
        This modification does not alter the fundamental terms of your custody arrangement.
      `;
    } else if (request.type === 'modify' && request.newDate) {
      changeDescription = `
        <strong>SCHEDULE MODIFICATION APPROVED</strong><br/>
        • ${request.originalEvent.title} moved from ${formatDate(request.originalDate)} to ${formatDate(request.newDate)}
      `;
      
      contractImpact = `
        This change may affect the custody balance outlined in your divorce agreement. 
        Please review your monthly custody distribution to ensure compliance with your legal arrangement.
        Consider scheduling a makeup day if required by your custody agreement.
      `;
    } else if (request.type === 'cancel') {
      changeDescription = `
        <strong>EVENT CANCELLATION APPROVED</strong><br/>
        • ${request.originalEvent.title} on ${formatDate(request.originalDate)} has been cancelled
      `;
      
      contractImpact = `
        This cancellation may affect the custody balance outlined in your divorce agreement.
        You may need to schedule a makeup day to maintain the required custody distribution.
        Please consult your legal agreement for guidance on cancelled custody time.
      `;
    }

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #002f6c, #10b981); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f8fafc; }
        .warning { border-left-color: #f59e0b; background: #fffbeb; }
        .success { border-left-color: #10b981; background: #f0fdf4; }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
        .signature-box { border: 2px solid #e2e8f0; padding: 15px; margin: 10px 0; background: white; }
        .timestamp { font-size: 11px; color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ Bridge-it Co-Parenting Platform</h1>
        <h2>Official Schedule Change Documentation</h2>
    </div>
    
    <div class="content">
        <div class="section success">
            <h3>📅 APPROVED SCHEDULE CHANGE</h3>
            ${changeDescription}
            <br/><br/>
            <strong>Reason:</strong> ${request.reason}
        </div>

        <div class="section">
            <h3>👥 APPROVAL DETAILS</h3>
            <strong>Requested by:</strong> ${requestedByName}<br/>
            <strong>Request Date:</strong> ${formatDateTime(request.timestamp)}<br/>
            <strong>Approved by:</strong> ${approvedByName}<br/>
            <strong>Approval Date:</strong> ${formatDateTime(request.approvedAt)}<br/>
            <strong>Change Type:</strong> ${request.type.toUpperCase()}
        </div>

        <div class="section warning">
            <h3>⚖️ DIVORCE CONTRACT IMPACT ANALYSIS</h3>
            <p>${contractImpact}</p>
            
            <strong>Consequences Acknowledged:</strong>
            <ul>
                ${request.consequences.map(consequence => `<li>${consequence}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h3>📋 BEFORE & AFTER COMPARISON</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f1f5f9;">
                    <th style="padding: 10px; border: 1px solid #e2e8f0;">BEFORE CHANGE</th>
                    <th style="padding: 10px; border: 1px solid #e2e8f0;">AFTER CHANGE</th>
                </tr>
                ${request.type === 'swap' && request.swapWithDate ? `
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.originalEvent.title}<br/>
                        ${formatDate(request.swapWithDate)}: ${request.affectedEvents.find(e => e.date === request.swapWithDate)?.title}
                    </td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.affectedEvents.find(e => e.date === request.swapWithDate)?.title}<br/>
                        ${formatDate(request.swapWithDate)}: ${request.originalEvent.title}
                    </td>
                </tr>
                ` : request.type === 'modify' && request.newDate ? `
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.originalEvent.title}
                    </td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.newDate)}: ${request.originalEvent.title}
                    </td>
                </tr>
                ` : `
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.originalEvent.title}
                    </td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: <em>CANCELLED</em>
                    </td>
                </tr>
                `}
            </table>
        </div>

        <div class="section">
            <h3>✅ MUTUAL AGREEMENT CONFIRMATION</h3>
            
            <div class="signature-box">
                <strong>PARENT 1 - ${parent1Signature}</strong><br/>
                Status: ${request.requestedBy === 'mom' ? 'REQUESTED' : 'APPROVED'}<br/>
                Date: ${request.requestedBy === 'mom' ? formatDateTime(request.timestamp) : formatDateTime(request.approvedAt)}<br/>
                Digital Signature: ✓ Confirmed via Bridge-it Platform
            </div>

            <div class="signature-box">
                <strong>PARENT 2 - ${parent2Signature}</strong><br/>
                Status: ${request.requestedBy === 'dad' ? 'REQUESTED' : 'APPROVED'}<br/>
                Date: ${request.requestedBy === 'dad' ? formatDateTime(request.timestamp) : formatDateTime(request.approvedAt)}<br/>
                Digital Signature: ✓ Confirmed via Bridge-it Platform
            </div>
        </div>

        <div class="section warning">
            <h3>⚠️ LEGAL DISCLAIMER</h3>
            <p><strong>This email serves as official documentation of a mutually agreed schedule modification.</strong></p>
            <p>Both parents have reviewed and approved this change through the Bridge-it Co-Parenting Platform. 
            This modification is binding and should be treated as an amendment to your existing custody schedule.</p>
            <p>If this change conflicts with your legal custody agreement, please consult with your family law attorney. 
            Bridge-it Co-Parenting Platform provides tools for communication and organization but does not provide legal advice.</p>
        </div>

        <div class="section">
            <h3>📞 QUESTIONS OR CONCERNS?</h3>
            <p>If you have questions about this change or need to make additional modifications:</p>
            <ul>
                <li>Log into your Bridge-it account at <a href="https://bridge-coparenting.com">bridge-coparenting.com</a></li>
                <li>Contact Bridge-it Support: support@bridge-coparenting.com</li>
                <li>For legal questions, consult your family law attorney</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p><strong>Bridge-it Co-Parenting Platform</strong> | Fair & Balanced Co-Parenting</p>
        <p>This is an automated message generated by the Bridge-it system.</p>
            <p class="timestamp">Document ID: BCH-${request.id} | Generated: ${formatDateTime(new Date())}</p>
            <p class="timestamp">All timestamps shown in ${selectedTimeZoneLabel}.</p>
        <p>⚖️ Bridge-it AI Assistant helped facilitate this agreement</p>
    </div>
</body>
</html>
    `;

    return {
      id: Date.now().toString(),
      to: recipientList.length ? recipientList : fallbackRecipients,
      subject: `🗓️ APPROVED: Schedule Change Documentation - ${currentMonthName} ${currentYear}`,
      content: emailContent,
      timestamp: new Date(),
      changeRequest: request
    };
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => event.date === day);
  };

  const getPendingRequestsForDay = (day: number) => {
    return changeRequests.filter(req => 
      req.status === 'pending' && 
      (req.originalDate === day || req.newDate === day || req.swapWithDate === day)
    );
  };

  /**
   * Load custody agreement from backend
   */
  useEffect(() => {
    const loadCustodyAgreement = async () => {
      if (!familyProfile) return;
      
      setIsLoadingCustody(true);
      try {
        const agreement = await familyAPI.getContract();
        setCustodyAgreement(agreement);
      } catch (error: unknown) {
        // 404 means no agreement uploaded yet, which is fine
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('404') || errorMessage?.includes('not found')) {
          setCustodyAgreement(null);
        } else {
          console.error('Error loading custody agreement:', error);
        }
      } finally {
        setIsLoadingCustody(false);
      }
    };

    loadCustodyAgreement();
  }, [familyProfile]);

  /**
   * Determine which parent has custody on a given date based on custody agreement
   */
  const getCustodyParentForDate = (date: Date): 'mom' | 'dad' | 'both' | null => {
    if (!familyProfile || !custodyAgreement || !custodyAgreement.custodySchedule) {
      return null;
    }

    const custodySchedule = custodyAgreement.custodySchedule.toLowerCase();

    // 2-2-3 schedule (14-day cycle)
    if (custodySchedule.includes('2-2-3') || custodySchedule.includes('two-two-three')) {
      const referenceDate = new Date(date.getFullYear(), 0, 1); // January 1st
      const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const pattern = ['mom', 'mom', 'dad', 'dad', 'mom', 'mom', 'mom', 'dad', 'dad', 'mom', 'mom', 'dad', 'dad', 'dad'];
      const dayInCycle = ((daysSinceReference % 14) + 14) % 14; // Handle negative days safely
      return pattern[dayInCycle] as 'mom' | 'dad';
    }

    // Week-on/week-off
    if (custodySchedule.includes('week-on') || custodySchedule.includes('week off') ||
        custodySchedule.includes('alternat') || custodySchedule.includes('week-on/week-off') ||
        custodySchedule.includes('every other')) {
      const referenceDate = new Date(date.getFullYear(), 0, 1);
      const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysSinceReference / 7);
      return weekNumber % 2 === 0 ? 'mom' : 'dad';
    }

    // Custom schedule
    if (custodySchedule.includes('custom') || custodySchedule.includes('custody on')) {
      const dayOfWeek = date.getDay();
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayName = dayNames[dayOfWeek];
      const parent1Section = custodySchedule.split('parent 2')[0] || custodySchedule;
      const parent2Section = custodySchedule.split('parent 2')[1] || '';
      
      if (parent1Section.includes(dayName)) return 'mom';
      else if (parent2Section.includes(dayName)) return 'dad';
    }

    // Default fallback
    if (custodySchedule.includes('50') || custodySchedule.includes('equal') || custodySchedule.includes('split')) {
      const referenceDate = new Date(date.getFullYear(), 0, 1);
      const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysSinceReference / 7);
      return weekNumber % 2 === 0 ? 'mom' : 'dad';
    }

    return null;
  };

  const getCustodyParentForDay = (day: number) => {
    return getCustodyParentForDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  /**
   * Legacy wrapper kept for diff minimization, logic moved to getCustodyParentForDate
   */
  const _legacy_getCustodyParentForDay = (day: number): 'mom' | 'dad' | 'both' | null => {
    // ONLY show custody colors if there's an actual custody agreement configured
    // Don't show colors based on just the custody arrangement setting
    if (!familyProfile || !custodyAgreement || !custodyAgreement.custodySchedule) {
      return null;
    }

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const custodySchedule = custodyAgreement.custodySchedule.toLowerCase();

    // 2-2-3 schedule (14-day cycle) - CHECK THIS FIRST before week-on/week-off
    // because 2-2-3 description may contain "alternates" which would incorrectly match week-on/week-off
    // Pattern: P1(2), P2(2), P1(3), P2(2), P1(2), P2(3) - repeats every 14 days
    if (custodySchedule.includes('2-2-3') || custodySchedule.includes('two-two-three')) {
      const referenceDate = new Date(date.getFullYear(), 0, 1); // January 1st
      const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // 14-day pattern: [P1, P1, P2, P2, P1, P1, P1, P2, P2, P1, P1, P2, P2, P2]
      const pattern = ['mom', 'mom', 'dad', 'dad', 'mom', 'mom', 'mom', 'dad', 'dad', 'mom', 'mom', 'dad', 'dad', 'dad'];
      const dayInCycle = daysSinceReference % 14;
      
      return pattern[dayInCycle] as 'mom' | 'dad';
    }

    return null; // Legacy function body removed to avoid duplicates, handled by getCustodyParentForDate
  };

  const getEffectiveCustodyParent = (day: number): 'mom' | 'dad' | 'both' | null => {
    // Check for explicit custody event (override)
    const overrideEvent = events.find(e => e.date === day && e.type === 'custody');
    if (overrideEvent && overrideEvent.parent) {
      return overrideEvent.parent;
    }
    // Fallback to agreement
    return getCustodyParentForDay(day);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const openCreateEventModal = (dateOverride?: Date) => {
    let defaultDate = dateOverride;
    if (!defaultDate) {
      const nowDate = new Date();
      const sameMonth =
        nowDate.getFullYear() === currentMonth.getFullYear() &&
        nowDate.getMonth() === currentMonth.getMonth();
      const defaultDay = sameMonth ? nowDate.getDate() : 1;
      const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      ).getDate();
      const clampedDay = Math.min(defaultDay, daysInMonth);
      defaultDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        clampedDay
      );
    }
    setNewEventDate(formatDateInputValue(defaultDate));
    setNewEventTitle("");
    setNewEventType("custody");
    
    // Auto-select the correct parent based on custody agreement
    const custodyParent = getCustodyParentForDay(defaultDate.getDate());
    setNewEventParent(custodyParent || "both");
    
    setNewEventSwappable(true);
    setNewEventTime('');
    setEditingEvent(null);
    setIsEditingMode(false);
    setShowCreateEvent(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsEditingMode(true);
    setNewEventDate(formatDateInputValue(event.fullDate));
    setNewEventTitle(event.title);
    setNewEventType(event.type);
    setNewEventParent(event.parent || "both");
    setNewEventSwappable(event.isSwappable ?? true);
    setNewEventTime(event.hasTime ? formatTimeOnly(event.fullDate) : '');
    setShowEventDetails(false);
    setShowCreateEvent(true);
  };

  const createNewEvent = async (eventData: {
    date: Date;
    type: string;
    title: string;
    parent?: string;
    isSwappable?: boolean;
  }) => {
    try {
      await calendarAPI.createEvent({
        date: eventData.date.toISOString(),
        type: eventData.type,
        title: eventData.title,
        parent: eventData.parent,
        isSwappable: eventData.isSwappable,
      });

      toast({
        title: "Success!",
        description: "Event created successfully.",
      });

      // Reload events
      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event.",
        variant: "destructive",
      });
    }
  };

  const handleCreateEventSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!newEventTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a name for the event.",
        variant: "destructive",
      });
      return;
    }

    const dateString = newEventTime ? `${newEventDate}T${newEventTime}` : `${newEventDate}T00:00`;
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      toast({
        title: "Invalid date",
        description: "Please pick a valid date for this event.",
        variant: "destructive",
      });
      return;
    }

    // Client-side conflict detection
    const day = parsedDate.getDate();
    // Ensure we are checking the correct month/year
    const isSameMonth = parsedDate.getMonth() === currentMonth.getMonth() &&
                        parsedDate.getFullYear() === currentMonth.getFullYear();
    
    if (isSameMonth) {
      const dayEvents = getEventsForDay(day);
      const isCustodyEvent = newEventType === 'custody';
      
      // Check for overlapping custody events
      if (isCustodyEvent) {
        const existingCustody = dayEvents.find(e =>
          e.type === 'custody' &&
          (!isEditingMode || e.id !== editingEvent?.id)
        );
        
        if (existingCustody) {
          const proceed = window.confirm(
            `Possible Conflict: There is already a custody event for ${existingCustody.parent ? getParentDisplayName(existingCustody.parent) : 'a parent'} on this date.\n\nDo you want to proceed with adding this event?`
          );
          
          if (!proceed) return;
        }
      }

      // Check if trying to override custody agreement manually (For ALL event types)
      const agreementParent = getCustodyParentForDay(day);
      
      // General Rule: You cannot assign events to a parent who does not have custody that day
      // (Unless the day is shared "both", or the event is assigned to "both" which we might allow or restrict)
      // Stricter Rule: The Event Parent must match the Agreement Parent
      
      if (agreementParent && agreementParent !== 'both') {
          // If I'm trying to assign to the "other" parent (who doesn't have custody)
          // e.g. It's Mom's day, but I assign to Dad.
          // OR It's Dad's day, but I assign to Mom (Myself) -> This blocks the reported loophole
          if (newEventParent !== 'both' && newEventParent !== agreementParent) {
            const agreementParentName = getParentDisplayName(agreementParent);
            const assignedParentName = getParentDisplayName(newEventParent);
            
            toast({
              title: "Responsibility Mismatch",
              description: `This day belongs to ${agreementParentName}. You cannot unilaterally assign an event to ${assignedParentName}. Please create the event for the correct parent, or use a Request to change responsibilities.`,
              variant: "destructive"
            });
            return;
          }
          
          // If I'm trying to assign to "Both" (forcing the other parent) on a single-parent day
          if (newEventParent === 'both') {
              // Only block strict "Custody" type overrides
              // Allow "Both" for School, Activity, etc. as they often involve both parents regardless of custody
              if (newEventType === 'custody') {
                toast({
                  title: "Custody Mismatch",
                  description: `This is explicitly ${agreementParent === 'mom' ? "Mom's" : "Dad's"} day. You cannot make it a shared 'Both' custody day manually. Please use Request Swap.`,
                  variant: "destructive"
                });
                return;
              }
          }
      }
      
      // Check for general schedule density (warn if > 3 events)
      if (dayEvents.length >= 3 && (!isEditingMode || dayEvents.find(e => e.id === editingEvent?.id))) {
         // Just a soft check, maybe don't block, but good to know logic is possible here
      }
    }

    setCreatingEvent(true);
    try {
      if (isEditingMode && editingEvent) {
        // Update existing event
        await calendarAPI.updateEvent(editingEvent.id, {
          date: parsedDate.toISOString(),
          type: newEventType,
          title: newEventTitle.trim(),
          parent: newEventParent,
          isSwappable: newEventSwappable,
        });
        toast({
          title: "Success!",
          description: "Event updated successfully.",
        });
        await loadEvents();
        setShowCreateEvent(false);
        setEditingEvent(null);
        setIsEditingMode(false);
      } else {
        // Create new event
        await createNewEvent({
          date: parsedDate,
          type: newEventType,
          title: newEventTitle.trim(),
          parent: newEventParent,
          isSwappable: newEventSwappable,
        });
        setShowCreateEvent(false);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : (isEditingMode ? "Failed to update event." : "Failed to create event."),
        variant: "destructive",
      });
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleRequestChangeFromDetails = () => {
    if (!selectedEvent) {
      return;
    }
    // Allow requesting changes even if isSwappable is false (mediation flow)
    setShowEventDetails(false);
    setShowChangeRequest(true);
  };

  const calculateConsequences = (): string[] => {
    if (!selectedEvent) return [];

    // Create a temporary request object to reuse logic
    const tempRequest: ChangeRequest = {
      id: 'temp',
      type: changeType,
      requestedBy: getParentRoleForEmail(currentUser?.email),
      requestedByEmail: currentUser?.email || '',
      originalDate: selectedEvent.date,
      newDate: newDate ?? undefined,
      swapWithDate: swapDate ?? undefined,
      swapEventId: undefined, // Not needed for logic
      reason: changeReason,
      status: 'pending',
      timestamp: new Date(),
      consequences: [],
      originalEvent: selectedEvent,
      affectedEvents: [] // Not strictly needed for logic
    };

    return getDynamicConsequences(tempRequest);
  };

  const getDynamicConsequences = (request: ChangeRequest, forEmail: boolean = false): string[] => {
    const consequences: string[] = [];
    const { type, originalEvent, newDate, swapWithDate, requestedBy } = request;
    const isCurrentUserRequester = currentUser?.email === request.requestedByEmail;
    const requestedByName = getParentDisplayName(requestedBy);
    const otherParentName = getParentDisplayName(requestedBy === 'mom' ? 'dad' : 'mom');

    if (type === 'swap' && swapWithDate) {
      let swapEvent = events.find(e => e.date === swapWithDate && e.type === 'custody');
      
      // If no event exists, simulate one based on custody schedule
      if (!swapEvent) {
         const parent = getEffectiveCustodyParent(swapWithDate);
         const parentName = parent ? getParentDisplayName(parent) : 'Other Parent';
         swapEvent = {
            id: 'simulated',
            title: `Custody Day (${parentName})`,
            date: swapWithDate,
            fullDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), swapWithDate),
            type: 'custody',
            parent: parent || 'both',
            isSwappable: true
         } as CalendarEvent;
      }

      if (swapEvent) {
        consequences.push(`${originalEvent.title} moves from ${originalEvent.date} to ${swapEvent.date}`);
        consequences.push(`${swapEvent.title} moves from ${swapEvent.date} to ${originalEvent.date}`);
        
        // Check for school day implications
        const isSchoolWeek = (date: number) => {
          const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date).getDay();
          return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
        };
        
        if (isSchoolWeek(swapWithDate) && originalEvent.type === 'custody') {
          consequences.push('⚠️ This change affects school week custody - pickup/dropoff responsibilities will change');
        }
        
        if (Math.abs(swapWithDate - originalEvent.date) > 7) {
          consequences.push('⚠️ This is a significant schedule change - consider impact on Emma\'s routine');
        }

        // Check for other events on the swap date (Target Date)
        // These are events currently on the date being ACQUIRED by the requester
        const eventsOnSwapDate = events.filter(e =>
          e.date === swapWithDate &&
          e.type !== 'custody'
        );
        
        if (eventsOnSwapDate.length > 0) {
          const eventNames = eventsOnSwapDate.map(e => e.title).join(', ');
          // If I am the requester: "You will be responsible"
          // If I am the approver: "Requester will be responsible"
          let who;
          if (forEmail) {
             who = requestedByName;
          } else {
             who = isCurrentUserRequester ? 'You' : requestedByName;
          }
          consequences.push(`⚠️ This swap includes: ${eventNames}. ${who} will be responsible for these events.`);
        }

        // Check for other events on the original date (Source Date)
        // These are events currently on the date being GIVEN UP by the requester
        const eventsOnOriginalDate = events.filter(e =>
          e.date === originalEvent.date &&
          e.type !== 'custody' &&
          e.id !== originalEvent.id
        );

        if (eventsOnOriginalDate.length > 0) {
          const eventNames = eventsOnOriginalDate.map(e => e.title).join(', ');
          const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long' });
          // If I am the requester: "Co-parent will be responsible"
          // If I am the approver: "You will be responsible"
          let who;
          if (forEmail) {
             who = otherParentName;
          } else {
             who = isCurrentUserRequester ? 'Your co-parent' : 'You';
          }
          consequences.push(`⚠️ ${who} will be responsible for: ${eventNames} on ${monthName} ${originalEvent.date}.`);
        }
      }
    } else if (type === 'modify' && newDate) {
      consequences.push(`${originalEvent.title} moves from ${originalEvent.date} to ${newDate}`);
      
      // Check for conflicts
      const conflictingEvents = events.filter(e => e.date === newDate);
      if (conflictingEvents.length > 0) {
        consequences.push(`⚠️ Conflict: ${conflictingEvents.map(e => e.title).join(', ')} already scheduled for ${newDate}`);
      }
    } else if (type === 'cancel') {
      consequences.push(`${originalEvent.title} on ${originalEvent.date} will be cancelled`);
      consequences.push('⚠️ This may affect the overall custody balance for the month');
    }

    return consequences;
  };

  const submitChangeRequest = async () => {
    if (!selectedEvent || !changeReason.trim()) return;

    const payload: {
      event_id?: string;
      eventDate?: string;
      requestType: 'swap' | 'modify' | 'cancel';
      reason: string;
      newDate?: string;
      swapEventId?: string;
      swapDate?: string;
    } = {
      requestType: changeType,
      reason: changeReason,
    };

    // Determine Source Identifier (ID or Date)
    if (selectedEvent.id.startsWith('virtual-')) {
       payload.eventDate = selectedEvent.fullDate.toISOString();
    } else {
       payload.event_id = selectedEvent.id;
    }

    if (changeType === 'modify') {
      if (!newDate) {
        toast({
          title: "New date required",
          description: "Select a new date for this modification.",
          variant: "destructive",
        });
        return;
      }
      const newDateObj = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        newDate
      );
      payload.newDate = newDateObj.toISOString();
    }

    if (changeType === 'swap') {
      if (!swapDate) {
        toast({
          title: "Swap date required",
          description: "Select the date you want to swap with.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if target has an existing custody event
      const existingSwapEvent = events.find(e => e.date === swapDate && e.type === 'custody');
      
      if (existingSwapEvent) {
        payload.swapEventId = existingSwapEvent.id;
      } else {
        // Use Date for target (Day Swap)
        const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), swapDate);
        payload.swapDate = dateObj.toISOString();
      }
    }

    setIsMaterializing(true);
    try {
      await calendarAPI.createChangeRequest(payload);
      toast({
        title: "Change request submitted",
        description: "We'll notify your co-parent to review this request.",
      });
      
      await Promise.all([loadEvents(), loadChangeRequests()]);

      setShowChangeRequest(false);
      setSelectedEvent(null);
      setChangeReason('');
      setSwapDate(null);
      setNewDate(null);
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit change request.",
        variant: "destructive",
      });
    } finally {
       setIsMaterializing(false);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    setShowDayOptions(true);
  };

  const handleSwapFromDayOptions = async () => {
    if (!selectedDay) return;
    
    const day = selectedDay.getDate();
    const existingEvent = events.find(e => e.date === day && e.type === 'custody');
    
    if (existingEvent) {
      setSelectedEvent(existingEvent);
      setShowDayOptions(false);
      setChangeType('swap');
      setShowChangeRequest(true);
    } else {
      // Create a VIRTUAL event for the current day (do not save to DB yet)
      const parent = getEffectiveCustodyParent(day);
      const title = `${parent ? getParentDisplayName(parent) : 'Custody'} Day`;
      
      const virtualEvent: CalendarEvent = {
         id: `virtual-${day}`, // Placeholder ID
         date: day,
         fullDate: selectedDay,
         type: 'custody',
         title: title,
         parent: parent || 'both',
         isSwappable: true,
         hasTime: false
      };
      
      setSelectedEvent(virtualEvent);
      setShowDayOptions(false);
      setChangeType('swap');
      setShowChangeRequest(true);
    }
  };

  const handleRequestResponse = async (requestId: string, response: 'approved' | 'rejected') => {
    const existingRequest = changeRequests.find(r => r.id === requestId);
    if (!existingRequest) return;

    try {
      await calendarAPI.updateChangeRequest(requestId, response);

      if (response === 'approved') {
        const approvedRequest: ChangeRequest = {
          ...existingRequest,
          status: 'approved',
          approvedBy: getParentRoleForEmail(currentUser?.email),
          approvedAt: new Date(),
        };
        // Update consequences with dynamic logic for the email, using explicit names
        approvedRequest.consequences = getDynamicConsequences(approvedRequest, true);
        
        const email = generateApprovalEmail(approvedRequest);
        setGeneratedEmail(email);
        setEmailHistory(prev => [email, ...prev]);
        setShowEmailPreview(true);
        toast({
          title: "Request approved",
          description: "The calendar has been updated.",
        });
      } else {
        setDeclinedRequest(existingRequest);
        const alternatives = generateBridgetteAlternatives(existingRequest);
        setBridgetteAlternatives(alternatives);
        setShowBridgetteAlternatives(true);
        toast({
          title: "Request rejected",
          description: "Consider sharing an alternative solution.",
        });
      }

      await Promise.all([loadEvents(), loadChangeRequests()]);
    } catch (error) {
      console.error('Error updating change request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update change request.",
        variant: "destructive",
      });
    }
  };

  const handleAlternativeAction = (alternative: BridgetteAlternative) => {
    // In a real app, this would implement the specific alternative action
    console.log('Implementing alternative:', alternative);
    
    // For demo purposes, we'll just close the dialog and show a success message
    setShowBridgetteAlternatives(false);
    
    // You could implement specific logic for each alternative type here
    switch (alternative.type) {
      case 'partial-swap':
        // Implement partial swap logic
        break;
      case 'different-date':
        // Implement different date suggestion
        break;
      case 'makeup-time':
        // Implement makeup time calculation
        break;
      case 'split-event':
        // Implement joint attendance suggestion
        break;
      case 'communication-help':
        // Open communication helper
        break;
    }
  };

  const handleDownloadPdf = () => {
    const emailContentElement = document.getElementById('email-content-for-pdf');
    if (emailContentElement) {
      // Temporarily modify styles for full capture
      const originalHeight = emailContentElement.style.height;
      const originalMaxHeight = emailContentElement.style.maxHeight;
      const originalOverflow = emailContentElement.style.overflow;
      emailContentElement.style.height = 'auto';
      emailContentElement.style.maxHeight = 'none';
      emailContentElement.style.overflow = 'visible';

      html2canvas(emailContentElement, {
        scrollY: -window.scrollY,
        useCORS: true,
      }).then(canvas => {
        // Restore original styles
        emailContentElement.style.height = originalHeight;
        emailContentElement.style.maxHeight = originalMaxHeight;
        emailContentElement.style.overflow = originalOverflow;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const scaledHeight = canvasHeight / ratio;

        if (scaledHeight > pdfHeight) {
          let y = 0;
          let remainingHeight = canvasHeight;
          while (remainingHeight > 0) {
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvasWidth;
            pageCanvas.height = pdfHeight * ratio;
            const pageCtx = pageCanvas.getContext('2d');
            if (pageCtx) {
              pageCtx.drawImage(canvas, 0, y, canvasWidth, pdfHeight * ratio, 0, 0, canvasWidth, pdfHeight * ratio);
              const pageImgData = pageCanvas.toDataURL('image/png');
              pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              remainingHeight -= pdfHeight * ratio;
              y += pdfHeight * ratio;
              if (remainingHeight > 0) {
                pdf.addPage();
              }
            }
          }
        } else {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight);
        }
        
        pdf.save('schedule-change-documentation.pdf');
      });
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const greetingName =
    currentUser?.firstName ||
    familyProfile?.parent1?.firstName ||
    'there';

  return (
    <div className="space-y-6">
      {/* Loading Banner */}
      {(isLoadingEvents || isLoadingRequests || isLoadingCustody) && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Syncing calendar data...
          </AlertDescription>
        </Alert>
      )}

      {/* Email History Alert */}
      {emailHistory.length > 0 && (
        <Alert className="border-[hsl(160,80%,80%)] bg-[hsl(160,80%,95%)]">
          <Mail className="h-4 w-4 text-[hsl(160,80%,50%)]" />
          <AlertDescription className="text-green-800">
            {emailHistory.length} automated documentation email{emailHistory.length > 1 ? 's' : ''} sent to both parents.
            <Button 
              variant="link" 
              className="p-0 ml-2 text-[hsl(160,80%,50%)] underline"
              onClick={() => setShowEmailPreview(true)}
            >
              View latest email
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Requests Alert */}
      {pendingRequestsCount > 0 && (
        <Alert className="border-[hsl(45,100%,80%)] bg-[hsl(45,100%,95%)]">
          <AlertTriangle className="h-4 w-4 text-[hsl(45,100%,50%)]" />
          <AlertDescription className="text-orange-800">
            You have {pendingRequestsCount} pending schedule change request{pendingRequestsCount > 1 ? 's' : ''} that need{pendingRequestsCount === 1 ? 's' : ''} your response.
            <Button 
              variant="link" 
              className="p-0 ml-2 text-[hsl(45,100%,50%)] underline"
              onClick={() => setShowPendingRequests(true)}
            >
              Review now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* Calendar Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <p className="text-gray-500">Shared Family Calendar</p>
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Times shown in {selectedTimeZoneLabel}
            </p>
          </div>

          <div className="flex flex-col w-full gap-3 lg:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <Select value={selectedTimeZone} onValueChange={setSelectedTimeZone}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  {US_TIME_ZONES.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Checkboxes */}
            <div className="flex flex-wrap items-center justify-end gap-4 px-2 py-2 bg-gray-50 rounded-lg">
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => openCreateEventModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
              {pendingRequestsCount > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-[hsl(45,100%,70%)] text-[hsl(45,100%,50%)] hover:bg-[hsl(45,100%,95%)]"
                  onClick={() => setShowPendingRequests(true)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Requests ({pendingRequestsCount})
                </Button>
              )}
              {emailHistory.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-[hsl(160,80%,70%)] text-[hsl(160,80%,50%)] hover:bg-[hsl(160,80%,95%)]"
                  onClick={() => setShowEmailPreview(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Emails ({emailHistory.length})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1.5 sm:py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
          {getDaysInMonth().map((day, index) => {
            if (day === null) {
              return <div key={index} className="min-h-[80px] sm:min-h-[120px]"></div>;
            }

            const dayEvents = getEventsForDay(day);
            const pendingRequests = getPendingRequestsForDay(day);
            const isToday = day === today && currentMonth.getMonth() === new Date().getMonth();
            const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayKey = getDayKey(dayDate);
            const dayExpensesForDate = expensesByDay[dayKey] || [];
            const dayDocumentsForDate = documentsByDay[dayKey] || [];
            
            // Determine custody parent based on agreement schedule
            const custodyParent = getCustodyParentForDay(day);
            
            // Check if there's a custody event for this day that overrides the schedule
            const custodyEvent = dayEvents.find(e => e.type === 'custody');
            const effectiveCustodyParent = custodyEvent?.parent || custodyParent;

            // Calculate total items to show (max 3 items per day)
            const maxItemsToShow = 3;
            const allItems: Array<{ type: 'event' | 'expense' | 'document'; data: CalendarEvent | DayExpense | DayDocument; id: string }> = [];
            
            // Add events first (priority)
            const eventsToShow = Math.min(dayEvents.length, maxItemsToShow);
            dayEvents.slice(0, eventsToShow).forEach(event => {
              allItems.push({ type: 'event', data: event, id: event.id });
            });
            
            // Add documents if enabled and we have space
            
            // Calculate remaining items
            const shownEvents = Math.min(dayEvents.length, maxItemsToShow);
            const shownExpenses = 0;
            const shownDocuments = 0;
            
            const remainingEvents = Math.max(0, dayEvents.length - shownEvents);
            const remainingExpenses = 0;
            const remainingDocuments = 0;
            const totalRemaining = remainingEvents;

            // Determine background color based on custody parent from agreement
            let dayBackgroundClass = 'border-gray-200';
            if (effectiveCustodyParent && (familyProfile?.custodyArrangement === '50-50' || familyProfile?.custodyArrangement === 'primary-secondary' || custodyAgreement)) {
              if (effectiveCustodyParent === 'mom') {
                dayBackgroundClass = 'bg-[hsl(214,100%,98%)] border-[hsl(214,100%,70%)]'; // Light blue for Parent 1 (#002f6c)
              } else if (effectiveCustodyParent === 'dad') {
                dayBackgroundClass = 'bg-[hsl(47,100%,98%)] border-[hsl(47,100%,70%)]'; // Light yellow for Parent 2 (#ffc800)
              } else if (effectiveCustodyParent === 'both') {
                dayBackgroundClass = 'bg-[hsl(160,80%,98%)] border-[hsl(160,80%,70%)]'; // Light teal for both
              }
            }
            
            // Override with today's highlight if applicable
            if (isToday) {
              dayBackgroundClass = 'bg-[hsl(214,100%,95%)] border-[hsl(214,100%,80%)]';
            }

            return (
              <div
                key={day}
                className={`min-h-[85px] sm:min-h-[120px] p-1.5 sm:p-2 border border-gray-200 sm:border-gray-300 rounded-md sm:rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer flex flex-col ${dayBackgroundClass} ${
                  pendingRequests.length > 0 ? 'ring-2 ring-[hsl(45,100%,80%)]' : ''
                } ${isToday ? 'ring-2 ring-[hsl(217,92%,39%)] shadow-md' : ''}`}
                onClick={() =>
                  handleDayClick(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  )
                }
              >
                <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-1.5 flex items-center justify-between flex-shrink-0 ${
                  isToday ? 'text-[hsl(217,92%,39%)]' : 'text-gray-700'
                }`}>
                  <span className="flex items-center gap-1">
                    <span className={`${isToday ? 'bg-[hsl(217,92%,39%)] text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold' : ''}`}>
                      {day}
                    </span>
                    {isToday && <span className="text-[10px] sm:text-xs font-normal text-[hsl(217,92%,39%)] hidden sm:inline">Today</span>}
                  </span>
                  {pendingRequests.length > 0 && (
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden space-y-1 min-h-0">
                  {allItems.map((item) => {
                    if (item.type === 'event') {
                      const event = item.data as CalendarEvent;
                      // Hide system-generated Custody Day events from the list
                      // They are only for background color logic
                      if (event.type === 'custody' && event.title === 'Custody Day') {
                        return null;
                      }
                      
                      return (
                        <div
                          key={item.id}
                          onClick={(eventObj) => {
                            eventObj.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md border ${eventColors[event.type]} truncate cursor-pointer hover:opacity-90 hover:shadow-sm transition-all ${
                            pendingRequests.some(r => r.originalEvent.id === event.id) ? 'ring-1 ring-orange-300' : ''
                          }`}
                          title={event.title}
                        >
                          <span className="truncate block font-medium">{event.title}</span>
                          {event.hasTime && (
                            <span className="text-[9px] sm:text-[10px] opacity-75 block truncate mt-0.5">
                              {formatTimeOnly(event.fullDate)}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {totalRemaining > 0 && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="text-[9px] sm:text-[10px] text-gray-500 px-1.5 sm:px-2 py-1 font-medium bg-gray-100 rounded-md"
                      title={`${remainingEvents} events`}
                    >
                      +{totalRemaining} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {/* Legend */}
        <div className="mt-6 space-y-3">
          {/* Custody Schedule Legend */}
          {custodyAgreement?.custodySchedule ? (
            <div className="p-3 sm:p-4 bg-bridge-blue/5 rounded-lg border-2 border-bridge-blue/20">
              <div className="font-bold text-gray-800 text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-blue-600">📅</span>
                <span>Custody Schedule:</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {custodyAgreement.custodySchedule.toLowerCase().includes('2-2-3') || custodyAgreement.custodySchedule.toLowerCase().includes('two-two-three') 
                    ? '2-2-3 Schedule'
                    : custodyAgreement.custodySchedule.toLowerCase().includes('week-on') || custodyAgreement.custodySchedule.toLowerCase().includes('week off') || custodyAgreement.custodySchedule.toLowerCase().includes('alternat')
                    ? 'Week-on/Week-off'
                    : custodyAgreement.custodySchedule.toLowerCase().includes('custom')
                    ? 'Custom Schedule'
                    : custodyAgreement.custodySchedule}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2 sm:mb-3">
                {custodyAgreement.custodySchedule.toLowerCase().includes('2-2-3')
                  ? `2 days ${getParentDisplayName('mom')} → 2 days ${getParentDisplayName('dad')} → 3 days ${getParentDisplayName('mom')}, then alternates (14-day cycle)`
                  : custodyAgreement.custodySchedule.toLowerCase().includes('week-on') || custodyAgreement.custodySchedule.toLowerCase().includes('alternat')
                  ? `${getParentDisplayName('mom')} and ${getParentDisplayName('dad')} alternate full weeks with the children`
                  : 'Schedule based on your custody agreement'}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-[hsl(214,100%,96%)] border-2 border-[hsl(214,100%,21%)] rounded mr-1.5 sm:mr-2"></div>
                  <span className="font-medium">{getParentDisplayName('mom')} Days</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-[hsl(47,100%,96%)] border-2 border-[hsl(47,100%,50%)] rounded mr-1.5 sm:mr-2"></div>
                  <span className="font-medium">{getParentDisplayName('dad')} Days</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-[hsl(160,80%,98%)] border-2 border-[hsl(160,80%,70%)] rounded mr-1.5 sm:mr-2"></div>
                  <span className="font-medium">Both Parents</span>
                </div>
              </div>
            </div>
          ) : (familyProfile?.custodyArrangement === '50-50' || familyProfile?.custodyArrangement === 'primary-secondary') && (
            <div className="p-3 sm:p-4 bg-bridge-yellow/5 rounded-lg border-2 border-bridge-yellow/20">
              <div className="font-bold text-bridge-yellow-dark text-sm sm:text-base mb-2 flex items-center gap-1.5 sm:gap-2">
                <span>⚠️</span>
                <span>No Custody Schedule Configured</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-700 mb-2 sm:mb-3">
                Configure your custody schedule to see color-coded days on the calendar showing which parent has custody.
              </p>
              <button
                onClick={() => navigate('/settings', { state: { activeTab: 'family' } })}
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                📝 Configure Custody Schedule in Settings
              </button>
            </div>
          )}
          
          {/* Event Type Legend */}
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[hsl(217,92%,80%)] rounded mr-2"></div>
              <span>Custody Events</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[hsl(160,80%,80%)] rounded mr-2"></div>
              <span>School Events</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[hsl(340,100%,80%)] rounded mr-2"></div>
              <span>Medical</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[hsl(45,100%,80%)] rounded mr-2"></div>
              <span>Holidays</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[hsl(30,100%,80%)] rounded mr-2"></div>
              <span>Activities</span>
            </div>
            <div className="flex items-center">
              <ArrowRightLeft className="w-3 h-3 text-gray-500 mr-2" />
              <span>Swappable</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 text-orange-500 mr-2" />
              <span>Pending Changes</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-3 h-3 text-green-500 mr-2" />
              <span>Email Sent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Event Dialog */}
      <Dialog open={showCreateEvent} onOpenChange={(open) => {
        setShowCreateEvent(open);
        if (!open) {
          setEditingEvent(null);
          setIsEditingMode(false);
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{isEditingMode ? 'Edit Calendar Event' : 'Add Calendar Event'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3 sm:space-y-4" onSubmit={handleCreateEventSubmit}>
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Title</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="e.g., Mom's Weekend"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <Input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Time (optional)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <Input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={newEventType}
                  onValueChange={(value) =>
                    setNewEventType(value as CalendarEvent["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custody">Custody</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parent responsible</Label>
              <Select
                value={newEventParent}
                onValueChange={(value) =>
                  setNewEventParent(value as "mom" | "dad" | "both")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    // Check custody for the selected date
                    const dateForCheck = newEventDate ? new Date(newEventDate) : new Date();
                    const custodyForDate = getCustodyParentForDate(dateForCheck);
                    
                    return (
                      <>
                        <SelectItem
                          value="mom"
                          disabled={custodyForDate === 'dad'}
                          className={custodyForDate === 'dad' ? 'text-gray-400' : ''}
                        >
                          {getParentDisplayName("mom")} {custodyForDate === 'dad' && '(Not Custodial)'}
                        </SelectItem>
                        <SelectItem
                          value="dad"
                          disabled={custodyForDate === 'mom'}
                          className={custodyForDate === 'mom' ? 'text-gray-400' : ''}
                        >
                          {getParentDisplayName("dad")} {custodyForDate === 'mom' && '(Not Custodial)'}
                        </SelectItem>
                        <SelectItem value="both">Both parents</SelectItem>
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <Label className="text-base">Allow schedule swaps</Label>
                <p className="text-sm text-gray-500">
                  Enable change requests for this event.
                </p>
              </div>
              <Switch
                checked={newEventSwappable}
                onCheckedChange={setNewEventSwappable}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateEvent(false)}
                disabled={creatingEvent}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingEvent} className="w-full sm:w-auto text-sm sm:text-base">
                {creatingEvent 
                  ? (isEditingMode ? "Updating..." : "Creating...") 
                  : (isEditingMode ? "Update Event" : "Create Event")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Event Details</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-3 sm:space-y-4">
              {/* Event Title and Type */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {selectedEvent.title}
                  </h3>
                  <Badge className={eventColors[selectedEvent.type]}>
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Date and Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    <strong>Date:</strong> {monthNames[currentMonth.getMonth()]} {selectedEvent.date}, {currentMonth.getFullYear()}
                  </span>
                </div>
                {selectedEvent.hasTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <strong>Time:</strong> {formatTimeOnly(selectedEvent.fullDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    <strong>Timezone:</strong> {selectedTimeZoneLabel}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Parent Information */}
              {selectedEvent.parent && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <strong>Responsible Parent:</strong>{' '}
                      {selectedEvent.parent === 'both'
                        ? 'Both parents'
                        : getParentDisplayName(selectedEvent.parent)}
                    </span>
                  </div>
                </div>
              )}

              {/* Swappable Status */}
              <div className="flex items-center gap-2 text-sm">
                {selectedEvent.isSwappable ? (
                  <>
                    <ArrowRightLeft className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">
                      This event can be swapped or modified
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">
                      This event cannot be modified
                    </span>
                  </>
                )}
              </div>

              {/* Pending Requests for this event */}
              {(() => {
                const pendingRequestsForEvent = changeRequests.filter(
                  r => r.originalEvent.id === selectedEvent.id && r.status === 'pending'
                );
                
                if (pendingRequestsForEvent.length > 0) {
                  return (
                    <div className="space-y-3">
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          Pending Change Requests ({pendingRequestsForEvent.length})
                        </h4>
                        {pendingRequestsForEvent.map((request) => {
                          // Check if current user is the requester
                          // Only the non-requester can approve/reject change requests
                          const currentUserEmail = currentUser?.email?.toLowerCase()?.trim();
                          const requesterEmail = request.requestedByEmail?.toLowerCase()?.trim();
                          const isCurrentUserRequester = currentUserEmail === requesterEmail;
                          const canApproveReject = !isCurrentUserRequester && !!currentUserEmail;
                          
                          return (
                            <Card key={request.id} className="border-orange-200 bg-orange-50">
                              <CardContent className="p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-800">
                                      {request.requestedBy === 'mom' ? 'You' : 'Your co-parent'} wants to {request.type} this event
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">
                                    {request.type}
                                  </Badge>
                                </div>
                                
                                <div className="bg-white rounded p-2 text-sm">
                                  <p className="font-medium text-gray-700 mb-1">Reason:</p>
                                  <p className="text-gray-600 text-xs">{request.reason}</p>
                                </div>

                                {request.consequences.length > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                    <p className="text-xs font-medium text-yellow-800 mb-1">What will change:</p>
                                    <ul className="text-xs text-yellow-700 space-y-0.5">
                                      {request.consequences.map((consequence, idx) => (
                                        <li key={idx} className="flex items-start">
                                          <span className="mr-1">•</span>
                                          <span>{consequence}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {canApproveReject ? (
                                  // Show Approve/Reject buttons if current user is NOT the requester
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await handleRequestResponse(request.id, 'approved');
                                          setShowEventDetails(false);
                                        } catch (error) {
                                          console.error('Error approving request:', error);
                                        }
                                      }}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          await handleRequestResponse(request.id, 'rejected');
                                          setShowEventDetails(false);
                                        } catch (error) {
                                          console.error('Error rejecting request:', error);
                                        }
                                      }}
                                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : isCurrentUserRequester ? (
                                  // Show Cancel button if current user is the requester
                                  <div className="space-y-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                      <p className="text-xs text-blue-800 text-center mb-2">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        Waiting for {isEventCreator(selectedEvent) ? 'the other parent' : 'event creator'} to respond
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          await handleRequestResponse(request.id, 'rejected');
                                          toast({
                                            title: "Request cancelled",
                                            description: "Your change request has been cancelled.",
                                          });
                                          setShowEventDetails(false);
                                        } catch (error) {
                                          console.error('Error cancelling request:', error);
                                        }
                                      }}
                                      className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Cancel Request
                                    </Button>
                                  </div>
                                ) : (
                                  // Fallback: show status
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                    <p className="text-xs text-blue-800 text-center">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      Waiting for response
                                    </p>
                                  </div>
                                )}

                                <p className="text-xs text-gray-500 text-center">
                                  Requested {formatDateTime(request.timestamp)}
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Actions */}
              <Separator />
              <div className="flex gap-2 pt-2">
                {isEventCreator(selectedEvent) ? (
                  // Creator can edit/delete directly
                  <div className="flex-1 flex gap-2">
                    <Button
                      onClick={() => openEditEventModal(selectedEvent)}
                      className="flex-1"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setEventToDelete(selectedEvent);
                        setDeleteConfirmationOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  // Other parent can request change (for any event)
                  <Button
                    onClick={handleRequestChangeFromDetails}
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Request Change
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowEventDetails(false)}
                  className={isEventCreator(selectedEvent) || selectedEvent.isSwappable ? '' : 'flex-1'}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event "{eventToDelete?.title}" from the calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (eventToDelete) {
                  try {
                    await calendarAPI.deleteEvent(eventToDelete.id);
                    toast({
                      title: "Event deleted",
                      description: "The event has been removed from the calendar.",
                    });
                    await loadEvents();
                    setShowEventDetails(false);
                  } catch (error) {
                    console.error("Error deleting event:", error);
                    toast({
                      title: "Error",
                      description: "Failed to delete event.",
                      variant: "destructive",
                    });
                  } finally {
                    setDeleteConfirmationOpen(false);
                    setEventToDelete(null);
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Request Dialog */}
      <Dialog open={showChangeRequest} onOpenChange={setShowChangeRequest}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Request Schedule Change</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              {/* Current Event Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Current Event</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={eventColors[selectedEvent.type]}>
                    {selectedEvent.title}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {monthNames[currentMonth.getMonth()]} {selectedEvent.date}
                    {selectedEvent.hasTime && (
                      <span className="ml-2 text-xs text-gray-500">
                        {formatTimeOnly(selectedEvent.fullDate)}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Change Type Selection */}
              <div>
                <Label className="text-base font-medium">What would you like to do?</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <Button
                    variant={changeType === 'swap' ? 'default' : 'outline'}
                    onClick={() => setChangeType('swap')}
                    className="h-auto p-3 flex flex-col items-center"
                  >
                    <ArrowRightLeft className="w-5 h-5 mb-1" />
                    <span className="text-sm">Swap Dates</span>
                  </Button>
                  <Button
                    variant={changeType === 'modify' ? 'default' : 'outline'}
                    onClick={() => setChangeType('modify')}
                    className="h-auto p-3 flex flex-col items-center"
                  >
                    <Edit3 className="w-5 h-5 mb-1" />
                    <span className="text-sm">Move Date</span>
                  </Button>
                  <Button
                    variant={changeType === 'cancel' ? 'default' : 'outline'}
                    onClick={() => setChangeType('cancel')}
                    className="h-auto p-3 flex flex-col items-center"
                  >
                    <XCircle className="w-5 h-5 mb-1" />
                    <span className="text-sm">Cancel Event</span>
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              {changeType === 'swap' && (
                <div>
                  <Label>Swap with which date?</Label>
                  <div className="grid grid-cols-7 gap-1 mt-2 p-3 border rounded-lg">
                    {getDaysInMonth().map((day, index) => {
                      if (day === null) return <div key={index}></div>;
                      
                      // Check if the target day belongs to the same parent as the source event
                      // If so, swapping is meaningless (you already have custody).
                      const targetParent = getEffectiveCustodyParent(day);
                      const sourceParent = selectedEvent.parent;
                      
                      const isSameParent = targetParent && sourceParent &&
                                          targetParent === sourceParent &&
                                          targetParent !== 'both';

                      const canSwap = day !== selectedEvent.date && !isSameParent;
                      
                      let title = "";
                      if (day === selectedEvent.date) title = "Cannot swap with same date";
                      else if (isSameParent) title = "You already have custody on this day";
                      else title = "Select to swap";

                      return (
                        <button
                          key={day}
                          onClick={() => canSwap && setSwapDate(day)}
                          disabled={!canSwap}
                          className={`h-8 text-xs rounded ${
                            swapDate === day ? 'bg-[hsl(217,92%,39%)] text-white' :
                            canSwap ? 'bg-green-100 hover:bg-green-200 text-green-800' :
                            'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          title={title}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a date belonging to the other parent to swap with.
                  </p>
                </div>
              )}

              {changeType === 'modify' && (
                <div>
                  <Label>Move to which date?</Label>
                  <div className="grid grid-cols-7 gap-1 mt-2 p-3 border rounded-lg">
                    {getDaysInMonth().map((day, index) => {
                      if (day === null) return <div key={index}></div>;
                      
                      const dayEvents = getEventsForDay(day);
                      const hasConflict = dayEvents.length > 0;
                      const canMove = day !== selectedEvent.date;
                      
                      return (
                        <button
                          key={day}
                          onClick={() => canMove && setNewDate(day)}
                          disabled={!canMove}
                          className={`h-8 text-xs rounded ${
                            newDate === day ? 'bg-[hsl(217,92%,39%)] text-white' : 
                            hasConflict ? 'bg-red-100 hover:bg-red-200 text-red-800' :
                            canMove ? 'bg-gray-100 hover:bg-gray-200' : 
                            'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Red dates have existing events (conflicts possible)
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <Label htmlFor="reason">Reason for change *</Label>
                <Textarea
                  id="reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Please explain why you need this change..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Consequences Preview */}
              {(changeType === 'swap' && swapDate) || (changeType === 'modify' && newDate) || changeType === 'cancel' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <h3 className="font-medium text-yellow-800">Consequences of This Change</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {calculateConsequences().map((consequence, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{consequence}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      📧 <strong>Automatic Documentation:</strong> If approved, both parents will receive an official email documenting this change and its impact on your custody agreement.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex space-x-3">
                <Button 
                  onClick={submitChangeRequest}
                  disabled={!changeReason.trim() || 
                    (changeType === 'swap' && !swapDate) || 
                    (changeType === 'modify' && !newDate)}
                  className="flex-1"
                >
                  Send Request to Co-Parent
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowChangeRequest(false)}
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Your co-parent will receive this request and must approve it before any changes take effect.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog open={showPendingRequests} onOpenChange={setShowPendingRequests}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Pending Schedule Change Requests</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoadingRequests ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
                <p className="text-gray-500">Loading change requests...</p>
              </div>
            ) : changeRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-700 font-medium mb-2">No Pending Requests</p>
                <p className="text-gray-500 text-sm">
                  All change requests have been resolved, or no requests have been made yet.
                </p>
              </div>
            ) : (
              changeRequests.filter(r => r.status === 'pending').map((request) => {
              // Check if current user is the requester
              const currentUserEmail = currentUser?.email?.toLowerCase()?.trim();
              const requesterEmail = request.requestedByEmail?.toLowerCase()?.trim();
              const isCurrentUserRequester = currentUserEmail === requesterEmail;
              const canApproveReject = !isCurrentUserRequester && !!currentUserEmail;
              
              return (
                <Card key={request.id} className="border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600" />
                        {isCurrentUserRequester ? 'You want' : 'Your co-parent wants'} to {request.type} a date
                      </CardTitle>
                      <Badge variant="outline" className="border-orange-300 text-orange-600">
                        {request.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-800 mb-1">Reason:</p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        What will change:
                      </h4>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {getDynamicConsequences(request).map((consequence, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{consequence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {canApproveReject && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          If you approve this change:
                        </h4>
                        <p className="text-sm text-blue-700">
                          Both parents will automatically receive an official email documenting the change, 
                          its impact on your custody agreement, and confirmation of mutual approval.
                        </p>
                      </div>
                    )}

                    {canApproveReject ? (
                      // Show Approve/Reject buttons if current user is NOT the requester
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => handleRequestResponse(request.id, 'approved')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Change
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleRequestResponse(request.id, 'rejected')}
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    ) : (
                      // Show Cancel button if current user is the requester
                      <div className="space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm text-blue-800 text-center">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Waiting for your co-parent to respond to your request
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              await handleRequestResponse(request.id, 'rejected');
                              toast({
                                title: "Request cancelled",
                                description: "Your change request has been cancelled.",
                              });
                            } catch (error) {
                              console.error('Error cancelling request:', error);
                            }
                          }}
                          className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel My Request
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 text-center">
                      Requested {formatDateTime(request.timestamp)}
                    </p>
                  </CardContent>
                </Card>
              );
            })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bridgette Alternatives Dialog */}
      <Dialog open={showBridgetteAlternatives} onOpenChange={setShowBridgetteAlternatives}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Bridge-it's Alternative Solutions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Bridgette Introduction */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <BridgetteAvatar size="lg" expression="encouraging" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      I understand this request didn't work for you! 💙
                    </p>
                    <p className="text-xs text-gray-600">
                      Let me suggest some alternatives that might have less impact on your custody agreement and family routine. 
                      These options are designed to help both parents while minimizing conflicts! ✨
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Original Request Context */}
            {declinedRequest && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-800">
                    Original Request (Declined)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-orange-700">
                    <p><strong>Type:</strong> {declinedRequest.type}</p>
                    <p><strong>Requested by:</strong> {declinedRequest.requestedBy === 'mom' ? 'You' : 'Your co-parent'}</p>
                    <p><strong>Reason:</strong> {declinedRequest.reason}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alternative Solutions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Alternative Solutions
              </h3>
              
              {bridgetteAlternatives.map((alternative, index) => (
                <Card key={alternative.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-800">{alternative.title}</h4>
                          <Badge className={impactColors[alternative.impact]}>
                            {alternative.impact} impact
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{alternative.description}</p>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-blue-800 text-sm font-medium">Why this works:</p>
                          <p className="text-blue-700 text-sm">{alternative.suggestion}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleAlternativeAction(alternative)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        {alternative.actionText}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onNavigateToMessages) {
                            onNavigateToMessages();
                          }
                          setShowBridgetteAlternatives(false);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Discuss with Co-Parent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skip Options */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Not interested in alternatives?</h4>
                    <p className="text-sm text-gray-600">That's okay! You can skip these suggestions and handle this your own way.</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowBridgetteAlternatives(false)}
                    className="flex items-center"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip Suggestions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bridgette Encouragement */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <BridgetteAvatar size="md" expression="encouraging" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Remember, great co-parenting is about finding solutions that work for everyone! 🌟
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      I'm always here to help you navigate these situations with fairness and balance in mind.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <Mail className="w-5 h-5 mr-2 text-green-600" />
              Automated Documentation Email
            </DialogTitle>
          </DialogHeader>
          
          {generatedEmail && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">📧 Email Details</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>To:</strong> {generatedEmail.to.join(', ')}</p>
                  <p><strong>Subject:</strong> {generatedEmail.subject}</p>
                  <p><strong>Sent:</strong> {formatDateTime(generatedEmail.timestamp)}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-medium text-gray-800 mb-3">Email Content Preview:</h3>
                <div
                  id="email-content-for-pdf"
                  className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: generatedEmail.content }}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEmailPreview(false)}>
                  Close
                </Button>
                <Button onClick={handleDownloadPdf}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Day Options Dialog */}
      <Dialog open={showDayOptions} onOpenChange={setShowDayOptions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? `${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()}` : 'Date Options'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             {selectedDay && (() => {
                const day = selectedDay.getDate();
                const parent = getEffectiveCustodyParent(day);
                const hasEvent = events.some(e => e.date === day);
                return (
                   <div className="text-sm text-gray-600 mb-2">
                      <p><strong>Custody:</strong> {parent ? getParentDisplayName(parent) : 'Not assigned'}</p>
                   </div>
                );
             })()}
            <Button
              onClick={() => {
                if (selectedDay) {
                   handleSwapFromDayOptions();
                }
              }}
              disabled={isMaterializing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isMaterializing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
              Request Custody Swap
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDayOptions(false);
                if (selectedDay) openCreateEventModal(selectedDay);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Specific Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView;