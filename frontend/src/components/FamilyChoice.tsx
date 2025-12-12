import React from 'react';
import { Users, Link2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedBridgette from './AnimatedBridgette';
import BridgetteAvatar from './BridgetteAvatar';

interface FamilyChoiceProps {
  onCreateNew: () => void;
  onLinkExisting: () => void;
  onSkip?: () => void;
}

const FamilyChoice: React.FC<FamilyChoiceProps> = ({ onCreateNew, onLinkExisting, onSkip }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <AnimatedBridgette
              size="xl"
              expression="encouraging"
              animation="float"
              showSpeechBubble={true}
              message="Welcome! Are you the first parent setting up your family, or are you joining an existing family profile? Choose the option that's right for you! 🤝"
              position="center"
            />
          </div>

          {/* Choice Cards */}
          <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center lg:text-left mb-4 sm:mb-6">
              Let's Set Up Your Family
            </h2>

            <Card
              className="border-2 border-blue-300 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
              onClick={onCreateNew}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                      Create New Family Profile
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      I'm the first parent setting up our family. I'll create our profile and get a Family Code to share with my co-parent.
                    </p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
                      Create Family Profile <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer"
              onClick={onLinkExisting}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                    <Link2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                      Link to Existing Family
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      My co-parent already created our family profile. I have a Family Code to link my account.
                    </p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
                      Enter Family Code <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {onSkip && (
              <div className="text-center pt-4">
                <Button variant="ghost" onClick={onSkip} className="text-gray-500 hover:text-gray-700">
                  Skip for now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyChoice;

