import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ArrowRightLeft,
  XCircle,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { CalendarEvent, ChangeRequest } from '@/types/calendar';
import { FamilyProfile } from '@/types/family';
import {
  eventColors,
  formatTimeOnly,
  monthNames,
  getParentDisplayName,
  isEventCreator,
  formatDateTime,
  US_TIME_ZONES
} from '@/utils/calendarUtils';

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: CalendarEvent | null;
  currentMonth: Date;
  selectedTimeZone: string;
  changeRequests: ChangeRequest[];
  currentUser?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  familyProfile: FamilyProfile | null;
  processingRequestId: string | null;
  onApproveRequest: (requestId: string) => Promise<void>;
  onRejectRequest: (requestId: string) => Promise<void>;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onRequestChange: () => void;
}

const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedEvent,
  currentMonth,
  selectedTimeZone,
  changeRequests,
  currentUser,
  familyProfile,
  processingRequestId,
  onApproveRequest,
  onRejectRequest,
  onEditEvent,
  onDeleteEvent,
  onRequestChange,
}) => {
  if (!selectedEvent) return null;

  const selectedTimeZoneLabel =
    US_TIME_ZONES.find((tz) => tz.value === selectedTimeZone)?.label || 'Eastern (ET)';

  const pendingRequestsForEvent = changeRequests.filter(
    (r) => r.originalEvent.id === selectedEvent.id && r.status === 'pending'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Event Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Event Title and Type */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedEvent.title}
              </h3>
              <Badge className={eventColors[selectedEvent.type]}>
                {selectedEvent.type.charAt(0).toUpperCase() +
                  selectedEvent.type.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                <strong>Date:</strong>{' '}
                {monthNames[currentMonth.getMonth()]} {selectedEvent.date},{' '}
                {currentMonth.getFullYear()}
              </span>
            </div>
            {selectedEvent.hasTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  <strong>Time:</strong>{' '}
                  {formatTimeOnly(selectedEvent.fullDate, selectedTimeZone)}
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
                    : getParentDisplayName(selectedEvent.parent, familyProfile, currentUser)}
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
          {pendingRequestsForEvent.length > 0 && (
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
                  const currentUserEmail = currentUser?.email
                    ?.toLowerCase()
                    ?.trim();
                  const requesterEmail = request.requestedByEmail
                    ?.toLowerCase()
                    ?.trim();
                  const isCurrentUserRequester =
                    currentUserEmail === requesterEmail;
                  const canApproveReject =
                    !isCurrentUserRequester && !!currentUserEmail;

                  return (
                    <Card
                      key={request.id}
                      className="border-orange-200 bg-orange-50"
                    >
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-800">
                              {request.requestedBy === 'mom'
                                ? 'You'
                                : 'Your co-parent'}{' '}
                              wants to {request.type} this event
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-orange-300 text-orange-600 text-xs"
                          >
                            {request.type}
                          </Badge>
                        </div>

                        <div className="bg-white rounded p-2 text-sm">
                          <p className="font-medium text-gray-700 mb-1">
                            Reason:
                          </p>
                          <p className="text-gray-600 text-xs">
                            {request.reason}
                          </p>
                        </div>

                        {request.consequences.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-xs font-medium text-yellow-800 mb-1">
                              What will change:
                            </p>
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
                              disabled={processingRequestId === request.id}
                              onClick={() => onApproveRequest(request.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingRequestId === request.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingRequestId === request.id}
                              onClick={() => onRejectRequest(request.id)}
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              {processingRequestId === request.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        ) : isCurrentUserRequester ? (
                          // Show Cancel button if current user is the requester
                          <div className="space-y-2">
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-xs text-blue-800 text-center mb-2">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Waiting for{' '}
                                {isEventCreator(selectedEvent, currentUser)
                                  ? 'the other parent'
                                  : 'event creator'}{' '}
                                to respond
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingRequestId === request.id}
                              onClick={() => onRejectRequest(request.id)}
                              className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              {processingRequestId === request.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
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
                          Requested{' '}
                          {formatDateTime(request.timestamp, selectedTimeZone)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2 pt-2">
            {isEventCreator(selectedEvent, currentUser) ? (
              // Creator can edit/delete directly
              <div className="flex-1 flex gap-2">
                <Button
                  onClick={() => onEditEvent(selectedEvent)}
                  className="flex-1"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDeleteEvent(selectedEvent)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              // Other parent can request change (for any event)
              <Button onClick={onRequestChange} className="flex-1">
                <Edit3 className="w-4 h-4 mr-2" />
                Request Change
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={
                isEventCreator(selectedEvent, currentUser) ||
                selectedEvent.isSwappable
                  ? ''
                  : 'flex-1'
              }
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;