import React, { useState } from 'react';
import { Calendar, MessageSquare, DollarSign, FileText, Users, ArrowRight, ArrowLeft, Check, Star, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AnimatedBridgette from './AnimatedBridgette';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  bridgetteMessage: string;
  bridgetteExpression: 'happy' | 'thinking' | 'encouraging' | 'celebrating' | 'waving';
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  tip?: string;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Bridge-it! 🌟',
      description: 'Your journey to better co-parenting starts here',
      bridgetteMessage: "Hi there! I'm Bridge-it, your personal co-parenting assistant! I'm so excited to show you around Bridge-it and help you create a positive environment for your family! 🎉",
      bridgetteExpression: 'waving',
      icon: Heart,
      color: 'from-bridge-blue to-bridge-blue/80',
      features: [
        'AI-powered assistance from Bridge-it!',
        'Secure communication with your co-parent',
        'Shared calendar for seamless scheduling',
        'Expense tracking and management',
        'Document storage and organization',
        'Educational resources from experts'
      ],
      tip: 'Bridge-it is designed to reduce conflict and improve communication between co-parents.'
    },
    {
      id: 'calendar',
      title: 'Shared Family Calendar 📅',
      description: 'Never miss an important moment',
      bridgetteMessage: "The shared calendar is where the magic happens! Both you and your co-parent can see all the important dates, from custody schedules to school events. Bridge-it will help you avoid conflicts and keep everyone on the same page! 📅✨",
      bridgetteExpression: 'encouraging',
      icon: Calendar,
      color: 'from-bridge-blue to-cyan-600',
      features: [
        'Color-coded event categories',
        'Custody schedule management',
        'School and medical appointments',
        'Holiday and vacation planning',
        'Automatic conflict detection',
        'Mobile notifications and reminders'
      ],
      tip: 'Pro tip: Use different colors for different types of events to stay organized!'
    },
    {
      id: 'messaging',
      title: 'Secure Communication 💬',
      description: 'Keep conversations focused and documented',
      bridgetteMessage: "Communication is key to successful co-parenting! Bridge-it will help you choose the right tone for your messages and keep everything documented for your records. No more misunderstandings! 💬🤝",
      bridgetteExpression: 'happy',
      icon: MessageSquare,
      color: 'from-bridge-green to-emerald-600',
      features: [
        'Tone selection (friendly, neutral, legal)',
        'AI-powered message suggestions',
        'Automatic message logging',
        'Court-ready documentation',
        'Read receipts and timestamps',
        'Conflict mediation assistance'
      ],
      tip: 'All messages are encrypted and permanently logged for legal documentation.'
    },
    {
      id: 'expenses',
      title: 'Expense Management 💰',
      description: 'Track and split costs transparently',
      bridgetteMessage: "Money matters can be tricky, but Bridge-it is here to help! Track all your shared expenses, split costs fairly, and keep detailed records. No more arguments about who paid for what! 💰📊",
      bridgetteExpression: 'thinking',
      icon: DollarSign,
      color: 'from-bridge-red to-pink-600',
      features: [
        'Automatic cost splitting',
        'Receipt photo storage',
        'Category-based organization',
        'Payment status tracking',
        'Dispute resolution workflow',
        'Financial reporting and summaries'
      ],
      tip: 'Upload receipts immediately to keep accurate records for tax purposes.'
    },
    {
      id: 'documents',
      title: 'Document Hub 📄',
      description: 'Organize and access important files',
      bridgetteMessage: "Keep all your important documents safe and organized! From custody agreements to medical records, everything is encrypted and easily accessible when you need it. Bridge-it can even help extract key information! 📄🔒",
      bridgetteExpression: 'encouraging',
      icon: FileText,
      color: 'from-bridge-yellow to-orange-500',
      features: [
        'Secure document storage',
        'AI-powered document parsing',
        'Category-based organization',
        'Search and filter capabilities',
        'Version control and history',
        'Legal document templates'
      ],
      tip: 'I can automatically extract important dates and terms from your custody agreement!'
    },
    {
      id: 'resources',
      title: 'Expert Resources 📚',
      description: 'Learn and grow as a co-parent',
      bridgetteMessage: "Learning never stops! Bridge-it has curated amazing resources from psychology experts, family therapists, and legal professionals to help you on your co-parenting journey. Knowledge is power! 📚💪",
      bridgetteExpression: 'encouraging',
      icon: Users,
      color: 'from-bridge-blue to-indigo-600',
      features: [
        'Expert articles and research',
        'Educational video library',
        'Professional directory',
        'Personalized recommendations',
        'Evidence-based strategies',
        'Community support resources'
      ],
      tip: 'Check out the Psychology Today articles I\'ve curated specifically for co-parents!'
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'Ready to start your co-parenting journey',
      bridgetteMessage: "Congratulations! You're now ready to use Bridge-it to create a positive co-parenting experience! Remember, Bridge-it is always here to help guide you through any challenges. You've got this! 🌟👏",
      bridgetteExpression: 'celebrating',
      icon: Star,
      color: 'from-bridge-yellow to-bridge-green',
      features: [
        'Your Bridge-it account is fully set up',
        'All features are now available',
        'Bridge-it is here 24/7 to assist you',
        'Your co-parent can join anytime',
        'Start with the shared calendar',
        'Explore at your own pace'
      ],
      tip: 'Remember: Great co-parenting is a journey, not a destination. Take it one day at a time!'
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={skipOnboarding}>
              Skip Tour
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left">
            <AnimatedBridgette
              size="xl"
              expression={currentStepData.bridgetteExpression}
              animation={currentStepData.bridgetteExpression === 'celebrating' ? 'celebrate' : 'float'}
              showSpeechBubble={true}
              message={currentStepData.bridgetteMessage}
              position="center"
            />
          </div>

          {/* Content Side */}
          <Card className="w-full shadow-2xl">
            <CardHeader>
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center shadow-lg`}>
                  <currentStepData.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {currentStepData.title}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{currentStepData.description}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Features List */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Key Features:</h3>
                <div className="space-y-2">
                  {currentStepData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip */}
              {currentStepData.tip && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 text-sm">Pro Tip</p>
                      <p className="text-blue-700 text-sm">{currentStepData.tip}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button 
                  onClick={prevStep} 
                  variant="outline"
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                
                <div className="flex space-x-2">
                  {currentStep < steps.length - 1 ? (
                    <Button 
                      onClick={nextStep}
                      className={`bg-gradient-to-r ${currentStepData.color} hover:opacity-90 flex items-center space-x-2`}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={onComplete}
                      className="bg-bridge-green hover:bg-bridge-green/90 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Get Started!</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center space-x-2 pt-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep 
                        ? 'bg-blue-500' 
                        : index < currentStep 
                          ? 'bg-green-400' 
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;