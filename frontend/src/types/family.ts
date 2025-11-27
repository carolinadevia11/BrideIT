export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  photo?: string;
  specialNeeds?: string[];
  medicalConditions?: string[];
  allergies?: string[];
  school?: string;
  grade?: string;
  notes?: string;
}

export interface FamilyProfile {
  id: string;
  familyName: string;
  familyCode?: string;
  
  // Parent 1 (Mom)
  parent1: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    timezone: string;
  };
  
  // Parent 2 (Dad)
  parent2: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    timezone: string;
  };
  
  // Children
  children: Child[];
  
  // Special Circumstances
  geographicalDistance?: number; // miles between parents
  differentTimezones: boolean;
  specialAccommodations?: string[];
  
  // Custody Information
  custodyArrangement?: '50-50' | 'primary-secondary' | 'custom';
  custodyNotes?: string;
  
  // Setup Status
  onboardingCompleted: boolean;
  setupDate: Date;
}

export interface CalendarEvent {
  id: string;
  date: number;
  type: 'custody' | 'holiday' | 'school' | 'medical' | 'activity';
  title: string;
  parent?: 'mom' | 'dad' | 'both';
  childrenIds: string[]; // Which children this event applies to
  isSwappable?: boolean;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  childrenIds: string[]; // Which children this document relates to
  uploadDate: Date;
  size: string;
  status: string;
  tags: string[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  childrenIds: string[]; // Which children this expense is for
  date: Date;
  paidBy: 'mom' | 'dad';
  status: string;
}
export interface CustodyDistribution {
  parent1: {
    name: string;
    days: number;
    percentage: number;
  };
  parent2: {
    name: string;
    days: number;
    percentage: number;
  };
}