import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, User, Users, FileText, Calendar, MessageSquare, CheckCircle, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AnimatedBridgette from './AnimatedBridgette';

interface OnboardingExplanationProps {
  onStartJourney: () => void;
  onCancel: () => void;
}

interface ExplanationStep {
  id: string;
  title: string;
  description: string;
  bridgetteMessage: string;
  bridgetteExpression: 'happy' | 'thinking' | 'encouraging' | 'celebrating' | 'waving';
  bridgetteAnimation: 'bounce' | 'float' | 'balance' | 'celebrate' | 'thinking' | 'idle';
  icon: React.ComponentType<any>;
  color: string;
  details: string[];
  tip: string;
}

const OnboardingExplanation: React.FC<OnboardingExplanationProps> = ({ onStartJourney, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: ExplanationStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Co-Parenting Journey! 🌟',
      description: 'Let me walk you through what we\'ll set up together',
      bridgetteMessage: "Hi there! I'm Bridge-it, your personal co-parenting assistant! I'm so excited to help you get started with Bridge-it. Let me show you exactly what we'll do together to create your perfect co-parenting setup! 🎉",
      bridgetteExpression: 'waving',
      bridgetteAnimation: 'celebrate',
      icon: Heart,
      color: 'from-bridge-blue to-bridge-blue/80',
      details: [
        'I\'ll guide you through every single step',
        'Everything is secure and private',
        'Takes about 5-10 minutes total',
        'You can pause and resume anytime',
        'Your co-parent joins when ready'
      ],
      tip: 'Don\'t worry - I\'ll be with you the entire time!'
    },
    {
      id: 'account',
      title: 'Step 1: Create Your Secure Account 🔐',
      description: 'First, we\'ll set up your personal Bridge-it account',
      bridgetteMessage: "Let's start with the basics! Bridge-it will help you create a secure account with your name, email, and a strong password. This is YOUR space in Bridge-it - completely private and protected! 🛡️",
      bridgetteExpression: 'encouraging',
      bridgetteAnimation: 'thinking',
      icon: User,
      color: 'from-bridge-blue to-cyan-600',
      details: [
        'Enter your name and email address',
        'Create a secure password',
        'Set up your time zone and preferences',
        'Choose notification settings',
        'Agree to our privacy terms'
      ],
      tip: 'I\'ll help you choose the best settings for your situation!'
    },
    {
      id: 'family',
      title: 'Step 2: Connect with Your Co-Parent 👥',
      description: 'Next, we\'ll link your account with your co-parent',
      bridgetteMessage: "Now for the magic part! Bridge-it will create a special Family Code that connects you and your co-parent while keeping your individual accounts separate. It's like having your own space that shares the important stuff! ✨",
      bridgetteExpression: 'happy',
      bridgetteAnimation: 'balance',
      icon: Users,
      color: 'from-bridge-green to-emerald-600',
      details: [
        'I\'ll generate your unique Family Code',
        'Share the code with your co-parent',
        'They use it to link their account',
        'Both accounts stay completely private',
        'Shared data syncs automatically'
      ],
      tip: 'Your co-parent can join immediately or later - totally flexible!'
    },
    {
      id: 'agreements',
      title: 'Step 3: Process Your Custody Agreement 📄',
      description: 'I\'ll help organize your legal documents and agreements',
      bridgetteMessage: "This is where Bridge-it really shines! You can upload your custody agreement and Bridge-it will read through it to extract all the important dates, schedules, and rules. Or if you don't have it handy, Bridge-it will ask you some simple questions instead! 🤖📋",
      bridgetteExpression: 'thinking',
      bridgetteAnimation: 'thinking',
      icon: FileText,
      color: 'from-bridge-blue to-indigo-600',
      details: [
        'Upload your custody agreement (optional)',
        'I\'ll extract key dates and schedules',
        'Or answer my simple questionnaire',
        'I\'ll organize all the important rules',
        'Everything stays secure and private'
      ],
      tip: 'Don\'t worry if you don\'t have documents ready - I can work with whatever you have!'
    },
    {
      id: 'calendar',
      title: 'Step 4: Set Up Your Shared Calendar 📅',
      description: 'We\'ll create your family\'s master schedule',
      bridgetteMessage: "Time to build your family calendar! Bridge-it will use the information from your agreement to set up custody schedules, and then you can add school events, activities, and appointments. Both parents see the same calendar - no more confusion! 🗓️✨",
      bridgetteExpression: 'encouraging',
      bridgetteAnimation: 'float',
      icon: Calendar,
      color: 'from-bridge-yellow to-orange-500',
      details: [
        'Import custody schedule automatically',
        'Add school and medical appointments',
        'Set up recurring events and activities',
        'Color-code different event types',
        'Enable notifications and reminders'
      ],
      tip: 'I\'ll help prevent scheduling conflicts before they happen!'
    },
    {
      id: 'communication',
      title: 'Step 5: Configure Communication Tools 💬',
      description: 'Finally, we\'ll set up secure messaging and preferences',
      bridgetteMessage: "Last but not least, let's set up how you and your co-parent will communicate! Bridge-it will help you choose message tones, set up notifications, and make sure everything is documented properly. Communication is key to great co-parenting! 🤝💙",
      bridgetteExpression: 'happy',
      bridgetteAnimation: 'celebrate',
      icon: MessageSquare,
      color: 'from-bridge-blue to-indigo-500',
      details: [
        'Choose your preferred communication tone',
        'Set up message templates and suggestions',
        'Configure notification preferences',
        'Enable automatic message logging',
        'Set up conflict mediation features'
      ],
      tip: 'I\'ll help you communicate more effectively and reduce conflicts!'
    },
    {
      id: 'ready',
      title: 'You\'re Ready to Begin! 🎉',
      description: 'Let\'s start building your co-parenting success story',
      bridgetteMessage: "That's it! In just a few minutes, Bridge-it will have you completely set up with everything you need for successful co-parenting. Bridge-it will be right there with you every step of the way. Are you ready to create something amazing for your family? Let's do this! 🌟👏",
      bridgetteExpression: 'celebrating',
      bridgetteAnimation: 'celebrate',
      icon: CheckCircle,
      color: 'from-bridge-yellow to-bridge-green',
      details: [
        'Complete account setup in 5-10 minutes',
        'I\'ll guide you through each step',
        'Everything is secure and private',
        'Start using Bridge-it immediately',
        'Your co-parent can join anytime'
      ],
      tip: 'Remember: Great co-parenting is a journey, and it starts with this first step!'
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button
              variant="outline"
              onClick={onCancel}
              className="bg-white/50 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-900"
            >
              Skip Preview
            </Button>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left">
            <AnimatedBridgette
              size="xl"
              expression={currentStepData.bridgetteExpression}
              animation={currentStepData.bridgetteAnimation}
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
                  <CardTitle className="text-xl font-bold text-gray-800">
                    {currentStepData.title}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{currentStepData.description}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Details List */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">What we'll do:</h3>
                <div className="space-y-2">
                  {currentStepData.details.map((detail, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                      <span className="text-gray-700 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 text-sm">Bridge-it's Tip</p>
                    <p className="text-blue-700 text-sm">{currentStepData.tip}</p>
                  </div>
                </div>
              </div>

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
                  {!isLastStep ? (
                    <Button 
                      onClick={nextStep}
                      className={`bg-gradient-to-r ${currentStepData.color} hover:opacity-90 flex items-center space-x-2`}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={onStartJourney}
                      className="bg-bridge-green hover:bg-bridge-green/90 flex items-center space-x-2 text-lg px-8 py-3"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Start My Journey!</span>
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

export default OnboardingExplanation;