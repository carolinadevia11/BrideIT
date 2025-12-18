import confetti from 'canvas-confetti';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, MessageSquare, DollarSign, FileText, Settings, Home, Heart, Users, Trophy, BookOpen, Scale, AlertTriangle, HelpCircle, Baby, LogOut, UserCheck, UserX, BarChart3, Bot, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProgressBar from '@/components/ProgressBar';
import QuickActionCard from '@/components/QuickActionCard';
import CalendarView from '@/components/CalendarView';
import MessagingInterface from '@/components/MessagingInterface';
import ExpenseTracker from '@/components/ExpenseTracker';
import DocumentManager from '@/components/DocumentManager';
import EducationalResources from '@/components/EducationalResources';
import SupportChatbot from '@/components/SupportChatbot';
import OnboardingFlow from '@/components/OnboardingFlow';
import OnboardingExplanation from '@/components/OnboardingExplanation';
import AccountSetup from '@/components/AccountSetup';
import BridgettePersonalization from '@/components/BridgettePersonalization';
import FamilyChoice from '@/components/FamilyChoice';
import FamilyCodeSetup from '@/components/FamilyCodeSetup';
import ContractUpload from '@/components/ContractUpload';
import UserSettings from '@/components/UserSettings';
import FamilyOnboarding from '@/components/FamilyOnboarding';
import ChildManagement from '@/components/ChildManagement';
import RecentActivity from '@/components/RecentActivity';
import ProductTour from '@/components/ProductTour';
import IncomingCallAlert from '@/components/IncomingCallAlert';
import VideoCallModal from '@/components/VideoCallModal';
import { FamilyProfile, Child } from '@/types/family';
import DashboardShell, { DashboardNavItem } from '@/components/dashboard/DashboardShell';
import { authAPI, familyAPI, childrenAPI, adminAPI, calendarAPI, expensesAPI, messagingAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface IndexProps {
  onLogout: () => void;
  startOnboarding?: boolean;
  startInSettings?: boolean;
  skipExplanation?: boolean;
}

type CurrentUser = {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
};

type AdminStats = {
  totalFamilies: number;
  linkedFamilies: number;
  unlinkedFamilies: number;
  totalUsers: number;
  totalChildren: number;
};

type AdminFamilyRecord = {
  id?: string;
  _id?: string;
  familyName?: string;
  familyCode?: string;
  isLinked?: boolean;
  createdAt?: string;
  linkedAt?: string | null;
  parent1?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  parent2?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

const Index: React.FC<IndexProps> = ({ onLogout, startOnboarding = false, startInSettings = false, skipExplanation = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Determine active tab from URL pathname
  const getTabFromPath = (pathname: string): string => {
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/messages')) return 'messages';
    if (pathname.startsWith('/expenses')) return 'expenses';
    if (pathname.startsWith('/documents')) return 'documents';
    if (pathname.startsWith('/resources')) return 'resources';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    return 'dashboard'; // default
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));

  // Sync activeTab with URL pathname when location changes
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    setActiveTab(tab);
  }, [location.pathname]);

  // Helper function to change tab and update URL
  const changeTab = (tab: string) => {
    // Just navigate, let the useEffect update the state
    navigate(`/${tab}`, { replace: false });
  };

  // Sync state from URL
  useEffect(() => {
    const isSettings = location.pathname === '/settings';
    setShowSettings(isSettings);
    
    if (!isSettings) {
      const tab = getTabFromPath(location.pathname);
      setActiveTab(tab);
    }
  }, [location.pathname]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Logic for handling new signups vs "Get Started" from landing
  // If skipExplanation is true (passed from App when coming from Signup), we skip the explanation
  const shouldShowExplanation = startOnboarding && !skipExplanation;
  
  const [showOnboardingExplanation, setShowOnboardingExplanation] = useState(shouldShowExplanation);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [showBridgettePersonalization, setShowBridgettePersonalization] = useState(startOnboarding && skipExplanation);
  const [showFamilyChoice, setShowFamilyChoice] = useState(false);
  const [showFamilyCodeSetup, setShowFamilyCodeSetup] = useState(false);
  const [showContractUpload, setShowContractUpload] = useState(false);
  const [showFamilyOnboarding, setShowFamilyOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(startInSettings);
  const [showChildManagement, setShowChildManagement] = useState(false);
  const [showSupportChatbot, setShowSupportChatbot] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);
  const [familyCodeMode, setFamilyCodeMode] = useState<'create' | 'join'>('create');
  const [tempFamilyData, setTempFamilyData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    familyName?: string;
    parent1_name?: string;
    familyCode?: string;
    custodyArrangement?: string;
    children?: Child[];
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  type UpcomingEventDetail = { id: string; title: string; dateLabel: string };
  type PendingExpenseDetail = { id: string; description: string; amount?: number; status?: string };
  const [dashboardMetrics, setDashboardMetrics] = useState({
    upcomingEvents: 0,
    pendingExpenses: 0,
    upcomingEventDetails: [] as UpcomingEventDetail[],
    pendingExpenseDetails: [] as PendingExpenseDetail[],
  });
  const [dashboardMetricsLoaded, setDashboardMetricsLoaded] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminPendingFamilies, setAdminPendingFamilies] = useState<AdminFamilyRecord[]>([]);
  const [adminRecentFamilies, setAdminRecentFamilies] = useState<AdminFamilyRecord[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [familyProfileLoading, setFamilyProfileLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Call State
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    roomName: string;
    conversationId: string;
    initiatorEmail: string;
    callType?: 'video' | 'audio';
  } | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [activeCallConversationId, setActiveCallConversationId] = useState<string | null>(null);

  const isVideoCallOpenRef = useRef<boolean>(false);
  const { lastMessage, sendMessage } = useWebSocket();

  // Keep ref in sync with state for WS
  useEffect(() => {
    isVideoCallOpenRef.current = isVideoCallOpen;
  }, [isVideoCallOpen]);

  // Handle WebSocket messages from context
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const data = lastMessage;

      // Call Events
      if (data.type === 'video_call_started') {
        const initiator = data.initiatorEmail?.trim().toLowerCase();
        const me = currentUser?.email?.trim().toLowerCase();

        console.log('[Index WS] Call started event:', { initiator, me, isInCall: isVideoCallOpenRef.current });

        if (currentUser && initiator && me && initiator !== me && !isVideoCallOpenRef.current) {
            setIncomingCall({
              callerName: data.initiatorName,
              roomName: data.roomName,
              conversationId: data.conversationId,
              initiatorEmail: data.initiatorEmail,
              callType: data.callType || 'video'
            });
        }
      }

      if (data.type === 'call_rejected' || data.type === 'call_end' || (data.messageType === 'call_end')) {
        if (data.type === 'call_rejected') {
          toast({
            title: "Call Declined",
            description: "The other party unavailable or declined the call.",
            variant: "default",
          });
        }
        setIsVideoCallOpen(false);
        setActiveCallConversationId(null);
      }

      // Refresh on specific events or generic refresh
      if (data.type === 'refresh_activities' ||
          data.type === 'new_message' ||
          data.type === 'refresh_calendar' ||
          data.type === 'refresh_expenses') {
        // console.log('Dashboard received refresh event:', data.type);
        // We'll trigger a reload of metrics here if needed, or rely on polling/cache invalidation
        // But for now, let's just trigger the load function if it's available
        // Since loadDashboardMetrics is defined inside useEffect, we can't call it directly here easily
        // without refactoring or using a trigger state.
        // For simplicity in this refactor, we'll ignore the direct reload here and rely on
        // the fact that many of these events might trigger other component updates or the user will refresh.
        // Ideally, loadDashboardMetrics should be a useCallback available here.
        // Let's use a workaround:
        setDashboardMetricsLoaded(prev => {
            // Just a dummy update to trigger effect? No, that won't work well.
            // A better way is to move loadDashboardMetrics outside or use a ref.
            // For now, let's just log. The critical part is call handling.
            return prev;
        });
        
        // Also check for call end messages
        if (data.type === 'new_message' && (data.messageType === 'call_end' || data.content === 'Call ended')) {
            setIsVideoCallOpen(false);
            setActiveCallConversationId(null);
        }
      }
    } catch (e) {
      console.error('Error processing WebSocket message:', e);
    }
  }, [lastMessage, currentUser, toast]);

  // Reload dashboard metrics when relevant WS events occur (using a separate effect for clarity)
  useEffect(() => {
     if (lastMessage &&
        ['refresh_activities', 'new_message', 'refresh_calendar', 'refresh_expenses'].includes(lastMessage.type)) {
         // We need to trigger a reload.
         // Since loadDashboardMetrics is inside an effect, we can't call it.
         // Let's set a "lastUpdate" timestamp to trigger the main effect.
         setLastUpdateTimestamp(Date.now());
     }
  }, [lastMessage]);

  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(Date.now());


  // Confetti helper function
  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999, // Ensure confetti is on top of everything
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  useEffect(() => {
    if (familyProfileLoading || !currentUser) return;

    // Use a user-specific key in localStorage to persist celebration status across sessions
    // This prevents the confetti from showing up every time the user opens a new tab/window
    const userKey = currentUser.email || 'unknown';
    const completionKey = `hasSeenCompletion_${userKey}_v1`;
    const progressKey = `hasSeenProgress_${userKey}_v1`;
    
    const hasSeenCompletion = localStorage.getItem(completionKey);
    const hasSeenProgress = localStorage.getItem(progressKey);
    
    // Check for full completion first
    if (familyProfile?.onboardingCompleted) {
       if (!hasSeenCompletion) {
         console.log('Triggering completion celebration');
         triggerConfetti();
         setCelebrationMessage(`🎉 Great job completing your setup, ${currentUser.firstName}!`);
         localStorage.setItem(completionKey, 'true');
         // Also mark progress as seen so we don't trigger it later if we downgrade/change logic
         localStorage.setItem(progressKey, 'true');
       }
       return;
    }

    // Check for progress (Has children OR Has custody arrangement)
    const hasProgress = (familyProfile?.children && familyProfile.children.length > 0) ||
                        (familyProfile?.custodyArrangement);

    if (hasProgress && !hasSeenProgress) {
       console.log('Triggering progress celebration');
       triggerConfetti();
       setCelebrationMessage(`✨ Great job making progress, ${currentUser.firstName}!`);
       localStorage.setItem(progressKey, 'true');
       return;
    }
  }, [familyProfile, familyProfileLoading, currentUser]);

  const pendingFamilyCount = adminStats?.unlinkedFamilies ?? adminPendingFamilies.length;

  const dashboardNavItems: DashboardNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : undefined,
    },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  const handleLogoutClick = () => {
    onLogout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const handleQuickAdd = () => {
    toast({
      title: "Quick add coming soon",
      description: "Soon you’ll be able to add events, expenses, and notes from here.",
    });
  };

  const handleOpenMessages = () => {
    changeTab('messages');
  };

  const handleCopyFamilyCode = async () => {
    if (!familyProfile?.familyCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(familyProfile.familyCode);
      toast({
        title: "Family code copied",
        description: "Share this code with your co-parent to link accounts.",
      });
    } catch (error) {
      console.error('Failed to copy family code:', error);
      toast({
        title: "Unable to copy",
        description: "Please copy the family code manually.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (value?: string) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    const onboardingState = {
      showOnboardingExplanation,
      showAccountSetup,
      showBridgettePersonalization,
      showFamilyChoice,
      showFamilyOnboarding,
      showFamilyCodeSetup,
      showContractUpload,
      familyCodeMode,
      tempFamilyData,
      currentUser,
    };

    // Only save if user is in onboarding flow (at least one onboarding screen is active)
    const isInOnboarding = showOnboardingExplanation || showAccountSetup || showBridgettePersonalization ||
      showFamilyChoice || showFamilyOnboarding || showFamilyCodeSetup || showContractUpload;

    if (isInOnboarding) {
      localStorage.setItem('onboardingState', JSON.stringify(onboardingState));
    } else {
      localStorage.removeItem('onboardingState');
    }
  }, [showOnboardingExplanation, showAccountSetup, showBridgettePersonalization, showFamilyChoice,
    showFamilyOnboarding, showFamilyCodeSetup, showContractUpload, familyCodeMode, tempFamilyData, currentUser]);

  // Restore onboarding state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('onboardingState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setShowOnboardingExplanation(state.showOnboardingExplanation || false);
        setShowAccountSetup(state.showAccountSetup || false);
        setShowBridgettePersonalization(state.showBridgettePersonalization || false);
        setShowFamilyChoice(state.showFamilyChoice || false);
        setShowFamilyOnboarding(state.showFamilyOnboarding || false);
        setShowFamilyCodeSetup(state.showFamilyCodeSetup || false);
        setShowContractUpload(state.showContractUpload || false);
        setFamilyCodeMode(state.familyCodeMode || 'create');
        setTempFamilyData(state.tempFamilyData || null);
        setCurrentUser(state.currentUser || null);
      } catch (error) {
        console.error('Error restoring onboarding state:', error);
        localStorage.removeItem('onboardingState');
      }
    }
  }, []);

  // Fetch current user and family/admin profile on mount
  useEffect(() => {
    const loadAdminOverview = async () => {
      setAdminLoading(true);
      setAdminError(null);
      try {
        const statsData = await adminAPI.getStats();
        const familiesResponse = await adminAPI.getAllFamilies();
        const familiesData: AdminFamilyRecord[] = Array.isArray(familiesResponse) ? familiesResponse : [];

        setAdminStats(statsData);

        const pendingFamilies = familiesData.filter((family) => !family.isLinked);
        setAdminPendingFamilies(pendingFamilies.slice(0, 4));

        const recent = [...familiesData]
          .sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
          })
          .slice(0, 5);
        setAdminRecentFamilies(recent);
      } catch (error) {
        console.error('Error fetching admin overview:', error);
        const message = error instanceof Error ? error.message : 'Failed to load admin overview.';
        setAdminError(message);
        toast({
          title: "Admin data unavailable",
          description: message,
          variant: "destructive",
        });
      } finally {
        setAdminLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        setFamilyProfileLoading(true);
        const token = localStorage.getItem('authToken');
        if (token) {
          const userProfile = await authAPI.getCurrentUser();
          const normalizedUser: CurrentUser = {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            email: userProfile.email,
            role: userProfile.role,
          };

          setCurrentUser(normalizedUser);
          
          // Check if user needs to see the tour (tourCompleted is false or undefined)
          const needsTour = userProfile.tourCompleted === false || userProfile.tourCompleted === undefined;

          if (userProfile.role === 'admin') {
            setFamilyProfile(null);
            setFamilyProfileLoading(false);
            await loadAdminOverview();
            return;
          }

          // Clear any stale admin data when switching from admin to standard view
          setAdminStats(null);
          setAdminPendingFamilies([]);
          setAdminRecentFamilies([]);
          setAdminError(null);

          // Fetch family profile if exists
          try {
            const family = await familyAPI.getFamily();
            if (family) {
              // Fetch children separately to ensure we have the latest data
              let children: Child[] = [];
              try {
                const childrenData = await childrenAPI.getChildren();
                console.log('Fetched children from backend:', childrenData);

                // Convert backend children to frontend format
                children = childrenData.map((child) => {
                  const [firstName, ...lastNameParts] = (child.name || '').split(' ');
                  const lastName = lastNameParts.join(' ');
                  const convertedChild: Child = {
                    id: child.id,
                    firstName: firstName || '',
                    lastName: lastName || '',
                    dateOfBirth: new Date(child.dateOfBirth),
                    age: Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                    gender: child.gender,
                    school: child.school,
                    grade: child.grade,
                    allergies: child.allergies ? child.allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                    medicalConditions: child.medications ? child.medications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                    specialNeeds: child.notes ? [child.notes] : [],
                    notes: child.notes,
                  };
                  console.log('Converted child:', convertedChild);
                  return convertedChild;
                });

                console.log('Total children converted:', children.length);
              } catch (childError) {
                console.error('Error fetching children:', childError);
              }

              // Convert backend family data to FamilyProfile format
              setFamilyProfile({
                ...family,
                children: children,
              } as FamilyProfile);

              // If family profile exists, clear onboarding state
              localStorage.removeItem('onboardingState');
              
              // Show tour if user hasn't completed it and has a family profile (onboarding complete)
              if (needsTour && !showOnboarding) {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                  setShowTour(true);
                }, 500);
              }
            } else {
              setFamilyProfile(null);
            }
          } catch (error) {
            // Family profile doesn't exist yet - that's okay
            console.info('No family profile found yet');
            setFamilyProfile(null);
          } finally {
            setFamilyProfileLoading(false);
          }
        } else {
          setFamilyProfileLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setFamilyProfileLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  useEffect(() => {
    const loadDashboardMetrics = async () => {
      if (!familyProfile || currentUser?.role === 'admin') {
        setDashboardMetricsLoaded(false);
        return;
      }

      try {
        const now = new Date();
        const [eventsResponse, expensesResponse, conversationsResponse] = await Promise.all([
          calendarAPI.getEvents(now.getFullYear(), now.getMonth() + 1),
          expensesAPI.getExpenses(),
          messagingAPI.getConversations(),
        ]);

        // Calculate unread messages
        if (Array.isArray(conversationsResponse)) {
          const totalUnread = conversationsResponse.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);
          setUnreadMessagesCount(totalUnread);
        }

        const upcomingEventArray = Array.isArray(eventsResponse)
          ? eventsResponse
            .map((event: { id?: string; date?: string; title?: string }) => {
              const eventDate = event?.date ? new Date(event.date) : null;
              if (!eventDate || Number.isNaN(eventDate.getTime()) || eventDate < now) {
                return null;
              }
              return {
                id: event.id ?? crypto.randomUUID(),
                title: event.title || 'Schedule event',
                dateLabel: eventDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                }),
                eventDate,
              };
            })
            .filter((item): item is UpcomingEventDetail & { eventDate: Date } => Boolean(item))
            .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
          : [];

        const upcomingEvents = upcomingEventArray.length;

        const pendingExpenseArray = Array.isArray(expensesResponse)
          ? expensesResponse.filter((expense: { status?: string }) => {
            const status = (expense?.status || '').toLowerCase();
            if (!status) return true;
            return !['paid', 'reimbursed', 'settled'].includes(status);
          })
          : [];

        const pendingExpenses = pendingExpenseArray.length;

        setDashboardMetrics({
          upcomingEvents,
          pendingExpenses,
          upcomingEventDetails: upcomingEventArray.slice(0, 3).map(({ id, title, dateLabel }) => ({
            id,
            title,
            dateLabel,
          })),
          pendingExpenseDetails: pendingExpenseArray.slice(0, 3).map((expense: { id?: string; description?: string; amount?: number; status?: string }) => ({
            id: expense.id ?? crypto.randomUUID(),
            description: expense.description || 'Expense awaiting review',
            amount: expense.amount,
            status: expense.status,
          })),
        });
        setDashboardMetricsLoaded(true);
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error);
        setDashboardMetricsLoaded(false);
      }
    };

    loadDashboardMetrics();

    // Set up polling for dashboard metrics (every 30 seconds) as backup
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboardMetrics();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [familyProfile, currentUser, toast, lastUpdateTimestamp]);

  // Removed problematic bidirectional sync useEffect

  const eventsCopy = dashboardMetricsLoaded
    ? `${dashboardMetrics.upcomingEvents} upcoming event${dashboardMetrics.upcomingEvents === 1 ? '' : 's'}`
    : 'upcoming events';

  const expensesCopy = dashboardMetricsLoaded
    ? `${dashboardMetrics.pendingExpenses} expense${dashboardMetrics.pendingExpenses === 1 ? '' : 's'}`
    : 'expenses';

  const expensesVerb = dashboardMetricsLoaded && dashboardMetrics.pendingExpenses === 1 ? "there's" : "there are";

  // Call Handlers
  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      setActiveCallConversationId(incomingCall.conversationId);
      setCallType(incomingCall.callType || 'video');
      setIsVideoCallOpen(true);
      setIncomingCall(null);
      changeTab('messages');
    }
  }, [incomingCall]);

  const handleDeclineCall = useCallback(() => {
    if (incomingCall) {
      sendMessage({
        type: 'call_rejected',
        conversationId: incomingCall.conversationId,
        recipientEmail: incomingCall.initiatorEmail
      });
    }
    setIncomingCall(null);
  }, [incomingCall, sendMessage]);

  const handleCallEnded = useCallback(async () => {
    setIsVideoCallOpen(false);
    const convId = activeCallConversationId;
    setActiveCallConversationId(null);
    
    if (convId) {
      try {
        await messagingAPI.sendMessage({
          conversation_id: convId,
          content: "Call ended",
          tone: "neutral-legal",
          type: "call_end"
        });
      } catch (error) {
        console.error("Failed to log call end:", error);
      }
    }
  }, [activeCallConversationId]);

  const handleStartCall = (conversationId: string, type: 'video' | 'audio') => {
    setActiveCallConversationId(conversationId);
    setCallType(type);
    setIsVideoCallOpen(true);
  };

  // Show onboarding explanation (check this first as it's a direct user action)
  if (showOnboardingExplanation) {
    return (
      <OnboardingExplanation
        onStartJourney={() => {
          setShowOnboardingExplanation(false);
          setShowBridgettePersonalization(true); // Skip AccountSetup since they just signed up
        }}
        onCancel={() => {
          // Skip Preview should go to dashboard with "Complete Setup" banner
          setShowOnboardingExplanation(false);
          // Clean up location state
          window.history.replaceState({}, document.title);
        }}
      />
    );
  }

  // Show account setup screen (check this before family onboarding)
  if (showAccountSetup) {
    return (
      <AccountSetup
        onComplete={(userData) => {
          // Store user data and show Bridgette personalization
          setCurrentUser(userData);
          setTempFamilyData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
          });
          setShowAccountSetup(false);
          setShowBridgettePersonalization(true);
        }}
      />
    );
  }

  // Show Bridgette Personalization (Step 4 in PRD flow)
  if (showBridgettePersonalization) {
    return (
      <BridgettePersonalization
        onComplete={(preferences) => {
          // Store preferences (could save to backend here)
          console.log('User preferences:', preferences);
          setShowBridgettePersonalization(false);
          setShowFamilyChoice(true);
        }}
      />
    );
  }

  // Show family choice (create new or link existing)
  if (showFamilyChoice) {
    return (
      <FamilyChoice
        onCreateNew={() => {
          setFamilyCodeMode('create');
          setShowFamilyChoice(false);
          // Pre-fill temp data for FamilyCodeSetup
          setTempFamilyData({
            familyName: `${currentUser?.lastName} Family`,
            parent1_name: `${currentUser?.firstName} ${currentUser?.lastName}`,
          });
          setShowFamilyCodeSetup(true);
        }}
        onLinkExisting={() => {
          setFamilyCodeMode('join');
          setShowFamilyChoice(false);
          setShowFamilyCodeSetup(true);
        }}
        onSkip={() => {
          setShowFamilyChoice(false);
          // This will fall through to the dashboard view
          // The banner will show because familyProfile is still null
        }}
      />
    );
  }

  // Show Family Code Setup (Step 4: Generate Code OR Join)
  if (showFamilyCodeSetup) {
    return (
      <FamilyCodeSetup
        mode={familyCodeMode}
        onSuccess={(familyData) => {
          if (familyCodeMode === 'join') {
            // Parent 2 successfully linked - go straight to dashboard
            setFamilyProfile(familyData as FamilyProfile);
            setShowFamilyCodeSetup(false);
            toast({
              title: "Welcome to Bridge!",
              description: "You've been successfully linked to your family!",
            });
          } else {
            // Parent 1 - Family code generated!
            // Store the created family profile
            setFamilyProfile(familyData as FamilyProfile);
            setShowFamilyCodeSetup(false);
            // Next step: Contract Upload
            setShowContractUpload(true);
          }
        }}
        onBack={() => {
          setShowFamilyCodeSetup(false);
          setShowFamilyChoice(true);
        }}
        familyName={tempFamilyData?.familyName}
        parent1Name={tempFamilyData?.parent1_name}
        parent2Name={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : undefined}
      />
    );
  }

  // Show Contract Upload (Step 5: Optional Contract)
  if (showContractUpload) {
    return (
      <ContractUpload
        onComplete={(parsedData) => {
          setShowContractUpload(false);
          // Next step: Detailed Family Onboarding
          setShowFamilyOnboarding(true);
        }}
        onSkip={() => {
          setShowContractUpload(false);
          // Next step: Detailed Family Onboarding
          setShowFamilyOnboarding(true);
        }}
        onBack={() => {
          setShowContractUpload(false);
          setShowFamilyCodeSetup(true);
        }}
      />
    );
  }

  // Show Family Onboarding (Step 6: Detailed Profile)
  if (showFamilyOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10">
        <FamilyOnboarding
          initialUserData={currentUser || undefined}
          currentFamilyProfile={familyProfile}
          onBack={() => {
            setShowFamilyOnboarding(false);
            setShowContractUpload(true);
          }}
          onComplete={async (profile) => {
            try {
              // Update the existing family with detailed info
              const updatedFamily = await familyAPI.updateFamily(profile);
              setFamilyProfile(updatedFamily);
              setShowFamilyOnboarding(false);
              toast({
                title: "Welcome to Bridge!",
                description: "Your family profile is complete!",
              });
            } catch (error) {
              console.error("Failed to update family profile:", error);
              toast({
                title: "Error",
                description: "Failed to save family profile details.",
                variant: "destructive",
              });
              // Still close onboarding to let user access dashboard (data might be partially saved)
              setShowFamilyOnboarding(false);
            }
          }}
        />
      </div>
    );
  }

  // Show onboarding flow
  if (showOnboarding && isFirstTime) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setShowOnboarding(false);
          setIsFirstTime(false);
        }}
      />
    );
  }

  // Show settings screen
  // Show settings screen
  if (showSettings) {
    return (
      <DashboardShell
        navItems={dashboardNavItems}
        activeItem="settings"
        onNavigate={changeTab}
        onLogout={handleLogoutClick}
        onOpenSettings={() => { }}
        onOpenChildren={familyProfile ? () => setShowChildManagement(true) : undefined}
        onCreateQuickAction={handleQuickAdd}
        onOpenMessages={handleOpenMessages}
        currentUser={currentUser}
        heroSubtitle={familyProfile?.familyName || 'Fair & Balanced Co-Parenting'}
      >
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <UserSettings
          initialProfile={currentUser || undefined}
          familyProfile={familyProfile}
        />
        {/* Global Call Components */}
        {incomingCall && (
          <IncomingCallAlert
            callerName={incomingCall.callerName}
            callType={incomingCall.callType || 'video'}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        )}
        
        {activeCallConversationId && currentUser && (
          <VideoCallModal
            isOpen={isVideoCallOpen}
            onClose={handleCallEnded}
            roomName={`room-${activeCallConversationId}`}
            username={`${currentUser.firstName} ${currentUser.lastName}`}
            isVideo={callType === 'video'}
          />
        )}
      </DashboardShell>
    );
  }

  // Show child management
  if (showChildManagement && familyProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setShowChildManagement(false)}>
              ← Back to Dashboard
            </Button>
          </div>
          <ChildManagement
            children={familyProfile.children}
            onAddChild={(child) => {
              setFamilyProfile(prev => prev ? {
                ...prev,
                children: [...prev.children, child]
              } : null);
            }}
            onUpdateChild={(childId, updates) => {
              setFamilyProfile(prev => prev ? {
                ...prev,
                children: prev.children.map(c =>
                  c.id === childId ? { ...c, ...updates } : c
                )
              } : null);
            }}
            onRemoveChild={(childId) => {
              setFamilyProfile(prev => prev ? {
                ...prev,
                children: prev.children.filter(c => c.id !== childId)
              } : null);
            }}
          />
          {/* Global Call Components */}
          {incomingCall && (
            <IncomingCallAlert
              callerName={incomingCall.callerName}
              callType={incomingCall.callType || 'video'}
              onAccept={handleAcceptCall}
              onDecline={handleDeclineCall}
            />
          )}
          
          {activeCallConversationId && currentUser && (
            <VideoCallModal
              isOpen={isVideoCallOpen}
              onClose={handleCallEnded}
              roomName={`room-${activeCallConversationId}`}
              username={`${currentUser.firstName} ${currentUser.lastName}`}
              isVideo={callType === 'video'}
            />
          )}
        </div>
      </div>
    );
  }

  if (currentUser?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-bridge-blue/5 to-bridge-green/5">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Bridge Admin Home</h1>
                <p className="text-sm text-slate-600">
                  Welcome back, {currentUser.firstName}! You have {pendingFamilyCount}{' '}
                  {pendingFamilyCount === 1 ? 'family' : 'families'} awaiting linkage.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Scale className="w-4 h-4 mr-2" />
                  Open Admin Console
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="border-gray-300 text-slate-700 hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutClick}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {adminLoading ? (
            <div className="min-h-[240px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {adminError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {adminError}
                </div>
              )}

              <Card className="mb-6 bg-gradient-to-r from-bridge-blue to-bridge-blue/80 text-white shadow-lg border-none">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">
                        Good morning, {currentUser.firstName}! ⚖️
                      </h2>
                      <p className="text-sm md:text-base text-white/90">
                        A quick snapshot of Bridge activity: {adminStats?.totalFamilies ?? '—'} total families,
                        {` `}
                        {adminStats?.totalUsers ?? '—'} caregivers, and {pendingFamilyCount}{' '}
                        pending {pendingFamilyCount === 1 ? 'invitation' : 'invitations'} to review.
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
                      <p className="text-xs uppercase tracking-wide text-white/80">At a glance</p>
                      <div className="mt-2 flex items-center gap-6">
                        <div>
                          <p className="text-2xl font-bold">{adminStats?.totalFamilies ?? '—'}</p>
                          <p className="text-xs text-white/80">Families</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{adminStats?.totalChildren ?? '—'}</p>
                          <p className="text-xs text-white/80">Children</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{pendingFamilyCount}</p>
                          <p className="text-xs text-white/80">Pending links</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {adminStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <Card className="border-t-4 border-indigo-300 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Total Families</p>
                          <p className="text-2xl font-semibold text-slate-900">{adminStats.totalFamilies}</p>
                        </div>
                        <Users className="w-8 h-8 text-indigo-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-t-4 border-green-300 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Linked Families</p>
                          <p className="text-2xl font-semibold text-slate-900 text-green-600">{adminStats.linkedFamilies}</p>
                        </div>
                        <UserCheck className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-t-4 border-orange-300 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Awaiting Link</p>
                          <p className="text-2xl font-semibold text-slate-900 text-orange-600">{adminStats.unlinkedFamilies}</p>
                        </div>
                        <UserX className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-t-4 border-purple-300 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Total Users</p>
                          <p className="text-2xl font-semibold text-slate-900 text-purple-600">{adminStats.totalUsers}</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-t-4 border-pink-300 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Children</p>
                          <p className="text-2xl font-semibold text-slate-900 text-pink-600">{adminStats.totalChildren}</p>
                        </div>
                        <Baby className="w-8 h-8 text-pink-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border border-indigo-100 bg-white/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Pending family links
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Families waiting for Parent 2 to finalize their connection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {adminPendingFamilies.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                        No pending family invitations right now.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {adminPendingFamilies.map((family) => {
                          const familyId = family.id || family._id || family.familyCode;
                          return (
                            <div
                              key={familyId || `${family.parent1?.email}-${family.familyCode}`}
                              className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm"
                            >
                              <div>
                                <p className="font-semibold text-slate-900">{family.familyName || 'Untitled Family'}</p>
                                <p className="text-sm text-slate-600">
                                  Primary contact: {family.parent1?.firstName} {family.parent1?.lastName} • {family.parent1?.email}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Family code: {family.familyCode || '—'} • Created {formatDate(family.createdAt)}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => familyId && navigate(`/admin/families/${familyId}`)}
                                disabled={!familyId}
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
                              >
                                Review
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-indigo-100 bg-white/90 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                      <Users className="w-5 h-5 text-indigo-500" />
                      Recent family activity
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Latest families created or linked in Bridge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {adminRecentFamilies.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                        No recent family activity to show yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {adminRecentFamilies.slice(0, 5).map((family) => {
                          const familyId = family.id || family._id || family.familyCode;
                          const isLinked = Boolean(family.isLinked);
                          return (
                            <div
                              key={`${familyId || family.familyName}-recent`}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900">{family.familyName || 'Untitled Family'}</p>
                                  <p className="text-xs text-slate-500">
                                    Created {formatDate(family.createdAt)}
                                    {family.linkedAt ? ` • Linked ${formatDate(family.linkedAt)}` : ''}
                                  </p>
                                </div>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${isLinked ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}
                                >
                                  {isLinked ? 'Linked' : 'Awaiting link'}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                  Parent 1: {family.parent1?.firstName} {family.parent1?.lastName}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => familyId && navigate(`/admin/families/${familyId}`)}
                                  disabled={!familyId}
                                  className="text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QuickActionCard
                    title="Manage Families"
                    description="Open the full admin console"
                    icon={Users}
                    color="blue"
                    onClick={() => navigate('/admin')}
                  />
                  <QuickActionCard
                    title="Pending Invitations"
                    description={pendingFamilyCount > 0 ? `${pendingFamilyCount} awaiting review` : 'All caught up'}
                    icon={AlertTriangle}
                    color="red"
                    onClick={() => navigate('/admin')}
                    urgent={pendingFamilyCount > 0}
                    badge={pendingFamilyCount > 0 ? String(pendingFamilyCount) : undefined}
                  />
                  <QuickActionCard
                    title="View User Directory"
                    description="See all caregivers across Bridge"
                    icon={BarChart3}
                    color="green"
                    onClick={() => navigate('/admin')}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <DashboardShell
      navItems={dashboardNavItems}
      activeItem={activeTab}
      onNavigate={changeTab}
      onLogout={handleLogoutClick}
      onOpenSettings={() => navigate('/settings', { replace: false })}
      onOpenChildren={familyProfile ? () => setShowChildManagement(true) : undefined}
      onCreateQuickAction={handleQuickAdd}
      onOpenMessages={handleOpenMessages}
      onStartTour={() => setShowTour(true)}
      currentUser={currentUser}
      heroSubtitle={familyProfile?.familyName || 'Fair & Balanced Co-Parenting'}
    >
      <>
        <style>{`
        @keyframes bridgette-float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
          }
        }

        @keyframes bridgette-talk {
          0%, 100% {
            transform: scaleY(1);
          }
          10% {
            transform: scaleY(0.95);
          }
          20% {
            transform: scaleY(1.02);
          }
          30% {
            transform: scaleY(0.98);
          }
          40% {
            transform: scaleY(1.01);
          }
          50% {
            transform: scaleY(0.97);
          }
          60% {
            transform: scaleY(1.03);
          }
          70% {
            transform: scaleY(0.96);
          }
          80% {
            transform: scaleY(1.01);
          }
          90% {
            transform: scaleY(0.99);
          }
        }

        @keyframes bridgette-wave {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }

        @keyframes bridgette-glow {
          0%, 100% {
            filter: drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3));
          }
          50% {
            filter: drop-shadow(0 8px 12px rgba(59, 130, 246, 0.5));
          }
        }

        .bridgette-animated {
          animation: 
            bridgette-float 3s ease-in-out infinite,
            bridgette-glow 2s ease-in-out infinite;
          transform-origin: center bottom;
        }

        .bridgette-animated:hover {
          animation: 
            bridgette-float 3s ease-in-out infinite,
            bridgette-talk 0.8s ease-in-out infinite,
            bridgette-wave 1s ease-in-out infinite,
            bridgette-glow 2s ease-in-out infinite;
        }

        .bridgette-container {
          position: relative;
        }

        .bridgette-container::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        .speech-bubble {
          position: relative;
          animation: bubble-appear 0.5s ease-out;
        }

        @keyframes bubble-appear {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
       `}</style>

        <div className="space-y-4 sm:space-y-6">
          <Tabs value={activeTab} onValueChange={changeTab} className="space-y-4 sm:space-y-6">
            <div className="w-full overflow-hidden sm:overflow-visible">
              <TabsList className="grid w-full grid-cols-6 bg-white rounded-lg sm:rounded-xl shadow-sm p-0.5 sm:p-0.5 lg:p-1 border-2 border-gray-200 h-auto lg:min-w-max" data-tour="navigation-tabs">
                <TabsTrigger 
                  value="dashboard" 
                  className="flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-0.5 lg:space-x-2 data-[state=active]:bg-bridge-blue data-[state=active]:text-white px-0.5 sm:px-1 lg:px-3 py-1 sm:py-1 lg:py-1.5 text-[9px] sm:text-[10px] lg:text-sm min-w-0"
                >
                  <Home className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  data-tour="calendar-tab"
                  className="flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-0.5 lg:space-x-2 data-[state=active]:bg-bridge-green data-[state=active]:text-white px-0.5 sm:px-1 lg:px-3 py-1 sm:py-1 lg:py-1.5 text-[9px] sm:text-[10px] lg:text-sm min-w-0"
                >
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">Calendar</span>
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  data-tour="messages-tab"
                  className="relative flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-0.5 lg:space-x-2 data-[state=active]:bg-bridge-yellow data-[state=active]:text-bridge-black px-0.5 sm:px-1 lg:px-3 py-1 sm:py-1 lg:py-1.5 text-[9px] sm:text-[10px] lg:text-sm min-w-0"
                >
                  <div className="relative">
                    <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex h-2 w-2 sm:h-2.5 sm:w-2.5 items-center justify-center rounded-full bg-red-500 ring-1 ring-white">
                        <span className="sr-only">New messages</span>
                      </span>
                    )}
                  </div>
                  <span className="truncate">Messages</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="expenses" 
                  data-tour="expenses-tab"
                  className="flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-0.5 lg:space-x-2 data-[state=active]:bg-bridge-red data-[state=active]:text-white px-0.5 sm:px-1 lg:px-3 py-1 sm:py-1 lg:py-1.5 text-[9px] sm:text-[10px] lg:text-sm min-w-0"
                >
                  <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">Expenses</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  data-tour="documents-tab"
                  className="flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-0.5 lg:space-x-2 data-[state=active]:bg-gray-600 data-[state=active]:text-white px-0.5 sm:px-1 lg:px-3 py-1 sm:py-1 lg:py-1.5 text-[9px] sm:text-[10px] lg:text-sm min-w-0"
                >
                  <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">Documents</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="resources" 
                  data-tour="resources-tab"
                  className="flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-0.5 lg:space-x-2 data-[state=active]:bg-bridge-blue data-[state=active]:text-white px-0.5 sm:px-1 lg:px-3 py-1 sm:py-1 lg:py-1.5 text-[9px] sm:text-[10px] lg:text-sm min-w-0"
                >
                  <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">Resources</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
              <Card className="bg-bridge-blue/5 border-2 border-bridge-blue/20 overflow-hidden" data-tour="dashboard-welcome">
                <CardContent className="p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95" onClick={triggerConfetti} title="Click for a surprise! 🎉">
                      <img
                        src="/bridgette-avatar.png"
                        alt="Bridgette"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white shadow-md bg-white object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0 speech-bubble">
                      <h2 className="text-lg sm:text-xl font-bold mb-1 text-bridge-black">
                        {celebrationMessage || `Good morning${currentUser ? ` ${currentUser.firstName}` : ''}, hope you are having a wonderful day.`}
                      </h2>
                      
                      {dashboardMetricsLoaded && (dashboardMetrics.pendingExpenseDetails.length > 0 || dashboardMetrics.upcomingEventDetails.length > 0) && (
                        <div className="mt-4 bg-white/40 rounded-lg p-3 sm:p-4 border border-white/50 shadow-sm">
                          <p className="text-bridge-black text-sm font-semibold mb-2 flex items-center gap-2">
                             Here are your reminders:
                          </p>
                          <ul className="space-y-2">
                            {dashboardMetrics.pendingExpenseDetails.map((expense) => (
                              <li
                                key={expense.id}
                                className="flex items-start gap-2 text-sm text-bridge-black/80 cursor-pointer hover:text-bridge-black transition-colors hover:bg-white/50 p-1 rounded -ml-1"
                                onClick={() => changeTab('expenses')}
                              >
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-bridge-red flex-shrink-0" />
                                <span className="break-words">
                                  <span className="font-medium">Expense Review:</span> {expense.description}
                                  {typeof expense.amount === 'number' && ` ($${expense.amount.toFixed(2)})`}
                                </span>
                              </li>
                            ))}
                            {dashboardMetrics.upcomingEventDetails.map((event) => (
                              <li
                                key={event.id}
                                className="flex items-start gap-2 text-sm text-bridge-black/80 cursor-pointer hover:text-bridge-black transition-colors hover:bg-white/50 p-1 rounded -ml-1"
                                onClick={() => changeTab('calendar')}
                              >
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-bridge-green flex-shrink-0" />
                                <span className="break-words">
                                  <span className="font-medium">Upcoming Event:</span> {event.title} on {event.dateLabel}
                                </span>
                              </li>
                            ))}
                          </ul>
                          
                          {dashboardMetrics.pendingExpenseDetails.length > 0 && (
                            <div className="mt-4 pt-2 border-t border-black/5">
                              <Button
                                onClick={() => changeTab('expenses')}
                                className="bg-bridge-red hover:bg-red-600 text-white font-medium text-sm h-8"
                              >
                                Review Expenses
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div data-tour="quick-actions">
                <h3 className="text-base sm:text-lg font-bold text-bridge-black mb-3 sm:mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <QuickActionCard
                    title="Schedule Event"
                    description="Add to shared calendar"
                    icon={Calendar}
                    color="green"
                    onClick={() => changeTab('calendar')}
                  />
                  <QuickActionCard
                    title="Send Message"
                    description="Communicate securely"
                    icon={MessageSquare}
                    color="yellow"
                    onClick={() => changeTab('messages')}
                    badge={unreadMessagesCount > 0 ? String(unreadMessagesCount) : undefined}
                  />
                  <QuickActionCard
                    title="Review Expense"
                    description="Pending approval needed"
                    icon={DollarSign}
                    color="red"
                    onClick={() => changeTab('expenses')}
                    urgent={true}
                    badge="URGENT"
                  />
                  <QuickActionCard
                    title="View Documents"
                    description="Access agreements"
                    icon={FileText}
                    color="blue"
                    onClick={() => changeTab('documents')}
                  />
                </div>
              </div>

              {!familyProfileLoading && !familyProfile && (
                <Card className="border-2 border-yellow-200 bg-yellow-50">
                  <CardContent className="p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-bridge-black mb-2">Complete Your Family Setup</h3>
                        <p className="text-bridge-black text-xs sm:text-sm">
                          Add information about your family to get personalized organization and support
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowFamilyChoice(true)}
                        className="bg-bridge-yellow hover:bg-yellow-400 text-bridge-black border-2 border-gray-400 text-sm sm:text-base w-full sm:w-auto"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Set Up Family Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <ProgressBar
                  progress={85}
                  title="Co-parenting Balance"
                  subtitle="Great progress this month!"
                  showTrophy={false}
                />
                <ProgressBar
                  progress={100}
                  title="January Setup"
                  subtitle="All systems ready!"
                  showTrophy={true}
                />
              </div>

              <div data-tour="recent-activity">
                <RecentActivity
                  onNavigateToExpenses={() => changeTab('expenses')}
                  onNavigateToCalendar={() => changeTab('calendar')}
                  onNavigateToMessages={() => changeTab('messages')}
                  currentUser={currentUser}
                />
              </div>

            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView
                familyProfile={familyProfile}
                currentUser={currentUser || undefined}
                onNavigateToMessages={() => changeTab('messages')}
              />
            </TabsContent>

            <TabsContent value="messages">
              <MessagingInterface
                onStartCall={(conversationId, type) => {
                  handleStartCall(conversationId, type);
                }}
                activeConversationId={activeCallConversationId}
              />
            </TabsContent>

            <TabsContent value="expenses">
              <ExpenseTracker familyProfile={familyProfile} />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentManager />
            </TabsContent>

            <TabsContent value="resources">
              <EducationalResources currentUserName={currentUser?.firstName} />
            </TabsContent>
          </Tabs>
        </div>
        {/* Global Call Components */}
        {incomingCall && (
          <IncomingCallAlert
            callerName={incomingCall.callerName}
            callType={incomingCall.callType || 'video'}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        )}
        
        {activeCallConversationId && currentUser && (
          <VideoCallModal
            isOpen={isVideoCallOpen}
            onClose={handleCallEnded}
            roomName={`room-${activeCallConversationId}`}
            username={`${currentUser.firstName} ${currentUser.lastName}`}
            isVideo={callType === 'video'}
          />
        )}

        <SupportChatbot
          isOpen={showSupportChatbot}
          onClose={() => setShowSupportChatbot(false)}
          parentName={currentUser?.firstName}
        />
        <ProductTour
          run={showTour}
          onComplete={async () => {
            setShowTour(false);
            // Update user's tourCompleted status
            try {
              await authAPI.updateUserProfile({ tourCompleted: true });
            } catch (error) {
              console.error('Error updating tour completion status:', error);
            }
          }}
        />
      </>
    </DashboardShell>
  );
};

export default Index;