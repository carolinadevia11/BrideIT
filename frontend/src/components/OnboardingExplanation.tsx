import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedBridgette from './AnimatedBridgette';
import { User, Smartphone, ArrowRight } from 'lucide-react';

interface OnboardingExplanationProps {
  onStartJourney: () => void;
  onCancel: () => void;
}

const OnboardingExplanation: React.FC<OnboardingExplanationProps> = ({ onStartJourney, onCancel }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8 md:gap-12">
        
        {/* Left Side: Bridgette */}
        <div className="flex-1 flex flex-col items-center text-center">
            <div className="mb-6 relative">
                 <AnimatedBridgette
                    size="xl"
                    expression="waving"
                    animation="bounce"
                    showSpeechBubble={true}
                    message="I'll help you create your Bridge account in just 2 quick steps!"
                    position="center"
                 />
            </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 w-full max-w-md">
            <Card className="shadow-2xl border-white/50 backdrop-blur-sm bg-white/90">
                <CardContent className="p-6 sm:p-8 space-y-8">
                    
                    <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                            Welcome to Bridge-it!
                        </h1>
                        <p className="text-gray-600">
                            Let's get you set up for successful co-parenting.
                        </p>
                    </div>

                    {/* Visual Steps */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <span className="font-bold text-blue-600">1</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">Basic Info</h3>
                                <p className="text-sm text-gray-500">Name, Email, Password</p>
                            </div>
                            <User className="h-5 w-5 text-blue-400" />
                        </div>

                        <div className="flex items-center gap-4 p-3 rounded-xl bg-green-50 border border-green-100">
                             <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <span className="font-bold text-green-600">2</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">Quick Setup</h3>
                                <p className="text-sm text-gray-500">Phone, Timezone, Terms</p>
                            </div>
                            <Smartphone className="h-5 w-5 text-green-400" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <Button 
                            onClick={onStartJourney}
                            className="w-full h-12 text-lg bg-gradient-to-r from-bridge-blue to-bridge-green hover:opacity-90 transition-all shadow-lg hover:shadow-xl group"
                        >
                            <span>Let's Get Started!</span>
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        
                    </div>

                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingExplanation;