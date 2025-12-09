import React, { useState } from 'react';
import { Heart, MessageSquare, Bell, Volume2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnimatedBridgette from './AnimatedBridgette';

interface BridgettePersonalizationProps {
  onComplete: (preferences: {
    personality: string;
    helpLevel: string;
    messageTone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  }) => void;
}

const BridgettePersonalization: React.FC<BridgettePersonalizationProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    personality: 'encouraging',
    helpLevel: 'balanced',
    messageTone: 'friendly',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  const steps = [
    {
      title: "Let's Customize Bridge-it!",
      description: 'How would you like me to help you?',
    },
    {
      title: 'Message Tone',
      description: 'Choose your default communication style',
    },
    {
      title: 'Stay Connected',
      description: 'How should I notify you?',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(preferences);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-medium mb-4 block">
                Choose Bridge-it's Personality
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    value: 'encouraging',
                    title: 'Encouraging & Supportive',
                    description: "I'll be warm, positive, and motivating!",
                    emoji: '🌟',
                  },
                  {
                    value: 'direct',
                    title: 'Direct & Efficient',
                    description: "I'll get straight to the point.",
                    emoji: '🎯',
                  },
                  {
                    value: 'detailed',
                    title: 'Detailed & Thorough',
                    description: "I'll explain everything step-by-step.",
                    emoji: '📋',
                  },
                  {
                    value: 'gentle',
                    title: 'Gentle & Calm',
                    description: "I'll be soft and understanding.",
                    emoji: '💚',
                  },
                ].map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all ${
                      preferences.personality === option.value
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border-2 border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, personality: option.value })
                    }
                  >
                    <CardContent className="p-4">
                      <div className="text-3xl mb-2">{option.emoji}</div>
                      <h3 className="font-bold text-gray-800 mb-1">{option.title}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-lg font-medium mb-4 block">
                How much help would you like?
              </Label>
              <Select
                value={preferences.helpLevel}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, helpLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">
                    <div>
                      <div className="font-medium">Minimal - Only when asked</div>
                      <div className="text-xs text-gray-500">
                        I will stay quiet unless you need me
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced">
                    <div>
                      <div className="font-medium">Balanced - Helpful suggestions</div>
                      <div className="text-xs text-gray-500">
                        I will offer tips when relevant
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="detailed">
                    <div>
                      <div className="font-medium">Detailed - Comprehensive guidance</div>
                      <div className="text-xs text-gray-500">
                        I will guide you through everything
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Label className="text-lg font-medium mb-4 block">
              Choose Your Default Message Tone
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  value: 'friendly',
                  title: 'Friendly',
                  description: 'Warm and collaborative tone',
                  emoji: '😊',
                },
                {
                  value: 'matter-of-fact',
                  title: 'Matter-of-fact',
                  description: 'Direct and clear communication',
                  emoji: '📝',
                },
                {
                  value: 'neutral-legal',
                  title: 'Neutral Legal',
                  description: 'Professional and documented',
                  emoji: '⚖️',
                },
                {
                  value: 'gentle',
                  title: 'Gentle',
                  description: 'Soft and understanding approach',
                  emoji: '🤝',
                },
              ].map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    preferences.messageTone === option.value
                      ? 'border-2 border-yellow-500 bg-yellow-50'
                      : 'border-2 border-gray-200 hover:border-yellow-300'
                  }`}
                  onClick={() =>
                    setPreferences({ ...preferences, messageTone: option.value })
                  }
                >
                  <CardContent className="p-4">
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <h3 className="font-bold text-gray-800 mb-1">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Label className="text-lg font-medium mb-4 block">
              How should I notify you about important updates?
            </Label>
            <div className="space-y-4">
              {[
                {
                  key: 'email',
                  icon: MessageSquare,
                  title: 'Email Notifications',
                  description: 'Updates about messages, calendar, and expenses',
                },
                {
                  key: 'sms',
                  icon: Volume2,
                  title: 'SMS Notifications',
                  description: 'Urgent updates via text message',
                },
                {
                  key: 'push',
                  icon: Bell,
                  title: 'Push Notifications',
                  description: 'Real-time alerts on your device',
                },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.key}
                    className={`cursor-pointer transition-all ${
                      preferences.notifications[option.key as keyof typeof preferences.notifications]
                        ? 'border-2 border-green-500 bg-green-50'
                        : 'border-2 border-gray-200'
                    }`}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          [option.key]: !preferences.notifications[option.key as keyof typeof preferences.notifications],
                        },
                      })
                    }
                  >
                    <CardContent className="p-4 flex items-center space-x-4">
                      <Icon className="w-8 h-8 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{option.title}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          preferences.notifications[option.key as keyof typeof preferences.notifications]
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {preferences.notifications[option.key as keyof typeof preferences.notifications] && (
                          <span className="text-white text-sm">✓</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left">
            <AnimatedBridgette
              size="xl"
              expression="encouraging"
              animation="float"
              showSpeechBubble={true}
              message={
                currentStep === 0
                  ? "Let's personalize your Bridge-it experience! Tell me how you would like me to help you. 🌟"
                  : currentStep === 1
                  ? "Perfect! Now let's set up how you want to communicate with your co-parent. 💬"
                  : "Almost done! Choose how you want to stay updated on everything. 🔔"
              }
              position="center"
            />
          </div>

          {/* Form Side */}
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {steps[currentStep].title}
                </h2>
                <p className="text-gray-600">{steps[currentStep].description}</p>
                <div className="mt-4 flex space-x-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 flex-1 rounded-full ${
                        index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {renderStepContent()}

              <div className="flex justify-between mt-8">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BridgettePersonalization;

