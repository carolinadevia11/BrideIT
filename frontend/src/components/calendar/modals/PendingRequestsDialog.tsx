import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  Loader2,
  XCircle
} from 'lucide-react';
import { ChangeRequest } from '@/types/calendar';
import { formatDateTime, US_TIME_ZONES } from '@/utils/calendarUtils';

interface PendingRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  pendingRequests: ChangeRequest[];
  currentUser?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  processingRequestId: string | null;
  selectedTimeZone: string;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  getDynamicConsequences: (request: ChangeRequest) => string[];
}

const PendingRequestsDialog: React.FC<PendingRequestsDialogProps> = ({
  open,
  onOpenChange,
  isLoading,
  pendingRequests,
  currentUser,
  processingRequestId,
  selectedTimeZone,
  onApprove,
  onReject,
  getDynamicConsequences,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Pending Schedule Change Requests
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
              <p className="text-gray-500">Loading change requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-700 font-medium mb-2">
                No Pending Requests
              </p>
              <p className="text-gray-500 text-sm">
                All change requests have been resolved, or no requests have been
                made yet.
              </p>
            </div>
          ) : (
            pendingRequests.map((request) => {
              // Check if current user is the requester
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
                <Card key={request.id} className="border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600" />
                        {isCurrentUserRequester
                          ? 'You want'
                          : 'Your co-parent wants'}{' '}
                        to {request.type} a date
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="border-orange-300 text-orange-600"
                      >
                        {request.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        Reason:
                      </p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        What will change:
                      </h4>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {getDynamicConsequences(request).map(
                          (consequence, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{consequence}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {canApproveReject && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          If you approve this change:
                        </h4>
                        <p className="text-sm text-blue-700">
                          Both parents will automatically receive an official
                          email documenting the change, its impact on your
                          custody agreement, and confirmation of mutual
                          approval.
                        </p>
                      </div>
                    )}

                    {canApproveReject ? (
                      // Show Approve/Reject buttons if current user is NOT the requester
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => onApprove(request.id)}
                          disabled={processingRequestId === request.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {processingRequestId === request.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve Change
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => onReject(request.id)}
                          disabled={processingRequestId === request.id}
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          {processingRequestId === request.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Decline
                        </Button>
                      </div>
                    ) : (
                      // Show Cancel button if current user is the requester
                      <div className="space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm text-blue-800 text-center">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Waiting for your co-parent to respond to your
                            request
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          disabled={processingRequestId === request.id}
                          onClick={() => onReject(request.id)}
                          className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          {processingRequestId === request.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Cancel My Request
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 text-center">
                      Requested {formatDateTime(request.timestamp, selectedTimeZone)}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingRequestsDialog;