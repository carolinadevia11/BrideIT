import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ThumbsUp, MessageCircle, SkipForward } from 'lucide-react';
import { ChangeRequest, BridgetteAlternative } from '@/types/calendar';
import { impactColors } from '@/utils/calendarUtils';
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            Bridge-it's Alternative Solutions
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
                    Let me suggest some alternatives that might have less impact
                    on your custody agreement and family routine. These options
                    are designed to help both parents while minimizing
                    conflicts! ✨
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
                  <p>
                    <strong>Type:</strong> {declinedRequest.type}
                  </p>
                  <p>
                    <strong>Requested by:</strong>{' '}
                    {declinedRequest.requestedBy === 'mom'
                      ? 'You'
                      : 'Your co-parent'}
                  </p>
                  <p>
                    <strong>Reason:</strong> {declinedRequest.reason}
                  </p>
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

            {alternatives.map((alternative) => (
              <Card
                key={alternative.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {alternative.title}
                        </h4>
                        <Badge className={impactColors[alternative.impact]}>
                          {alternative.impact} impact
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {alternative.description}
                      </p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-800 text-sm font-medium">
                          Why this works:
                        </p>
                        <p className="text-blue-700 text-sm">
                          {alternative.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => onAction(alternative)}
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
                        onOpenChange(false);
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
                  <h4 className="font-medium text-gray-800">
                    Not interested in alternatives?
                  </h4>
                  <p className="text-sm text-gray-600">
                    That's okay! You can skip these suggestions and handle this
                    your own way.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
                    Remember, great co-parenting is about finding solutions that
                    work for everyone! 🌟
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    I'm always here to help you navigate these situations with
                    fairness and balance in mind.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BridgetteAlternativesDialog;