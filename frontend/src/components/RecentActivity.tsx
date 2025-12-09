import React, { useState, useEffect, useCallback } from 'react';
import { Users, DollarSign, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { activityAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'expense_pending' | 'expense_approved' | 'calendar_confirmed' | 'calendar_update' | 'message' | 'change_request';
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
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  onNavigateToExpenses,
  onNavigateToCalendar,
  onNavigateToMessages,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchActivities();
    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const handleReviewExpense = (expenseId: string) => {
    if (onNavigateToExpenses) {
      onNavigateToExpenses();
    }
    // The expense tab will be active, user can review there
  };

  const handleReviewChangeRequest = () => {
    if (onNavigateToCalendar) {
      onNavigateToCalendar();
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
      default:
        return AlertCircle;
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-bridge-blue">
        <CardHeader>
          <CardTitle className="flex items-center text-bridge-black">
            <Users className="w-5 h-5 mr-2 text-bridge-blue" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-2 border-bridge-blue">
        <CardHeader>
          <CardTitle className="flex items-center text-bridge-black">
            <Users className="w-5 h-5 mr-2 text-bridge-blue" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm text-center py-4">
            No recent activity to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-bridge-blue">
      <CardHeader>
        <CardTitle className="flex items-center text-bridge-black">
          <Users className="w-5 h-5 mr-2 text-bridge-blue" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const colorClasses = getColorClasses(activity.color);
            const Icon = getActivityIcon(activity.type);
            const isPulsing = activity.actionRequired && activity.color === 'red';

            return (
              <div
                key={activity.id}
                className={`flex items-center space-x-3 p-3 ${colorClasses.bg} rounded-lg border-l-4 ${colorClasses.border}`}
              >
                <div
                  className={`w-2 h-2 ${colorClasses.dot} rounded-full ${isPulsing ? 'animate-pulse' : ''}`}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-bridge-black">
                    {activity.type === 'expense_pending' && (
                      <span className="text-bridge-red font-semibold">PENDING: </span>
                    )}
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">{activity.relativeTime}</p>
                </div>
                {activity.actionRequired && (
                  <Button
                    size="sm"
                    className={`${
                      activity.color === 'red'
                        ? 'bg-bridge-red hover:bg-red-600 text-white'
                        : 'bg-bridge-blue hover:bg-blue-600 text-white'
                    }`}
                    onClick={() => {
                      if (activity.type === 'expense_pending' && activity.expenseId) {
                        handleReviewExpense(activity.expenseId);
                      } else if (activity.type === 'change_request') {
                        handleReviewChangeRequest();
                      }
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

