import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Calendar as CalendarIcon, MessageCircle, ArrowRight } from 'lucide-react';
import { ChangeRequest, BridgetteAlternative } from '@/types/calendar';
import BridgetteAvatar from '../../BridgetteAvatar';

interface BridgetteAlternativesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternatives: BridgetteAlternative[];
  declinedRequest: ChangeRequest | null;
  onAction: (alternative: BridgetteAlternative) => void;
  onNavigateToMessages?: () => void;
}

const BridgetteAlternativesDialog: React.FC<BridgetteAlternativesDialogProps> = ({
  open,
  onOpenChange,
  alternatives,
  declinedRequest,
  onAction,
  onNavigateToMessages,
}) => {
  // Find the specific alternatives we want to show
  // We prefer the 'different-date' alternative as the primary "Alternative Date" option
  const dateAlternative = alternatives.find(a => a.type === 'different-date') || alternatives[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            Bridge-it's Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Intro - Simplified */}
           <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <BridgetteAvatar size="md" expression="encouraging" />
            <p className="text-sm text-blue-900">
              I noticed the request was declined. Here are two ways to move forward:
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Option 1: Propose Alternative Date */}
            {dateAlternative && (
                <Card className="hover:shadow-md transition-shadow border-blue-200 cursor-pointer h-full" onClick={() => onAction(dateAlternative)}>
                  <CardContent className="p-6 flex flex-col items-center text-center h-full justify-between">
                    <div className="mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                             <CalendarIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Propose New Date</h3>
                        <p className="text-sm text-gray-500">
                          {dateAlternative.description}
                        </p>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Select Date
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
            )}

            {/* Option 2: Discuss */}
            <Card className="hover:shadow-md transition-shadow border-green-200 cursor-pointer h-full" onClick={() => {
                if (onNavigateToMessages) {
                    onNavigateToMessages();
                    onOpenChange(false);
                }
            }}>
              <CardContent className="p-6 flex flex-col items-center text-center h-full justify-between">
                 <div className="mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Discuss with Co-Parent</h3>
                    <p className="text-sm text-gray-500">
                      Chat directly with {declinedRequest?.requestedBy === 'mom' ? 'Mom' : 'Dad'} to find a solution that works for both of you.
                    </p>
                 </div>
                 <Button variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50">
                    Open Chat
                    <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
             <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-gray-500">
                Dismiss Suggestions
             </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BridgetteAlternativesDialog;