import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  ArrowRightLeft,
  Clock,
  Calendar as CalendarIcon,
  User,
  Mail,
  FileText,
  AlertTriangle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { calendarAPI, familyAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  CalendarEvent,
  DayExpense,
  DayDocument,
  ChangeRequest,
  BridgetteAlternative,
  EmailNotification,
  CalendarViewProps
} from '@/types/calendar';
import {
  US_TIME_ZONES,
  eventColors,
  formatDateInputValue,
  parseApiDate,
  formatTimeOnly,
  generateBridgetteAlternatives,
  getParentDisplayName,
  getParentEmailAddress,
  formatDateTime
} from '@/utils/calendarUtils';
import { generateApprovalEmail } from '@/utils/emailTemplates';

// Extracted Modals
import EventDetailsDialog from './calendar/modals/EventDetailsDialog';
import PendingRequestsDialog from './calendar/modals/PendingRequestsDialog';
import BridgetteAlternativesDialog from './calendar/modals/BridgetteAlternativesDialog';
import EmailPreviewDialog from './calendar/modals/EmailPreviewDialog';
import DeleteConfirmationDialog from './calendar/modals/DeleteConfirmationDialog';
import DayOptionsDialog from './calendar/modals/DayOptionsDialog';

const CalendarView: React.FC<CalendarViewProps> = ({
  familyProfile,
  currentUser,
  onNavigateToMessages,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  // Use a simple object state for year/month to avoid Date object mutation/rollover issues
  const [viewState, setViewState] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Derive the Date object from stable state
  // We use 12:00 PM to ensure we're safely in the middle of the day for any timezone/DST logic
  // This Date object is primarily for API calls and passing to children
  const currentMonth = useMemo(() => {
    return new Date(viewState.year, viewState.month, 1, 12, 0, 0, 0);
  }, [viewState.year, viewState.month]);
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
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expensesByDay, setExpensesByDay] = useState<Record<string, DayExpense[]>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarTimeZone', selectedTimeZone);
    }
  }, [selectedTimeZone]);

  const selectedTimeZoneLabel =
    US_TIME_ZONES.find((tz) => tz.value === selectedTimeZone)?.label || 'Eastern (ET)';

  const getDayKey = (date: Date) => formatDateInputValue(date);

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
      newDateFull: newDateObj,
      swapWithDate: swapEvent?.date,
      swapWithDateFull: swapEvent?.fullDate,
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

  // Load events immediately
  useEffect(() => {
    const loadAllData = async () => {
      await loadEvents();
    };
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  // Auto-update parent in create modal when date changes
  useEffect(() => {
    if (showCreateEvent && !isEditingMode && newEventDate) {
      const effectiveParent = getEffectiveParentForDate(newEventDate);
      if (effectiveParent) {
        setNewEventParent(effectiveParent);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEventDate, showCreateEvent, isEditingMode]);

  useEffect(() => {
    loadChangeRequests();
  }, [familyProfile]);

  // Listen for WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      const data = lastMessage;
      if (
        data.type === 'refresh_calendar' ||
        data.type === 'calendar_event' ||
        data.type === 'change_request_update'
      ) {
        loadEvents(true);
        loadChangeRequests(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage, currentMonth]);

  const loadEvents = async (background = false) => {
    if (!background) {
        setIsLoadingEvents(true);
        // Clear events only when explicitly navigating (not background refresh)
        // This prevents showing stale events from the previous month while loading
        setEvents([]);
    }
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await calendarAPI.getEvents(year, month);
      
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
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No events')) {
        setEvents([]);
      } else {
        console.error('Error loading events:', error);
        if (!background) setEvents([]);
      }
    } finally {
      if (!background) setIsLoadingEvents(false);
    }
  };

  const loadChangeRequests = async (background = false) => {
    if (!background) {
        setIsLoadingRequests(true);
        setChangeRequests([]); // Clear requests on navigation to avoid stale data
    }
    try {
      const response = await calendarAPI.getChangeRequests();
      const mapped: ChangeRequest[] = response.map((req: any) =>
        mapChangeRequestFromApi(req)
      );
      setChangeRequests(mapped);
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No change requests')) {
        setChangeRequests([]);
      } else {
        console.error('Error loading change requests:', error);
        if (!background) setChangeRequests([]);
      }
    } finally {
      if (!background) setIsLoadingRequests(false);
    }
  };

  // Get pending requests count
  const pendingRequestsCount = changeRequests.filter(r => r.status === 'pending').length;

  const getDaysInMonth = () => {
    // Calculate strictly from viewState to avoid any Date object ambiguity
    const { year, month } = viewState;
    
    // Use noon to avoid DST/timezone midnight anomalies
    const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => event.date === day);
  };

  const getPendingRequestsForDay = (day: number) => {
    const isSameMonth = (date: Date) =>
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear();

    return changeRequests.filter(req => {
      if (req.status !== 'pending') return false;

      const matchesOriginal = isSameMonth(req.originalEvent.fullDate) && req.originalEvent.date === day;
      const matchesNew = req.newDateFull && isSameMonth(req.newDateFull) && req.newDateFull.getDate() === day;
      const matchesSwap = req.swapWithDateFull && isSameMonth(req.swapWithDateFull) && req.swapWithDateFull.getDate() === day;

      return matchesOriginal || matchesNew || matchesSwap;
    });
  };

  useEffect(() => {
    const loadCustodyAgreement = async () => {
      if (!familyProfile) return;
      
      setIsLoadingCustody(true);
      try {
        const agreement = await familyAPI.getContract();
        setCustodyAgreement(agreement);
      } catch (error: unknown) {
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
      const dayInCycle = ((daysSinceReference % 14) + 14) % 14;
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

  const getEffectiveCustodyParent = (day: number): 'mom' | 'dad' | 'both' | null => {
    const overrideEvent = events.find(e => e.date === day && e.type === 'custody');
    if (overrideEvent && overrideEvent.parent) {
      return overrideEvent.parent;
    }
    return getCustodyParentForDay(day);
  };

  const getEffectiveParentForDate = (dateInput: Date | string): 'mom' | 'dad' | 'both' | null => {
    let dateObj: Date;
    let dateString: string;

    if (dateInput instanceof Date) {
      dateObj = dateInput;
      dateString = formatDateInputValue(dateInput);
    } else {
      dateString = dateInput;
      const parts = dateInput.split('-').map(Number);
      dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    }

    const existingCustodyEvent = events.find(e =>
      formatDateInputValue(e.fullDate) === dateString && e.type === 'custody'
    );

    if (existingCustodyEvent?.parent) {
      return existingCustodyEvent.parent;
    }

    return getCustodyParentForDate(dateObj);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewState(prev => {
      // Create a date object for the 1st of the current view month
      // Use noon to avoid timezone issues
      const current = new Date(prev.year, prev.month, 1, 12, 0, 0, 0);
      
      // Use setMonth to navigate - let JS handle the year rollover automatically
      current.setMonth(current.getMonth() + (direction === 'prev' ? -1 : 1));
      
      return { year: current.getFullYear(), month: current.getMonth() };
    });
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
    
    const effectiveParent = getEffectiveParentForDate(defaultDate);
    setNewEventParent(effectiveParent || "both");
    
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
    setNewEventTime(event.hasTime ? formatTimeOnly(event.fullDate, selectedTimeZone) : '');
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
    await calendarAPI.createEvent({
      date: eventData.date.toISOString(),
      type: eventData.type,
      title: eventData.title,
      parent: eventData.parent,
      isSwappable: eventData.isSwappable,
    });
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
    const isSameMonth = parsedDate.getMonth() === currentMonth.getMonth() &&
                        parsedDate.getFullYear() === currentMonth.getFullYear();
    
    if (isSameMonth) {
      const dayEvents = getEventsForDay(day);
      const isCustodyEvent = newEventType === 'custody';
      
      if (isCustodyEvent) {
        const existingCustody = dayEvents.find(e =>
          e.type === 'custody' &&
          (!isEditingMode || e.id !== editingEvent?.id)
        );
        
        if (existingCustody) {
          toast({
            title: "Schedule Conflict",
            description: `There is already a custody event for ${existingCustody.parent ? getParentDisplayName(existingCustody.parent, familyProfile, currentUser) : 'a parent'} on this date. Please use the Swap feature to change custody.`,
            variant: "destructive"
          });
          return;
        }
      }
    }

    const staticAgreementParent = getCustodyParentForDate(parsedDate);
    const dateKey = parsedDate.toDateString();
    const existingCustodyEvent = events.find(e =>
      e.fullDate.toDateString() === dateKey && e.type === 'custody'
    );

    const effectiveParent = existingCustodyEvent?.parent || staticAgreementParent;
    
    if (effectiveParent && effectiveParent !== 'both') {
        if (newEventParent !== 'both' && newEventParent !== effectiveParent) {
          const effectiveParentName = getParentDisplayName(effectiveParent, familyProfile, currentUser);
          const assignedParentName = getParentDisplayName(newEventParent, familyProfile, currentUser);
          
          toast({
            title: "Responsibility Mismatch",
            description: `This day belongs to ${effectiveParentName} (either by agreement or swap). You cannot unilaterally assign an event to ${assignedParentName}.`,
            variant: "destructive"
          });
          return;
        }
        
        if (newEventParent === 'both') {
            if (newEventType === 'custody') {
              toast({
                title: "Custody Mismatch",
                description: `This is explicitly ${effectiveParent === 'mom' ? "Mom's" : "Dad's"} day. You cannot make it a shared 'Both' custody day manually. Please use Request Swap.`,
                variant: "destructive"
              });
              return;
            }
        }
    }

    setCreatingEvent(true);
    try {
      if (isEditingMode && editingEvent) {
        await calendarAPI.updateEvent(editingEvent.id, {
          date: parsedDate.toISOString(),
          type: newEventType,
          title: newEventTitle.trim(),
          parent: newEventParent,
          isSwappable: newEventSwappable,
        });
        
        setShowCreateEvent(false);
        setEditingEvent(null);
        setIsEditingMode(false);
        
        toast({
          title: "Success!",
          description: "Event updated successfully.",
        });
        
        loadEvents();
      } else {
        await createNewEvent({
          date: parsedDate,
          type: newEventType,
          title: newEventTitle.trim(),
          parent: newEventParent,
          isSwappable: newEventSwappable,
        });
        
        setShowCreateEvent(false);
        
        toast({
          title: "Success!",
          description: "Event created successfully.",
        });
        
        loadEvents();
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
    setShowEventDetails(false);
    setShowChangeRequest(true);
  };

  const calculateConsequences = (): string[] => {
    if (!selectedEvent) return [];

    const tempRequest: ChangeRequest = {
      id: 'temp',
      type: changeType,
      requestedBy: getParentRoleForEmail(currentUser?.email),
      requestedByEmail: currentUser?.email || '',
      originalDate: selectedEvent.date,
      newDate: newDate ?? undefined,
      swapWithDate: swapDate ?? undefined,
      swapEventId: undefined,
      reason: changeReason,
      status: 'pending',
      timestamp: new Date(),
      consequences: [],
      originalEvent: selectedEvent,
      affectedEvents: []
    };

    return getDynamicConsequences(tempRequest);
  };

  const getDynamicConsequences = (request: ChangeRequest, forEmail: boolean = false): string[] => {
    const consequences: string[] = [];
    const { type, originalEvent, newDate, swapWithDate, requestedBy } = request;
    const isCurrentUserRequester = currentUser?.email === request.requestedByEmail;
    const requestedByName = getParentDisplayName(requestedBy, familyProfile, currentUser);
    const otherParentName = getParentDisplayName(requestedBy === 'mom' ? 'dad' : 'mom', familyProfile, currentUser);

    if (type === 'swap' && swapWithDate) {
      let swapEvent = events.find(e => e.date === swapWithDate && e.type === 'custody');
      
      if (!swapEvent) {
         const parent = getEffectiveCustodyParent(swapWithDate);
         const parentName = parent ? getParentDisplayName(parent, familyProfile, currentUser) : 'Other Parent';
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
        
        const isSchoolWeek = (date: number) => {
          const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date).getDay();
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        };
        
        if (isSchoolWeek(swapWithDate) && originalEvent.type === 'custody') {
          consequences.push('⚠️ This change affects school week custody - pickup/dropoff responsibilities will change');
        }
        
        if (Math.abs(swapWithDate - originalEvent.date) > 7) {
          consequences.push('⚠️ This is a significant schedule change - consider impact on Emma\'s routine');
        }

        const eventsOnSwapDate = events.filter(e =>
          e.date === swapWithDate &&
          e.type !== 'custody'
        );
        
        if (eventsOnSwapDate.length > 0) {
          const eventNames = eventsOnSwapDate.map(e => e.title).join(', ');
          let who;
          if (forEmail) {
             who = requestedByName;
          } else {
             who = isCurrentUserRequester ? 'You' : requestedByName;
          }
          consequences.push(`⚠️ This swap includes: ${eventNames}. ${who} will be responsible for these events.`);
        }

        const eventsOnOriginalDate = events.filter(e =>
          e.date === originalEvent.date &&
          e.type !== 'custody' &&
          e.id !== originalEvent.id
        );

        if (eventsOnOriginalDate.length > 0) {
          const eventNames = eventsOnOriginalDate.map(e => e.title).join(', ');
          const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long' });
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
      
      const existingSwapEvent = events.find(e => e.date === swapDate && e.type === 'custody');
      
      if (existingSwapEvent) {
        payload.swapEventId = existingSwapEvent.id;
      } else {
        const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), swapDate);
        payload.swapDate = dateObj.toISOString();
      }
    }

    setIsMaterializing(true);
    try {
      await calendarAPI.createChangeRequest(payload);
      
      setShowChangeRequest(false);
      setSelectedEvent(null);
      setChangeReason('');
      setSwapDate(null);
      setNewDate(null);

      toast({
        title: "Change request submitted",
        description: "We'll notify your co-parent to review this request.",
      });
      
      Promise.all([loadEvents(), loadChangeRequests()]);
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
      const parent = getEffectiveCustodyParent(day);
      const title = `${parent ? getParentDisplayName(parent, familyProfile, currentUser) : 'Custody'} Day`;
      
      const virtualEvent: CalendarEvent = {
         id: `virtual-${day}`,
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
    setProcessingRequestId(`${requestId}:${response}`);
    const existingRequest = changeRequests.find(r => r.id === requestId);
    if (!existingRequest) {
      setProcessingRequestId(null);
      return;
    }

    try {
      await calendarAPI.updateChangeRequest(requestId, response);

      Promise.all([loadEvents(), loadChangeRequests()]);

      if (response === 'approved') {
        const approvedRequest: ChangeRequest = {
          ...existingRequest,
          status: 'approved',
          approvedBy: getParentRoleForEmail(currentUser?.email),
          approvedAt: new Date(),
        };
        approvedRequest.consequences = getDynamicConsequences(approvedRequest, true);
        
        const email = generateApprovalEmail(
          approvedRequest, 
          currentMonth, 
          familyProfile, 
          currentUser, 
          selectedTimeZone
        );
        setGeneratedEmail(email);
        setEmailHistory(prev => [email, ...prev]);
        
        setShowEmailPreview(true);
        toast({
          title: "Request approved",
          description: "The calendar has been updated.",
        });
      } else {
        setDeclinedRequest(existingRequest);
        const alternatives = generateBridgetteAlternatives(existingRequest, currentMonth);
        setBridgetteAlternatives(alternatives);
        
        setShowBridgetteAlternatives(true);
        toast({
          title: "Request rejected",
          description: "Consider sharing an alternative solution.",
        });
      }
    } catch (error) {
      console.error('Error updating change request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update change request.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleAlternativeAction = (alternative: BridgetteAlternative) => {
    setShowBridgetteAlternatives(false);

    // Handle communication-based alternatives
    if (alternative.type === 'communication-help' || alternative.type === 'split-event') {
      if (onNavigateToMessages) {
        toast({
          title: "Opening Messages",
          description: "You can discuss this suggestion with your co-parent.",
        });
        onNavigateToMessages();
      } else {
        toast({
          title: "Suggestion",
          description: alternative.suggestion,
        });
      }
      return;
    }

    // Handle schedule-change alternatives (counter-offers)
    if (declinedRequest && alternative.data) {
      // Set the event context to the original event from the declined request
      setSelectedEvent(declinedRequest.originalEvent);

      // Configure the change request dialog based on the alternative's data
      if (alternative.data.requestType) {
        setChangeType(alternative.data.requestType);
      }

      if (alternative.data.date) {
        if (alternative.data.requestType === 'swap') {
          setSwapDate(alternative.data.date);
          setNewDate(null);
        } else {
          setNewDate(alternative.data.date);
          setSwapDate(null);
        }
      }

      if (alternative.data.message) {
        setChangeReason(alternative.data.message);
      }

      // Open the dialog for the user to review and submit
      setShowChangeRequest(true);
    }
  };

  const confirmDeleteEvent = async () => {
    if (eventToDelete) {
      setIsDeletingEvent(true);
      try {
        await calendarAPI.deleteEvent(eventToDelete.id);
        
        setShowEventDetails(false);
        setDeleteConfirmationOpen(false);
        setEventToDelete(null);
        
        toast({
          title: "Event deleted",
          description: "The event has been removed from the calendar.",
        });
        
        loadEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({
          title: "Error",
          description: "Failed to delete event.",
          variant: "destructive",
        });
      } finally {
        setIsDeletingEvent(false);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
              {monthNames[viewState.month]} {viewState.year}
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
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[10px] sm:text-sm font-medium text-gray-500 py-1 sm:py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div key={currentMonth.toISOString()} className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
          {getDaysInMonth().map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[70px] sm:min-h-[120px]"></div>;
            }

            const dayEvents = getEventsForDay(day);
            const pendingRequests = getPendingRequestsForDay(day);
            const isToday = day === today && currentMonth.getMonth() === new Date().getMonth();
            
            const custodyParent = getCustodyParentForDay(day);
            
            const custodyEvent = dayEvents.find(e => e.type === 'custody');
            const effectiveCustodyParent = custodyEvent?.parent || custodyParent;

            const maxItemsToShow = 4;
            const allItems: Array<{ type: 'event' | 'expense' | 'document'; data: CalendarEvent | DayExpense | DayDocument; id: string }> = [];
            
            const eventsToShow = Math.min(dayEvents.length, maxItemsToShow);
            dayEvents.slice(0, eventsToShow).forEach(event => {
              allItems.push({ type: 'event', data: event, id: event.id });
            });
            
            const shownEvents = Math.min(dayEvents.length, maxItemsToShow);
            const remainingEvents = Math.max(0, dayEvents.length - shownEvents);
            const totalRemaining = remainingEvents;

            const mobileDotColors: Record<string, string> = {
              custody: 'bg-blue-600',
              school: 'bg-emerald-500',
              medical: 'bg-rose-500',
              holiday: 'bg-amber-500',
              activity: 'bg-orange-500'
            };

            let dayBackgroundClass = 'border-gray-200';
            if (effectiveCustodyParent && (familyProfile?.custodyArrangement === '50-50' || familyProfile?.custodyArrangement === 'primary-secondary' || custodyAgreement)) {
              if (effectiveCustodyParent === 'mom') {
                dayBackgroundClass = 'bg-[hsl(214,100%,98%)] border-[hsl(214,100%,70%)]';
              } else if (effectiveCustodyParent === 'dad') {
                dayBackgroundClass = 'bg-[hsl(47,100%,98%)] border-[hsl(47,100%,70%)]';
              } else if (effectiveCustodyParent === 'both') {
                dayBackgroundClass = 'bg-[hsl(160,80%,98%)] border-[hsl(160,80%,70%)]';
              }
            }
            
            if (isToday) {
              dayBackgroundClass = 'bg-[hsl(214,100%,95%)] border-[hsl(214,100%,80%)]';
            }

            return (
              <div
                key={day}
                className={`min-h-[70px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 sm:border-gray-300 rounded-md sm:rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer flex flex-col ${dayBackgroundClass} ${
                  pendingRequests.length > 0 ? 'ring-2 ring-[hsl(45,100%,80%)]' : ''
                } ${isToday ? 'ring-2 ring-[hsl(217,92%,39%)] shadow-md' : ''}`}
                onClick={() =>
                  handleDayClick(
                    new Date(viewState.year, viewState.month, day, 12, 0, 0, 0)
                  )
                }
              >
                <div className={`text-[10px] sm:text-sm font-semibold mb-0.5 sm:mb-1.5 flex items-center justify-between flex-shrink-0 ${
                  isToday ? 'text-[hsl(217,92%,39%)]' : 'text-gray-700'
                }`}>
                  <span className="flex items-center gap-1">
                    <span className={`${isToday ? 'bg-[hsl(217,92%,39%)] text-white rounded-full w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-sm font-bold' : ''}`}>
                      {day}
                    </span>
                    {isToday && <span className="text-[10px] sm:text-xs font-normal text-[hsl(217,92%,39%)] hidden sm:inline">Today</span>}
                  </span>
                  {pendingRequests.length > 0 && (
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden min-h-0 flex flex-wrap content-start gap-1 sm:flex-col sm:gap-0 sm:space-y-1">
                  {allItems.map((item) => {
                    if (item.type === 'event') {
                      const event = item.data as CalendarEvent;
                      if (event.type === 'custody' && event.title === 'Custody Day') {
                        return null;
                      }
                      
                      return (
                        <React.Fragment key={item.id}>
                          {/* Mobile View: Dot Indicator */}
                          <div
                            onClick={(eventObj) => {
                              eventObj.stopPropagation();
                              handleEventClick(event);
                            }}
                            className={`sm:hidden w-1.5 h-1.5 rounded-full ${mobileDotColors[event.type] || 'bg-gray-400'} flex-shrink-0 cursor-pointer`}
                          />

                          {/* Desktop View: Full Text Bar */}
                          <div
                            onClick={(eventObj) => {
                              eventObj.stopPropagation();
                              handleEventClick(event);
                            }}
                            className={`hidden sm:block text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md border ${eventColors[event.type]} truncate cursor-pointer hover:opacity-90 hover:shadow-sm transition-all ${
                              pendingRequests.some(r => r.originalEvent.id === event.id) ? 'ring-1 ring-orange-300' : ''
                            }`}
                            title={event.title}
                          >
                            <span className="truncate block font-medium">{event.title}</span>
                            {event.hasTime && (
                              <span className="text-[9px] sm:text-[10px] opacity-75 block truncate mt-0.5">
                                {formatTimeOnly(event.fullDate, selectedTimeZone)}
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                  
                  {totalRemaining > 0 && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="text-[9px] sm:text-[10px] text-gray-500 px-1 sm:px-2 py-0.5 sm:py-1 font-medium bg-gray-100 rounded-md sm:w-full"
                      title={`${remainingEvents} events`}
                    >
                      +{totalRemaining} <span className="hidden sm:inline">more</span>
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
                  ? `2 days ${getParentDisplayName('mom', familyProfile, currentUser)} → 2 days ${getParentDisplayName('dad', familyProfile, currentUser)} → 3 days ${getParentDisplayName('mom', familyProfile, currentUser)}, then alternates (14-day cycle)`
                  : custodyAgreement.custodySchedule.toLowerCase().includes('week-on') || custodyAgreement.custodySchedule.toLowerCase().includes('alternat')
                  ? `${getParentDisplayName('mom', familyProfile, currentUser)} and ${getParentDisplayName('dad', familyProfile, currentUser)} alternate full weeks with the children`
                  : 'Schedule based on your custody agreement'}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-[hsl(214,100%,96%)] border-2 border-[hsl(214,100%,21%)] rounded mr-1.5 sm:mr-2"></div>
                  <span className="font-medium">{getParentDisplayName('mom', familyProfile, currentUser)} Days</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-[hsl(47,100%,96%)] border-2 border-[hsl(47,100%,50%)] rounded mr-1.5 sm:mr-2"></div>
                  <span className="font-medium">{getParentDisplayName('dad', familyProfile, currentUser)} Days</span>
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
      <ResponsiveModal open={showCreateEvent} onOpenChange={(open) => {
        setShowCreateEvent(open);
        if (!open) {
          setEditingEvent(null);
          setIsEditingMode(false);
        }
      }}>
        <ResponsiveModalContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-lg sm:text-xl">{isEditingMode ? 'Edit Calendar Event' : 'Add Calendar Event'}</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {isEditingMode ? 'Update the details of your event.' : 'Create a new event on the calendar.'}
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
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
                    const effectiveParent = getEffectiveParentForDate(newEventDate);
                    
                    return (
                      <>
                        <SelectItem
                          value="mom"
                          disabled={effectiveParent === 'dad'}
                          className={effectiveParent === 'dad' ? 'text-gray-400' : ''}
                        >
                          {getParentDisplayName("mom", familyProfile, currentUser)} {effectiveParent === 'dad' && '(Not Custodial)'}
                        </SelectItem>
                        <SelectItem
                          value="dad"
                          disabled={effectiveParent === 'mom'}
                          className={effectiveParent === 'mom' ? 'text-gray-400' : ''}
                        >
                          {getParentDisplayName("dad", familyProfile, currentUser)} {effectiveParent === 'mom' && '(Not Custodial)'}
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
                {creatingEvent && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {creatingEvent
                  ? (isEditingMode ? "Updating..." : "Creating...")
                  : (isEditingMode ? "Update Event" : "Create Event")}
              </Button>
            </div>
          </form>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Extracted Modals */}
      <EventDetailsDialog
        open={showEventDetails}
        onOpenChange={setShowEventDetails}
        selectedEvent={selectedEvent}
        currentMonth={currentMonth}
        selectedTimeZone={selectedTimeZone}
        changeRequests={changeRequests}
        currentUser={currentUser}
        familyProfile={familyProfile}
        processingRequestId={processingRequestId}
        onApproveRequest={(id) => handleRequestResponse(id, 'approved')}
        onRejectRequest={(id) => handleRequestResponse(id, 'rejected')}
        onEditEvent={openEditEventModal}
        onDeleteEvent={(event) => {
          setEventToDelete(event);
          setDeleteConfirmationOpen(true);
        }}
        onRequestChange={handleRequestChangeFromDetails}
      />

      <DeleteConfirmationDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        eventToDelete={eventToDelete}
        isDeleting={isDeletingEvent}
        onConfirmDelete={confirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
      />

      {/* Change Request Dialog - Still complex enough to keep here for now or extract in Phase 3 */}
      <ResponsiveModal open={showChangeRequest} onOpenChange={setShowChangeRequest}>
        <ResponsiveModalContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-lg sm:text-xl">Request Schedule Change</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Submit a request to swap, move, or cancel a custody event.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          
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
                        {formatTimeOnly(selectedEvent.fullDate, selectedTimeZone)}
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
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 justify-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-100 border border-red-200"></span>
                      <span>Occupied (At least one event)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-100 border border-gray-200"></span>
                      <span>Empty</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    You can select any date. Conflicts will be reviewed by your co-parent.
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
                  disabled={isMaterializing || !changeReason.trim() ||
                    (changeType === 'swap' && !swapDate) ||
                    (changeType === 'modify' && !newDate)}
                  className="flex-1"
                >
                  {isMaterializing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
        </ResponsiveModalContent>
      </ResponsiveModal>

      <PendingRequestsDialog
        open={showPendingRequests}
        onOpenChange={setShowPendingRequests}
        isLoading={isLoadingRequests}
        pendingRequests={changeRequests.filter(r => r.status === 'pending')}
        currentUser={currentUser}
        processingRequestId={processingRequestId}
        selectedTimeZone={selectedTimeZone}
        onApprove={(id) => handleRequestResponse(id, 'approved')}
        onReject={(id) => handleRequestResponse(id, 'rejected')}
        getDynamicConsequences={getDynamicConsequences}
      />

      <BridgetteAlternativesDialog
        open={showBridgetteAlternatives}
        onOpenChange={setShowBridgetteAlternatives}
        alternatives={bridgetteAlternatives}
        declinedRequest={declinedRequest}
        onAction={handleAlternativeAction}
        onNavigateToMessages={onNavigateToMessages}
      />

      <EmailPreviewDialog
        open={showEmailPreview}
        onOpenChange={setShowEmailPreview}
        generatedEmail={generatedEmail}
        selectedTimeZone={selectedTimeZone}
      />

      <DayOptionsDialog
        open={showDayOptions}
        onOpenChange={setShowDayOptions}
        selectedDay={selectedDay}
        isMaterializing={isMaterializing}
        events={events}
        familyProfile={familyProfile}
        currentUser={currentUser}
        getEffectiveCustodyParent={getEffectiveCustodyParent}
        onRequestSwap={handleSwapFromDayOptions}
        onAddEvent={(date) => {
          openCreateEventModal(date);
          setShowDayOptions(false);
        }}
        onEventClick={(event) => {
          setShowDayOptions(false);
          handleEventClick(event);
        }}
        selectedTimeZone={selectedTimeZone}
      />
    </div>
  );
};

export default CalendarView;