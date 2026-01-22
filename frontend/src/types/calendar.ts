import { FamilyProfile } from './family';

export interface CalendarEvent {
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

export interface DayExpense {
  id: string;
  description: string;
  amount?: number;
  status?: string;
  date: Date;
}

export interface DayDocument {
  id: string;
  name: string;
  type?: string;
  folder?: string;
  uploadDate: Date;
}

export interface ChangeRequest {
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

export interface BridgetteAlternative {
  id: string;
  type: 'partial-swap' | 'different-date' | 'makeup-time' | 'split-event' | 'communication-help';
  title: string;
  description: string;
  impact: 'minimal' | 'low' | 'medium';
  suggestion: string;
  actionText: string;
  originalRequestId: string;
}

export interface EmailNotification {
  id: string;
  to: string[];
  subject: string;
  content: string;
  timestamp: Date;
  changeRequest: ChangeRequest;
}

export interface CalendarViewProps {
  familyProfile: FamilyProfile | null;
  currentUser?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  onNavigateToMessages?: () => void;
}