import React, { useState, useEffect, useCallback } from 'react';
import { Users, DollarSign, Calendar, MessageSquare, AlertCircle, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { activityAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface Activity {
  id: string;
  type: 'expense_pending' | 'expense_approved' | 'calendar_confirmed' | 'calendar_update' | 'message' | 'change_request' | 'call';
  title: string;
  description?: string;
  amount?: number;
  expenseId?: string;
  color: 'red' | 'green' | 'blue' | 'yellow';
  createdAt: string;
  relativeTime: string;
  actionRequired: boolean;
}

interface RecentActivityProps {
  onNavigateToExpenses?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToMessages?: () => void;
  currentUser?: { email: string } | null;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  onNavigateToExpenses,
  onNavigateToCalendar,
  onNavigateToMessages,
  currentUser,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activityAPI.getRecentActivity();
      // If no family exists (404), data will be null - just show empty state
      setActivities(data || []);
    } catch (error: any) {
      // Only show error if it's not a 404 (no family found)
      if (!error.message?.includes('404') && !error.message?.includes('not found')) {
        console.error('Error fetching activities:', error);
        toast({
          title: "Error",
          description: "Failed to load recent activity",
          variant: "destructive",
        });
      } else {
        // No family found - just show empty state silently
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (lastMessage) {
        const data = lastMessage;
        if (data.type === 'refresh_activities' ||
            data.type === 'new_message' ||
            data.type === 'refresh_calendar' ||
            data.type === 'refresh_expenses') {
          // console.log('Received refresh event:', data.type);
          fetchActivities();
        }
    }
  }, [lastMessage, fetchActivities]);

  useEffect(() => {
    fetchActivities();
    
    // Poll for new activities every 30 seconds as backup
    const interval = setInterval(fetchActivities, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchActivities]);

  const handleActivityClick = (activity: Activity) => {
    switch (activity.type) {
      case 'expense_pending':
      case 'expense_approved':
        if (onNavigateToExpenses) onNavigateToExpenses();
        break;
      case 'calendar_confirmed':
      case 'calendar_update':
      case 'change_request':
        if (onNavigateToCalendar) onNavigateToCalendar();
        break;
      case 'message':
      case 'call':
        if (onNavigateToMessages) onNavigateToMessages();
        break;
    }
  };

  const handleDismiss = async (e: React.MouseEvent, activityId: string) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    // Optimistically remove from UI
    setActivities(prev => prev.filter(a => a.id !== activityId));

    try {
      await activityAPI.dismissActivity(activityId);
    } catch (error) {
      console.error('Error dismissing activity:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss notification",
        variant: "destructive",
      });
      // Re-fetch to restore state if failed
      fetchActivities();
    }
  };

  const handleDismissAll = async () => {
    if (activities.length === 0) return;

    // Optimistically clear UI
    const currentActivities = [...activities];
    const activityIds = currentActivities.map(a => a.id);
    setActivities([]);

    try {
      await activityAPI.dismissAllActivities(activityIds);
      toast({
        title: "Cleared",
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error('Error clearing activities:', error);
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
      // Restore state if failed
      setActivities(currentActivities);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-bridge-red',
          dot: 'bg-bridge-red',
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          border: 'border-bridge-green',
          dot: 'bg-bridge-green',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-bridge-blue',
          dot: 'bg-bridge-blue',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-400',
          dot: 'bg-yellow-400',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          dot: 'bg-gray-300',
        };
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'expense_pending':
      case 'expense_approved':
        return DollarSign;
      case 'calendar_confirmed':
      case 'calendar_update':
      case 'change_request':
        return Calendar;
      case 'message':
        return MessageSquare;
      case 'call':
        return Phone;
      default:
        return AlertCircle;
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-bridge-blue">
        <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-bridge-black text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-bridge-blue" />
            Recent Activity
          </CardTitle>
          {activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissAll}
              className="text-xs text-gray-500 hover:text-bridge-red hover:bg-red-50 h-8"
            >
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-bridge-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-bridge-blue">
      <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-bridge-black text-base sm:text-lg">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-bridge-blue" />
          Recent Activity
        </CardTitle>
        {activities.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissAll}
            className="text-xs text-gray-500 hover:text-bridge-red hover:bg-red-50 h-8"
          >
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 sm:space-y-4">
          {activities.map((activity) => {
            const colorClasses = getColorClasses(activity.color);
            const Icon = getActivityIcon(activity.type);
            const isPulsing = activity.actionRequired && activity.color === 'red';

            return (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 ${colorClasses.bg} rounded-lg border-l-4 ${colorClasses.border} cursor-pointer hover:shadow-md transition-shadow pr-8`}
              >
                <button
                  onClick={(e) => handleDismiss(e, activity.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-1">
                  <div
                    className={`w-2 h-2 ${colorClasses.dot} rounded-full flex-shrink-0 ${isPulsing ? 'animate-pulse' : ''}`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-bridge-black break-words pr-4">
                      {activity.type === 'expense_pending' && (
                        <span className="text-bridge-red font-semibold">PENDING: </span>
                      )}
                      {activity.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{activity.relativeTime}</p>
                  </div>
                </div>
                {activity.actionRequired && (
                  <Button
                    size="sm"
                    className={`w-full sm:w-auto text-xs sm:text-sm ${
                      activity.color === 'red'
                        ? 'bg-bridge-red hover:bg-red-600 text-white'
                        : 'bg-bridge-blue hover:bg-blue-600 text-white'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivityClick(activity);
                    }}
                  >
                    Review
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;

