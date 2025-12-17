import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Smile, FileText, AlertCircle, CheckCircle, Search, Filter, Plus, MessageSquare, Calendar, User, Clock, Star, Archive, MoreVertical, Loader2, Check, CheckCheck, Video, Phone, PhoneOff, PhoneMissed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import BridgetteAvatar from './BridgetteAvatar';
import { messagingAPI, authAPI } from '@/lib/api';
import VideoCallModal from './VideoCallModal';
import IncomingCallAlert from './IncomingCallAlert';

interface Message {
  id: string;
  conversationId: string;
  senderEmail: string;
  content: string;
  timestamp: string;
  tone: 'matter-of-fact' | 'friendly' | 'neutral-legal' | 'system';
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'call_start' | 'call_end' | 'call_missed';
}

interface Conversation {
  id: string;
  subject: string;
  category: 'custody' | 'medical' | 'school' | 'activities' | 'financial' | 'general' | 'urgent';
  participants: string[];
  messageCount: number;
  lastMessageAt: string | null;
  unreadCount: number;
  isStarred: boolean;
  isArchived: boolean;
}

interface CurrentUser {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

const MessagingInterface: React.FC = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState<'matter-of-fact' | 'friendly' | 'neutral-legal'>('friendly');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationSubject, setNewConversationSubject] = useState('');
  const [newConversationCategory, setNewConversationCategory] = useState<'custody' | 'medical' | 'school' | 'activities' | 'financial' | 'general' | 'urgent'>('general');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const conversationPollingRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  const isVideoCallOpenRef = useRef<boolean>(false);

  // Keep ref in sync with state
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);
  
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  // Sync ref with state
  useEffect(() => {
    isVideoCallOpenRef.current = isVideoCallOpen;
  }, [isVideoCallOpen]);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    roomName: string;
    conversationId: string;
    initiatorEmail: string;
    callType?: 'video' | 'audio';
  } | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const categoryColors = {
    custody: 'bg-blue-100 text-blue-800',
    medical: 'bg-red-100 text-red-800',
    school: 'bg-green-100 text-green-800',
    activities: 'bg-purple-100 text-purple-800',
    financial: 'bg-yellow-100 text-yellow-800',
    general: 'bg-gray-100 text-gray-800',
    urgent: 'bg-orange-100 text-orange-800'
  };

  const categoryIcons = {
    custody: Calendar,
    medical: AlertCircle,
    school: FileText,
    activities: Star,
    financial: FileText,
    general: MessageSquare,
    urgent: AlertCircle
  };

  const toneDescriptions = {
    'matter-of-fact': 'Direct and clear communication',
    'friendly': 'Warm and collaborative tone',
    'neutral-legal': 'Professional and documented'
  };

  const toneColors = {
    'matter-of-fact': 'bg-blue-100 text-blue-800',
    'friendly': 'bg-green-100 text-green-800',
    'neutral-legal': 'bg-gray-100 text-gray-800'
  };

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user information",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchConversations = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;
    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await messagingAPI.getConversations();
      setConversations(data);
      
      // Select first conversation if none is selected
      if (data.length > 0 && !activeConversationRef.current) {
        setActiveConversation(data[0].id);
      }
    } catch (error: any) {
      // Handle empty states gracefully - don't show error toasts
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No conversations')) {
        // Empty state - not an error, just set empty array
        setConversations([]);
      } else {
        console.error('Error fetching conversations:', error);
        // Only log real errors, don't show toast
        setConversations([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string, pageNum: number = 1, options: { silent?: boolean; append?: boolean } = {}) => {
    const { silent = false, append = false } = options;
    if (!silent && !append) {
      setLoadingMessages(true);
    }
    if (append) {
      setIsFetchingMore(true);
    }
    
    try {
      const data = await messagingAPI.getMessages(conversationId, pageNum);
      const { messages: newMessages, pagination } = data;
      
      setMessages((prev) => {
        const optimistic = prev.filter((msg) => msg.id.startsWith('temp-'));
        
        // If appending (loading older messages), put them at the start
        if (append) {
          // Remove duplicates just in case
          const uniqueNew = newMessages.filter((nm: Message) => !prev.some(pm => pm.id === nm.id));
          return [...uniqueNew, ...prev];
        }
        
        // If regular load, replace but keep optimistic
        const merged = [...newMessages];
        optimistic.forEach((msg) => {
          if (!merged.some((existing) => existing.id === msg.id)) {
            merged.push(msg);
          }
        });
        return merged;
      });
      
      setHasMore(pagination.hasMore);
      setPage(pageNum);
      
    } catch (error: any) {
      // Handle empty states gracefully - don't show error toasts
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No messages')) {
        // Empty state - not an error, just set empty array
        setMessages([]);
      } else {
        console.error('Error fetching messages:', error);
        // Only log real errors, don't show toast
        setMessages([]);
      }
    } finally {
      if (!silent && !append) {
        setLoadingMessages(false);
      }
      if (append) {
        setIsFetchingMore(false);
      }
    }
  }, [toast]);

  // Fetch current user and conversations on mount
  useEffect(() => {
    fetchCurrentUser();
    fetchConversations();
    
    // Polling only for conversation list updates (less frequent)
    conversationPollingRef.current = window.setInterval(() => {
      fetchConversations({ silent: true });
    }, 3000); // Increased to 3s to reduce load further

    return () => {
      if (conversationPollingRef.current) {
        window.clearInterval(conversationPollingRef.current);
      }
    };
  }, [fetchCurrentUser, fetchConversations]);

  // WebSocket Connection
  useEffect(() => {
    if (!currentUser?.email) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const WS_URL = API_URL.replace(/^http/, 'ws') + `/api/v1/messaging/ws/${currentUser.email}`;
    
    console.log('Connecting to WebSocket:', WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Typing Indicator
        if (data.type === 'typing') {
          setActiveConversation(currentActive => {
            if (currentActive === data.conversationId) {
              setIsTyping(true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
            return currentActive;
          });
          return;
        }

        // Call Rejected or Ended
        if (data.type === 'call_rejected' || data.type === 'call_end') {
          setIsVideoCallOpen(false);
          if (data.type === 'call_rejected') {
            toast({
              title: "Call Declined",
              description: "The other party unavailable or declined the call.",
              variant: "default",
            });
          }
          return;
        }

        // Video Call Started
        if (data.type === 'video_call_started') {
          const initiator = data.initiatorEmail?.trim().toLowerCase();
          const me = currentUser?.email?.trim().toLowerCase();
          
          console.log('[WS] Call started event:', { initiator, me, isInCall: isVideoCallOpenRef.current });

          // Also check if we are already in a call (using ref to avoid stale closure)
          if (currentUser && initiator && me && initiator !== me && !isVideoCallOpenRef.current) {
             setIncomingCall({
               callerName: data.initiatorName,
               roomName: data.roomName,
               conversationId: data.conversationId,
               initiatorEmail: data.initiatorEmail,
               callType: data.callType || 'video'
             });
          } else {
            console.log('[WS] Ignoring call event - either own call or already in call');
          }
          return;
        }

        // New Message
        if (data.type === 'new_message' || data.id) {
           // Check for call_end type specifically to close modal
           // The backend sends 'type' as the message type ('text', 'call_end', etc.)
           // BUT our backend wrapper might put it in a different field or the structure varies.
           // Based on backend code: ws_payload = {**response_data, "type": "new_message"}
           // So the original type is likely overwritten or lost if not careful.
           // Let's check the message content or other fields if available.
           // Actually, in the previous step I updated backend to preserve messageType.
           
           if (data.messageType === 'call_end' || data.content === 'Call ended') {
              setIsVideoCallOpen(false);
           }

           // Clear typing indicator on new message
           setIsTyping(false);
           
           // Check if message belongs to active conversation
           const msgConvId = data.conversationId || data.conversation_id;
           
           if (activeConversationRef.current && activeConversationRef.current === msgConvId) {
             // Refresh messages for the active conversation to ensure we have the latest state
             // This is safer than manual appending as it handles formatting and optimistic states correctly
             fetchMessages(msgConvId, 1, { silent: true });
           }
           
           // Always refresh conversations list to update unread counts and ordering in sidebar
           fetchConversations({ silent: true });
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      // Simple reconnect logic could go here
    };

    return () => {
      ws.close();
    };
  }, [currentUser, fetchConversations, fetchMessages]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setMessages([]);
      setPage(1);
      setHasMore(false);
      setIsTyping(false);
      fetchMessages(activeConversation, 1);
    } else {
      setMessages([]);
    }
  }, [activeConversation, fetchMessages]);

  // Scroll handling
  useEffect(() => {
    // Only scroll to bottom on initial load (page 1) or when new message is sent/received
    // NOT when loading older messages
    if (page === 1 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Use timeout to allow render
      setTimeout(() => {
         container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [messages, page, activeConversation]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && hasMore && !isFetchingMore && activeConversation) {
        // Load previous page
        const nextPage = page + 1;
        // Save current scroll height to maintain position after load
        const currentScrollHeight = messagesContainerRef.current.scrollHeight;
        
        fetchMessages(activeConversation, nextPage, { append: true }).then(() => {
          // Adjust scroll position to keep user at same relative point
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
          }
        });
      }
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || conv.category === filterCategory;
    const notArchived = !conv.isArchived;
    return matchesSearch && matchesFilter && notArchived;
  });

  const activeConv = conversations.find(conv => conv.id === activeConversation);

  const handleTyping = () => {
    if (!wsRef.current || !activeConversation || !currentUser) return;
    
    // Find recipient
    const currentConv = conversations.find(c => c.id === activeConversation);
    const recipient = currentConv?.participants.find(p => p !== currentUser.email);
    
    if (recipient) {
      // Send typing event (debouncing could be added here if needed)
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        conversationId: activeConversation,
        recipientEmail: recipient
      }));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser || isSending) return;

    try {
      setIsSending(true);
      const tempId = `temp-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const optimisticMessage: Message = {
        id: tempId,
        conversationId: activeConversation,
        senderEmail: currentUser.email,
        content: newMessage,
        tone: selectedTone,
        timestamp: createdAt,
        status: 'sent',
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage('');

      const response = await messagingAPI.sendMessage({
        conversation_id: activeConversation,
        content: newMessage,
        tone: selectedTone,
      });
      
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? response : msg))
      );
      fetchConversations({ silent: true });
     // fetchMessages(activeConversation, { silent: true }); // No need to refetch entire list, we updated optimistically and WS will confirm if needed
      
      // Removed "Message sent" toast as requested
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message if send failed
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('temp-')));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const createNewConversation = async () => {
    if (!newConversationSubject.trim()) return;

    try {
      const newConv = await messagingAPI.createConversation({
        subject: newConversationSubject,
        category: newConversationCategory,
      });

      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv.id);
      setNewConversationSubject('');
      setNewConversationCategory('general');
      setShowNewConversation(false);
      
      toast({
        title: "Conversation created",
        description: "Start messaging with your co-parent",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      const description = error instanceof Error ? error.message : "Failed to create conversation";
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  };

  const toggleStar = async (convId: string) => {
    try {
      await messagingAPI.toggleStar(convId);
      setConversations(prev => prev.map(conv => 
        conv.id === convId ? { ...conv, isStarred: !conv.isStarred } : conv
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      setActiveConversation(incomingCall.conversationId);
      setCallType(incomingCall.callType || 'video');
      setIsVideoCallOpen(true);
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const handleDeclineCall = useCallback(() => {
    if (incomingCall && wsRef.current) {
      // Notify server about rejection
      wsRef.current.send(JSON.stringify({
        type: 'call_rejected',
        conversationId: incomingCall.conversationId,
        recipientEmail: incomingCall.initiatorEmail // Reply directly to caller
      }));
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const handleCallEnded = async () => {
    setIsVideoCallOpen(false);
    if (activeConversation) {
      try {
        await messagingAPI.sendMessage({
          conversation_id: activeConversation,
          content: "Call ended",
          tone: "neutral-legal",
          type: "call_end"
        });
        
        // Notify the other user via WebSocket to close their modal too
        // We do this by sending a specific WebSocket message, if needed,
        // OR relying on the 'call_end' message type if the backend forwards it properly.
        // The current backend implementation for 'sendMessage' already broadcasts the new message.
        // We just need to handle the 'call_end' message type in the frontend's onmessage handler (done above).

        // Refresh conversations to show new message
        fetchConversations({ silent: true });
      } catch (error) {
        console.error("Failed to log call end:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Incoming Call Alert */}
      {incomingCall && (
        <IncomingCallAlert
          callerName={incomingCall.callerName}
          callType={incomingCall.callType || 'video'}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
      {/* Bridgette Helper */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <BridgetteAvatar size="md" expression="encouraging" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                Hey {currentUser?.firstName || 'there'}, I'm here to help with your conversations!
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Organize your conversations by subject and category to easily find important discussions later! All messages are encrypted and logged for legal documentation. 💬
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-2xl shadow-lg h-[600px] sm:h-[700px] flex flex-col sm:flex-row">
        {/* Conversations Sidebar */}
        <div className="w-full sm:w-1/3 border-r-0 sm:border-r border-gray-200 border-b sm:border-b-0 flex flex-col h-1/2 sm:h-auto">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Messages</h2>
              <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-xs sm:text-sm">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md mx-4 sm:mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Start New Conversation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <div className="relative mt-1">
                        <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="subject"
                          value={newConversationSubject}
                          onChange={(e) => setNewConversationSubject(e.target.value)}
                          placeholder="What's this conversation about?"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newConversationCategory}
                        onValueChange={(value) =>
                          setNewConversationCategory(value as Conversation['category'])
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custody">Custody & Scheduling</SelectItem>
                          <SelectItem value="medical">Medical & Health</SelectItem>
                          <SelectItem value="school">School & Education</SelectItem>
                          <SelectItem value="activities">Activities & Sports</SelectItem>
                          <SelectItem value="financial">Financial & Expenses</SelectItem>
                          <SelectItem value="urgent">Urgent Matter</SelectItem>
                          <SelectItem value="general">General Discussion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={createNewConversation} className="flex-1">
                        Start Conversation
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewConversation(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="custody">Custody & Scheduling</SelectItem>
                  <SelectItem value="medical">Medical & Health</SelectItem>
                  <SelectItem value="school">School & Education</SelectItem>
                  <SelectItem value="activities">Activities & Sports</SelectItem>
                  <SelectItem value="financial">Financial & Expenses</SelectItem>
                  <SelectItem value="urgent">Urgent Matters</SelectItem>
                  <SelectItem value="general">General Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500">Loading conversations...</p>
                {/* Skeleton loaders */}
                <div className="w-full space-y-3 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="w-6 h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const CategoryIcon = categoryIcons[conv.category];
                
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeConversation === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <CategoryIcon className="w-4 h-4 text-gray-500" />
                        <h3 className={`font-medium text-sm truncate ${conv.unreadCount > 0 ? 'font-bold' : ''}`}>
                          {conv.subject}
                        </h3>
                        {conv.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      </div>
                      <div className="flex items-center space-x-1">
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                            {conv.unreadCount}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(conv.id);
                          }}
                          className="p-1 h-auto"
                        >
                          <Star className={`w-3 h-3 ${conv.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        </Button>
                      </div>
                    </div>
                    
                    <Badge className={`${categoryColors[conv.category]} text-xs mb-2`}>
                      {conv.category}
                    </Badge>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>{formatTime(conv.lastMessageAt)}</span>
                      <span>{conv.messageCount} messages</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-1/2 sm:h-auto">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-gray-200 bg-bridge-blue/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">{activeConv.subject}</h2>
                      <div className="flex items-center space-x-2 mt-1 flex-wrap">
                        <Badge className={`${categoryColors[activeConv.category]} text-xs`}>
                          {activeConv.category}
                        </Badge>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {activeConv.messageCount} messages
                        </span>
                      </div>
                    </div>
                    {loadingMessages && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        setCallType('audio');
                        setIsVideoCallOpen(true);
                      }}
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        setCallType('video');
                        setIsVideoCallOpen(true);
                      }}
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Call</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsVideoCallOpen(true)}
                      className="sm:hidden text-blue-600"
                    >
                      <Video className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStar(activeConv.id)}
                    >
                      <Star className={`w-4 h-4 ${activeConv.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 p-4 overflow-y-auto space-y-4"
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {isFetchingMore && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  </div>
                )}
                
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-gray-500">Loading messages...</p>
                    {/* Skeleton loaders for messages */}
                    <div className="w-full space-y-4 mt-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-300 rounded w-full"></div>
                              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = currentUser && message.senderEmail === currentUser.email;
                    
                    // Handle System Messages (Calls)
                    if (message.type === 'call_start' || message.type === 'call_missed' || message.type === 'call_end') {
                       return (
                         <div key={message.id} className="flex justify-center my-4">
                           <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-2 text-xs text-gray-600">
                             {message.type === 'call_missed' ? (
                               <PhoneMissed className="w-3 h-3 text-red-500" />
                             ) : message.type === 'call_start' ? (
                               <Phone className="w-3 h-3 text-blue-500" />
                             ) : (
                               <PhoneOff className="w-3 h-3 text-gray-500" />
                             )}
                             <span>
                               {isCurrentUser ? 'You ' : ''}
                               {message.content}
                               <span className="opacity-50 ml-2">
                                 {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </span>
                           </div>
                         </div>
                       );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                        }`}>
                          {/* Tone Badge */}
                          <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                            isCurrentUser ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {message.tone}
                          </div>
                          
                          {/* Content */}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Footer: Time & Status */}
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                             isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            
                            {isCurrentUser && (
                              <span className="ml-1">
                                {message.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 opacity-70" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing Indicator */}
                {isTyping && (
                   <div className="flex justify-start">
                     <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1">
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                     </div>
                   </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="mb-3">
                  <Select
                    value={selectedTone}
                    onValueChange={(value) => setSelectedTone(value as Message['tone'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">
                        <div className="flex items-center">
                          <Smile className="w-4 h-4 mr-2 text-green-500" />
                          <div>
                            <div className="font-medium">Friendly</div>
                            <div className="text-xs text-gray-500">Warm and collaborative</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="matter-of-fact">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
                          <div>
                            <div className="font-medium">Matter-of-fact</div>
                            <div className="text-xs text-gray-500">Direct and clear</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="neutral-legal">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-gray-500" />
                          <div>
                            <div className="font-medium">Neutral Legal</div>
                            <div className="text-xs text-gray-500">Professional and documented</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 resize-none min-h-[50px]"
                    rows={1}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending}>
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  🔒 All messages are encrypted and logged for legal documentation
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      {activeConv && currentUser && (
        <VideoCallModal
          isOpen={isVideoCallOpen}
          onClose={handleCallEnded}
          roomName={`room-${activeConv.id}`}
          username={`${currentUser.firstName} ${currentUser.lastName}`}
          isVideo={callType === 'video'}
        />
      )}
    </div>
  );
};

export default MessagingInterface;