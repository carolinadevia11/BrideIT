import React from 'react';
import { Users, Link2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedBridgette from './AnimatedBridgette';

interface FamilyChoiceProps {
  onCreateNew: () => void;
  onLinkExisting: () => void;
  onBack?: () => void;
}

const FamilyChoice: React.FC<FamilyChoiceProps> = ({ onCreateNew, onLinkExisting, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left">
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
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-800 text-center lg:text-left mb-6">
              Let's Set Up Your Family
            </h2>

            <Card 
              className="border-2 border-blue-300 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
              onClick={onCreateNew}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Create New Family Profile
                    </h3>
                    <p className="text-gray-600 mb-4">
                      I'm the first parent setting up our family. I'll create our profile and get a Family Code to share with my co-parent.
                    </p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Create Family Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-2 border-green-300 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
              onClick={onLinkExisting}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Link2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Link to Existing Family
                    </h3>
                    <p className="text-gray-600 mb-4">
                      My co-parent already created our family profile. I have a Family Code to link my account.
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Enter Family Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyChoice;

