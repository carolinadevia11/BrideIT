import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit3, ArrowRightLeft, Clock, CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, User, Mail, FileText, Lightbulb, SkipForward, ThumbsUp, MessageCircle } from 'lucide-react';
import { calendarAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

const CalendarView: React.FC<CalendarViewProps> = ({
  familyProfile,
  currentUser,
  onNavigateToMessages,
}) => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showBridgetteAlternatives, setShowBridgetteAlternatives] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [changeType, setChangeType] = useState<'swap' | 'modify' | 'cancel'>('swap');
  const [swapDate, setSwapDate] = useState<number | null>(null);
  const [newDate, setNewDate] = useState<number | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<EmailNotification | null>(null);
  const [declinedRequest, setDeclinedRequest] = useState<ChangeRequest | null>(null);
  const [bridgetteAlternatives, setBridgetteAlternatives] = useState<BridgetteAlternative[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventType, setNewEventType] =
    useState<CalendarEvent["type"]>("custody");
  const [newEventParent, setNewEventParent] = useState<"mom" | "dad" | "both">(
    "both"
  );
  const [newEventSwappable, setNewEventSwappable] = useState(true);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const today = new Date().getDate();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
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

  const getParentDisplayName = (role: 'mom' | 'dad'): string => {
    if (!familyProfile) {
      return role === 'mom' ? 'Parent 1' : 'Parent 2';
    }
    const parent =
      role === 'mom' ? familyProfile.parent1 : familyProfile.parent2;
    const first = parent?.firstName || (role === 'mom' ? 'Parent 1' : 'Parent 2');
    const last = parent?.lastName || '';
    return `${first} ${last}`.trim();
  };

  const getParentEmailAddress = (role: 'mom' | 'dad'): string | undefined => {
    if (!familyProfile) return undefined;
    const parent = role === 'mom' ? familyProfile.parent1 : familyProfile.parent2;
    return parent?.email || undefined;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarTimeZone', selectedTimeZone);
    }
  }, [selectedTimeZone]);

  const formatDateTime = (value?: Date | string | null): string => {
    if (!value) return '—';
    const dateObj = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(dateObj.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: selectedTimeZone,
      timeZoneName: 'short',
    }).format(dateObj);
  };

  const selectedTimeZoneLabel =
    US_TIME_ZONES.find((tz) => tz.value === selectedTimeZone)?.label || 'Eastern (ET)';

  const formatTimeOnly = (value?: Date): string => {
    if (!value) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: selectedTimeZone,
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
    const dateObj = isoDate ? new Date(isoDate) : new Date();
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

    const swapEvent = apiRequest.swapEventId
      ? buildCalendarEventFromSnapshot(
          apiRequest.swapEventId,
          apiRequest.swapEventTitle || 'Swap Event',
          apiRequest.eventType || 'custody',
          apiRequest.eventParent,
          apiRequest.swapEventDate
        )
      : undefined;

    const newDateObj = apiRequest.newDate ? new Date(apiRequest.newDate) : undefined;

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
      timestamp: apiRequest.createdAt ? new Date(apiRequest.createdAt) : new Date(),
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
      approvedAt: apiRequest.updatedAt ? new Date(apiRequest.updatedAt) : undefined,
    };
  };

  const [emailHistory, setEmailHistory] = useState<EmailNotification[]>([]);

  // Load events when month changes
  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  useEffect(() => {
    loadChangeRequests();
  }, [familyProfile]);

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // API expects 1-12
      const response = await calendarAPI.getEvents(year, month);
      
      // Transform backend events to frontend format
      const transformedEvents: CalendarEvent[] = response.map((event: any) => {
        const eventDate = new Date(event.date);
        return {
          id: event.id,
          date: eventDate.getDate(),
          fullDate: eventDate,
          type: event.type as 'custody' | 'holiday' | 'school' | 'medical' | 'activity',
          title: event.title,
          parent: event.parent as 'mom' | 'dad' | 'both' | undefined,
          isSwappable: event.isSwappable ?? false,
          hasTime: hasSpecificTime(eventDate),
        };
      });
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events. Using mock data.",
        variant: "destructive",
      });
      // Keep mock data on error
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadChangeRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await calendarAPI.getChangeRequests();
      const mapped: ChangeRequest[] = response.map((req: any) =>
        mapChangeRequestFromApi(req)
      );
      setChangeRequests(mapped);
    } catch (error) {
      console.error('Error loading change requests:', error);
      toast({
        title: "Error",
        description: "Failed to load change requests.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const eventColors = {
    custody: 'bg-blue-100 text-blue-800 border-blue-200',
    holiday: 'bg-red-100 text-red-800 border-red-200',
    school: 'bg-green-100 text-green-800 border-green-200',
    medical: 'bg-purple-100 text-purple-800 border-purple-200',
    activity: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    disputed: 'bg-bridge-red text-white border-bridge-red',
    paid: 'bg-blue-100 text-blue-800 border-blue-200'
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
        .header { background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 20px; text-align: center; }
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
        <h1>⚖️ Bridge Co-Parenting Platform</h1>
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
                Digital Signature: ✓ Confirmed via Bridge Platform
            </div>

            <div class="signature-box">
                <strong>PARENT 2 - ${parent2Signature}</strong><br/>
                Status: ${request.requestedBy === 'dad' ? 'REQUESTED' : 'APPROVED'}<br/>
                Date: ${request.requestedBy === 'dad' ? formatDateTime(request.timestamp) : formatDateTime(request.approvedAt)}<br/>
                Digital Signature: ✓ Confirmed via Bridge Platform
            </div>
        </div>

        <div class="section warning">
            <h3>⚠️ LEGAL DISCLAIMER</h3>
            <p><strong>This email serves as official documentation of a mutually agreed schedule modification.</strong></p>
            <p>Both parents have reviewed and approved this change through the Bridge Co-Parenting Platform. 
            This modification is binding and should be treated as an amendment to your existing custody schedule.</p>
            <p>If this change conflicts with your legal custody agreement, please consult with your family law attorney. 
            Bridge Co-Parenting Platform provides tools for communication and organization but does not provide legal advice.</p>
        </div>

        <div class="section">
            <h3>📞 QUESTIONS OR CONCERNS?</h3>
            <p>If you have questions about this change or need to make additional modifications:</p>
            <ul>
                <li>Log into your Bridge account at <a href="https://bridge-coparenting.com">bridge-coparenting.com</a></li>
                <li>Contact Bridge Support: support@bridge-coparenting.com</li>
                <li>For legal questions, consult your family law attorney</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p><strong>Bridge Co-Parenting Platform</strong> | Fair & Balanced Co-Parenting</p>
        <p>This is an automated message generated by the Bridge system.</p>
            <p class="timestamp">Document ID: BCH-${request.id} | Generated: ${formatDateTime(new Date())}</p>
            <p class="timestamp">All timestamps shown in ${selectedTimeZoneLabel}.</p>
        <p>⚖️ Bridgette AI Assistant helped facilitate this agreement</p>
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const openCreateEventModal = () => {
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
    const defaultDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      clampedDay
    );
    setNewEventDate(defaultDate.toISOString().slice(0, 10));
    setNewEventTitle("");
    setNewEventType("custody");
    setNewEventParent("both");
    setNewEventSwappable(true);
    setNewEventTime('');
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

    setCreatingEvent(true);
    try {
      await createNewEvent({
        date: parsedDate,
        type: newEventType,
        title: newEventTitle.trim(),
        parent: newEventParent,
        isSwappable: newEventSwappable,
      });
      setShowCreateEvent(false);
    } catch (error) {
      // toast already handled inside createNewEvent
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (!event.isSwappable) {
      return; // Can't modify non-swappable events
    }
    setSelectedEvent(event);
    setShowChangeRequest(true);
  };

  const calculateConsequences = (): string[] => {
    if (!selectedEvent) return [];

    const consequences = [];
    
    if (changeType === 'swap' && swapDate) {
      const swapEvent = events.find(e => e.date === swapDate);
      if (swapEvent) {
        consequences.push(`${selectedEvent.title} moves from ${selectedEvent.date} to ${swapDate}`);
        consequences.push(`${swapEvent.title} moves from ${swapDate} to ${selectedEvent.date}`);
        
        // Check for school day implications
        const isSchoolWeek = (date: number) => {
          const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date).getDay();
          return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
        };
        
        if (isSchoolWeek(swapDate) && selectedEvent.type === 'custody') {
          consequences.push('⚠️ This change affects school week custody - pickup/dropoff responsibilities will change');
        }
        
        if (Math.abs(swapDate - selectedEvent.date) > 7) {
          consequences.push('⚠️ This is a significant schedule change - consider impact on Emma\'s routine');
        }
      }
    } else if (changeType === 'modify' && newDate) {
      consequences.push(`${selectedEvent.title} moves from ${selectedEvent.date} to ${newDate}`);
      
      // Check for conflicts
      const conflictingEvents = getEventsForDay(newDate);
      if (conflictingEvents.length > 0) {
        consequences.push(`⚠️ Conflict: ${conflictingEvents.map(e => e.title).join(', ')} already scheduled for ${newDate}`);
      }
    } else if (changeType === 'cancel') {
      consequences.push(`${selectedEvent.title} on ${selectedEvent.date} will be cancelled`);
      consequences.push('⚠️ This may affect the overall custody balance for the month');
    }

    return consequences;
  };

  const submitChangeRequest = async () => {
    if (!selectedEvent || !changeReason.trim()) return;

    const payload: {
      event_id: string;
      requestType: 'swap' | 'modify' | 'cancel';
      reason: string;
      newDate?: string;
      swapEventId?: string;
    } = {
      event_id: selectedEvent.id,
      requestType: changeType,
      reason: changeReason,
    };

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
      const swapEvent = events.find(e => e.date === swapDate);
      if (!swapEvent) {
        toast({
          title: "Event not found",
          description: "The event you're trying to swap with could not be found.",
          variant: "destructive",
        });
        return;
      }
      payload.swapEventId = swapEvent.id;
    }

    try {
      await calendarAPI.createChangeRequest(payload);
      toast({
        title: "Change request submitted",
        description: "We'll notify your co-parent to review this request.",
      });
      setShowChangeRequest(false);
      setSelectedEvent(null);
      setChangeReason('');
      setSwapDate(null);
      setNewDate(null);
      await loadChangeRequests();
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit change request.",
        variant: "destructive",
      });
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
      {/* Enhanced Bridgette Helper with Alert System */}
      <Card className={`border-2 ${bridgetteInfo.isAlert ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <BridgetteAvatar size="md" expression={bridgetteInfo.expression} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                Hey {greetingName}, I'm here to help. Ask anything!
              </p>
              <p className={`text-xs mt-1 font-medium ${bridgetteInfo.isAlert ? 'text-red-700' : 'text-gray-600'}`}>
                {bridgetteInfo.message}
              </p>
              {bridgetteInfo.isAlert && pendingRequestsCount > 0 && (
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setShowPendingRequests(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Review {pendingRequestsCount} Request{pendingRequestsCount > 1 ? 's' : ''} Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email History Alert */}
      {emailHistory.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <Mail className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {emailHistory.length} automated documentation email{emailHistory.length > 1 ? 's' : ''} sent to both parents.
            <Button 
              variant="link" 
              className="p-0 ml-2 text-green-600 underline"
              onClick={() => setShowEmailPreview(true)}
            >
              View latest email
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Requests Alert */}
      {pendingRequestsCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have {pendingRequestsCount} pending schedule change request{pendingRequestsCount > 1 ? 's' : ''} that need{pendingRequestsCount === 1 ? 's' : ''} your response.
            <Button 
              variant="link" 
              className="p-0 ml-2 text-orange-600 underline"
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
              <Button size="sm" onClick={openCreateEventModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
              {pendingRequestsCount > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
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
                  className="border-green-300 text-green-600 hover:bg-green-50"
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
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-24"></div>;
            }

            const dayEvents = getEventsForDay(day);
            const pendingRequests = getPendingRequestsForDay(day);
            const isToday = day === today && currentMonth.getMonth() === new Date().getMonth();

            return (
              <div
                key={day}
                className={`h-24 p-2 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                  isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                } ${pendingRequests.length > 0 ? 'ring-2 ring-orange-200' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 flex items-center justify-between ${
                  isToday ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  <span>
                    {day}
                    {isToday && <span className="ml-1 text-xs">Today</span>}
                  </span>
                  {pendingRequests.length > 0 && (
                    <Clock className="w-3 h-3 text-orange-500" />
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={`text-xs px-2 py-1 rounded border ${eventColors[event.type]} truncate ${
                        event.isSwappable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                      } ${pendingRequests.some(r => r.originalEvent.id === event.id) ? 'ring-1 ring-orange-300' : ''}`}
                    >
                      {event.title}
                      {event.hasTime && (
                        <span className="block text-[10px] text-blue-900 mt-0.5">
                          {formatTimeOnly(event.fullDate)}
                        </span>
                      )}
                      {event.isSwappable && (
                        <ArrowRightLeft className="w-2 h-2 inline ml-1" />
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
            <span>Custody Days</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
            <span>School Events</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-200 rounded mr-2"></div>
            <span>Medical</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-200 rounded mr-2"></div>
            <span>Holidays</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-200 rounded mr-2"></div>
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

      {/* Create Event Dialog */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateEventSubmit}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Mom's Weekend"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time (optional)</Label>
                <Input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                />
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
                  <SelectItem value="mom">
                    {getParentDisplayName("mom")}
                  </SelectItem>
                  <SelectItem value="dad">
                    {getParentDisplayName("dad")}
                  </SelectItem>
                  <SelectItem value="both">Both parents</SelectItem>
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateEvent(false)}
                disabled={creatingEvent}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingEvent}>
                {creatingEvent ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Request Dialog */}
      <Dialog open={showChangeRequest} onOpenChange={setShowChangeRequest}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Schedule Change</DialogTitle>
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
                      
                      const dayEvents = getEventsForDay(day);
                      const swappableEvents = dayEvents.filter(e => e.isSwappable && e.type === selectedEvent.type);
                      const canSwap = swappableEvents.length > 0 && day !== selectedEvent.date;
                      
                      return (
                        <button
                          key={day}
                          onClick={() => canSwap && setSwapDate(day)}
                          disabled={!canSwap}
                          className={`h-8 text-xs rounded ${
                            swapDate === day ? 'bg-blue-500 text-white' : 
                            canSwap ? 'bg-green-100 hover:bg-green-200 text-green-800' : 
                            'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Green dates have swappable events of the same type
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
                            newDate === day ? 'bg-blue-500 text-white' : 
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pending Schedule Change Requests</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {changeRequests.filter(r => r.status === 'pending').map((request) => (
              <Card key={request.id} className="border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      {request.requestedBy === 'mom' ? 'You' : 'Your co-parent'} wants to {request.type} a date
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
                      {request.consequences.map((consequence, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consequence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

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

                  <p className="text-xs text-gray-500 text-center">
                  Requested {formatDateTime(request.timestamp)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bridgette Alternatives Dialog */}
      <Dialog open={showBridgetteAlternatives} onOpenChange={setShowBridgetteAlternatives}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Bridgette's Alternative Solutions
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
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
    </div>
  );
};

export default CalendarView;